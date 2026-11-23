/**
 * URL Risk Analysis Utility — CyberShield Campus
 *
 * Performs entirely LOCAL, static analysis of a submitted URL string.
 * This module NEVER makes outbound network requests to the submitted URL.
 * No DNS lookups, no HTTP fetches, no crawling.
 *
 * All analysis is based solely on the structure and content of the URL string
 * itself plus campus threat indicator data already stored in MongoDB.
 */

import { ThreatIndicator, normalizeDomain, domainMatches } from '../models/ThreatIndicator';
import { Advisory } from '../models/Advisory';
import mongoose from 'mongoose';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface UrlFinding {
  rule:        string;    // machine-readable rule name
  title:       string;    // human-readable title
  description: string;    // plain-English explanation for a student
  severity:    'info' | 'low' | 'medium' | 'high' | 'critical';
  score:       number;    // additive contribution to riskScore (0–100 total scale)
}

export interface MatchedIndicatorSummary {
  type:        string;
  value:       string;    // rawValue (never the normalized internal form)
  description: string;
}

export interface RelatedAdvisorySummary {
  advisoryId:          string;
  title:               string;
  category:            string;
  severity:            string;
  recommendedActions:  string[];
}

export interface UrlAnalysisResult {
  url:                   string;
  hostname:              string;
  riskLevel:             RiskLevel;
  riskScore:             number;        // 0–100
  isCampusIndicatorMatch: boolean;
  findings:              UrlFinding[];
  matchedIndicators:     MatchedIndicatorSummary[];
  relatedAdvisories:     RelatedAdvisorySummary[];
  recommendations:       string[];
  disclaimer:            string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const DISCLAIMER =
  'This is a preliminary, heuristic-based risk assessment of the URL structure only. ' +
  'It does not scan the destination website, detect malware, or access live threat intelligence. ' +
  'An unmatched URL is NOT guaranteed to be safe. When in doubt, do not click the link and ' +
  'report it via the Incident Reporting form.';

/** Ports considered unusual / non-standard for web traffic */
const UNUSUAL_PORTS = new Set([
  21, 22, 23, 25, 110, 143, 445, 3306, 3389, 5432, 6379, 8080, 8443, 8888, 9200,
]);

/** Well-known URL-shortener / redirect domains */
const URL_SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'ow.ly', 'goo.gl', 'short.link',
  'rebrand.ly', 'is.gd', 'buff.ly', 'dlvr.it', 'tiny.cc', 'shorten.me',
  'cutt.ly', 'bl.ink', 'rb.gy', 'shorturl.at', 'linktr.ee',
]);

/**
 * Suspicious keywords that appear in phishing / scam URLs.
 * Each entry is [regex, human-readable label].
 */
const SUSPICIOUS_KEYWORD_PATTERNS: Array<[RegExp, string]> = [
  [/login|signin|sign-in|logon/i,                'Login / sign-in'],
  [/verify|verification|verif[yi]/i,             'Account verification'],
  [/update.*account|account.*update/i,           'Account update'],
  [/confirm.*password|password.*confirm/i,       'Password confirmation'],
  [/free.*reward|reward.*free|prize|winner/i,    'Free reward / prize'],
  [/urgent.*pay|pay.*urgent|payment.*due/i,      'Urgent payment'],
  [/internship.*register|register.*internship/i, 'Internship registration'],
  [/scholarship.*apply|apply.*scholarship/i,     'Scholarship application'],
  [/recover.*account|account.*recover/i,         'Account recovery'],
  [/suspend.*account|account.*suspend/i,         'Account suspension warning'],
];

// ─── Parsing helper ────────────────────────────────────────────────────────────

interface ParsedUrl {
  parsed:   URL;
  hostname: string;    // normalized (lowercase, no trailing dot, no www.)
}

/**
 * Parse and validate the submitted URL.
 * Returns null if the URL is malformed or uses an unsupported protocol.
 * Never makes any network request.
 */
export function parseAndValidate(raw: string): ParsedUrl | null {
  if (!raw || raw.trim().length === 0) return null;
  if (raw.length > 2000) return null;

  try {
    const urlString = /^https?:\/\//i.test(raw) ? raw : null;
    // We only accept explicit http/https — do not silently prepend a scheme
    if (!urlString) return null;

    const parsed = new URL(urlString);

    if (!['http:', 'https:'].includes(parsed.protocol)) return null;

    const hostname = normalizeDomain(parsed.hostname);
    if (!hostname) return null;

    return { parsed, hostname };
  } catch {
    return null;
  }
}

// ─── Heuristic checks ──────────────────────────────────────────────────────────

/**
 * Run all heuristic rules against a parsed URL.
 * Returns an array of findings (may be empty).
 * Each check is self-contained and does NOT make any network calls.
 */
