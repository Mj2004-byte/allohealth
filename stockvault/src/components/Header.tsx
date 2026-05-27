'use client';

import { format } from 'date-fns';

interface HeaderProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
}

export default function Header({ lastUpdated, onRefresh }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M8 1V15M2 4.5L8 8L14 4.5" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            Stock<span className="text-blue-400">Vault</span>
          </span>
        </a>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="hidden sm:block text-xs text-[--text-secondary]">
              Updated {format(lastUpdated, 'HH:mm:ss')}
            </span>
          )}
          <button
            onClick={onRefresh}
            className="glass border border-white/10 hover:border-white/20 text-xs font-medium px-3 py-1.5 rounded-lg text-[--text-secondary] hover:text-white transition-all duration-200 flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.5 2A5.5 5.5 0 1 0 11 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M10.5 2V5H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>
    </header>
  );
}
