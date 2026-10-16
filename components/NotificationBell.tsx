'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCircle,
  Clock,
  ListTodo,
  Shield,
  Users,
  X,
  ExternalLink,
  Check,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NotificationItem, NotificationType } from '@/types';
import { getSupabaseClient } from '@/lib/supabase';

export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/notifications?limit=25');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    // Set up Supabase Realtime subscription for this user
    const supabase = getSupabaseClient();
    let channel: any = null;

    if (supabase) {
      channel = supabase
        .channel(`user:${user.id}`)
        .on('broadcast', { event: 'new-notification' }, (payload: any) => {
          if (payload?.payload) {
            setNotifications((prev) => [payload.payload, ...prev]);
            setUnreadCount((prev) => prev + 1);
          } else {
            fetchNotifications();
          }
        })
        .subscribe();
    }

    // Polling fallback every 8 seconds to ensure notifications are always updated
    const interval = setInterval(fetchNotifications, 8000);

    return () => {
      clearInterval(interval);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string, link?: string | null) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      if (link) {
        setIsOpen(false);
        router.push(link);
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const clearRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'DELETE' });
      setNotifications((prev) => prev.filter((n) => !n.isRead));
    } catch (err) {
      console.error('Failed to clear read notifications:', err);
    }
  };

  if (!user) return null;

  const renderIcon = (type: NotificationType) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return <ListTodo className="w-4 h-4 text-emerald-600" />;
      case 'TEAM_INVITED':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'ROLE_UPDATED':
        return <Shield className="w-4 h-4 text-amber-600" />;
      case 'TASK_STATUS_CHANGED':
        return <CheckCircle className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-zinc-600" />;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;
      return d.toLocaleDateString('vi-VN');
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors focus:outline-none"
        title="Thông báo"
        aria-label="Thông báo"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            id="notification-unread-badge"
            className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-pulse"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id="notification-dropdown-panel"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-zinc-200 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/70">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900 text-sm">
                Thông báo
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  {unreadCount} mới
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  id="mark-all-read-btn"
                  onClick={markAllAsRead}
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
                >
                  Đọc tất cả
                </button>
              )}
              {notifications.some((n) => n.isRead) && (
                <button
                  onClick={clearRead}
                  className="text-zinc-400 hover:text-red-500 p-1 rounded hover:bg-zinc-100 transition-colors"
                  title="Dọn dẹp thông báo đã đọc"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-50">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 text-xs">
                <Bell className="w-8 h-8 mx-auto mb-2 text-zinc-300 stroke-[1.5]" />
                Bạn không có thông báo nào
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id, notif.link)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer text-left hover:bg-zinc-50 ${
                    !notif.isRead ? 'bg-emerald-50/40' : 'bg-white'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-zinc-100 border border-zinc-200/60 shrink-0 mt-0.5">
                    {renderIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-xs ${
                          !notif.isRead
                            ? 'font-bold text-zinc-900'
                            : 'font-medium text-zinc-700'
                        }`}
                      >
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">
                      {notif.content}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(notif.createdAt)}</span>
                      {notif.link && (
                        <span className="text-emerald-600 font-medium inline-flex items-center gap-0.5">
                          Xem chi tiết <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
