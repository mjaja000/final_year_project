import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function AdminResetLogs({ onClose }: { onClose?: () => void }) {
  const { toast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE + '/api/drivers/resets?limit=100', { headers: { ...getAuthHeaders() } });
      const data = await res.json();
      if (res.ok) setLogs(data.activities || data.rows || []);
      else toast({ title: 'Failed to load logs', description: data.message || 'Error', variant: 'destructive' });
    } catch (err: any) {
      toast({ title: 'Failed to load logs', description: err.message || 'Error', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div>
      <div className="mb-3">
        <Button variant="outline" size="sm" onClick={fetchLogs}>Refresh</Button>
        <Button variant="ghost" size="sm" onClick={() => { try { navigator.clipboard.writeText(JSON.stringify(logs, null, 2)); toast({ title: 'Copied logs' }); } catch (e) { toast({ title: 'Copy failed' }); } }} className="ml-2">Copy JSON</Button>
      </div>

      <div className="space-y-2 max-h-80 overflow-auto">
        {loading && <div>Loading…</div>}
        {!loading && logs.length === 0 && <div className="text-sm text-muted-foreground">No reset logs found.</div>}
        {logs.map((l: any) => (
          <div key={l.id} className="p-2 rounded border">
            <div className="text-sm font-semibold">{l.action_type} — {new Date(l.created_at).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Admin: {l.user_name || l.user_email || 'unknown'} • Driver id: {l.resource_id}</div>
            <div className="mt-1 text-sm">{l.details}</div>
          </div>
        ))}
      </div>

      {onClose && <div className="mt-3"><Button onClick={onClose}>Close</Button></div>}
    </div>
  );
}
