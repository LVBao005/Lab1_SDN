'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CheckSquare,
  Users,
  LogIn,
  LogOut,
  UserPlus,
  Menu,
  X,
  Database,
  User as UserIcon,
  FolderKanban,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/db-status')
      .then((res) => res.json())
      .then((data) => setDbConnected(Boolean(data?.connected)))
      .catch(() => setDbConnected(false));
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link
              id="nav-brand-btn"
              href="/"
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-200 group-hover:bg-emerald-700 transition-colors">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-zinc-900 text-base tracking-tight block">
                  TaskFlow
                </span>
                <span className="text-[11px] text-zinc-500 font-medium block leading-none">
                  Assignment 2 · Teams &amp; RBAC
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              id="nav-link-home"
              href="/"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/'
                  ? 'bg-zinc-100 text-zinc-900 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              Trang chủ
            </Link>

            {user && (
              <Link
                id="nav-link-teams"
                href="/teams"
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith('/teams')
                    ? 'bg-zinc-100 text-zinc-900 font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Đội nhóm (Teams)</span>
              </Link>
            )}
          </nav>

          {/* Right Side: DB status & User Profile / Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            <div
              id="navbar-db-status"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                dbConnected === true
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : dbConnected === false
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-600'
              }`}
              title={
                dbConnected === true
                  ? 'Kết nối Supabase PostgreSQL thành công'
                  : dbConnected === false
                  ? 'Chưa kết nối được Supabase'
                  : 'Đang kiểm tra kết nối...'
              }
            >
              <Database
                className={`w-3.5 h-3.5 ${
                  dbConnected === true ? 'text-emerald-600' : 'text-zinc-400'
                }`}
              />
              <span>
                {dbConnected === true
                  ? 'PostgreSQL Active'
                  : dbConnected === false
                  ? 'DB Offline'
                  : 'Checking DB'}
              </span>
            </div>

            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-3 pl-2 border-l border-zinc-200">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 text-xs font-bold uppercase">
                        {user.name ? user.name[0] : user.email[0]}
                      </div>
                      <div className="text-left hidden lg:block">
                        <p className="text-xs font-semibold text-zinc-900 leading-tight">
                          {user.name || 'Người dùng'}
                        </p>
                        <p className="text-[11px] text-zinc-500 leading-tight truncate max-w-[120px]">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <button
                      id="navbar-logout-btn"
                      onClick={() => logout()}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-red-600 hover:bg-red-50 transition-colors border border-zinc-200"
                      title="Đăng xuất"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      id="nav-btn-register"
                      href="/register"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                    >
                      <UserPlus className="w-4 h-4 text-zinc-500" />
                      <span>Đăng ký</span>
                    </Link>

                    <Link
                      id="nav-btn-login"
                      href="/login"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-xs"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Đăng nhập</span>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
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
          <div className="md:hidden py-3 border-t border-zinc-100 space-y-2">
            <Link
              id="mobile-nav-link-home"
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`w-full block px-3 py-2 rounded-lg text-sm font-medium ${
                pathname === '/' ? 'bg-zinc-100 text-zinc-900 font-semibold' : 'text-zinc-600'
              }`}
            >
              Trang chủ
            </Link>

            {user && (
              <Link
                id="mobile-nav-link-teams"
                href="/teams"
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname.startsWith('/teams')
                    ? 'bg-zinc-100 text-zinc-900 font-semibold'
                    : 'text-zinc-600'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Đội nhóm (Teams)</span>
              </Link>
            )}

            <div className="pt-2 border-t border-zinc-100">
              {user ? (
                <div className="space-y-2">
                  <div className="px-3 py-2 bg-zinc-50 rounded-lg">
                    <p className="text-xs font-semibold text-zinc-900">{user.name}</p>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-zinc-300 text-zinc-700"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Đăng ký</span>
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-zinc-900 text-white"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Đăng nhập</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
