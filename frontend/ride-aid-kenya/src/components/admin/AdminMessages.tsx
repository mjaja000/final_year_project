import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import io from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function AdminMessages() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [driverQuery, setDriverQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);
  const [conversation, setConversation] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [presenceMap, setPresenceMap] = useState<Record<number, boolean>>({});
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
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
    const socket = API_BASE ? io(API_BASE) : io();
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

  const filteredDrivers = drivers.filter((d) => {
    const name = (d.name || d.username || '').toLowerCase();
    const contact = (d.phone || d.email || '').toLowerCase();
    const query = driverQuery.trim().toLowerCase();
    if (!query) return true;
    return name.includes(query) || contact.includes(query);
  });

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 rounded-xl border bg-white/80 backdrop-blur p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-semibold">Registered Drivers</h4>
              <div className="text-xs text-muted-foreground">Select a driver to open chat</div>
            </div>
            <div className="text-xs rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5">
              {filteredDrivers.length}
            </div>
          </div>
          <input
            className="mb-3 w-full rounded-md border px-3 py-2 text-sm"
            value={driverQuery}
            onChange={(e) => setDriverQuery(e.target.value)}
            placeholder="Search drivers..."
          />
          <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
            {filteredDrivers.map(d => {
              const driverId = d.user_id || d.id;
              const displayName = d.name || d.username || `Driver ${driverId}`;
              const initial = String(displayName).charAt(0).toUpperCase();
              const isOnline = typeof presenceMap[Number(driverId)] === 'boolean'
                ? presenceMap[Number(driverId)]
                : (d.is_online === true || String(d.status || '').toLowerCase() === 'online');
              return (
                <div
                  key={driverId}
                  className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition hover:bg-slate-50 ${selectedUser === Number(driverId) ? 'bg-emerald-50 border-emerald-100' : ''}`}
                  onClick={() => openConversation(d)}
                >
                  <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{displayName}</div>
                    <div className="text-xs text-muted-foreground truncate">{d.phone || d.email || 'No contact info'}</div>
                  </div>
                  <div className={`text-[11px] px-2 py-0.5 rounded-full ${isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-2 rounded-xl border bg-white/80 backdrop-blur p-3 shadow-sm">
          {selectedUser ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold">
                    {String(selectedDriver?.name || selectedDriver?.username || selectedUser).charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{selectedDriver?.name || selectedDriver?.username || `Driver #${selectedUser}`}</div>
                    <div className="text-[11px] text-muted-foreground">Support conversation</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{isOtherTyping ? 'Typing...' : 'Online now'}</div>
              </div>

              <div className="h-72 overflow-auto mb-3 rounded-lg border bg-[radial-gradient(circle_at_1px_1px,rgba(16,185,129,0.12)_1px,transparent_0)] bg-[length:16px_16px] p-4 flex flex-col gap-2">
                {conversationRows.map((row, idx) => {
                  if (row.type === 'day') {
                    return (
                      <div key={`day-${row.day}-${idx}`} className="self-center text-[11px] text-muted-foreground bg-white/80 border rounded-full px-3 py-1">
                        {row.day}
                      </div>
                    );
                  }
                  const m = row.msg;
                  return (
                    <div
                      key={m.id}
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${m.sender_id === adminId ? 'self-end bg-emerald-200' : 'self-start bg-white border border-emerald-100'}`}
                    >
                      <div>{m.message}</div>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{new Date(m.created_at).toLocaleString()}</span>
                        {m.sender_id === adminId && (
                          <span>{m.is_read ? 'Read' : 'Sent'}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {isOtherTyping && (
                  <div className="self-start rounded-2xl bg-white px-3 py-2 text-sm text-muted-foreground animate-pulse border border-emerald-100">
                    Typing...
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="flex gap-2 items-center">
                <input
                  className="flex-1 border rounded-full px-4 py-2"
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
                <Button onClick={sendMessage} className="rounded-full px-5">Send</Button>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Select a driver to start chatting.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
