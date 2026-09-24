import React from 'react';
import { Users, ArrowLeft, ShieldCheck, UserPlus, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function TeamsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 text-center">
      {/* Back Link */}
      <div className="mb-8 flex justify-start">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang chủ (Back to Home)</span>
        </Link>
      </div>

      {/* Coming Soon Hero */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-8 sm:p-12 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-6 text-amber-600 shadow-xs">
          <Users className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tính năng sắp ra mắt</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight mb-3">
          Quản lý Đội nhóm (Teams Management)
        </h1>

        <p className="text-zinc-600 max-w-lg mx-auto text-sm sm:text-base leading-relaxed mb-8">
          Module quản lý nhóm và phân quyền thành viên theo mô hình <code className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 text-xs font-mono font-semibold">Team</code> &amp; <code className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 text-xs font-mono font-semibold">TeamMember</code> trong Prisma Schema đang được phát triển cho Assignment 2.
        </p>

        {/* Planned Features in Assignment 2 / Milestone */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto pt-6 border-t border-zinc-100">
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
            <UserPlus className="w-5 h-5 text-emerald-600 mb-2" />
            <h4 className="text-xs font-bold text-zinc-900 mb-1">Mời thành viên</h4>
            <p className="text-[11px] text-zinc-500">Mời qua email và liên kết tài khoản User theo bảng TeamMember.</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
            <ShieldCheck className="w-5 h-5 text-blue-600 mb-2" />
            <h4 className="text-xs font-bold text-zinc-900 mb-1">Phân quyền (RBAC)</h4>
            <p className="text-[11px] text-zinc-500">Hỗ trợ các vai trò OWNER, ADMIN, MEMBER theo Prisma Enum.</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
            <Users className="w-5 h-5 text-purple-600 mb-2" />
            <h4 className="text-xs font-bold text-zinc-900 mb-1">Giao việc cho Nhóm</h4>
            <p className="text-[11px] text-zinc-500">Gán task cho teamId và assigneeId cụ thể.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
