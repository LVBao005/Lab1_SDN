'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import TaskForm from '@/components/TaskForm';
import TaskList from '@/components/TaskList';
import EditTaskModal from '@/components/EditTaskModal';
import { TaskItem, TaskStatus } from '@/types';
import { CheckCircle2, Clock, ListTodo, AlertCircle, RefreshCw } from 'lucide-react';

export default function HomePage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    provider: string;
    message: string;
  }>({
    connected: false,
    provider: 'PostgreSQL (Supabase)',
    message: 'Đang kết nối cơ sở dữ liệu...',
  });
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Fetch tasks from API
  const fetchTasks = useCallback(async (filter = activeFilter) => {
    setIsLoading(true);
    try {
      const url = filter && filter !== 'ALL' ? `/api/tasks?status=${filter}` : '/api/tasks';
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
      setDbStatus({
        connected: true,
        provider: 'PostgreSQL (Supabase)',
        message: 'Kết nối thành công với Supabase PostgreSQL qua Prisma ORM',
      });
    } catch (err: any) {
      console.error('Error loading tasks:', err);
      setFeedbackMessage({
        type: 'error',
        text: 'Không thể tải danh sách công việc từ cơ sở dữ liệu. Vui lòng kiểm tra DATABASE_URL.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Handle filter change
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };

  // Callback when a task is created
  const handleTaskCreated = (newTask: TaskItem) => {
    // Real-time state update without manual page reload
    setTasks((prev) => [newTask, ...prev]);
    setFeedbackMessage({
      type: 'success',
      text: `Đã tạo công việc "${newTask.title}" thành công!`,
    });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Open edit modal
  const handleEditTask = (task: TaskItem) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  // Callback when task is updated
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

  // Callback when task is deleted
  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete task');
      }

      // Real-time state update without manual page reload
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

  // Quick toggle status directly from list
  const handleStatusToggle = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      const updated = await res.json();

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? updated : t)),
      );
    } catch (err: any) {
      console.error('Status toggle failed:', err);
    }
  };

  // Filter tasks in UI if server returned all
  const displayedTasks = activeFilter === 'ALL'
    ? tasks
    : tasks.filter((t) => t.status === activeFilter);

  // Statistics
  const totalCount = tasks.length;
  const todoCount = tasks.filter((t) => t.status === 'TODO').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const doneCount = tasks.filter((t) => t.status === 'DONE').length;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-between">
      <div>
        {/* Navigation Bar */}
        <Navbar currentPath="/" dbStatus={dbStatus} />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          {/* Feedback alert toast */}
          {feedbackMessage && (
            <div
              id="action-feedback-toast"
              className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${
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
          )}

          {/* Top Heading & Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                Quản lý công việc (Task Management)
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                Dự án Assignment 1 · Next.js App Router, Prisma ORM &amp; PostgreSQL Supabase
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

          {/* Form Create Task Section */}
          <TaskForm onTaskCreated={handleTaskCreated} />

          {/* Task List Section with Filter and Actions */}
          <TaskList
            tasks={displayedTasks}
            isLoading={isLoading}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onStatusToggle={handleStatusToggle}
          />
        </main>
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
          <p className="font-mono text-[11px] text-zinc-400">Endpoint: GET / POST /api/tasks · PUT / DELETE /api/tasks/[id]</p>
        </div>
      </footer>
    </div>
  );
}
