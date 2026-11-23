/**
 * CyberShield Campus — Quiz Question Dataset
 *
 * Questions cover realistic college-environment cybersecurity scenarios.
 * This file is the single source of truth for all quiz content.
 *
 * SECURITY NOTE: This dataset includes correct answers and explanations.
 * They must NEVER be sent to the client in question-listing responses.
 * Server-side scoring reads from this data; client only receives question
 * text and option lists.
 */

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
  id: string;    // 'a' | 'b' | 'c' | 'd'
  text: string;
}

export interface QuizQuestion {
  id:           string;
  question:     string;
  options:      QuizOption[];
  correctId:    string;   // option id of the correct answer
  explanation:  string;   // shown after submission
  category:     QuizCategory;
  difficulty:   QuizDifficulty;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ── 1. Phishing ─────────────────────────────────────────────────────────────
  {
    id: 'q001',
    category: 'Phishing',
    difficulty: 'Easy',
    question:
      'You receive an email from "placements@university-hr.net" asking you to click a link to confirm your internship slot. The official placement portal URL is erp.college.edu.in. What should you do first?',
    options: [
      { id: 'a', text: 'Click the link quickly so you do not lose your slot' },
      { id: 'b', text: 'Check whether the sender domain matches the official university domain' },
      { id: 'c', text: 'Reply with your college credentials to confirm your identity' },
      { id: 'd', text: 'Forward it to classmates so they can also register' },
    ],
    correctId: 'b',
    explanation:
      'Always verify the sender domain. Legitimate university emails come from the official domain (e.g. @college.edu.in). "university-hr.net" is a lookalike domain used to deceive students.',
  },
  {
    id: 'q002',
    category: 'Phishing',
    difficulty: 'Medium',
    question:
      'Which of the following signs BEST indicates a phishing email?',
    options: [
      { id: 'a', text: 'The email is sent from your college\'s official domain' },
      { id: 'b', text: 'The email greets you by your full name and mentions your roll number' },
      { id: 'c', text: 'The email creates urgency ("Act within 2 hours or your account will be locked") and links to a non-official domain' },
      { id: 'd', text: 'The email was received during business hours on a weekday' },
    ],
    correctId: 'c',
    explanation:
      'Urgency combined with a non-official link is the strongest indicator of phishing. Attackers pressure victims to act without thinking. Greeting you by name does not confirm legitimacy — that data is easily found on social media.',
  },
  {
    id: 'q003',
    category: 'Phishing',
    difficulty: 'Medium',
    question:
      'An email claims to be from Google saying your account will be deactivated unless you log in through the link provided. The link URL reads "https://google-accounts-verify.com/login". What is happening?',
    options: [
      { id: 'a', text: 'Google uses separate domains for security notifications — this is normal' },
      { id: 'b', text: 'This is a phishing page designed to steal your Google credentials' },
      { id: 'c', text: 'The link is safe because it uses HTTPS' },
      { id: 'd', text: 'You should log in quickly to prevent deactivation' },
    ],
    correctId: 'b',
    explanation:
      'The domain "google-accounts-verify.com" is not owned by Google. HTTPS only encrypts data in transit — it does not verify that the website is legitimate. Always navigate to sites by typing the official URL directly.',
  },

  // ── 2. Fake Internship ───────────────────────────────────────────────────────
  {
    id: 'q004',
    category: 'Fake Internship',
    difficulty: 'Easy',
    question:
      'A Google Form link is shared in your class WhatsApp group claiming to offer confirmed TCS internship slots. The form asks for your Aadhaar number and bank account details to "process your stipend". What is the safest action?',
    options: [
      { id: 'a', text: 'Fill in only the Aadhaar number, not the bank details' },
      { id: 'b', text: 'Fill in the form — it was shared by a classmate so it must be legitimate' },
      { id: 'c', text: 'Do not fill the form; verify with the official placement office and report it' },
      { id: 'd', text: 'Share it with other friends so they can also benefit' },
    ],
    correctId: 'c',
    explanation:
      'Legitimate internship registrations never ask for Aadhaar or bank details via Google Forms. Always verify through the official placement portal. If suspicious, report it to your IT helpdesk.',
  },
  {
    id: 'q005',
    category: 'Fake Internship',
    difficulty: 'Hard',
    question:
      'You receive a professional-looking offer letter PDF from "hr.infosys-campus.in" confirming your summer internship. The logo and formatting look authentic. What should raise your suspicion?',
    options: [
      { id: 'a', text: 'The domain "infosys-campus.in" is not the official Infosys website (infosys.com)' },
      { id: 'b', text: 'The offer arrived before the official placement drive dates announced by your college' },
      { id: 'c', text: 'The email asks you to pay a "registration deposit" to confirm your slot' },
      { id: 'd', text: 'All of the above' },
    ],
    correctId: 'd',
    explanation:
      'All three are strong indicators of a scam: a lookalike domain, timing inconsistency with the official placement calendar, and any request for a registration payment. Legitimate companies never charge candidates for internship slots.',
  },

