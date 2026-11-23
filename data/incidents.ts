// ── Local demo type (not connected to backend) ──────────────────────────────
// These mock incidents use the old frontend-only shape and are only consumed
// by admin/dashboard and analytics pages which have not yet been integrated.
interface DemoIncident {
  id: string;
  title: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Under Review' | 'Resolved' | 'Closed';
  description: string;
  reportedBy: string;
  reportedAt: string;
  updatedAt: string;
  affectedSystem?: string;
  evidence?: string;
  adminNotes?: string;
}

export const sampleIncidents: DemoIncident[] = [
  {
    id: 'INC-2024-001',
    title: 'Phishing email impersonating placement office',
    category: 'Phishing Email',
    severity: 'High',
    status: 'Resolved',
    description:
      'Received an email from "placements@university-hr.net" asking to click a link to verify internship registration. The domain is not the official university domain.',
    reportedBy: 'Riya Sharma',
    reportedAt: '2024-11-02T09:15:00Z',
    updatedAt: '2024-11-04T14:30:00Z',
    affectedSystem: 'College Email',
    evidence: 'Screenshot of email with suspicious link',
    adminNotes: 'Confirmed phishing attempt. Advisory published.',
  },
  {
    id: 'INC-2024-002',
    title: 'Fake internship registration Google Form',
    category: 'Fake Internship Offer',
    severity: 'High',
    status: 'Under Review',
    description:
      'A Google Form link was shared in the class WhatsApp group claiming to be an official TCS internship registration. The form asks for Aadhaar number and bank details.',
    reportedBy: 'Arjun Mehta',
    reportedAt: '2024-11-10T11:40:00Z',
    updatedAt: '2024-11-10T15:00:00Z',
    affectedSystem: 'WhatsApp / Google Forms',
    evidence: 'Link to the Google Form shared in group',
  },
  {
    id: 'INC-2024-003',
    title: 'QR code scam at campus canteen',
    category: 'Payment / QR Code Scam',
    severity: 'Medium',
    status: 'Open',
    description:
      'A tampered QR code was found pasted over the legitimate payment QR at the library photocopier. Students making payments were redirected to an unknown UPI ID.',
    reportedBy: 'Sneha Patil',
    reportedAt: '2024-11-12T08:30:00Z',
    updatedAt: '2024-11-12T08:30:00Z',
    affectedSystem: 'UPI Payment',
  },
  {
    id: 'INC-2024-004',
    title: 'Google account compromise after clicking unknown link',
    category: 'Account Compromise',
    severity: 'Critical',
    status: 'Resolved',
    description:
      'Student clicked a link in an email that looked like Google password reset. Account was accessed from an unknown device in another state within minutes.',
    reportedBy: 'Dev Patel',
    reportedAt: '2024-10-28T16:20:00Z',
    updatedAt: '2024-11-01T10:00:00Z',
    affectedSystem: 'Google Account / College Portal',
    adminNotes: 'Password reset advised. MFA enabled. Account recovered.',
  },
  {
    id: 'INC-2024-005',
    title: 'Professor impersonation on WhatsApp requesting money',
    category: 'Impersonation',
    severity: 'High',
    status: 'Resolved',
    description:
      'An unknown number using the HOD\'s name and photo contacted students asking for emergency money transfer via GPay. At least 3 students were targeted.',
    reportedBy: 'Priya Kulkarni',
    reportedAt: '2024-10-15T13:45:00Z',
    updatedAt: '2024-10-18T09:00:00Z',
    affectedSystem: 'WhatsApp',
    adminNotes: 'Students advised to verify via official channels. Reported to cybercell.',
  },
  {
    id: 'INC-2024-006',
    title: 'Suspicious URL in college notice board email',
    category: 'Suspicious URL',
    severity: 'Medium',
    status: 'Under Review',
    description:
      'Official-looking email from "noreply@college-notices.in" contained a link to download the exam schedule. URL leads to a file hosting site instead of official portal.',
    reportedBy: 'Rahul Verma',
    reportedAt: '2024-11-14T10:00:00Z',
    updatedAt: '2024-11-14T12:30:00Z',
    affectedSystem: 'College Email',
  },
  {
    id: 'INC-2024-007',
    title: 'Fake scholarship registration link on Instagram',
    category: 'Fake Internship Offer',
    severity: 'Medium',
    status: 'Open',
    description:
      'An Instagram account with the university logo posted a scholarship registration link. The website closely mimics the university portal but has a different domain.',
    reportedBy: 'Anjali Singh',
    reportedAt: '2024-11-15T14:10:00Z',
    updatedAt: '2024-11-15T14:10:00Z',
    affectedSystem: 'Instagram / Web',
  },
  {
    id: 'INC-2024-008',
    title: 'Unknown login attempt on college ERP portal',
    category: 'Account Compromise',
    severity: 'High',
    status: 'Open',
    description:
      'Student received login alert from ERP portal for an IP from outside India. Password was not changed but login was blocked by the system.',
    reportedBy: 'Kunal Desai',
    reportedAt: '2024-11-16T07:55:00Z',
    updatedAt: '2024-11-16T07:55:00Z',
    affectedSystem: 'College ERP Portal',
  },
];