export function runHeuristics(parsed: URL, hostname: string): UrlFinding[] {
  const findings: UrlFinding[] = [];
  const fullUrl = parsed.toString();

  // ── A. HTTP instead of HTTPS ───────────────────────────────────────────────
  if (parsed.protocol === 'http:') {
    findings.push({
      rule:        'NO_HTTPS',
      title:       'No HTTPS Encryption',
      description:
        'This URL uses HTTP, which means data sent to this page is not encrypted. ' +
        'Avoid entering passwords, payment details or personal information on HTTP pages. ' +
        'Note: HTTPS alone does not guarantee a site is legitimate.',
      severity: 'medium',
      score:    20,
    });
  }

  // ── B. IP address hostname ─────────────────────────────────────────────────
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    findings.push({
      rule:        'IP_ADDRESS_HOSTNAME',
      title:       'IP Address Used Instead of Domain Name',
      description:
        'The URL uses a raw IP address instead of a recognisable domain name. ' +
        'Legitimate websites almost never ask you to visit an IP address directly. ' +
        'This is a common characteristic of phishing pages and temporary scam infrastructure.',
      severity: 'high',
      score:    40,
    });
  }

  // ── C. Embedded @ symbol ───────────────────────────────────────────────────
  // e.g. http://evil.com@legitimate.com — the browser resolves to evil.com
  if (parsed.username || parsed.password || fullUrl.includes('@')) {
    findings.push({
      rule:        'EMBEDDED_AT_SYMBOL',
      title:       'Embedded @ Symbol in URL',
      description:
        'The URL contains an @ symbol. Browsers treat everything before @ as ' +
        'credentials, so "http://trusted.com@evil.com" actually opens evil.com. ' +
        'This technique is used to make phishing links appear to point to legitimate sites.',
      severity: 'high',
      score:    40,
    });
  }

  // ── D. Punycode / IDN domain ───────────────────────────────────────────────
  if (hostname.includes('xn--') || parsed.hostname.includes('xn--')) {
    findings.push({
      rule:        'PUNYCODE_DOMAIN',
      title:       'Punycode / Internationalised Domain (IDN)',
      description:
        'The domain uses punycode encoding ("xn--"), which is used to represent ' +
        'non-ASCII characters. Attackers use look-alike characters (e.g. а vs a) ' +
        'to create domains that visually resemble trusted sites. Exercise extreme caution.',
      severity: 'high',
      score:    35,
    });
  }

  // ── E. Excessive subdomains ────────────────────────────────────────────────
  const labels = hostname.split('.');
  if (labels.length >= 5) {
    findings.push({
      rule:        'EXCESSIVE_SUBDOMAINS',
      title:       'Unusually Deep Subdomain Structure',
      description:
        `This domain has ${labels.length} dot-separated labels (e.g. a.b.c.d.example.com). ` +
        'Very deep subdomain chains can be used to bury a suspicious root domain at the end ' +
        'and make the URL look longer and more legitimate than it is.',
      severity: 'medium',
      score:    15,
    });
  }

  // ── F. Unusually long URL ──────────────────────────────────────────────────
  if (fullUrl.length > 200) {
    findings.push({
      rule:        'LONG_URL',
      title:       'Unusually Long URL',
      description:
        `The URL is ${fullUrl.length} characters long. Very long URLs are sometimes ` +
        'used to hide the actual destination or embed encoded payloads. ' +
        'Check the domain portion carefully.',
      severity: 'low',
      score:    10,
    });
  }

  // ── G. Suspicious keywords ─────────────────────────────────────────────────
  const matched: string[] = [];
  for (const [pattern, label] of SUSPICIOUS_KEYWORD_PATTERNS) {
    if (pattern.test(fullUrl)) {
      matched.push(label);
    }
  }
  if (matched.length > 0) {
    findings.push({
      rule:        'SUSPICIOUS_KEYWORDS',
      title:       'Suspicious Keywords Detected',
      description:
        `The URL contains keywords commonly found in phishing or scam pages: ` +
        `${matched.join(', ')}. ` +
        'By themselves these keywords do not confirm a threat, but combined with ' +
        'other indicators they significantly raise the risk of this being a fraudulent link.',
      severity: matched.length >= 2 ? 'high' : 'medium',
      score:    matched.length >= 2 ? 30 : 15,
    });
  }

  // ── H. Unusual / non-standard port ────────────────────────────────────────
  if (parsed.port) {
    const portNum = parseInt(parsed.port, 10);
    if (UNUSUAL_PORTS.has(portNum)) {
      findings.push({
        rule:        'UNUSUAL_PORT',
        title:       `Non-Standard Port (${portNum})`,
        description:
          `The URL specifies port ${portNum}, which is not normally used for web browsing. ` +
          'Legitimate websites almost always use port 443 (HTTPS) or 80 (HTTP) without ' +
          'explicitly stating it in the URL. An unusual port may indicate a misconfigured ' +
          'or malicious server.',
        severity: 'medium',
        score:    20,
      });
    }
  }

  // ── I. Known URL shortener ─────────────────────────────────────────────────
  if (URL_SHORTENERS.has(hostname)) {
    findings.push({
      rule:        'URL_SHORTENER',
      title:       'URL Shortener Service',
      description:
        `The URL uses the shortener service "${hostname}", which hides the actual ` +
        'destination. URL shorteners are frequently used in phishing and spam campaigns ' +
        'because the real destination cannot be evaluated from the link alone.',
      severity: 'low',
      score:    15,
    });
  }

  return findings;
}

