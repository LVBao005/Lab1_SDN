'use client';

import React, { useState } from 'react';
import { CheckSquare, Users, LogIn, Menu, X, Database } from 'lucide-react';

interface NavbarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  dbStatus?: {
    connected: boolean;
    provider: string;
    message: string;
  };
}

export function Navbar({ currentPath = '/', onNavigate, dbStatus }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (path: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else if (typeof window !== 'undefined') {
      window.location.href = path;
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Brand */}
          <div className="flex items-center gap-3">
            <button
              id="nav-brand-btn"
              onClick={(e) => handleNav('/', e)}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-200 group-hover:bg-emerald-700 transition-colors">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-zinc-900 text-base tracking-tight block">
                  Task & Team
                </span>
                <span className="text-[11px] text-zinc-500 font-medium block leading-none">
                  Assignment 1 · Supabase & Prisma
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              id="nav-link-home"
              onClick={(e) => handleNav('/', e)}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPath === '/'
                  ? 'bg-zinc-100 text-zinc-900 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              Home
            </button>

            <button
              id="nav-link-teams"
              onClick={(e) => handleNav('/teams', e)}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentPath === '/teams'
                  ? 'bg-zinc-100 text-zinc-900 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              <Users className="w-4 h-4 text-zinc-400" />
              <span>Teams</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 ml-1">
                Coming soon
              </span>
            </button>
          </nav>

          {/* Right Side: DB indicator & Login */}
          <div className="hidden md:flex items-center gap-3">
            {dbStatus && (
              <div
                id="navbar-db-status"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  dbStatus.connected
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                }`}
                title={dbStatus.message}
              >
                <Database className={`w-3.5 h-3.5 ${dbStatus.connected ? 'text-emerald-600' : 'text-zinc-400'}`} />
                <span>{dbStatus.connected ? 'PostgreSQL Active' : 'Supabase Ready'}</span>
              </div>
            )}

            <button
              id="nav-btn-login"
              onClick={(e) => handleNav('/login', e)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-zinc-100 space-y-1">
            <button
              id="mobile-nav-link-home"
              onClick={(e) => handleNav('/', e)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                currentPath === '/' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600'
              }`}
            >
              Home
            </button>
            <button
              id="mobile-nav-link-teams"
              onClick={(e) => handleNav('/teams', e)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between ${
                currentPath === '/teams' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-zinc-400" />
                <span>Teams</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                Coming soon
              </span>
            </button>
            <div className="pt-2">
              <button
                id="mobile-nav-btn-login"
                onClick={(e) => handleNav('/login', e)}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
