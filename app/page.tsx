import Link from 'next/link';
import {
  Shield,
  AlertTriangle,
  Newspaper,
  Link2,
  Brain,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Lock,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: AlertTriangle,
    title: 'Incident Reporting',
    description:
      'Report phishing, scams, QR code fraud and account compromises directly through the platform.',
    color: 'text-orange-400',
    bg: 'bg-orange-900/20',
    border: 'border-orange-700/30',
  },
  {
    icon: Newspaper,
    title: 'Security Advisories',
    description:
      'Stay informed with real-time advisories about active threats targeting the campus community.',
    color: 'text-blue-400',
    bg: 'bg-blue-900/20',
    border: 'border-blue-700/30',
  },
  {
    icon: Link2,
    title: 'URL Checker',
    description:
      'Analyse suspicious links against campus threat intelligence before clicking or sharing them.',
    color: 'text-teal-400',
    bg: 'bg-teal-900/20',
    border: 'border-teal-700/30',
  },
  {
    icon: Brain,
    title: 'Cyber Awareness Quiz',
    description:
      'Test and strengthen your knowledge of phishing, social engineering and safe digital practices.',
    color: 'text-purple-400',
    bg: 'bg-purple-900/20',
    border: 'border-purple-700/30',
  },
  {
    icon: BarChart3,
    title: 'Security Analytics',
    description:
      'Visualise incident trends, severity distributions and resolution metrics across the campus.',
    color: 'text-green-400',
    bg: 'bg-green-900/20',
    border: 'border-green-700/30',
  },
  {
    icon: Lock,
    title: 'Admin Response',
    description:
      'IT administrators can review, triage and update incidents and publish official advisories.',
    color: 'text-red-400',
    bg: 'bg-red-900/20',
    border: 'border-red-700/30',
  },
];

const stats = [
  { value: '500+', label: 'Students Protected' },
  { value: '6', label: 'Threat Categories' },
  { value: '24/7', label: 'Awareness Coverage' },
  { value: '100%', label: 'Campus-focused' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0d1421] text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-white">CyberShield</span>
              <span className="text-sm font-bold text-blue-400"> Campus</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-slate-300 hover:text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-900/30 border border-blue-700/40 rounded-full text-xs font-medium text-blue-300 mb-8">
            <Zap size={12} />
            Campus Cybersecurity Awareness Platform
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
            Protect Your Campus{' '}
            <span className="text-blue-400">Digital Life</span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-2xl mx-auto">
            CyberShield Campus helps students identify, report and respond to cybersecurity
            threats — from phishing emails and fake internship scams to QR code fraud and
            account compromises.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Get Started
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-10 border-y border-slate-800">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-blue-400">{stat.value}</p>
              <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Everything You Need to Stay Safe Online
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              A comprehensive platform built specifically for the campus environment, covering the
              most common threats students face today.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`${feature.bg} border ${feature.border} rounded-xl p-6 hover:scale-[1.01] transition-transform`}
              >
                <div className={`w-10 h-10 ${feature.bg} border ${feature.border} rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon size={20} className={feature.color} />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Threat categories */}
      <section className="px-6 py-16 bg-[#111827]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-8 text-center">
            Threat Categories We Cover
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              'Phishing Email',
              'Suspicious URL',
              'Fake Internship Offer',
              'Account Compromise',
              'Payment / QR Code Scam',
              'Impersonation',
            ].map((cat) => (
              <div
                key={cat}
                className="flex items-center gap-2 bg-[#0d1421] border border-slate-800 rounded-lg px-4 py-3"
              >
                <CheckCircle size={14} className="text-blue-400 flex-shrink-0" />
                <span className="text-sm text-slate-300">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-10">
            <Shield size={40} className="text-blue-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Join the Campus Security Community
            </h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Register with your college email to report incidents, receive advisories and
              contribute to a safer campus digital environment.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Register as a Student
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Shield size={16} className="text-blue-400" />
          <span className="text-sm font-semibold text-white">CyberShield Campus</span>
        </div>
        <p className="text-xs text-slate-500">
          A college mini-project for cybersecurity awareness and incident response.{' '}
          <span className="text-yellow-500">Demo platform — not a real security service.</span>
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <Link href="/login" className="text-xs text-slate-400 hover:text-white transition-colors">Sign In</Link>
          <Link href="/register" className="text-xs text-slate-400 hover:text-white transition-colors">Register</Link>
          <Link href="/dashboard" className="text-xs text-slate-400 hover:text-white transition-colors">Dashboard</Link>
          <Link href="/admin/dashboard" className="text-xs text-slate-400 hover:text-white transition-colors">Admin</Link>
        </div>
      </footer>
    </div>
  );
}