  // ── 3. Social Engineering ────────────────────────────────────────────────────
  {
    id: 'q006',
    category: 'Social Engineering',
    difficulty: 'Easy',
    question:
      'A WhatsApp message from an unknown number displays your HOD\'s name and profile photo. It asks you to urgently transfer ₹2000 via GPay and says they will return it tomorrow. What is this attack called?',
    options: [
      { id: 'a', text: 'Credential stuffing' },
      { id: 'b', text: 'Impersonation scam using social engineering' },
      { id: 'c', text: 'Brute-force attack' },
      { id: 'd', text: 'Man-in-the-middle attack' },
    ],
    correctId: 'b',
    explanation:
      'This is impersonation combined with social engineering. Attackers use a known person\'s identity and urgency to manipulate victims into transferring money. Faculty will never request money transfers via WhatsApp. Always verify by calling the official college number.',
  },
  {
    id: 'q007',
    category: 'Social Engineering',
    difficulty: 'Medium',
    question:
      'A person calls you claiming to be from your college IT helpdesk. They say your ERP account has been compromised and ask you to share your OTP to "restore your account". What should you do?',
    options: [
      { id: 'a', text: 'Share the OTP immediately to prevent account loss' },
      { id: 'b', text: 'Ask for their employee ID and then share the OTP' },
      { id: 'c', text: 'Never share OTPs over the phone — hang up and call the official IT number to verify' },
      { id: 'd', text: 'Share the OTP but change your password immediately after' },
    ],
    correctId: 'c',
    explanation:
      'No legitimate IT helpdesk will ever ask for your OTP. OTPs are single-use second-factor codes meant only for you. This is a classic vishing (voice phishing) attack. Always independently verify by calling the official helpdesk number.',
  },

  // ── 4. Suspicious Forms ───────────────────────────────────────────────────────
  {
    id: 'q008',
    category: 'Suspicious Forms',
    difficulty: 'Easy',
    question:
      'A Google Form shared by a student asks for your ERP login password to "sync your attendance automatically". Should you fill it in?',
    options: [
      { id: 'a', text: 'Yes — it sounds like a useful college service' },
      { id: 'b', text: 'Only if the form was shared by faculty' },
      { id: 'c', text: 'No — no legitimate service ever asks for your password via a form' },
      { id: 'd', text: 'Yes — Google Forms are always secure' },
    ],
    correctId: 'c',
    explanation:
      'No legitimate system, IT team or service will ever ask for your password through a form or email. This is credential harvesting. Report the form to your IT helpdesk.',
  },
  {
    id: 'q009',
    category: 'Suspicious Forms',
    difficulty: 'Medium',
    question:
      'Which clue MOST strongly suggests a scholarship registration form is fraudulent?',
    options: [
      { id: 'a', text: 'The form is on Google Forms with a google.com/forms URL' },
      { id: 'b', text: 'The form asks for your bank account number and IFSC code to "transfer the scholarship amount"' },
      { id: 'c', text: 'The form was shared in an email rather than a WhatsApp group' },
      { id: 'd', text: 'The form has a deadline two weeks away' },
    ],
    correctId: 'b',
    explanation:
      'Requesting bank account details (account number and IFSC) via a form for an unsolicited scholarship offer is a strong scam indicator. Legitimate scholarship disbursements go through the institution\'s finance office using already-verified banking details.',
  },

