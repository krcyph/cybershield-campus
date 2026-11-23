'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  AlertTriangle,
  Newspaper,
  Link2,
  Brain,
  BarChart3,
  User,
  X,
  ChevronRight,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const studentNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Incidents', href: '/incidents', icon: <AlertTriangle size={18} /> },
  { label: 'Advisories', href: '/advisories', icon: <Newspaper size={18} /> },
  { label: 'URL Checker', href: '/url-checker', icon: <Link2 size={18} /> },
  { label: 'Cyber Quiz', href: '/cyber-quiz', icon: <Brain size={18} /> },
  { label: 'Analytics', href: '/analytics', icon: <BarChart3 size={18} /> },
  { label: 'Profile', href: '/profile', icon: <User size={18} /> },
];

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Incidents', href: '/admin/incidents', icon: <AlertTriangle size={18} /> },
  { label: 'Advisories', href: '/admin/advisories', icon: <Newspaper size={18} /> },
  { label: 'Indicators', href: '/admin/indicators', icon: <Shield size={18} /> },
  { label: 'Settings', href: '/profile', icon: <Settings size={18} /> },
];

interface SidebarProps {
  isAdmin?: boolean;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ isAdmin = false, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const navItems = isAdmin ? adminNavItems : studentNavItems;

  function handleLogout() {
    logout();
    router.push('/login');
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-[#0d1117] border-r border-slate-800 z-50
          flex flex-col transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <Link href={isAdmin ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">CyberShield</p>
              <p className="text-xs text-slate-400 leading-none mt-0.5">Campus</p>
            </div>
          </Link>
          <button onClick={onMobileClose} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-4 py-3">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isAdmin ? 'bg-purple-900/40 text-purple-300 border border-purple-700/40' : 'bg-blue-900/40 text-blue-300 border border-blue-700/40'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-purple-400' : 'bg-blue-400'} animate-pulse`} />
            {isAdmin ? 'Admin Panel' : 'Student Portal'}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150 group
                  ${active
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }
                `}
              >
                <span className={active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight size={14} className="text-blue-500" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800">
          {isAdmin && (
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mb-1"
            >
              <User size={18} />
              <span>Student View</span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
