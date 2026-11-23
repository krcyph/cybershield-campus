'use client';

import { Menu, Shield } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { getInitials } from '@/lib/utils';
import NotificationBell from './NotificationBell';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMobileMenuOpen?: () => void;
  isAdmin?: boolean;
}

export default function Header({ title, subtitle, onMobileMenuOpen, isAdmin = false }: HeaderProps) {
  const { user } = useAuth();
  const initials = user ? getInitials(user.fullName) : '?';
  return (
    <header className="sticky top-0 z-30 bg-[#0d1421]/90 backdrop-blur-sm border-b border-slate-800 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile menu + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMobileMenuOpen}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-white truncate">{title}</h1>
            {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isAdmin && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-900/40 text-purple-300 border border-purple-700/40">
              <Shield size={12} />
              Admin
            </span>
          )}
          <NotificationBell />
          <Link
            href="/profile"
            className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            {initials}
          </Link>
        </div>
      </div>
    </header>
  );
}
