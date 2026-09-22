'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  Circle, 
  AlertTriangle, 
  Loader2, 
  Filter,
  Check
} from 'lucide-react';
import { TaskItem, TaskPriority, TaskStatus } from '@/src/types';

interface TaskListProps {
  tasks: TaskItem[];
  isLoading: boolean;
  activeFilter: string;
  onFilterChange: (status: string) => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => Promise<void>;
  onStatusToggle?: (taskId: string, newStatus: TaskStatus) => Promise<void>;
}

export function TaskList({
  tasks,
  isLoading,
  activeFilter,
  onFilterChange,
  onEditTask,
  onDeleteTask,
  onStatusToggle,
}: TaskListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa công việc "${title}" không?`)) {
      return;
    }
    setDeletingId(id);
    try {
      await onDeleteTask(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (task: TaskItem) => {
    if (!onStatusToggle) return;
    const nextStatus: TaskStatus = 
      task.status === 'DONE' ? 'TODO' : 
      task.status === 'TODO' ? 'IN_PROGRESS' : 'DONE';

    setUpdatingId(task.id);
    try {
      await onStatusToggle(task.id, nextStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  // Helper for status badge
  const renderStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'DONE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Done</span>
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            <span>In Progress</span>
          </span>
        );
      case 'TODO':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
            <Circle className="w-3 h-3 text-zinc-400" />
            <span>To Do</span>
          </span>
        );
    }
  };

  // Helper for priority badge
  const renderPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            <span>Cao</span>
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span>Trung bình</span>
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
            <span>Thấp</span>
          </span>
        );
    }
  };

  const filterOptions = [
    { label: 'Tất cả (All)', value: 'ALL', count: tasks.length },
    { label: 'To Do', value: 'TODO', count: tasks.filter(t => t.status === 'TODO').length },
    { label: 'In Progress', value: 'IN_PROGRESS', count: tasks.filter(t => t.status === 'IN_PROGRESS').length },
    { label: 'Done', value: 'DONE', count: tasks.filter(t => t.status === 'DONE').length },
  ];

  return (
    <div className="space-y-4">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-zinc-200 shadow-xs">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1 text-xs font-semibold text-zinc-500 mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Lọc:</span>
          </div>
          {filterOptions.map((f) => (
            <button
              key={f.value}
              id={`filter-btn-${f.value.toLowerCase()}`}
              onClick={() => onFilterChange(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeFilter === f.value
                  ? 'bg-zinc-900 text-white font-semibold shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
              }`}
            >
              <span>{f.label}</span>
              {activeFilter === 'ALL' && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeFilter === f.value ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-600'
                }`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-end gap-1 shrink-0">
          <button
            id="view-mode-cards"
            onClick={() => setViewMode('cards')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              viewMode === 'cards'
                ? 'bg-zinc-100 border-zinc-300 text-zinc-900'
                : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Thẻ (Cards)
          </button>
          <button
            id="view-mode-table"
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              viewMode === 'table'
                ? 'bg-zinc-100 border-zinc-300 text-zinc-900'
                : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Bảng (Table)
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-12 flex flex-col items-center justify-center bg-white rounded-xl border border-zinc-200">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mb-2" />
          <p className="text-sm font-medium text-zinc-600">Đang tải danh sách công việc...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && tasks.length === 0 && (
        <div className="py-14 text-center bg-white rounded-xl border border-dashed border-zinc-300 p-6">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-3 text-zinc-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-zinc-800 mb-1">
            Không tìm thấy công việc nào
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
            {activeFilter !== 'ALL'
              ? `Hiện chưa có công việc nào với trạng thái "${activeFilter}". Thử chọn bộ lọc khác.`
              : 'Hãy sử dụng form ở trên để thêm công việc đầu tiên của bạn vào hệ thống!'}
          </p>
          {activeFilter !== 'ALL' && (
            <button
              onClick={() => onFilterChange('ALL')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
            >
              Xem tất cả công việc
            </button>
          )}
        </div>
      )}

      {/* Cards View */}
      {!isLoading && tasks.length > 0 && viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {tasks.map((task) => {
            const isDeleting = deletingId === task.id;
            const isUpdating = updatingId === task.id;

            return (
              <div
                key={task.id}
                id={`task-card-${task.id}`}
                className={`group bg-white rounded-xl border p-4 sm:p-5 transition-all duration-150 flex flex-col justify-between ${
                  task.status === 'DONE'
                    ? 'border-zinc-200/80 bg-zinc-50/50'
                    : 'border-zinc-200 hover:border-zinc-300 shadow-xs hover:shadow-sm'
                }`}
              >
                <div>
                  {/* Top Row: status + priority + quick toggle */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleToggle(task)}
                        disabled={isUpdating}
                        title="Bấm để chuyển trạng thái nhanh"
                        className="transition-transform active:scale-95"
                      >
                        {renderStatusBadge(task.status)}
                      </button>
                      {renderPriorityBadge(task.priority)}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Edit Button */}
                      <button
                        id={`edit-task-${task.id}`}
                        onClick={() => onEditTask(task)}
                        className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
                        title="Chỉnh sửa task"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        id={`delete-task-${task.id}`}
                        onClick={() => handleDelete(task.id, task.title)}
                        disabled={isDeleting}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                        title="Xóa task"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className={`text-base font-semibold text-zinc-900 mb-1.5 ${
                    task.status === 'DONE' ? 'line-through text-zinc-400' : ''
                  }`}>
                    {task.title}
                  </h3>

                  {/* Description */}
                  {task.description && (
                    <p className={`text-xs text-zinc-600 line-clamp-2 mb-3 ${
                      task.status === 'DONE' ? 'text-zinc-400' : ''
                    }`}>
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Bottom Metadata */}
                <div className="pt-3 mt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>
                      {task.dueDate
                        ? `Hạn: ${new Date(task.dueDate).toLocaleDateString('vi-VN')}`
                        : `Tạo: ${new Date(task.createdAt).toLocaleDateString('vi-VN')}`}
                    </span>
                  </div>

                  {task.team && (
                    <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded font-medium">
                      {task.team.name}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {!isLoading && tasks.length > 0 && viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70 text-zinc-600 font-semibold">
                <th className="py-3 px-4 w-12 text-center">Trạng thái</th>
                <th className="py-3 px-4">Tiêu đề công việc</th>
                <th className="py-3 px-4 w-28">Độ ưu tiên</th>
                <th className="py-3 px-4 w-32">Hạn chót</th>
                <th className="py-3 px-4 w-24 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {tasks.map((task) => {
                const isDeleting = deletingId === task.id;
                return (
                  <tr
                    key={task.id}
                    className="hover:bg-zinc-50/60 transition-colors group"
                  >
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(task)}
                        title="Bấm để chuyển trạng thái"
                        className="inline-block"
                      >
                        {task.status === 'DONE' ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : task.status === 'IN_PROGRESS' ? (
                          <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center mx-auto">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-zinc-300 mx-auto" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-900 text-sm">
                        <span className={task.status === 'DONE' ? 'line-through text-zinc-400' : ''}>
                          {task.title}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-zinc-500 text-[11px] truncate max-w-md mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {renderPriorityBadge(task.priority)}
                    </td>
                    <td className="py-3 px-4 text-zinc-500">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          id={`table-edit-task-${task.id}`}
                          onClick={() => onEditTask(task)}
                          className="p-1.5 rounded text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
                          title="Chỉnh sửa"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`table-delete-task-${task.id}`}
                          onClick={() => handleDelete(task.id, task.title)}
                          disabled={isDeleting}
                          className="p-1.5 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          title="Xóa"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TaskList;
