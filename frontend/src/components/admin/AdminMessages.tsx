import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import createAppSocket from '@/lib/socket';
import type { Socket } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function AdminMessages() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);
  const [conversation, setConversation] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [presenceMap, setPresenceMap] = useState<Record<number, boolean>>({});
  const socketRef = useRef<Socket | null>(null);
  const selectedUserRef = useRef<number | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const lastTypingRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const tokenStr = localStorage.getItem('token');
  let adminId = null;
  try {
    if (tokenStr) adminId = JSON.parse(decodeURIComponent(escape(atob(String(tokenStr).split('.')[1] || '')))).id;
  } catch (e) {
    // ignore
  }

  const fetchDrivers = async () => {
    try {
      const res = await fetch(API_BASE + '/api/drivers', { headers: { Authorization: `Bearer ${tokenStr}` } });
      const data = await res.json();
      if (res.ok) setDrivers(data.drivers || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
    setIsOtherTyping(false);
  }, [selectedUser]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [conversation, isOtherTyping, selectedUser]);

  useEffect(() => {
    const socket = createAppSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      if (adminId) socket.emit('chat.join', adminId);
    });

    socket.on('chat.message', (m: any) => {
      const currentSelected = selectedUserRef.current;
      if (currentSelected && (m.sender_id === currentSelected || m.receiver_id === currentSelected)) {
        setConversation((prev) => [...prev, m]);
      }
      fetchDrivers();
    });

    socket.on('chat.typing', (payload: any) => {
      const currentSelected = selectedUserRef.current;
      if (!adminId || !currentSelected) return;
      if (payload.receiverId !== adminId) return;
      if (payload.senderId === currentSelected) {
        setIsOtherTyping(Boolean(payload.isTyping));
      }
    });

    socket.on('chat.presence', (payload: any) => {
      if (!payload || typeof payload.userId !== 'number') return;
      setPresenceMap((prev) => ({ ...prev, [payload.userId]: Boolean(payload.isOnline) }));
    });

    return () => {
      socket.off('chat.message');
      socket.off('chat.typing');
      socket.off('chat.presence');
      socket.disconnect();
    };
  }, [adminId]);

  const emitTyping = (isTyping: boolean) => {
    if (!socketRef.current || !selectedUser || !adminId) return;
    if (lastTypingRef.current === isTyping) return;
    socketRef.current.emit('chat.typing', {
      senderId: adminId,
      receiverId: selectedUser,
      isTyping,
    });
    lastTypingRef.current = isTyping;
  };

  const openConversation = async (driver: any) => {
    const otherId = driver.user_id || driver.id;
    setSelectedUser(Number(otherId));
    setSelectedDriver(driver);
    setIsOtherTyping(false);
    try {
      const res = await fetch(API_BASE + `/api/messages/conversation?otherId=${otherId}`, { headers: { Authorization: `Bearer ${tokenStr}` } });
      const data = await res.json();
      if (res.ok) {
        setConversation(data.messages || []);
        // mark unread messages addressed to admin as read
        const unreadIds = (data.messages || []).filter((m: any) => m.receiver_id === adminId && !m.is_read).map((m: any) => m.id);
        if (unreadIds.length > 0) {
          await fetch(API_BASE + '/api/messages/mark_read', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenStr}` }, body: JSON.stringify({ ids: unreadIds }) });
        }
        // refresh drivers list
        fetchDrivers();
      }
    } catch (e) { /* ignore */ }
  };

  const sendMessage = async () => {
    if (!selectedUser || !messageText.trim()) return;
    try {
      emitTyping(false);
      const res = await fetch(API_BASE + '/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenStr}` }, body: JSON.stringify({ receiverId: selectedUser, message: messageText }) });
      const data = await res.json();
      if (res.ok) {
        setConversation(prev => [...prev, data.msg]);
        setMessageText('');
        fetchDrivers();
        toast({ title: 'Sent', description: 'Reply sent' });
      } else {
        toast({ title: 'Failed', description: data.message || 'Could not send' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Network error' });
    }
  };

  const handleInputChange = (value: string) => {
    setMessageText(value);
    emitTyping(true);
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      emitTyping(false);
    }, 1200);
  };

  const handleInputBlur = () => {
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    emitTyping(false);
  };

  const formatDayLabel = (value: string) => {
    const d = new Date(value);
    return d.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const conversationRows = (() => {
    let lastDay = '';
    const rows: Array<{ type: 'day' | 'msg'; day?: string; msg?: any }> = [];
    conversation.forEach((m) => {
      const day = formatDayLabel(m.created_at);
      if (day !== lastDay) {
        rows.push({ type: 'day', day });
        lastDay = day;
      }
      rows.push({ type: 'msg', msg: m });
    });
    return rows;
  })();

  const sortedDrivers = [...drivers].sort((a, b) => {
    const aName = String(a.name || a.username || '').toLowerCase();
    const bName = String(b.name || b.username || '').toLowerCase();
    return aName.localeCompare(bName);
  });

  const handleDriverSelect = async (value: string) => {
    if (!value) {
      setSelectedUser(null);
      setSelectedDriver(null);
      setConversation([]);
      return;
    }

    const pickedId = Number(value);
    const driver = sortedDrivers.find((d) => Number(d.user_id || d.id) === pickedId);
    if (driver) {
      await openConversation(driver);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white/90 backdrop-blur p-4 shadow-sm">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Driver Chat</h4>
            <p className="text-xs text-slate-500">Pick a driver from the dropdown to open conversation.</p>
          </div>
          <div className="text-xs rounded-full bg-emerald-50 text-emerald-700 px-2 py-1">
            {sortedDrivers.length} drivers
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={selectedUser ? String(selectedUser) : ''}
            onChange={(e) => handleDriverSelect(e.target.value)}
          >
            <option value="">Select driver...</option>
            {sortedDrivers.map((d) => {
              const driverId = Number(d.user_id || d.id);
              const displayName = d.name || d.username || `Driver ${driverId}`;
              const isOnline = typeof presenceMap[driverId] === 'boolean'
                ? presenceMap[driverId]
                : (d.is_online === true || String(d.status || '').toLowerCase() === 'online');
              return (
                <option key={driverId} value={driverId}>
                  {displayName} {isOnline ? '(Online)' : '(Offline)'}
                </option>
              );
            })}
          </select>
          <Button type="button" variant="outline" onClick={fetchDrivers}>Refresh</Button>
        </div>

        {selectedUser ? (
          <>
            <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
              <div className="text-sm font-medium text-emerald-900">
                {selectedDriver?.name || selectedDriver?.username || `Driver #${selectedUser}`}
              </div>
              <div className="text-xs text-emerald-700">{isOtherTyping ? 'Typing...' : 'Conversation open'}</div>
            </div>

            <div className="h-[420px] overflow-auto rounded-lg border border-slate-200 bg-[radial-gradient(circle_at_1px_1px,rgba(15,118,110,0.09)_1px,transparent_0)] bg-[length:14px_14px] p-3 flex flex-col gap-2">
              {conversationRows.map((row, idx) => {
                if (row.type === 'day') {
                  return (
                    <div key={`day-${row.day}-${idx}`} className="self-center text-[11px] text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-1">
                      {row.day}
                    </div>
                  );
                }

                const m = row.msg;
                const isMine = m.sender_id === adminId;
                return (
                  <div
                    key={m.id}
                    className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm shadow-sm ${isMine ? 'self-end bg-emerald-200 text-slate-900' : 'self-start bg-white border border-emerald-100 text-slate-800'}`}
                  >
                    <div className="whitespace-pre-wrap break-words">{m.message}</div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                      <span>{new Date(m.created_at).toLocaleString()}</span>
                      {isMine && <span>{m.is_read ? 'Read' : 'Sent'}</span>}
                    </div>
                  </div>
                );
              })}

              {isOtherTyping && (
                <div className="self-start rounded-2xl bg-white px-3 py-2 text-sm text-slate-500 animate-pulse border border-emerald-100">
                  Typing...
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="flex gap-2 items-center">
              <input
                className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={messageText}
                onChange={e => handleInputChange(e.target.value)}
                onBlur={handleInputBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Write a reply..."
              />
              <Button onClick={sendMessage} className="rounded-full px-5 bg-emerald-600 hover:bg-emerald-700">Send</Button>
            </div>
          </>
        ) : (
          <div className="h-[420px] rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-sm text-slate-500">
            Select a driver from the dropdown to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}