// ─── Risk classification ───────────────────────────────────────────────────────

/**
 * Derive an overall RiskLevel from the total score and an optional campus match.
 *
 * Score bands (approximate):
 *   0–19   → Low
 *   20–44  → Medium
 *   45–69  → High
 *   70+    → Critical
 *
 * Campus indicator match overrides the score-based level to at least High.
 */
export function classifyRisk(score: number, hasCampusMatch: boolean, campusMatchSeverity?: string): RiskLevel {
  if (hasCampusMatch) {
    // Escalate to Critical for Critical/High campus advisory severity
    if (campusMatchSeverity === 'Critical') return 'Critical';
    if (campusMatchSeverity === 'High')     return 'Critical';
    return 'High';  // Medium/Low advisory → still at least High for matched indicator
  }

  if (score >= 70) return 'Critical';
  if (score >= 45) return 'High';
  if (score >= 20) return 'Medium';
  return 'Low';
}

// ─── Recommendations ──────────────────────────────────────────────────────────

function buildRecommendations(
  riskLevel:          RiskLevel,
  hasCampusMatch:     boolean,
  heuristicFindings:  UrlFinding[],
): string[] {
  const recs: string[] = [];

  if (hasCampusMatch) {
    recs.push('⚠️  This URL matches a known campus threat indicator. Do NOT visit or share this link.');
    recs.push('Report this URL immediately using the Incident Reporting form in the portal.');
    recs.push('If you have already clicked this link, change your passwords and enable MFA on affected accounts.');
  }

  if (riskLevel === 'Critical' || riskLevel === 'High') {
    recs.push('Do not enter any personal information, login credentials or payment details on this page.');
    recs.push('Verify the legitimacy of this URL with the sender through a separate, trusted channel before proceeding.');
  }

  if (riskLevel === 'Medium') {
    recs.push('Exercise caution. Verify with the sender before clicking this link.');
    recs.push('Do not download files or enter credentials if the site appears unfamiliar.');
  }

  const hasNoHttps    = heuristicFindings.some(f => f.rule === 'NO_HTTPS');
  const hasShortener  = heuristicFindings.some(f => f.rule === 'URL_SHORTENER');
  const hasIpAddress  = heuristicFindings.some(f => f.rule === 'IP_ADDRESS_HOSTNAME');
  const hasKeywords   = heuristicFindings.some(f => f.rule === 'SUSPICIOUS_KEYWORDS');

  if (hasNoHttps)   recs.push('Never enter passwords or payment details on HTTP (non-encrypted) pages.');
  if (hasShortener) recs.push('Use a URL-preview service (e.g. add "+" to the end of a bit.ly link) to reveal the actual destination before clicking.');
  if (hasIpAddress) recs.push('Legitimate services use domain names, not IP addresses. Treat IP-based URLs with extreme suspicion.');
  if (hasKeywords)  recs.push('The URL contains words commonly used in phishing attacks. Be especially careful before entering any information.');

  recs.push('If in doubt, do not click the link. Report it using the Incident Reporting form.');

  // Deduplicate while preserving order
  return [...new Set(recs)];
}

// ─── Campus indicator matching ────────────────────────────────────────────────

interface CampusMatchResult {
  matched:           boolean;
  matchedIndicators: MatchedIndicatorSummary[];
  relatedAdvisories: RelatedAdvisorySummary[];
  highestSeverity:   string | undefined;
}

/** Minimal shape we need from a stored indicator record */
interface IndicatorRecord {
  type:             string;
  value:            string;
  rawValue:         string;
  description:      string;
  relatedAdvisory?: mongoose.Types.ObjectId;
}

/**
 * Check the submitted hostname and normalized full URL against all stored
 * ThreatIndicators.
 *
 * Uses the same domainMatches() logic exported from ThreatIndicator model —
 * no duplication.
 */
