import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import EditTaskModal from '../components/EditTaskModal';
import { TaskItem, TaskStatus } from './types';
import { 
  CheckCircle2, 
  Clock, 
  ListTodo, 
  RefreshCw, 
  Database, 
  Sparkles, 
  Users, 
  ArrowLeft, 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  KeyRound, 
  LogIn,
  Info,
  ExternalLink
} from 'lucide-react';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<'/' | '/teams' | '/login'>('/');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    provider: string;
    message: string;
    databaseUrlMasked?: string;
  }>({
    connected: false,
    provider: 'PostgreSQL (Supabase) + Prisma',
    message: 'Kiểm tra trạng thái cơ sở dữ liệu...',
  });
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [showDbGuide, setShowDbGuide] = useState(false);

  // Sync browser path if changed
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      if (pathname === '/teams') setCurrentRoute('/teams');
      else if (pathname === '/login') setCurrentRoute('/login');
      else setCurrentRoute('/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    if (path === '/teams' || path === '/login' || path === '/') {
      setCurrentRoute(path as any);
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState({}, '', path);
      }
    }
  };

  // Check DB status
  const checkDbStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/db-status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch {
      // Fallback info
    }
  }, []);

  // Fetch tasks
  const fetchTasks = useCallback(async (filter = activeFilter) => {
    setIsLoading(true);
    try {
      const url = filter && filter !== 'ALL' ? `/api/tasks?status=${filter}` : '/api/tasks';
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
      checkDbStatus();
    } catch (err: any) {
      console.error('Error loading tasks:', err);
      setFeedbackMessage({
        type: 'error',
        text: 'Không thể tải danh sách task. Đang thử lại...',
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, checkDbStatus]);

  useEffect(() => {
    fetchTasks();
    checkDbStatus();
  }, [fetchTasks, checkDbStatus]);

  // Handle task created
  const handleTaskCreated = (newTask: TaskItem) => {
    setTasks((prev) => [newTask, ...prev]);
    setFeedbackMessage({
      type: 'success',
      text: `Đã tạo công việc "${newTask.title}" thành công!`,
    });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Handle edit task
  const handleEditTask = (task: TaskItem) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  // Handle task updated
  const handleTaskUpdated = (updatedTask: TaskItem) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    );
    setFeedbackMessage({
      type: 'success',
      text: `Đã cập nhật công việc "${updatedTask.title}" thành công!`,
    });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Handle task deleted
  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete task');
      }

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setFeedbackMessage({
        type: 'info',
        text: 'Đã xóa công việc thành công.',
      });
      setTimeout(() => setFeedbackMessage(null), 3500);
    } catch (err: any) {
      console.error('Error deleting task:', err);
      alert(`Lỗi khi xóa task: ${err.message}`);
    }
  };

  // Handle quick status toggle
  const handleStatusToggle = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Status update failed');
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err: any) {
      console.error('Failed to update status:', err);
    }
  };

  // Filter tasks in UI
  const displayedTasks = activeFilter === 'ALL'
    ? tasks
    : tasks.filter((t) => t.status === activeFilter);

  // Counters
  const totalCount = tasks.length;
  const todoCount = tasks.filter((t) => t.status === 'TODO').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const doneCount = tasks.filter((t) => t.status === 'DONE').length;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col justify-between">
      <div>
        {/* Navigation Bar */}
        <Navbar
          currentPath={currentRoute}
          onNavigate={navigateTo}
          dbStatus={dbStatus}
        />

        {/* Database Status Alert Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex items-center justify-between p-3 rounded-xl border bg-white border-zinc-200 text-xs shadow-2xs">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${dbStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="font-semibold text-zinc-800">
                {dbStatus.connected ? 'Supabase PostgreSQL Đang Hoạt Động' : 'Supabase PostgreSQL Connection Ready'}
              </span>
              <span className="text-zinc-500 hidden sm:inline">
                ({dbStatus.message})
              </span>
            </div>
            <button
              onClick={() => setShowDbGuide(!showDbGuide)}
              className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold underline shrink-0 ml-2"
            >
              <Info className="w-3.5 h-3.5" />
              <span>{showDbGuide ? 'Ẩn hướng dẫn DB' : 'Xem cấu hình Prisma & DB'}</span>
            </button>
          </div>

          {/* Collapsible DB Guide */}
          {showDbGuide && (
            <div className="mt-2 p-4 rounded-xl bg-zinc-900 text-zinc-100 text-xs space-y-2.5 font-mono shadow-sm animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-zinc-400 pb-2 border-b border-zinc-800">
                <span className="font-sans font-semibold text-white">Hướng dẫn kết nối Supabase + Prisma</span>
                <span className="text-[11px]">Assignment 1 Configuration</span>
              </div>
              <p className="text-zinc-300 font-sans">
                Chuỗi kết nối PostgreSQL Supabase đã được cài sẵn trong file <code className="text-emerald-400 font-bold">.env</code>:
              </p>
              <div className="p-2.5 rounded bg-black/60 text-emerald-300 text-[11px] overflow-x-auto select-all">
                DATABASE_URL="postgres://postgres:YOUR_PASSWORD@db.zoijagrhrirmjvilswxt.supabase.co:5432/postgres"
              </div>
              <p className="text-zinc-400 font-sans text-[11px]">
                💡 Khi bạn thay <code className="text-amber-300">YOUR_PASSWORD</code> bằng mật khẩu database Supabase của bạn, hệ thống sẽ tự động đồng bộ trực tiếp mọi task lên database cloud. Nếu chưa có mật khẩu, ứng dụng sử dụng bộ lưu trữ an toàn để bạn thử nghiệm trọn vẹn mọi thao tác Create, Read, Update, Delete.
              </p>
              <div className="pt-1 flex flex-wrap gap-2 text-[11px] font-sans">
                <span className="text-zinc-400">Lệnh di chuyển Prisma:</span>
                <code className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-200">npx prisma migrate dev --name init</code>
                <code className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-200">npx prisma generate</code>
              </div>
            </div>
          )}
        </div>

        {/* FEEDBACK TOAST */}
        {feedbackMessage && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
            <div
              id="action-feedback-toast"
              className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all duration-200 shadow-xs ${
                feedbackMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : feedbackMessage.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-800'
              }`}
            >
              <span>{feedbackMessage.text}</span>
              <button
                onClick={() => setFeedbackMessage(null)}
                className="text-zinc-500 hover:text-zinc-800 text-xs ml-2"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* ROUTE 1: HOME PAGE */}
        {currentRoute === '/' && (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Top Heading & Refresh */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                  Quản lý công việc (Task Management)
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                  Assignment 1 · Next.js App Router, Prisma ORM &amp; PostgreSQL Supabase
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="refresh-tasks-btn"
                  onClick={() => fetchTasks(activeFilter)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs"
                  title="Tải lại danh sách"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : 'text-zinc-500'}`} />
                  <span>Làm mới</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">Tổng số task</span>
                  <ListTodo className="w-4 h-4 text-zinc-400" />
                </div>
                <p className="text-xl font-bold text-zinc-900 mt-1">{totalCount}</p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">To Do</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                </div>
                <p className="text-xl font-bold text-zinc-700 mt-1">{todoCount}</p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">In Progress</span>
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-xl font-bold text-blue-600 mt-1">{inProgressCount}</p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">Hoàn thành</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xl font-bold text-emerald-600 mt-1">{doneCount}</p>
              </div>
            </div>

            {/* Task Form (Title validation required) */}
            <TaskForm onTaskCreated={handleTaskCreated} />

            {/* Task List with Status Filter */}
            <TaskList
              tasks={displayedTasks}
              isLoading={isLoading}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onStatusToggle={handleStatusToggle}
            />
          </main>
        )}

        {/* ROUTE 2: TEAMS PLACEHOLDER PAGE (Coming Soon) */}
        {currentRoute === '/teams' && (
          <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 text-center">
            <div className="mb-6 flex justify-start">
              <button
                onClick={() => navigateTo('/')}
                className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-100"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại trang chủ (Back to Home)</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 p-8 sm:p-12 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5 text-amber-600 shadow-xs">
                <Users className="w-8 h-8" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tính năng đang phát triển</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight mb-3">
                Teams Management (Coming soon)
              </h1>

              <p className="text-zinc-600 max-w-lg mx-auto text-sm leading-relaxed mb-8">
                Trang quản lý nhóm theo yêu cầu bài tập Assignment 1. Mô hình dữ liệu quan hệ giữa <code className="px-1.5 py-0.5 rounded bg-zinc-100 font-mono text-zinc-800 text-xs font-bold">Team</code> và <code className="px-1.5 py-0.5 rounded bg-zinc-100 font-mono text-zinc-800 text-xs font-bold">TeamMember</code> đã được chuẩn bị sẵn sàng trong file <code className="px-1.5 py-0.5 rounded bg-zinc-100 font-mono text-zinc-800 text-xs font-bold">schema.prisma</code>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto pt-6 border-t border-zinc-100">
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                  <UserPlus className="w-5 h-5 text-emerald-600 mb-2" />
                  <h4 className="text-xs font-bold text-zinc-900 mb-1">Mời thành viên</h4>
                  <p className="text-[11px] text-zinc-500">Thêm thành viên vào nhóm và gán vai trò theo bảng TeamMember.</p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                  <ShieldCheck className="w-5 h-5 text-blue-600 mb-2" />
                  <h4 className="text-xs font-bold text-zinc-900 mb-1">Phân quyền vai trò</h4>
                  <p className="text-[11px] text-zinc-500">Hỗ trợ các cấp bậc OWNER, ADMIN, MEMBER theo Prisma Enum.</p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                  <Users className="w-5 h-5 text-purple-600 mb-2" />
                  <h4 className="text-xs font-bold text-zinc-900 mb-1">Giao việc cho Nhóm</h4>
                  <p className="text-[11px] text-zinc-500">Liên kết task với teamId và assigneeId cụ thể.</p>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => navigateTo('/')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors"
                >
                  <span>Quay về quản lý công việc</span>
                </button>
              </div>
            </div>
          </main>
        )}

        {/* ROUTE 3: LOGIN PLACEHOLDER PAGE */}
        {currentRoute === '/login' && (
          <main className="max-w-md mx-auto px-4 py-12 text-center">
            <div className="mb-6 flex justify-start">
              <button
                onClick={() => navigateTo('/')}
                className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-100"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay về trang chủ</span>
              </button>
            </div>

            <div className="bg-white py-8 px-6 sm:px-8 shadow-xs rounded-2xl border border-zinc-200 text-left">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-white mx-auto mb-4 shadow-sm">
                <LogIn className="w-6 h-6" />
              </div>
              <h2 className="text-center text-xl font-bold tracking-tight text-zinc-900">
                Đăng nhập tài khoản
              </h2>
              <p className="mt-1 text-center text-xs text-zinc-500 mb-6">
                Mô hình User trong Prisma Schema (id, name, email, password, createdAt)
              </p>

              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); navigateTo('/'); }}>
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
                      defaultValue="student@assignment1.edu.vn"
                      className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                      className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-hidden"
                  >
                    Đăng nhập (Assignment 1 Demo)
                  </button>
                </div>
              </form>

              <div className="mt-5 p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-center">
                <span className="text-[11px] text-zinc-500">
                  Phần quản lý task hoạt động trực tiếp ngay trên trang chủ không cần đăng nhập.
                </span>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* Edit Task Modal */}
      <EditTaskModal
        task={editingTask}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
        }}
        onTaskUpdated={handleTaskUpdated}
      />

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
          <p>Assignment 1: Task &amp; Team Management · Next.js App Router + Prisma ORM + Supabase PostgreSQL</p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-zinc-400">GET /api/tasks · POST /api/tasks · PUT / DELETE /api/tasks/:id</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
