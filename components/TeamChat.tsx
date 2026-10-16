'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  MessageSquare,
  Users,
  Clock,
  Loader2,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { MessageItem } from '@/types';
import { getSupabaseClient } from '@/lib/supabase';

interface TeamChatProps {
  teamId: string;
  teamName: string;
}

export function TeamChat({ teamId, teamName }: TeamChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<{ id: string; name: string }[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  // Fetch initial message history
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}/messages?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch team messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchMessages().then(() => scrollToBottom(false));
  }, [fetchMessages, scrollToBottom]);

  // Connect to Supabase Realtime channel
  useEffect(() => {
    if (!teamId || !user) return;

    const supabase = getSupabaseClient();
    if (!supabase) {
      // Fallback polling if Supabase anon key not set
      const interval = setInterval(fetchMessages, 4000);
      return () => clearInterval(interval);
    }

    const channelName = `team:${teamId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: user.id },
      },
    });

    channelRef.current = channel;

    // Listen to broadcast messages
    channel
      .on('broadcast', { event: 'new-message' }, ({ payload }: { payload: MessageItem }) => {
        if (!payload) return;
        setMessages((prev) => {
          // Avoid duplicate
          if (prev.some((m) => m.id === payload.id)) return prev;
          return [...prev, payload];
        });
        setTimeout(() => scrollToBottom(true), 50);
      })
      .on('broadcast', { event: 'typing' }, ({ payload }: { payload: { userId: string; userName: string; isTyping: boolean } }) => {
        if (!payload || payload.userId === user.id) return;
        setTypingUsers((prev) => {
          if (payload.isTyping) {
            return prev.includes(payload.userName) ? prev : [...prev, payload.userName];
          } else {
            return prev.filter((name) => name !== payload.userName);
          }
        });
      })
      // Listen to Presence
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const usersMap = new Map<string, string>();
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.id && p.name) {
              usersMap.set(p.id, p.name);
            }
          });
        });
        setOnlineUsers(Array.from(usersMap.entries()).map(([id, name]) => ({ id, name })));
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeActive(true);
          channel.track({
            id: user.id,
            name: user.name || user.email,
            onlineAt: new Date().toISOString(),
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsRealtimeActive(false);
        }
      });

    // Fallback sync interval every 6 seconds to ensure no dropped messages
    const fallbackInterval = setInterval(() => {
      fetchMessages();
    }, 6000);

    return () => {
      clearInterval(fallbackInterval);
      if (channel) {
        channel.untrack();
        supabase.removeChannel(channel);
      }
      channelRef.current = null;
    };
  }, [teamId, user, fetchMessages, scrollToBottom]);

  // Handle typing broadcast with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (!channelRef.current || !user) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: user.id,
        userName: user.name || user.email.split('@')[0],
        isTyping: true,
      },
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: user.id,
          userName: user.name || user.email.split('@')[0],
          isTyping: false,
        },
      });
    }, 2000);
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = inputText.trim();
    if (!content || isSending || !user) return;

    try {
      setIsSending(true);
      const res = await fetch(`/api/teams/${teamId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const createdMessage = await res.json();
        // Add optimistically to current user state
        setMessages((prev) => {
          if (prev.some((m) => m.id === createdMessage.id)) return prev;
          return [...prev, createdMessage];
        });
        setInputText('');

        // Broadcast to team channel so other users receive it instantly
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'new-message',
            payload: createdMessage,
          });

          // Stop typing indicator
          channelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: {
              userId: user.id,
              userName: user.name || user.email.split('@')[0],
              isTyping: false,
            },
          });
        }

        setTimeout(() => scrollToBottom(true), 50);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      id="team-chat-container"
      className="flex flex-col h-[650px] bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden"
    >
      {/* Chat Room Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-zinc-900 text-sm sm:text-base">
                Kênh trò chuyện: {teamName}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800">
                <Wifi className="w-3 h-3 text-emerald-600 animate-pulse" />
                Real-time
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Trao đổi tức thì với các thành viên trong nhóm
            </p>
          </div>
        </div>

        {/* Presence indicator */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-zinc-200/80 text-xs text-zinc-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Users className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-medium text-zinc-700">
            {onlineUsers.length > 0 ? `${onlineUsers.length} trực tuyến` : 'Đang hoạt động'}
          </span>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-zinc-50/40 via-white to-white">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs">Đang tải lịch sử tin nhắn...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Sparkles className="w-7 h-7 stroke-[1.5]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-700">
                Chưa có tin nhắn nào
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Hãy là người đầu tiên gửi tin nhắn trong nhóm này!
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === user?.id;
            const senderName = msg.sender?.name || msg.sender?.email || 'Thành viên';
            const initial = senderName.charAt(0).toUpperCase();

            return (
              <div
                key={msg.id || index}
                className={`flex items-end gap-2.5 ${
                  isMe ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isMe
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                      : 'bg-zinc-200 text-zinc-700 border border-zinc-300'
                  }`}
                  title={senderName}
                >
                  {initial}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[75%] sm:max-w-[65%] flex flex-col ${
                    isMe ? 'items-end' : 'items-start'
                  }`}
                >
                  {!isMe && (
                    <span className="text-[11px] font-medium text-zinc-500 mb-1 ml-1">
                      {senderName}
                    </span>
                  )}
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm ${
                      isMe
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-zinc-100 text-zinc-900 rounded-bl-none border border-zinc-200/60'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 px-1">
                    {formatMessageTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator banner */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-zinc-500 italic px-2 animate-pulse">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
            </span>
            <span>{typingUsers.join(', ')} đang soạn tin...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-3.5 border-t border-zinc-200/80 bg-white flex items-center gap-2"
      >
        <input
          id="team-chat-input"
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Nhập tin nhắn... (Nhấn Enter để gửi)"
          className="flex-1 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          disabled={isSending}
        />
        <button
          id="team-chat-send-btn"
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors shadow-sm shadow-emerald-200"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Gửi</span>
        </button>
      </form>
    </div>
  );
}
