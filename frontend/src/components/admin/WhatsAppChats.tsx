import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_URL || '';

type ChatContact = {
  phone: string;
  last_message_at?: string;
  last_message_type?: string;
  last_direction?: string;
  unread_count?: number;
};

type ChatMessage = {
  id: number;
  whatsapp_phone: string;
  direction: string;
  message_type: string;
  message: string;
  created_at: string;
  is_read?: boolean;
};

const formatPhone = (value: string) => value.replace(/\s+/g, '').replace(/^\+/, '');
const normalizePhone = (value: string) => value.replace(/[^0-9]/g, '');

// Format timestamp for Nairobi time (EAT = UTC+3) display
// Database stores UTC timestamps, we convert to Nairobi time for display
// This conversion is browser-independent (works correctly in any timezone)
const formatNairobiDateTime = (timestamp: string | Date) => {
  const date = new Date(timestamp); // Parse UTC timestamp
  const nairobiTime = new Date(date.getTime() + (3 * 60 * 60 * 1000)); // Add 3 hours for EAT
  
  const day = nairobiTime.getUTCDate();
  const month = nairobiTime.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const year = nairobiTime.getUTCFullYear();
  
  let hours = nairobiTime.getUTCHours();
  const minutes = nairobiTime.getUTCMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
};

