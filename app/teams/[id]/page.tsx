'use client';

import React, { useState, useEffect, use, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  Crown,
  UserCheck,
  CheckCircle2,
  Clock,
  ListTodo,
  UserPlus,
  Filter,
  Search,
  LayoutGrid,
  List,
  MoreVertical,
  X,
  Loader2,
  AlertTriangle,
  User as UserIcon,
  Check,
  ChevronDown,
  CheckSquare,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { TaskItem, TaskStatus, TaskPriority, MemberRole } from '@/types';

export default function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const teamId = resolvedParams.id;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [team, setTeam] = useState<any>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'members'>('tasks');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);

  // Form states
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'TODO' as TaskStatus,
    priority: 'MEDIUM' as TaskPriority,
    dueDate: '',
    assigneeId: '',
  });

  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<MemberRole>('MEMBER');

  const [editTeamForm, setEditTeamForm] = useState({
    name: '',
    description: '',
  });

  const [modalError, setModalError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const isOwner = team?.ownerId === user?.id;

  // Fetch full team data
  const fetchTeamData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/teams/${teamId}`);
      if (!res.ok) {
        if (res.status === 403 || res.status === 404) {
          router.push('/teams');
          return;
        }
        throw new Error('Failed to load team');
      }
      const data = await res.json();
      setTeam(data);
      setMembers(data.members || []);
      setTasks(data.tasks || []);
      setEditTeamForm({
        name: data.name || '',
        description: data.description || '',
      });
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Không thể tải thông tin nhóm' });
    } finally {
      setIsLoading(false);
    }
  }, [teamId, router]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        fetchTeamData();
      }
    }
  }, [user, authLoading, fetchTeamData, router]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchSearch =
        searchQuery === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || task.status === statusFilter;
      const matchPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
      const matchAssignee =
        assigneeFilter === 'ALL' ||
        (assigneeFilter === 'UNASSIGNED' && !task.assigneeId) ||
        task.assigneeId === assigneeFilter;

      return matchSearch && matchStatus && matchPriority && matchAssignee;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, assigneeFilter]);

  // Open Create Task Modal
  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: '',
      assigneeId: '',
    });
    setModalError(null);
    setIsTaskModalOpen(true);
  };

  // Open Edit Task Modal
  const handleOpenEditTask = (task: TaskItem) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      assigneeId: task.assigneeId || '',
    });
    setModalError(null);
    setIsTaskModalOpen(true);
  };

  // Save Task (Create or Update)
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      setModalError('Tiêu đề công việc là bắt buộc');
      return;
    }

    try {
      setModalError(null);
      if (editingTask) {
        // Update task
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: taskForm.title.trim(),
            description: taskForm.description.trim() || null,
            status: taskForm.status,
            priority: taskForm.priority,
            dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : null,
            assigneeId: taskForm.assigneeId || null,
          }),
        });
        const updated = await res.json();
        if (!res.ok) throw new Error(updated.error || 'Cập nhật thất bại');

        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setFeedback({ type: 'success', text: 'Cập nhật công việc thành công!' });
      } else {
        // Create task
        const res = await fetch(`/api/teams/${teamId}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: taskForm.title.trim(),
            description: taskForm.description.trim() || null,
            status: taskForm.status,
            priority: taskForm.priority,
            dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : null,
            assigneeId: taskForm.assigneeId || null,
          }),
        });
        const created = await res.json();
        if (!res.ok) throw new Error(created.error || 'Tạo công việc thất bại');

        setTasks((prev) => [created, ...prev]);
        setFeedback({ type: 'success', text: 'Tạo công việc mới thành công!' });
      }

      setIsTaskModalOpen(false);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setModalError(err.message || 'Lỗi thao tác');
    }
  };

  // Quick Status change (for Kanban / buttons)
  const handleQuickStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa công việc này?')) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Bạn không có quyền xóa công việc này');
        return;
      }
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setFeedback({ type: 'success', text: 'Đã xóa công việc thành công' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa công việc');
    }
  };

  // Add Member by Email
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim()) {
      setModalError('Email thành viên là bắt buộc');
      return;
    }

    try {
      setModalError(null);
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: memberEmail.trim(),
          role: memberRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể thêm thành viên');
      }

      setMembers((prev) => [...prev, data]);
      setMemberEmail('');
      setIsAddMemberModalOpen(false);
      setFeedback({ type: 'success', text: 'Đã thêm thành viên mới vào nhóm!' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setModalError(err.message || 'Lỗi thêm thành viên');
    }
  };

  // Remove Member
  const handleRemoveMember = async (memberUserId: string, memberName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa "${memberName}" khỏi nhóm?`)) return;

    try {
      const res = await fetch(`/api/teams/${teamId}/members/${memberUserId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Không thể xóa thành viên');
        return;
      }

      setMembers((prev) => prev.filter((m) => m.userId !== memberUserId));
      // Re-fetch tasks to update unassigned ones
      fetchTeamData();
      setFeedback({ type: 'success', text: 'Đã xóa thành viên khỏi nhóm' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa thành viên');
    }
  };

  // Update Team Info (Owner only)
  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setModalError(null);
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editTeamForm.name.trim(),
          description: editTeamForm.description.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể cập nhật nhóm');

      setTeam((prev: any) => ({ ...prev, ...data }));
      setIsEditTeamModalOpen(false);
      setFeedback({ type: 'success', text: 'Cập nhật thông tin nhóm thành công' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setModalError(err.message || 'Lỗi cập nhật');
    }
  };

  // Delete Team (Owner only)
  const handleDeleteTeam = async () => {
    if (
      !confirm(
        'CẢNH BÁO: Bạn có chắc chắn muốn xóa toàn bộ nhóm này? Tất cả thành viên và công việc thuộc nhóm sẽ bị xóa vĩnh viễn!',
      )
    )
      return;

    try {
      const res = await fetch(`/api/teams/${teamId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/teams');
      } else {
        const data = await res.json();
        alert(data.error || 'Không thể xóa nhóm');
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi hệ thống');
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">Cao (High)</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Vừa (Medium)</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">Thấp (Low)</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'DONE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Hoàn thành</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Đang làm</span>;
      case 'TODO':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200 text-zinc-800">Cần làm</span>;
      default:
        return null;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm text-zinc-500">Đang tải dữ liệu nhóm và công việc...</p>
      </div>
    );
  }

  if (!team) return null;

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/teams"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách Đội nhóm</span>
        </Link>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm flex items-center justify-between shadow-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Team Header Card */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
                {team.name}
              </h1>
              {isOwner ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  <span>Bạn là Owner</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700">
                  <UserCheck className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Thành viên (Member)</span>
                </span>
              )}
            </div>

            <p className="text-sm text-zinc-600 max-w-2xl">
              {team.description || 'Chưa có mô tả cho nhóm này.'}
            </p>

            <div className="flex items-center gap-4 mt-4 text-xs text-zinc-500">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                <span>{members.length} thành viên</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-zinc-400" />
                <span>{tasks.length} công việc</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <span>Chủ nhóm: </span>
                <span className="font-semibold text-zinc-700">{team.owner?.name || team.owner?.email}</span>
              </div>
            </div>
          </div>

          {/* Owner Actions */}
          {isOwner && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsEditTeamModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Sửa nhóm</span>
              </button>
              <button
                onClick={handleDeleteTeam}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                title="Xóa nhóm (Chỉ Owner)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa nhóm</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-4 mt-8 pt-4 border-t border-zinc-100">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'tasks'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Công việc ({tasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'members'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Thành viên ({members.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: TASKS SECTION */}
      {activeTab === 'tasks' && (
        <section>
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search input */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm công việc theo tiêu đề..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
                />
              </div>

              {/* Filters & Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 focus:border-emerald-500 outline-hidden bg-white"
                >
                  <option value="ALL">Mọi trạng thái</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>

                {/* Priority Filter */}
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 focus:border-emerald-500 outline-hidden bg-white"
                >
                  <option value="ALL">Mọi độ ưu tiên</option>
                  <option value="HIGH">Cao (High)</option>
                  <option value="MEDIUM">Vừa (Medium)</option>
                  <option value="LOW">Thấp (Low)</option>
                </select>

                {/* Assignee Filter */}
                <select
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 focus:border-emerald-500 outline-hidden bg-white"
                >
                  <option value="ALL">Mọi người làm</option>
                  <option value="UNASSIGNED">Chưa giao việc</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user?.name || m.user?.email}
                    </option>
                  ))}
                </select>

                {/* View switcher */}
                <div className="flex items-center border border-zinc-200 rounded-lg p-0.5 bg-zinc-50 ml-auto sm:ml-0">
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                      viewMode === 'kanban'
                        ? 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                    title="Kanban Board View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                      viewMode === 'table'
                        ? 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                    title="Table View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Create Task Button */}
                <button
                  id="create-task-btn"
                  onClick={handleOpenCreateTask}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo công việc</span>
                </button>
              </div>
            </div>
          </div>

          {/* VIEW 1: KANBAN BOARD */}
          {viewMode === 'kanban' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1: TODO */}
              <div className="bg-zinc-100/70 rounded-2xl p-4 border border-zinc-200 flex flex-col">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-400"></span>
                    <h3 className="font-bold text-zinc-800 text-sm">Cần làm (To Do)</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white text-zinc-600 shadow-2xs">
                    {filteredTasks.filter((t) => t.status === 'TODO').length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto min-h-[150px]">
                  {filteredTasks
                    .filter((t) => t.status === 'TODO')
                    .map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        currentUserId={user?.id}
                        isTeamOwner={isOwner}
                        onEdit={() => handleOpenEditTask(task)}
                        onDelete={() => handleDeleteTask(task.id)}
                        onStatusChange={handleQuickStatusChange}
                        getPriorityBadge={getPriorityBadge}
                      />
                    ))}
                  {filteredTasks.filter((t) => t.status === 'TODO').length === 0 && (
                    <div className="h-24 flex items-center justify-center text-xs text-zinc-400 border border-dashed border-zinc-300 rounded-xl">
                      Không có công việc nào
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: IN_PROGRESS */}
              <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-200/60 flex flex-col">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-blue-200/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <h3 className="font-bold text-blue-900 text-sm">Đang thực hiện (In Progress)</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white text-blue-700 shadow-2xs">
                    {filteredTasks.filter((t) => t.status === 'IN_PROGRESS').length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto min-h-[150px]">
                  {filteredTasks
                    .filter((t) => t.status === 'IN_PROGRESS')
                    .map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        currentUserId={user?.id}
                        isTeamOwner={isOwner}
                        onEdit={() => handleOpenEditTask(task)}
                        onDelete={() => handleDeleteTask(task.id)}
                        onStatusChange={handleQuickStatusChange}
                        getPriorityBadge={getPriorityBadge}
                      />
                    ))}
                  {filteredTasks.filter((t) => t.status === 'IN_PROGRESS').length === 0 && (
                    <div className="h-24 flex items-center justify-center text-xs text-zinc-400 border border-dashed border-blue-200 rounded-xl">
                      Không có công việc nào
                    </div>
                  )}
                </div>
              </div>

              {/* Column 3: DONE */}
              <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-200/60 flex flex-col">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-200/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <h3 className="font-bold text-emerald-900 text-sm">Hoàn thành (Done)</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white text-emerald-700 shadow-2xs">
                    {filteredTasks.filter((t) => t.status === 'DONE').length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto min-h-[150px]">
                  {filteredTasks
                    .filter((t) => t.status === 'DONE')
                    .map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        currentUserId={user?.id}
                        isTeamOwner={isOwner}
                        onEdit={() => handleOpenEditTask(task)}
                        onDelete={() => handleDeleteTask(task.id)}
                        onStatusChange={handleQuickStatusChange}
                        getPriorityBadge={getPriorityBadge}
                      />
                    ))}
                  {filteredTasks.filter((t) => t.status === 'DONE').length === 0 && (
                    <div className="h-24 flex items-center justify-center text-xs text-zinc-400 border border-dashed border-emerald-200 rounded-xl">
                      Không có công việc nào
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* VIEW 2: TABLE VIEW */
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
                      <th className="py-3 px-4">Tiêu đề công việc</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4">Độ ưu tiên</th>
                      <th className="py-3 px-4">Người thực hiện</th>
                      <th className="py-3 px-4">Hạn chót</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {filteredTasks.map((task) => {
                      const canDelete =
                        task.creatorId === user?.id ||
                        task.assigneeId === user?.id ||
                        isOwner;

                      return (
                        <tr key={task.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-zinc-900">{task.title}</p>
                            {task.description && (
                              <p className="text-[11px] text-zinc-500 line-clamp-1">{task.description}</p>
                            )}
                          </td>
                          <td className="py-3 px-4">{getStatusBadge(task.status)}</td>
                          <td className="py-3 px-4">{getPriorityBadge(task.priority)}</td>
                          <td className="py-3 px-4">
                            {task.assignee ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">
                                  {task.assignee.name ? task.assignee.name[0] : task.assignee.email[0]}
                                </div>
                                <span className="text-zinc-700">{task.assignee.name || task.assignee.email}</span>
                              </div>
                            ) : (
                              <span className="text-zinc-400 italic">Chưa giao</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-zinc-600">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : '—'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditTask(task)}
                                className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                                title="Chỉnh sửa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="p-1 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50"
                                  title="Xóa công việc"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: MEMBERS SECTION */}
      {activeTab === 'members' && (
        <section>
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-200">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Danh sách Thành viên Nhóm</h2>
              <p className="text-xs text-zinc-500">
                Thành viên có thể xem, tạo và cập nhật công việc trong nhóm.
              </p>
            </div>

            {isOwner && (
              <button
                id="add-member-btn"
                onClick={() => {
                  setMemberEmail('');
                  setModalError(null);
                  setIsAddMemberModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>Thêm Thành viên bằng Email</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => {
              const isMemberOwner = member.role === 'OWNER';
              const canRemove = isOwner && !isMemberOwner && member.userId !== user?.id;

              return (
                <div
                  key={member.id}
                  className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 font-bold uppercase text-xs">
                      {member.user?.name ? member.user.name[0] : member.user?.email[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-zinc-900">
                          {member.user?.name || 'Chưa đặt tên'}
                        </p>
                        {isMemberOwner ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Owner
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-600">
                            Member
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">{member.user?.email}</p>
                    </div>
                  </div>

                  {canRemove && (
                    <button
                      onClick={() =>
                        handleRemoveMember(member.userId, member.user?.name || member.user?.email)
                      }
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Xóa thành viên khỏi nhóm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* MODAL 1: CREATE / EDIT TASK */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-zinc-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <h3 className="font-bold text-zinc-900 text-base">
                {editingTask ? 'Chỉnh sửa Công việc' : 'Tạo Công việc Mới'}
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTask} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Tiêu đề công việc <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thiết kế cơ sở dữ liệu..."
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Mô tả chi tiết
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả công việc cần làm..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={taskForm.status}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, status: e.target.value as TaskStatus })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs font-medium bg-white focus:border-emerald-500 outline-hidden"
                  >
                    <option value="TODO">To Do (Cần làm)</option>
                    <option value="IN_PROGRESS">In Progress (Đang làm)</option>
                    <option value="DONE">Done (Hoàn thành)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Độ ưu tiên
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, priority: e.target.value as TaskPriority })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs font-medium bg-white focus:border-emerald-500 outline-hidden"
                  >
                    <option value="LOW">Thấp (Low)</option>
                    <option value="MEDIUM">Vừa (Medium)</option>
                    <option value="HIGH">Cao (High)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Phân công cho thành viên
                  </label>
                  <select
                    value={taskForm.assigneeId}
                    onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs font-medium bg-white focus:border-emerald-500 outline-hidden"
                  >
                    <option value="">Chưa phân công</option>
                    {members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user?.name || m.user?.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Hạn chót (Due date)
                  </label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs bg-white focus:border-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                >
                  {editingTask ? 'Lưu thay đổi' : 'Tạo công việc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD MEMBER BY EMAIL */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-zinc-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <h3 className="font-bold text-zinc-900 text-base">Thêm Thành viên vào Nhóm</h3>
              <button
                onClick={() => setIsAddMemberModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddMember} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Email người dùng <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ví dụ: member@assignment2.edu.vn"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Người dùng này phải đã đăng ký tài khoản trên hệ thống.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Vai trò (Role)
                </label>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value as MemberRole)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs font-medium bg-white focus:border-emerald-500 outline-hidden"
                >
                  <option value="MEMBER">Thành viên (Member)</option>
                  <option value="OWNER">Chủ nhóm (Owner)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                >
                  Xác nhận thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT TEAM INFO (Owner only) */}
      {isEditTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-zinc-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <h3 className="font-bold text-zinc-900 text-base">Cập nhật thông tin Nhóm</h3>
              <button
                onClick={() => setIsEditTeamModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateTeam} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Tên nhóm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTeamForm.name}
                  onChange={(e) => setEditTeamForm({ ...editTeamForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  rows={3}
                  value={editTeamForm.description}
                  onChange={(e) =>
                    setEditTeamForm({ ...editTeamForm, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditTeamModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

// Subcomponent: Individual Kanban Task Card
function TaskCard({
  task,
  currentUserId,
  isTeamOwner,
  onEdit,
  onDelete,
  onStatusChange,
  getPriorityBadge,
}: {
  task: TaskItem;
  currentUserId?: string;
  isTeamOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  getPriorityBadge: (priority: TaskPriority) => React.ReactNode;
}) {
  const canDelete =
    task.creatorId === currentUserId ||
    task.assigneeId === currentUserId ||
    isTeamOwner;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-3.5 shadow-2xs hover:shadow-xs hover:border-zinc-300 transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        {getPriorityBadge(task.priority)}
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
            title="Chỉnh sửa"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          {canDelete && (
            <button
              onClick={onDelete}
              className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50"
              title="Xóa công việc"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <h4 className="font-semibold text-zinc-900 text-xs leading-snug mb-1">
        {task.title}
      </h4>

      {task.description && (
        <p className="text-[11px] text-zinc-500 line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      {/* Due date & Assignee */}
      <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-100">
        <div className="flex items-center gap-1">
          {task.dueDate && (
            <>
              <Calendar className="w-3 h-3 text-zinc-400" />
              <span>{new Date(task.dueDate).toLocaleDateString('vi-VN')}</span>
            </>
          )}
        </div>

        {task.assignee ? (
          <div
            className="flex items-center gap-1 bg-zinc-50 px-1.5 py-0.5 rounded-full border border-zinc-200"
            title={`Giao cho: ${task.assignee.name || task.assignee.email}`}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[8px] font-bold">
              {task.assignee.name ? task.assignee.name[0] : task.assignee.email[0]}
            </div>
            <span className="truncate max-w-[70px] text-zinc-700 font-medium">
              {task.assignee.name || task.assignee.email}
            </span>
          </div>
        ) : (
          <span className="text-zinc-400 italic">Chưa giao</span>
        )}
      </div>

      {/* Quick Move Status Buttons */}
      <div className="mt-2.5 pt-2 border-t border-dashed border-zinc-100 flex items-center justify-between gap-1">
        {task.status !== 'TODO' && (
          <button
            onClick={() => onStatusChange(task.id, 'TODO')}
            className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 hover:bg-zinc-200 font-medium"
          >
            ← To Do
          </button>
        )}
        {task.status !== 'IN_PROGRESS' && (
          <button
            onClick={() => onStatusChange(task.id, 'IN_PROGRESS')}
            className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium ml-auto"
          >
            → In Progress
          </button>
        )}
        {task.status !== 'DONE' && (
          <button
            onClick={() => onStatusChange(task.id, 'DONE')}
            className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium"
          >
            ✓ Done
          </button>
        )}
      </div>
    </div>
  );
}
