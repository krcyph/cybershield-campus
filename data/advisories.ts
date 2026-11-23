// ── Local demo type (not connected to backend) ──────────────────────────────
// These mock advisories use the old frontend-only shape and are only consumed
// by advisories and admin/advisories pages which have not yet been integrated.
interface DemoAdvisory {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Archived';
  publishedAt: string;
  updatedAt: string;
  recommendedAction: string;
  tags: string[];
  isDemo: boolean;
}

export const sampleAdvisories: DemoAdvisory[] = [
  {
    id: 'ADV-2024-001',
    title: 'DEMO: Fake Internship Registration Campaigns Targeting Students',
    summary:
      'Fraudulent Google Forms and websites are circulating claiming to offer TCS, Infosys and Wipro internships. These collect personal and financial data.',
    description: `[DEMO — Illustrative Content]\n\nMultiple students have reported receiving WhatsApp messages and emails advertising "confirmed internship slots" at major IT companies. These messages link to Google Forms or unofficial websites that ask for:\n\n• Aadhaar card number\n• Bank account details for "stipend processing"\n• University login credentials\n• Personal photographs\n\nLegitimate internship registrations are ALWAYS done through the official college placement portal (erp.college.ac.in) or notified in writing by the placement office. No internship offer requires bank details upfront.\n\nIf you receive such messages, do not fill in the form. Report to the placement office and the IT helpdesk immediately.`,
    category: 'Scam',
    severity: 'High',
    status: 'Active',
    publishedAt: '2024-11-10T09:00:00Z',
    updatedAt: '2024-11-10T09:00:00Z',
    recommendedAction:
      'Do not submit personal or financial information. Verify all internship communications with the official placement cell. Report suspicious links using the Incident Reporting form.',
    tags: ['internship', 'google-form', 'scam', 'financial-fraud'],
    isDemo: true,
  },
  {
    id: 'ADV-2024-002',
    title: 'DEMO: Unofficial Google Forms Collecting Student Credentials',
    summary:
      'Phishing forms disguised as internal surveys are collecting student login IDs and passwords under the guise of feedback collection.',
    description: `[DEMO — Illustrative Content]\n\nSeveral phishing Google Forms have been identified that mimic official student feedback and exam registration forms. These forms appear credible because they use the university logo and familiar language.\n\nSigns that a form is fraudulent:\n• It asks for your ERP login password\n• The form URL is a google.com/forms link shared via informal channels\n• It promises "extra marks" or "priority exam slot" for filling it\n• There is a deadline pressure ("Register before midnight")\n\nOfficial forms from the university will never ask for your password. When in doubt, check with your department coordinator before filling any form.`,
    category: 'Phishing',
    severity: 'High',
    status: 'Active',
    publishedAt: '2024-11-08T11:30:00Z',
    updatedAt: '2024-11-12T08:00:00Z',
    recommendedAction:
      'Never enter your ERP or email password in a Google Form. Verify forms with department coordinators. Enable two-factor authentication on your college email.',
    tags: ['phishing', 'google-form', 'credentials', 'erp'],
    isDemo: true,
  },
  {
    id: 'ADV-2024-003',
    title: 'DEMO: Fake University Placement or Faculty Impersonation on WhatsApp',
    summary:
      'Scammers are impersonating professors and placement officers on WhatsApp to request urgent money transfers or personal information.',
    description: `[DEMO — Illustrative Content]\n\nA recent pattern involves unknown phone numbers using the display photos and names of well-known faculty or placement officers. These accounts contact students with urgent requests such as:\n\n• "I am stuck — please transfer ₹2000 urgently via GPay, I will return it tomorrow"\n• "Your placement interview is tomorrow — send me your password so I can register you"\n• "There is a last-minute registration fee — pay immediately to secure your slot"\n\nFaculty and placement officers will NEVER contact students this way. Always verify any such request by calling the official college number or meeting the person in person.\n\nReport the number to your college IT helpdesk and to the cyber crime portal.`,
    category: 'Social Engineering',
    severity: 'Critical',
    status: 'Active',
    publishedAt: '2024-10-18T10:00:00Z',
    updatedAt: '2024-11-01T09:00:00Z',
    recommendedAction:
      'Verify identity through official college channels before transferring money or sharing credentials. Report impersonation accounts to WhatsApp and local cybercrime authorities.',
    tags: ['impersonation', 'whatsapp', 'social-engineering', 'money-fraud'],
    isDemo: true,
  },
  {
    id: 'ADV-2024-004',
    title: 'DEMO: QR Code Payment Scam at Campus Payment Points',
    summary:
      'Tampered QR codes have been found pasted over legitimate payment codes at canteen and library counters, redirecting payments to fraudulent UPI IDs.',
    description: `[DEMO — Illustrative Content]\n\nPhysical QR code replacement scams have been reported at campus payment counters. Fraudsters print fake QR codes and paste them over the legitimate codes on notice boards, canteen counters and printer payment terminals.\n\nHow to identify a fake QR code:\n• The QR code sticker appears to have an extra layer pasted on top\n• The name that appears after scanning does not match the expected vendor or department name\n• The UPI ID belongs to an individual name rather than a business\n\nAlways check the name shown by your UPI app before confirming the payment. If in doubt, ask the counter staff to verify the QR code. Report any suspicious QR codes to campus security immediately.`,
    category: 'Scam',
    severity: 'High',
    status: 'Active',
    publishedAt: '2024-11-12T09:30:00Z',
    updatedAt: '2024-11-12T09:30:00Z',
    recommendedAction:
      'Always verify the recipient name in your UPI app before confirming payment. Report suspicious QR codes to campus security and the IT helpdesk.',
    tags: ['qr-code', 'upi', 'payment-scam', 'physical'],
    isDemo: true,
  },
  {
    id: 'ADV-2024-005',
    title: 'DEMO: Suspicious Emails Requesting Urgent Action on Exam Portal',
    summary:
      'Phishing emails mimicking official exam notifications are directing students to fake login pages to harvest credentials.',
    description: `[DEMO — Illustrative Content]\n\nStudents have been receiving emails from addresses like "noreply@exam-portal-university.in" and "admin@uni-results.net" that closely mimic the official university exam notification format.\n\nCommon red flags in these emails:\n• Urgent language: "Your hall ticket will be CANCELLED if you do not verify within 24 hours"\n• Link destination is not the official university domain\n• Email sender domain is different from the official university domain\n• Poor formatting or inconsistent fonts compared to genuine emails\n\nThe official university exam portal URL is always communicated via official notice boards and your college email from verified sender addresses. When in doubt, type the URL directly in the browser rather than clicking the link in the email.`,
    category: 'Phishing',
    severity: 'Medium',
    status: 'Active',
    publishedAt: '2024-11-05T12:00:00Z',
    updatedAt: '2024-11-05T12:00:00Z',
    recommendedAction:
      'Do not click links in suspicious emails. Navigate to the exam portal by typing the URL directly. Contact the exam office to verify any unexpected notifications.',
    tags: ['phishing', 'email', 'exam-portal', 'credentials'],
    isDemo: true,
  },
  {
    id: 'ADV-2024-006',
    title: 'DEMO: Password Safety — Avoid Reusing College Credentials',
    summary:
      'Students using the same password for college ERP and personal accounts risk full account takeover if one platform is breached.',
    description: `[DEMO — Illustrative Content]\n\nData breaches at third-party services frequently expose email and password combinations. If students use the same password for their college ERP as for social media or gaming accounts, attackers can use those leaked credentials to access college systems — a technique known as credential stuffing.\n\nBest practices:\n• Use a unique, strong password for your college ERP and email\n• Enable Multi-Factor Authentication (MFA) wherever possible\n• Use a password manager to generate and store unique passwords\n• Change your password immediately if you receive an unexpected login alert\n• Never share your password with anyone, including IT staff`,
    category: 'Account Security',
    severity: 'Medium',
    status: 'Active',
    publishedAt: '2024-10-01T09:00:00Z',
    updatedAt: '2024-10-01T09:00:00Z',
    recommendedAction:
      'Enable MFA on college email and ERP. Use unique passwords for each service. Change your college password if you suspect it has been exposed.',
    tags: ['password', 'mfa', 'account-security', 'credential-stuffing'],
    isDemo: true,
  },
];