export default function WhatsAppChats() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [activePhone, setActivePhone] = useState('');
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitedAll, setInvitedAll] = useState(false);

  const loadContacts = async () => {
    try {
      const res = await fetch(API_BASE + '/api/whatsapp/chats');
      const data = await res.json();

      const baseContacts = res.ok ? (data.contacts || []) : [];
      const known = new Set(baseContacts.map((contact: ChatContact) => normalizePhone(contact.phone || '')));

      try {
        const participantsRes = await fetch(API_BASE + '/api/admin/whatsapp/participants');
        const participantsData = await participantsRes.json();
        const participants = participantsRes.ok ? (participantsData.participants || []) : [];

        participants.forEach((participant: { phone: string; last_message_at?: string }) => {
          const normalized = normalizePhone(participant.phone || '');
          if (!normalized || known.has(normalized)) return;
          known.add(normalized);
          baseContacts.push({
            phone: participant.phone,
            last_message_at: participant.last_message_at,
            last_message_type: 'twilio_participant',
            last_direction: 'inbound',
            unread_count: 0,
          });
        });
      } catch (error) {
        // ignore participants errors
      }

      setContacts(baseContacts);
    } catch (error) {
      // ignore
    }
  };

  const loadConversation = async (phone: string) => {
    try {
      const res = await fetch(API_BASE + `/api/whatsapp/chats/${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (res.ok) {
        const raw = data.messages || [];
        setConversation(raw.filter((msg: ChatMessage) => msg.message_type !== 'system_contact'));
      }
    } catch (error) {
      // ignore
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (activePhone) {
      loadConversation(activePhone);
    }
  }, [activePhone]);

  useEffect(() => {
    if (!invitedAll && contacts.length > 0) {
      const sendInvites = async () => {
        for (const contact of contacts) {
          await fetch(API_BASE + '/api/whatsapp/chats/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: contact.phone }),
          });
        }
        setInvitedAll(true);
      };
      sendInvites();
    }
  }, [contacts, invitedAll]);

  const handleAddNumber = async () => {
    const normalized = formatPhone(phoneInput);
    if (!normalized) return;

    try {
      setLoading(true);
      await fetch(API_BASE + '/api/whatsapp/chats/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalized }),
      });
      toast({ title: 'Invitation sent', description: `Auto invitation sent to ${normalized}` });
      setPhoneInput('');
      await loadContacts();
      setActivePhone(normalized);
    } catch (error: any) {
      toast({ title: 'Invite failed', description: error.message || 'Unable to send invite', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!activePhone || !messageText.trim()) return;
    try {
      setLoading(true);
      const res = await fetch(API_BASE + '/api/whatsapp/chats/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: activePhone, message: messageText }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessageText('');
        await loadConversation(activePhone);
        toast({ title: 'Sent', description: 'WhatsApp message sent' });
      } else {
        toast({ title: 'Send failed', description: data.error || 'Unable to send', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Send failed', description: error.message || 'Unable to send', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (phone: string) => {
    if (!confirm(`Delete all messages for ${phone}? This cannot be undone.`)) return;
    
    try {
      setLoading(true);
      const res = await fetch(API_BASE + `/api/whatsapp/chats/${encodeURIComponent(phone)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (res.ok) {
        toast({ title: 'Deleted', description: `Chat with ${phone} deleted (${data.deleted} messages)` });
        if (activePhone === phone) {
          setActivePhone('');
          setConversation([]);
        }
        await loadContacts();
      } else {
        toast({ title: 'Delete failed', description: data.error || 'Unable to delete', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Delete failed', description: error.message || 'Unable to delete', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [contacts]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">WhatsApp Users</h3>
            <p className="text-xs text-muted-foreground">Auto invites are sent to all numbers</p>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">{sortedContacts.length}</span>
        </div>

        <div className="flex gap-2 mb-3">
          <input
            className="flex-1 rounded-md border px-3 py-2 text-sm"
            placeholder="Enter number e.g. 2547xxxxxxx"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
          />
          <Button onClick={handleAddNumber} disabled={loading || !phoneInput.trim()}>
            Add
          </Button>
        </div>

        <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
          {sortedContacts.map((contact) => {
            const isPending = contact.last_message_type === 'system_contact';
            const hasUnread = (contact.unread_count || 0) > 0;
            return (
              <div
                key={contact.phone}
                className={`w-full p-3 rounded-lg border transition ${activePhone === contact.phone ? 'bg-emerald-50 border-emerald-100' : 'hover:bg-slate-50'}`}
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActivePhone(contact.phone)}
                    className="flex-1 text-left"
                  >
                    <div className="font-medium">{contact.phone}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Last: {contact.last_message_at ? formatNairobiDateTime(contact.last_message_at) : '—'}
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    {isPending && (
                      <span className="text-[11px] bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Pending</span>
                    )}
                    {hasUnread && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] flex items-center justify-center font-semibold">
                        {contact.unread_count}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(contact.phone);
                      }}
                      className="ml-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1.5 transition"
                      title="Delete chat"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {activePhone ? (
        <>
          <div className="lg:col-span-2 rounded-xl border bg-white p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Admin WhatsApp chat</p>
                <span className="text-xs text-muted-foreground">{conversation.length} messages</span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(activePhone)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg px-3 py-1.5 text-sm font-medium transition flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Chat
              </button>
            </div>

            <div className="h-80 overflow-auto mb-3 rounded-lg border bg-slate-50 p-4 flex flex-col gap-2">
              {conversation.map((msg) => {
                const isOutgoing = msg.direction === 'outgoing';
                const isUnread = !msg.is_read && !isOutgoing;
                return (
                  <div
                    key={msg.id}
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      isOutgoing
                        ? 'self-end bg-emerald-200'
                        : isUnread
                          ? 'self-start bg-blue-50 border-2 border-blue-200'
                          : 'self-start bg-white border border-emerald-100'
                    }`}
                  >
                    <div className={isUnread ? 'font-semibold' : ''}>{msg.message}</div>
                    <div className={`mt-1 text-[10px] ${isUnread ? 'text-blue-600' : 'text-muted-foreground'}`}>
                      {formatNairobiDateTime(msg.created_at)}
                      {isOutgoing && (msg.is_read ? ' ✓✓' : ' ✓')}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 items-center">
              <input
                className="flex-1 border rounded-full px-4 py-2"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a WhatsApp message..."
              />
              <Button onClick={handleSend} disabled={loading || !messageText.trim()} className="rounded-full px-5">Send</Button>
            </div>
          </div>
        </>
      ) : (
        <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
          Select a number to start chatting.
        </div>
      )}
    </div>
  );
}
