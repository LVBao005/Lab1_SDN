'use client';

import React from 'react';
import { LogIn, ArrowLeft, KeyRound, Mail } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="max-w-md mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay về trang chủ</span>
        </Link>

        <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-white mx-auto shadow-sm">
          <LogIn className="w-6 h-6" />
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-zinc-900">
          Đăng nhập tài khoản
        </h2>
        <p className="mt-1 text-center text-xs text-zinc-500">
          Mô hình User trong Prisma Schema (id, name, email, password, createdAt)
        </p>
      </div>

      <div className="mt-6">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xs rounded-2xl border border-zinc-200">
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  defaultValue="admin@assignment1.edu.vn"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  defaultValue="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-hidden"
              >
                Đăng nhập (Assignment 1 Demo)
              </button>
            </div>
          </form>

          <div className="mt-4 p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-center">
            <span className="text-[11px] text-zinc-500">
              Ở Assignment 1, phần quản lý task trực tiếp hoạt động ngay trên trang chủ không cần đăng nhập.
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
