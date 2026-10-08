'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  Sparkles,
  Crown,
  UserCheck,
  FolderKanban,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { TeamItem } from '@/types';

export default function TeamsDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchTeams = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/teams');
      if (res.ok) {
        const data = await res.json();
        setTeams(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        fetchTeams();
      }
    }
  }, [user, authLoading, router, fetchTeams]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      setFormError('Tên đội nhóm không được để trống');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTeamName.trim(),
          description: newTeamDescription.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Không thể tạo nhóm');
        return;
      }

      setNewTeamName('');
      setNewTeamDescription('');
      setIsCreateModalOpen(false);
      // Refresh teams list
      fetchTeams();
    } catch (err: any) {
      setFormError(err.message || 'Lỗi hệ thống');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || (!user && isLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm text-zinc-500">Đang tải không gian làm việc...</p>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workspace Teams</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            Quản lý Đội nhóm (Teams)
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Chọn một nhóm để quản lý thành viên và công việc, hoặc tạo nhóm mới của riêng bạn.
          </p>
        </div>

        <button
          id="create-team-btn"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors shadow-xs shadow-emerald-200"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Nhóm Mới</span>
        </button>
      </div>

      {/* Teams Grid */}
      <div className="mt-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-zinc-300">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4 text-zinc-400">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900">Bạn chưa tham gia nhóm nào</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Hãy tạo một nhóm làm việc đầu tiên để bắt đầu phân công nhiệm vụ và quản lý dự án cùng đồng đội!
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo nhóm ngay</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => {
              const isOwner = team.ownerId === user?.id;
              return (
                <div
                  key={team.id}
                  className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                        <FolderKanban className="w-5 h-5" />
                      </div>

                      {isOwner ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Crown className="w-3 h-3 text-amber-600" />
                          <span>Owner</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700">
                          <UserCheck className="w-3 h-3 text-zinc-500" />
                          <span>Member</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-zinc-900 tracking-tight group-hover:text-emerald-700 transition-colors">
                      {team.name}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2 min-h-[32px]">
                      {team.description || 'Chưa có mô tả cho nhóm này.'}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-100">
                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{team._count?.members || 1} thành viên</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{team._count?.tasks || 0} công việc</span>
                      </div>
                    </div>

                    <Link
                      id={`view-team-btn-${team.id}`}
                      href={`/teams/${team.id}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-50 hover:bg-emerald-600 hover:text-white text-zinc-800 text-xs font-semibold transition-colors border border-zinc-200 hover:border-emerald-600"
                    >
                      <span>Vào quản lý nhóm</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-zinc-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-zinc-900 text-base">Tạo Đội nhóm mới</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTeam} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Tên nhóm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Backend Development, Marketing Team..."
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Mô tả nhóm (Tùy chọn)
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả mục tiêu hoặc phạm vi công việc của nhóm..."
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmitting ? (
                    <span>Đang tạo...</span>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Xác nhận tạo nhóm</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
