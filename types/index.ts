// ─── Backend-aligned Incident Types ───────────────────────────────────────────
// Status values match the backend MongoDB enum exactly.
// The old frontend-only statuses (Open, Under Review, Closed) are replaced.

export type IncidentCategory =
  | 'Phishing Email'
  | 'Suspicious URL'
  | 'Fake Internship Offer'
  | 'Account Compromise'
  | 'Payment / QR Code Scam'
  | 'Impersonation'
  | 'Other';

export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

/** Backend incident statuses (Mongoose enum values). */
export type IncidentStatus = 'Reported' | 'Investigating' | 'Resolved' | 'Rejected';

/** Reporter sub-document shape returned by .populate() */
export interface IncidentReporter {
  _id: string;
  fullName: string;
  email: string;
  enrollmentId?: string;
  department?: string;
}

/** Incident document as returned by the backend API. */
export interface Incident {
  _id: string;
  incidentId: string;       // human-readable: INC-1001
  title: string;
  description: string;
  category: IncidentCategory;
  severity: SeverityLevel;
  status: IncidentStatus;
  reporter: IncidentReporter;
  suspiciousUrl?: string;
  senderEmail?: string;
  adminRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Advisory Types (backend-aligned) ─────────────────────────────────────────

export type AdvisoryCategory =
  | 'Fake Internship'
  | 'Phishing Email'
  | 'University Impersonation'
  | 'Payment / QR Code Scam'
  | 'Fake Registration Form'
  | 'Account Security'
  | 'General Security Warning';

export type AdvisoryStatus = 'Draft' | 'Published' | 'Archived';

export interface Advisory {
  _id: string;
  advisoryId: string;
  title: string;
  description: string;
  category: AdvisoryCategory;
  severity: SeverityLevel;
  warningSigns: string[];
  recommendedActions: string[];
  suspiciousUrls: string[];
  status: AdvisoryStatus;
  createdBy: { fullName: string; email: string };
  createdAt: string;
  updatedAt: string;
}

// ─── URL Checker Types (backend-aligned) ──────────────────────────────────────
// Backend riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'  (no "Safe" / "Low Risk")
// Backend finding severity: lowercase 'info'|'low'|'medium'|'high'|'critical'

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type FindingSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface UrlFinding {
  rule:        string;
  title:       string;
  description: string;
  severity:    FindingSeverity;
  score:       number;
}

export interface MatchedIndicatorSummary {
  type:        string;
  value:       string;
  description: string;
}

export interface RelatedAdvisorySummary {
  advisoryId:         string;
  title:              string;
  category:           string;
  severity:           string;
  recommendedActions: string[];
}

export interface UrlCheckResult {
  url:                    string;
  hostname:               string;
  riskLevel:              RiskLevel;
  riskScore:              number;
  isCampusIndicatorMatch: boolean;
  findings:               UrlFinding[];
  matchedIndicators:      MatchedIndicatorSummary[];
  relatedAdvisories:      RelatedAdvisorySummary[];
  recommendations:        string[];
  disclaimer:             string;
}

// ─── Quiz Types (backend-aligned) ─────────────────────────────────────────────

export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard';

export type QuizCategory =
  | 'Phishing'
  | 'Fake Internship'
  | 'Social Engineering'
  | 'Suspicious Forms'
  | 'QR Code / UPI Scam'
  | 'University Impersonation'
  | 'Password Security'
  | 'Multi-Factor Authentication'
  | 'Suspicious URLs'
  | 'Safe Browsing';

export interface QuizOption {
  id: string;
  text: string;
}

/** Safe question shape returned by GET /api/quiz/questions — no correctId or explanation */
export interface SafeQuizQuestion {
  id:         string;
  question:   string;
  options:    QuizOption[];
  category:   QuizCategory;
  difficulty: QuizDifficulty;
}

/** Single answer in a submission payload */
export interface SubmittedAnswer {
  questionId: string;
  selectedId: string;
}

/** Per-question result row returned in POST /api/quiz/submit response */
export interface QuizReviewItem {
  questionId:   string;
  questionText: string;
  selectedId:   string;
  correctId:    string;
  isCorrect:    boolean;
  explanation:  string;
}

/** Full submit response shape */
export interface QuizSubmitResult {
  attemptId:      string;
  score:          number;
  totalQuestions: number;
  percentage:     number;
  correctCount:   number;
  incorrectCount: number;
  review:         QuizReviewItem[];
}

/** Attempt history item returned by GET /api/quiz/my-attempts */
export interface QuizAttempt {
  _id:             string;
  score:           number;
  totalQuestions:  number;
  percentage:      number;
  categoryFilter:  QuizCategory | null;
  difficultyFilter: QuizDifficulty | null;
  createdAt:       string;
}

/** Leaderboard entry returned by GET /api/quiz/leaderboard */
export interface LeaderboardEntry {
  fullName:       string;
  bestPercentage: number;
  bestScore:      number;
  totalAttempts:  number;
}

// ─── Indicator Types (Admin) ───────────────────────────────────────────────────

/** Backend-aligned: only Domain and URL are supported by the ThreatIndicator model. */
export type IndicatorType = 'Domain' | 'URL';

/** Indicator document as returned by GET /api/indicators (admin). */
export interface Indicator {
  _id: string;
  value: string;        // normalized value stored in DB
  rawValue: string;     // original value as submitted
  type: IndicatorType;
  description: string;
  addedBy: { _id: string; fullName: string; email: string };
  relatedAdvisory?: { advisoryId: string; title: string; severity: string; status: string } | null;
  createdAt: string;
  updatedAt: string;
}

// ─── User / Profile Types ──────────────────────────────────────────────────────

export type UserRole = 'student' | 'admin';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  department?: string;
  enrollmentId?: string;
  createdAt?: string;
}

// ─── Analytics Types (backend-aligned) ────────────────────────────────────────

export interface ChartDataPoint {
  name: string;
  value: number;
}

/** Admin analytics response (role === 'admin') */
export interface AdminAnalyticsData {
  incidents: {
    total:           number;
    byStatus: {
      reported:      number;
      investigating: number;
      resolved:      number;
      rejected:      number;
    };
    highAndCritical: number;
    byCategory: Array<{ category: string; count: number }>;
    bySeverity: Array<{ severity: string; count: number }>;
    monthlyTrend: Array<{ label: string; year: number; month: number; count: number }>;
  };
  advisories: {
    totalPublished: number;
  };
  users: {
    totalStudents: number;
  };
  quiz: {
    totalAttempts:     number;
    averagePercentage: number;
  };
}

/** Student analytics response (role === 'student') */
export interface StudentAnalyticsData {
  incidents: {
    total:    number;
    pending:  number;
    resolved: number;
    rejected: number;
    recent:   Incident[];
  };
  quiz: {
    totalAttempts:      number;
    averagePercentage:  number;
    latestScore:        number | null;
    latestTotal:        number | null;
    latestPercentage:   number | null;
    latestAttemptDate:  string | null;
  };
}

/** Union response from GET /api/analytics/dashboard */
export type AnalyticsDashboardResponse =
  | { success: true; role: 'admin';   data: AdminAnalyticsData }
  | { success: true; role: 'student'; data: StudentAnalyticsData };

/** @deprecated Use StudentAnalyticsData instead */
export type StudentDashboardData = StudentAnalyticsData;
