import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Phone, Copy, UserCheck } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Drivers() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE + '/api/drivers/public');
      const data = await res.json();
      if (res.ok) setDrivers(data.drivers || []);
      else toast({ title: 'Failed to load drivers', description: data.message || 'Error' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err || 'Error');
      toast({ title: 'Failed to load drivers', description: message || 'Error', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchDrivers(); }, []);

  const filtered = drivers.filter((d) => {
    const name = String((d as any).name || '').toLowerCase();
    const email = String((d as any).email || '').toLowerCase();
    const phone = String((d as any).phone || '').toLowerCase();
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return name.includes(q) || email.includes(q) || phone.includes(q) || String((d as any).username || '').toLowerCase().includes(q);
  });

  const handleCopy = (text?: string) => {
    if (!text) return; try { navigator.clipboard.writeText(text); toast({ title: 'Copied' }); } catch (e) { toast({ title: 'Copy failed' }); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Drivers - MatatuConnect</title>
      </Helmet>
      <Header />
      <main className="container py-8 px-4">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Drivers</h1>
            <p className="text-sm text-muted-foreground">This list shows registered drivers. Contact admin for access.</p>
          </div>
          <div className="flex items-center gap-2">
            <Input placeholder="Search by name, email or phone" value={query} onChange={(e) => setQuery(e.target.value)} />
            <Button variant="outline" onClick={() => setQuery('')}>Clear</Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="p-4 bg-white rounded-lg shadow-sm border">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.length === 0 && <div className="text-sm text-muted-foreground">No drivers found.</div>}
            {filtered.map((d) => {
              const driver = d as any;
              const initials = (driver.name || 'D').split(' ').map((s: string) => s[0]).slice(0,2).join('').toUpperCase();

              return (
                <div key={driver.id} className="p-4 bg-white rounded-lg shadow-sm border">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-medium text-lg">{driver.name} <span className="text-sm text-muted-foreground">({driver.username})</span></div>
                          <div className="text-sm text-muted-foreground mt-1">{driver.email}</div>
                          <div className="text-sm text-muted-foreground">{driver.phone}</div>
                        </div>
                        <div className="text-sm text-muted-foreground">Vehicle: <span className="font-medium text-foreground">{driver.vehicle_reg || 'Not assigned'}</span></div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        {driver.phone && (
                          <a href={`tel:${driver.phone}`} className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary text-primary-foreground text-sm">
                            <Phone className="size-4" /> Call
                          </a>
                        )}

                        {driver.phone && (
                          <Button variant="outline" size="sm" onClick={() => handleCopy(driver.phone)}>
                            <Copy className="size-4 mr-2" /> Copy
                          </Button>
                        )}

                        <Button variant="ghost" size="sm" onClick={() => handleCopy(driver.email)}>
                          <UserCheck className="size-4 mr-2" /> Contact
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