  // ── 5. QR Code / UPI Scam ────────────────────────────────────────────────────
  {
    id: 'q010',
    category: 'QR Code / UPI Scam',
    difficulty: 'Easy',
    question:
      'You scan a QR code at the campus canteen to pay. Your UPI app shows the recipient name as "Ramesh Kumar" instead of the expected canteen name. What should you do?',
    options: [
      { id: 'a', text: 'Pay anyway — the QR code is at the counter so it must be safe' },
      { id: 'b', text: 'Pay a small test amount first to check' },
      { id: 'c', text: 'Cancel the payment, check the QR code for tampering, and report to campus security' },
      { id: 'd', text: 'Ask the person behind you if they have experienced the same issue' },
    ],
    correctId: 'c',
    explanation:
      'A mismatch between the displayed name and the expected business is a strong indicator of a tampered QR code. Fraudsters print fake codes and stick them over legitimate ones. Always check the recipient name before confirming any UPI payment.',
  },
  {
    id: 'q011',
    category: 'QR Code / UPI Scam',
    difficulty: 'Medium',
    question:
      'A stranger approaches you at an ATM and says they urgently need cash. They show you a QR code and say "scan this and you will receive ₹500 in your account". What is actually happening?',
    options: [
      { id: 'a', text: 'They are sending you money as promised' },
      { id: 'b', text: 'Scanning a QR code for a payment request will DEBIT money from your account, not credit it' },
      { id: 'c', text: 'The QR code is a standard bank transfer — it is safe' },
      { id: 'd', text: 'You will receive money only if you also enter your PIN' },
    ],
    correctId: 'b',
    explanation:
      'Scanning a UPI collect-request QR code authorises a payment FROM your account. The statement "scan to receive money" is a well-known UPI scam. You cannot receive money by scanning a code — you can only send it.',
  },

  // ── 6. University Impersonation ───────────────────────────────────────────────
  {
    id: 'q012',
    category: 'University Impersonation',
    difficulty: 'Medium',
    question:
      'An email with the subject "URGENT: Exam Hall Ticket Cancellation" arrives from "admin@university-exam-portal.in". Your official university domain is "college.edu.in". What should you do?',
    options: [
      { id: 'a', text: 'Click the verification link immediately to prevent cancellation' },
      { id: 'b', text: 'Ignore it — exam communications always come via SMS only' },
      { id: 'c', text: 'Do not click the link; navigate directly to the official ERP portal by typing the URL yourself' },
      { id: 'd', text: 'Forward it to classmates to warn them' },
    ],
    correctId: 'c',
    explanation:
      'The sender domain "university-exam-portal.in" is not the official college domain. Urgency and threats of cancellation are classic pressure tactics. Always navigate to the official portal by typing the URL directly instead of clicking email links.',
  },
  {
    id: 'q013',
    category: 'University Impersonation',
    difficulty: 'Hard',
    question:
      'A polished Instagram account using your university logo announces an "exclusive study-abroad scholarship". The link leads to a website with a URL like "college-global-scholarships.com". Which is the BEST way to verify legitimacy?',
    options: [
      { id: 'a', text: 'Check if the website has a lock icon (HTTPS) in the browser address bar' },
      { id: 'b', text: 'Look for the scholarship announcement on the official university website or contact the registrar directly' },
      { id: 'c', text: 'Check the number of Instagram followers — a large following suggests legitimacy' },
      { id: 'd', text: 'Fill in only your name and email to test the site before providing more data' },
    ],
    correctId: 'b',
    explanation:
      'The only reliable way to verify an official scholarship is through the university\'s own verified website or by directly contacting the administrative office. HTTPS, follower counts and partial form submissions do not confirm authenticity.',
  },

  // ── 7. Password Security ──────────────────────────────────────────────────────
  {
    id: 'q014',
    category: 'Password Security',
    difficulty: 'Easy',
    question:
      'Which of the following is the STRONGEST password?',
    options: [
      { id: 'a', text: 'Riya2003' },
      { id: 'b', text: 'Password@123' },
      { id: 'c', text: 'college2024' },
      { id: 'd', text: 'T#9mK!vQ2$pL8' },
    ],
    correctId: 'd',
    explanation:
      '"T#9mK!vQ2$pL8" is a 13-character random mix of uppercase, lowercase, numbers and special characters with no recognisable words or personal information. The other options contain predictable patterns, dictionary words or personal details.',
  },
  {
    id: 'q015',
    category: 'Password Security',
    difficulty: 'Medium',
    question:
      'Why is reusing the same password for your college ERP and a gaming website risky?',
    options: [
      { id: 'a', text: 'Using the same password everywhere is considered best practice for memorability' },
      { id: 'b', text: 'If the gaming site is breached, attackers can use the leaked credentials to access your college ERP — a technique called credential stuffing' },
      { id: 'c', text: 'College ERPs automatically expire repeated passwords' },
      { id: 'd', text: 'It is only risky if both accounts share the same username' },
    ],
    correctId: 'b',
    explanation:
      'Credential stuffing attacks use username/password pairs leaked from one site to access other services. Unique passwords for each account prevent this. Use a password manager to generate and store strong, unique passwords.',
  },

