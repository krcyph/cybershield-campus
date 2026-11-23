// Local demo type — this file is kept as a reference but is no longer
// imported by any page. The cyber-quiz page now uses the backend API.
interface LocalQuizQuestion {
  id: string;
  topic: string;
  question: string;
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
  explanation: string;
}

export const quizQuestions: LocalQuizQuestion[] = [
  {
    id: 'q1',
    topic: 'Phishing',
    question:
      'You receive an email from "placements@university-hr.net" asking you to verify your internship registration. What should you do first?',
    options: [
      { id: 'a', text: 'Click the link to verify — it looks official' },
      { id: 'b', text: 'Check whether the sender domain matches your official university domain' },
      { id: 'c', text: 'Reply with your credentials to confirm your identity' },
      { id: 'd', text: 'Forward it to all classmates so they can register too' },
    ],
    correctOptionId: 'b',
    explanation:
      'Always verify the sender\'s domain before clicking any links. Legitimate university emails come from the official domain (e.g., @college.edu.in), not from look-alike domains like "university-hr.net".',
  },
  {
    id: 'q2',
    topic: 'Fake Internship Scam',
    question:
      'A Google Form shared in your class WhatsApp group asks for your Aadhaar number and bank account details to "process your internship stipend". What is the safest action?',
    options: [
      { id: 'a', text: 'Fill in the form — it was shared by a classmate so it must be safe' },
      { id: 'b', text: 'Fill in only the bank details, not the Aadhaar' },
      {
        id: 'c',
        text: 'Do not fill the form; verify with the official placement office and report it',
      },
      { id: 'd', text: 'Share it with other friends so they can also benefit' },
    ],
    correctOptionId: 'c',
    explanation:
      'Legitimate internship registrations never ask for Aadhaar or bank details via Google Forms. Always verify through the official placement portal and report suspicious forms to your IT helpdesk.',
  },
  {
    id: 'q3',
    topic: 'Password Safety',
    question: 'Which of the following is the strongest password?',
    options: [
      { id: 'a', text: 'Password@123' },
      { id: 'b', text: 'Riya2003' },
      { id: 'c', text: 'T#9mK!vQ2$pL' },
      { id: 'd', text: 'college2024' },
    ],
    correctOptionId: 'c',
    explanation:
      'A strong password uses a random mix of uppercase, lowercase, numbers and special characters with no recognisable words or personal information. "T#9mK!vQ2$pL" is the strongest here.',
  },
  {
    id: 'q4',
    topic: 'Multi-Factor Authentication',
    question: 'Why is Multi-Factor Authentication (MFA) important even if you have a strong password?',
    options: [
      { id: 'a', text: 'MFA is not important — a strong password is enough' },
      {
        id: 'b',
        text: 'MFA adds a second verification step, so attackers cannot log in with just your password',
      },
      { id: 'c', text: 'MFA makes logging in faster' },
      { id: 'd', text: 'MFA only works on mobile phones' },
    ],
    correctOptionId: 'b',
    explanation:
      'Even if your password is stolen through phishing or a data breach, MFA prevents attackers from accessing your account without also having access to your second factor (e.g., your phone).',
  },
  {
    id: 'q5',
    topic: 'QR Code Scams',
    question:
      'You scan a QR code at the campus canteen to pay but the name shown in your UPI app does not match the canteen name. What should you do?',
    options: [
      { id: 'a', text: 'Pay anyway — QR codes are always safe' },
      {
        id: 'b',
        text: 'Cancel the payment, report the QR code to campus security and check for tampering',
      },
      { id: 'c', text: 'Pay a small amount first to test it' },
      { id: 'd', text: 'Ask the person behind you if they have experienced the same issue' },
    ],
    correctOptionId: 'b',
    explanation:
      'A mismatch between the expected recipient name and the UPI name is a strong indicator of a tampered QR code. Cancel the transaction immediately and report it to campus security and the IT helpdesk.',
  },
  {
    id: 'q6',
    topic: 'Social Engineering',
    question:
      'A WhatsApp message from a number claiming to be your HOD asks you to urgently transfer ₹2000 and says they will return it tomorrow. What is this?',
    options: [
      { id: 'a', text: 'A genuine emergency — your HOD needs help' },
      { id: 'b', text: 'A social engineering / impersonation scam' },
      { id: 'c', text: 'A test from the college IT department' },
      { id: 'd', text: 'Spam — just ignore it' },
    ],
    correctOptionId: 'b',
    explanation:
      'This is a classic social engineering attack using impersonation and urgency. Faculty members will never request money transfers via WhatsApp. Always verify by calling the official college number or meeting the person directly.',
  },
  {
    id: 'q7',
    topic: 'Phishing',
    question: 'Which of the following is NOT a red flag in a suspicious email?',
    options: [
      { id: 'a', text: 'Urgent language: "Act within 24 hours or your account will be suspended"' },
      { id: 'b', text: 'Sender address matches the official university domain exactly' },
      { id: 'c', text: 'A link that leads to a different domain than expected' },
      { id: 'd', text: 'A request for your password via email' },
    ],
    correctOptionId: 'b',
    explanation:
      'A sender address that exactly matches the official university domain is NOT a red flag — it is what you expect from genuine emails. All other options (urgency, mismatched links, password requests) are classic phishing indicators.',
  },
  {
    id: 'q8',
    topic: 'Suspicious Forms',
    question:
      'A Google Form asks for your college ERP password to "sync your attendance automatically". Is this legitimate?',
    options: [
      { id: 'a', text: 'Yes — it sounds like a useful college service' },
      { id: 'b', text: 'Only if the form is shared by a faculty member' },
      { id: 'c', text: 'No — no legitimate service ever asks for your password via a form' },
      { id: 'd', text: 'Yes — Google Forms are always secure' },
    ],
    correctOptionId: 'c',
    explanation:
      'No legitimate system, service or IT team will ever ask you for your password via a form or email. This is a credential harvesting attempt. Report it immediately.',
  },
  {
    id: 'q9',
    topic: 'Password Safety',
    question: 'Which practice BEST protects your accounts across multiple services?',
    options: [
      { id: 'a', text: 'Use one strong password for all accounts so you remember it easily' },
      {
        id: 'b',
        text: 'Use a unique password for each account, managed with a password manager',
      },
      { id: 'c', text: 'Write all passwords in a notebook kept at your desk' },
      { id: 'd', text: 'Change all passwords every day' },
    ],
    correctOptionId: 'b',
    explanation:
      'Using unique passwords for each account means that if one service is breached, your other accounts remain safe. A password manager helps you create and store strong, unique passwords without memorising them all.',
  },
  {
    id: 'q10',
    topic: 'Phishing',
    question:
      'You receive an email with the subject "URGENT: Your hall ticket will be CANCELLED". You notice the sender is "admin@uni-exam-portal.in" but your university domain is "college.edu.in". What is happening?',
    options: [
      { id: 'a', text: 'The university uses a separate domain for exam notifications — it is fine' },
      {
        id: 'b',
        text: 'This is likely a phishing email using a fake domain to impersonate the university',
      },
      { id: 'c', text: 'The email is likely a mistake and can be ignored' },
      { id: 'd', text: 'You should click the link quickly before the deadline' },
    ],
    correctOptionId: 'b',
    explanation:
      'The combination of urgency ("CANCELLED"), a mismatched sender domain, and a pressure deadline are classic phishing tactics. Navigate directly to the official exam portal by typing the URL yourself rather than clicking the link.',
  },
];
