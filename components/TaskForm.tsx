'use client';

import React, { useState } from 'react';
import { Plus, AlertCircle, Loader2 } from 'lucide-react';
import { CreateTaskPayload, TaskPriority, TaskStatus } from '@/types';

interface TaskFormProps {
  onTaskCreated: (newTask: any) => void;
}

export function TaskForm({ onTaskCreated }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Vui lòng nhập tiêu đề task (Task title is required).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateTaskPayload = {
        title: trimmedTitle,
        description: description.trim() || undefined,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      };

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      // Reset form
      setTitle('');
      setDescription('');
      setStatus('TODO');
      setPriority('MEDIUM');
      setDueDate('');
      setIsExpanded(false);

      // Trigger immediate UI refresh
      onTaskCreated(data);
    } catch (err: any) {
      console.error('Error in TaskForm:', err);
      setError(err.message || 'Có lỗi xảy ra khi tạo task. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden transition-all duration-200">
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h2 className="text-base font-semibold text-zinc-900">
              Tạo công việc mới (Create Task)
            </h2>
          </div>
          <span className="text-xs text-zinc-400 font-medium">Assignment 1 Endpoint</span>
        </div>

        {error && (
          <div
            id="task-form-error"
            className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Main Title Input */}
          <div>
            <label htmlFor="task-title-input" className="block text-xs font-semibold text-zinc-700 mb-1">
              Tiêu đề công việc <span className="text-red-500">*</span>
            </label>
            <input
              id="task-title-input"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              onFocus={() => setIsExpanded(true)}
              placeholder="Nhập tiêu đề task cần làm (vd: Thiết kế Database Schema)..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              disabled={isSubmitting}
            />
          </div>

          {/* Expanded Fields: Description, Status, Priority, Due Date */}
          {(isExpanded || description || dueDate || status !== 'TODO') && (
            <div className="space-y-3 pt-1 border-t border-zinc-100 animate-in fade-in duration-200">
              {/* Description */}
              <div>
                <label htmlFor="task-desc-input" className="block text-xs font-semibold text-zinc-700 mb-1">
                  Mô tả chi tiết (Tùy chọn)
                </label>
                <textarea
                  id="task-desc-input"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ghi chú chi tiết, yêu cầu công việc hoặc tài liệu đính kèm..."
                  className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* Status, Priority, Due Date row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Status */}
                <div>
                  <label htmlFor="task-status-select" className="block text-xs font-semibold text-zinc-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    id="task-status-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm text-zinc-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                    disabled={isSubmitting}
                  >
                    <option value="TODO">To Do (Chưa bắt đầu)</option>
                    <option value="IN_PROGRESS">In Progress (Đang làm)</option>
                    <option value="DONE">Done (Hoàn thành)</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label htmlFor="task-priority-select" className="block text-xs font-semibold text-zinc-700 mb-1">
                    Mức độ ưu tiên
                  </label>
                  <select
                    id="task-priority-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm text-zinc-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                    disabled={isSubmitting}
                  >
                    <option value="LOW">Thấp (Low)</option>
                    <option value="MEDIUM">Trung bình (Medium)</option>
                    <option value="HIGH">Cao (High)</option>
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label htmlFor="task-due-date-input" className="block text-xs font-semibold text-zinc-700 mb-1">
                    Hạn chót (Due Date)
                  </label>
                  <input
                    id="task-due-date-input"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm text-zinc-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            {!isExpanded && (
              <button
                type="button"
                id="task-expand-details-btn"
                onClick={() => setIsExpanded(true)}
                className="text-xs text-zinc-500 hover:text-zinc-800 font-medium underline"
              >
                + Thêm chi tiết (Mô tả, hạn chót, mức độ)
              </button>
            )}
            {isExpanded && (
              <button
                type="button"
                id="task-collapse-details-btn"
                onClick={() => setIsExpanded(false)}
                className="text-xs text-zinc-400 hover:text-zinc-600 font-medium"
              >
                Thu gọn
              </button>
            )}

            <button
              type="submit"
              id="submit-create-task-btn"
              disabled={isSubmitting}
              className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Tạo Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskForm;
