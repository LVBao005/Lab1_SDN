'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  CheckSquare,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  LogIn,
  UserPlus,
  LayoutGrid,
  CheckCircle2,
  Clock,
  Crown,
  FolderKanban,
  Database,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const { user, loading } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  useEffect(() => {
    if (user) {
      setLoadingTeams(true);
      fetch('/api/teams')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setTeams(Array.isArray(data) ? data : []))
        .catch((err) => console.error(err))
        .finally(() => setLoadingTeams(false));
    }
  }, [user]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      {/* If Authenticated: Dashboard View */}
      {user ? (
        <div className="space-y-8">
          {/* Welcome Banner */}
          <div className="bg-white rounded-3xl border border-zinc-200 p-8 sm:p-10 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-56 h-56 bg-emerald-50 rounded-full blur-2xl opacity-60 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Xin chào, {user.name || user.email}!</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
                  Không gian Làm việc &amp; Đội nhóm
                </h1>
                <p className="text-zinc-600 text-sm sm:text-base mt-2 max-w-xl">
                  Chào mừng bạn quay trở lại. Hãy lựa chọn nhóm làm việc bên dưới để phân công nhiệm vụ, cập nhật trạng thái trên Kanban board và quản lý thành viên.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  id="home-go-teams-btn"
                  href="/teams"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors shadow-xs shadow-emerald-200"
                >
                  <FolderKanban className="w-4 h-4" />
                  <span>Quản lý Tất cả Đội nhóm</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-zinc-100">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium mb-1">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Số nhóm tham gia</span>
                </div>
                <div className="text-2xl font-bold text-zinc-900">{teams.length}</div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium mb-1">
                  <Crown className="w-4 h-4 text-amber-600" />
                  <span>Nhóm bạn sở hữu</span>
                </div>
                <div className="text-2xl font-bold text-zinc-900">
                  {teams.filter((t) => t.ownerId === user.id).length}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium mb-1">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <span>Tổng số công việc</span>
                </div>
                <div className="text-2xl font-bold text-zinc-900">
                  {teams.reduce((acc, t) => acc + (t._count?.tasks || 0), 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Team Access */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-zinc-900">Đội nhóm của bạn</h2>
              <Link href="/teams" className="text-xs font-semibold text-emerald-600 hover:underline">
                Xem toàn bộ →
              </Link>
            </div>

            {loadingTeams ? (
              <div className="py-12 text-center text-xs text-zinc-400">Đang tải danh sách nhóm...</div>
            ) : teams.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-zinc-200 text-center">
                <p className="text-xs text-zinc-500 mb-3">Bạn chưa tham gia nhóm nào.</p>
                <Link
                  href="/teams"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium"
                >
                  <span>Tạo nhóm ngay</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.slice(0, 3).map((team) => (
                  <Link
                    key={team.id}
                    href={`/teams/${team.id}`}
                    className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all group block"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 group-hover:bg-emerald-50 group-hover:text-emerald-700 flex items-center justify-center text-zinc-700 transition-colors">
                        <FolderKanban className="w-5 h-5" />
                      </div>
                      {team.ownerId === user.id ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          Owner
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                          Member
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-zinc-900 group-hover:text-emerald-700 transition-colors">
                      {team.name}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2 min-h-[32px]">
                      {team.description || 'Chưa có mô tả cho nhóm này.'}
                    </p>
                    <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                      <span>{team._count?.members || 1} thành viên</span>
                      <span>{team._count?.tasks || 0} công việc</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* If Not Authenticated: Landing & Overview */
        <div className="space-y-12">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto py-12 sm:py-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 mb-6 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Assignment 2 · CRUD API &amp; Authentication</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-zinc-900 tracking-tight leading-tight">
              Quản lý Công việc &amp; Đội nhóm Chuyên nghiệp
            </h1>

            <p className="mt-4 text-base sm:text-lg text-zinc-600 leading-relaxed">
              Ứng dụng kết nối PostgreSQL qua Prisma ORM, tích hợp xác thực JWT bảo mật, phân quyền theo vai trò (Owner / Member / Assignee / Creator) và giao diện Kanban Board trực quan.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                id="hero-login-btn"
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 text-white font-semibold text-sm hover:bg-zinc-800 transition-colors shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập hệ thống</span>
              </Link>

              <Link
                id="hero-register-btn"
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200"
              >
                <UserPlus className="w-4 h-4" />
                <span>Đăng ký tài khoản mới</span>
              </Link>
            </div>
          </div>


          {/* Core Feature Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 mb-2">Xác thực &amp; Phân quyền (RBAC)</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Quản lý quyền truy cập nghiêm ngặt: Chỉ Owner mới có thể chỉnh sửa/xóa team và thêm thành viên; chỉ Creator, Assignee hoặc Owner mới có quyền xóa task.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 mb-2">Đội nhóm Linh hoạt (Teams)</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Người dùng có thể tham gia nhiều nhóm, chuyển đổi không gian làm việc tức thì, thêm thành viên nhanh chóng thông qua địa chỉ email.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 mb-2">Kanban Board &amp; Bộ lọc</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Chuyển đổi linh hoạt giữa giao diện bảng (Table) và bảng Kanban (To Do, In Progress, Done). Hỗ trợ tìm kiếm và lọc theo trạng thái, độ ưu tiên, người làm.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