  // ── 8. Multi-Factor Authentication ───────────────────────────────────────────
  {
    id: 'q016',
    category: 'Multi-Factor Authentication',
    difficulty: 'Easy',
    question:
      'What is the primary benefit of Multi-Factor Authentication (MFA) even when you already have a strong password?',
    options: [
      { id: 'a', text: 'MFA makes your password easier to remember' },
      { id: 'b', text: 'MFA ensures your account cannot be accessed even if your password is stolen or leaked' },
      { id: 'c', text: 'MFA is only useful for bank accounts, not college portals' },
      { id: 'd', text: 'MFA prevents phishing emails from reaching your inbox' },
    ],
    correctId: 'b',
    explanation:
      'Even if an attacker obtains your password through phishing or a data breach, MFA requires a second factor (e.g. OTP on your phone) that the attacker does not have. Enable MFA on your college email and all important accounts.',
  },
  {
    id: 'q017',
    category: 'Multi-Factor Authentication',
    difficulty: 'Medium',
    question:
      'You receive an unexpected OTP on your phone for your college ERP login even though you did not try to log in. What does this MOST likely mean?',
    options: [
      { id: 'a', text: 'The OTP was sent by the system automatically — it is nothing to worry about' },
      { id: 'b', text: 'Someone else has your password and is attempting to log into your account' },
      { id: 'c', text: 'The OTP was sent to the wrong number by mistake' },
      { id: 'd', text: 'Your phone is sending messages automatically due to a virus' },
    ],
    correctId: 'b',
    explanation:
      'An unsolicited OTP is a strong sign that someone else has your password and is trying to pass the MFA step. Immediately change your password and report to the IT helpdesk.',
  },

  // ── 9. Suspicious URLs ───────────────────────────────────────────────────────
  {
    id: 'q018',
    category: 'Suspicious URLs',
    difficulty: 'Medium',
    question:
      'Which of the following URLs is MOST likely to be a phishing attempt targeting a college student?',
    options: [
      { id: 'a', text: 'https://college.edu.in/erp/login' },
      { id: 'b', text: 'https://college-erp-login.com/secure/verify' },
      { id: 'c', text: 'https://mail.google.com' },
      { id: 'd', text: 'https://nptel.ac.in/courses' },
    ],
    correctId: 'b',
    explanation:
      '"college-erp-login.com" is a lookalike domain designed to resemble a college portal URL. The actual domain is ".com" rather than the institution\'s official ".edu.in" domain. Words like "secure" and "verify" in the path are also common phishing indicators.',
  },
  {
    id: 'q019',
    category: 'Suspicious URLs',
    difficulty: 'Hard',
    question:
      'A URL reads: http://paymentgate.in@192.168.1.5/erp/pay. Which TWO features of this URL are most suspicious?',
    options: [
      { id: 'a', text: 'The use of HTTP and an IP address instead of a domain name' },
      { id: 'b', text: 'The presence of an @ symbol (which redirects the browser to the IP address) and the use of HTTP' },
      { id: 'c', text: 'The path /erp/pay and the .in domain' },
      { id: 'd', text: 'The word "paymentgate" and the lack of a port number' },
    ],
    correctId: 'b',
    explanation:
      'The @ symbol in a URL means everything before it is treated as credentials by the browser — the actual destination is the IP address 192.168.1.5. Combined with HTTP (unencrypted), this URL has two serious red flags. Browsers now warn about such URLs but users often ignore warnings.',
  },