async function checkCampusIndicators(
  hostname:       string,
  normalizedUrl:  string,
): Promise<CampusMatchResult> {
  // Select only the fields we need; cast via unknown to our plain interface.
  const allIndicators = (
    await ThreatIndicator.find({}).select('type value rawValue description relatedAdvisory')
  ) as unknown as IndicatorRecord[];

  const matched: IndicatorRecord[] = allIndicators.filter((ind) => {
    if (ind.type === 'Domain') {
      return domainMatches(ind.value, hostname);
    } else {
      // URL-type: check normalized full URL
      return normalizedUrl === ind.value || normalizedUrl.startsWith(ind.value + '/');
    }
  });

  if (matched.length === 0) {
    return { matched: false, matchedIndicators: [], relatedAdvisories: [], highestSeverity: undefined };
  }

  // Collect only Published advisory details — never expose Draft/Archived
  const advisoryIds = matched
    .map(ind => ind.relatedAdvisory)
    .filter((id): id is mongoose.Types.ObjectId => id != null);

  const publishedAdvisories = advisoryIds.length > 0
    ? await Advisory.find({ _id: { $in: advisoryIds }, status: 'Published' })
        .select('advisoryId title category severity recommendedActions')
    : [];

  // Highest severity across matched published advisories
  const SEVERITY_ORDER = ['Low', 'Medium', 'High', 'Critical'];
  let highestSeverity: string | undefined;
  for (const adv of publishedAdvisories) {
    const idx = SEVERITY_ORDER.indexOf(adv.severity as string);
    const curIdx = highestSeverity ? SEVERITY_ORDER.indexOf(highestSeverity) : -1;
    if (idx > curIdx) highestSeverity = adv.severity as string;
  }
  // If no published advisories found, default to 'High' so campus match still escalates
  if (!highestSeverity && matched.length > 0) highestSeverity = 'High';

  return {
    matched: true,
    matchedIndicators: matched.map(ind => ({
      type:        ind.type,
      value:       ind.rawValue,
      description: ind.description,
    })),
    relatedAdvisories: publishedAdvisories.map(adv => ({
      advisoryId:         adv.advisoryId,
      title:              adv.title,
      category:           adv.category,
      severity:           adv.severity,
      recommendedActions: adv.recommendedActions,
    })),
    highestSeverity,
  };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Analyse a URL and return a structured risk assessment.
 *
 * SSRF prevention: this function performs only string-level analysis and
 * one MongoDB read. It NEVER fetches, pings, or resolves the submitted URL.
 */
export async function analyzeUrl(rawUrl: string): Promise<UrlAnalysisResult> {
  // 1. Parse and validate
  const parsed = parseAndValidate(rawUrl);
  if (!parsed) {
    throw new Error('INVALID_URL');
  }

  const { parsed: urlObj, hostname } = parsed;
  const normalizedUrl = rawUrl.trim().toLowerCase();

  // 2. Run heuristics (synchronous, pure string analysis)
  const heuristicFindings = runHeuristics(urlObj, hostname);

  // 3. Check campus threat indicators (async DB read, no network call to URL)
  const campusResult = await checkCampusIndicators(hostname, normalizedUrl);

  // 4. Calculate score from heuristics only (campus match overrides risk level separately)
  const heuristicScore = Math.min(
    100,
    heuristicFindings.reduce((sum, f) => sum + f.score, 0),
  );

  // 5. Classify risk
  const riskLevel = classifyRisk(heuristicScore, campusResult.matched, campusResult.highestSeverity);

  // 6. Build campus match findings to prepend to findings array
  const campusFindings: UrlFinding[] = campusResult.matched
    ? [{
        rule:        'CAMPUS_INDICATOR_MATCH',
        title:       'Campus Threat Indicator Match',
        description:
          `This URL or its domain matches ${campusResult.matchedIndicators.length} ` +
          `campus threat indicator(s) flagged by the IT security team. ` +
          `This is a known suspicious resource in the campus threat database.`,
        severity: campusResult.highestSeverity === 'Critical' ? 'critical' : 'high',
        score:    0, // score is overridden by classifyRisk; not additive here
      }]
    : [];

  const allFindings = [...campusFindings, ...heuristicFindings];

  // 7. Build recommendations
  const recommendations = buildRecommendations(riskLevel, campusResult.matched, heuristicFindings);

  // 8. Final score to report (campus match bumps to minimum 60 for display)
  const reportedScore = campusResult.matched
    ? Math.max(60, heuristicScore)
    : heuristicScore;

  return {
    url:                    rawUrl,
    hostname,
    riskLevel,
    riskScore:              reportedScore,
    isCampusIndicatorMatch: campusResult.matched,
    findings:               allFindings,
    matchedIndicators:      campusResult.matchedIndicators,
    relatedAdvisories:      campusResult.relatedAdvisories,
    recommendations,
    disclaimer:             DISCLAIMER,
  };
}
