import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function AdminMessages() {
  const { toast } = useToast();
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [conversation, setConversation] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');

  const tokenStr = localStorage.getItem('token');
  let adminId = null;
  try {
    if (tokenStr) adminId = JSON.parse(decodeURIComponent(escape(atob(String(tokenStr).split('.')[1] || '')))).id;
  } catch (e) {
    // ignore
  }

  const fetchActivities = async () => {
    try {
      const res = await fetch(API_BASE + '/api/messages/admin/recent', { headers: { Authorization: `Bearer ${tokenStr}` } });
      const data = await res.json();
      if (res.ok) setActivities(data.activities || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const openConversation = async (activity: any) => {
    const otherId = activity.sender_id === adminId ? activity.receiver_id : activity.sender_id;
    setSelectedUser(Number(otherId));
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
        // refresh activities list
        fetchActivities();
      }
    } catch (e) { /* ignore */ }
  };

  const sendMessage = async () => {
    if (!selectedUser || !messageText.trim()) return;
    try {
      const res = await fetch(API_BASE + '/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenStr}` }, body: JSON.stringify({ receiverId: selectedUser, message: messageText }) });
      const data = await res.json();
      if (res.ok) {
        setConversation(prev => [...prev, data.msg]);
        setMessageText('');
        fetchActivities();
        toast({ title: 'Sent', description: 'Reply sent' });
      } else {
        toast({ title: 'Failed', description: data.message || 'Could not send' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Network error' });
    }
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1">
          <h4 className="font-semibold mb-2">Recent Messages</h4>
          <div className="space-y-2">
            {activities.map(a => (
              <div key={a.id} className={`p-2 rounded border cursor-pointer hover:bg-slate-50 ${selectedUser && (a.sender_id === selectedUser || a.receiver_id === selectedUser) ? 'bg-slate-50' : ''}`} onClick={() => openConversation(a)}>
                <div className="font-medium">From: {a.sender_name || a.sender_id}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">{a.message}</div>
                <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 bg-slate-50 p-3 rounded">
          {selectedUser ? (
            <>
              <div className="h-64 overflow-auto mb-3">
                {conversation.map(m => (
                  <div key={m.id} className={`mb-2 p-2 rounded ${m.sender_id === adminId ? 'bg-blue-100 self-end' : 'bg-gray-100'}`}>
                    <div className="text-sm">{m.message}</div>
                    <div className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input className="flex-1 border rounded px-2 py-1" value={messageText} onChange={e => setMessageText(e.target.value)} placeholder="Write a reply..." />
                <Button onClick={sendMessage}>Send</Button>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Select a conversation to view and reply.</div>
          )}
        </div>
      </div>
    </div>
  );
}