  // ── 10. Safe Browsing ─────────────────────────────────────────────────────────
  {
    id: 'q020',
    category: 'Safe Browsing',
    difficulty: 'Easy',
    question:
      'A website shows a padlock icon (🔒) and uses HTTPS. Does this mean the website is legitimate and safe to use?',
    options: [
      { id: 'a', text: 'Yes — the padlock confirms the website is verified and trustworthy' },
      { id: 'b', text: 'No — HTTPS only encrypts the connection; the site can still be a phishing page' },
      { id: 'c', text: 'Yes — only real businesses can obtain HTTPS certificates' },
      { id: 'd', text: 'No — the padlock icon only appears on government websites' },
    ],
    correctId: 'b',
    explanation:
      'HTTPS encrypts data in transit but does not validate the content or intent of the website. Free TLS certificates (e.g. from Let\'s Encrypt) are openly available, so phishing sites routinely use HTTPS. A padlock confirms encryption, not legitimacy.',
  },
  {
    id: 'q021',
    category: 'Safe Browsing',
    difficulty: 'Medium',
    question:
      'You click a bit.ly link shared in a study group and land on a page that asks you to log in with your college credentials. The page looks identical to the official ERP portal. What should you do?',
    options: [
      { id: 'a', text: 'Log in normally — the page looks official so it must be safe' },
      { id: 'b', text: 'Log in but use a temporary password first to test the site' },
      { id: 'c', text: 'Close the tab, navigate to the official ERP URL by typing it manually, and report the link' },
      { id: 'd', text: 'Log in quickly and change your password immediately after' },
    ],
    correctId: 'c',
    explanation:
      'Never log in to a site reached via a URL shortener from an unofficial source. URL shorteners hide the actual destination. Even if the page looks identical to the ERP, it could be a pixel-perfect phishing clone. Always type the official URL directly.',
  },
  {
    id: 'q022',
    category: 'Safe Browsing',
    difficulty: 'Hard',
    question:
      'Which practice BEST protects your personal data while using public Wi-Fi on campus?',
    options: [
      { id: 'a', text: 'Only visit HTTPS websites' },
      { id: 'b', text: 'Use a VPN and avoid accessing sensitive accounts on public Wi-Fi when possible' },
      { id: 'c', text: 'Log out of accounts after every session' },
      { id: 'd', text: 'Use Incognito / Private browsing mode' },
    ],
    correctId: 'b',
    explanation:
      'A VPN encrypts all traffic between your device and the VPN server, preventing other users on the same Wi-Fi from intercepting your data. While HTTPS encrypts individual site connections and logging out is good practice, a VPN provides the most comprehensive protection on untrusted networks.',
  },
  {
    id: 'q023',
    category: 'Safe Browsing',
    difficulty: 'Hard',
    question:
      'Your college computer shows a pop-up: "Warning! 5 viruses detected. Call Microsoft Support: +91-XXXX-XXXX immediately." What should you do?',
    options: [
      { id: 'a', text: 'Call the number and follow their instructions' },
      { id: 'b', text: 'Close the browser tab; this is a tech-support scam pop-up — real OS alerts do not include phone numbers' },
      { id: 'c', text: 'Download the antivirus software linked in the pop-up' },
      { id: 'd', text: 'Restart the computer and call IT immediately' },
    ],
    correctId: 'b',
    explanation:
      'This is a classic tech-support scam (also called "scareware"). Real Windows Defender or macOS alerts never display phone numbers. Calling the number connects you to scammers who will charge you to "fix" a non-existent problem. Close the tab and clear browser cache if the pop-up persists.',
  },
  {
    id: 'q024',
    category: 'Password Security',
    difficulty: 'Hard',
    question:
      'Your college sends a data breach notification saying email addresses and hashed passwords were exposed. You use the same email and password on other websites. What should you do FIRST?',
    options: [
      { id: 'a', text: 'Wait and see if any of your accounts show signs of unauthorised access' },
      { id: 'b', text: 'Immediately change the compromised password on every site where you use it and enable MFA' },
      { id: 'c', text: 'Only change the password on the breached college system' },
      { id: 'd', text: 'Delete all your accounts and create new ones' },
    ],
    correctId: 'b',
    explanation:
      'Even hashed passwords can be cracked over time, especially if weak. If you reuse passwords, attackers attempt credential stuffing on other services immediately after a breach is discovered. Change the password on every affected service and enable MFA before attackers can exploit it.',
  },
  {
    id: 'q025',
    category: 'Phishing',
    difficulty: 'Hard',
    question:
      'Which technique allows a phishing site at "micrоsoft.com" (using a Cyrillic "о") to bypass visual detection?',
    options: [
      { id: 'a', text: 'SQL injection' },
      { id: 'b', text: 'Homograph attack using Unicode/Punycode domain substitution' },
      { id: 'c', text: 'SSL stripping' },
      { id: 'd', text: 'Cross-site scripting (XSS)' },
    ],
    correctId: 'b',
    explanation:
      'A homograph attack uses visually identical Unicode characters (like Cyrillic "о" vs Latin "o") to register domains that look identical to legitimate ones. Browsers convert these to Punycode (xn--) internally. Checking the Punycode representation in the browser address bar reveals the deception.',
  },
];
