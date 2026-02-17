import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import { Bus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function DriverLogin() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!identifier || !password) return toast({ title: 'Missing fields', description: 'Enter username/email and password', variant: 'destructive' });
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.user.role);
        toast({ title: 'Logged in', description: 'Welcome back' });
        navigate('/driver/dashboard');
      } else {
        toast({ title: 'Login failed', description: data.message || 'Invalid credentials', variant: 'destructive' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err || 'Error');
      toast({ title: 'Login failed', description: message || 'Error', variant: 'destructive' });
    }
  };

  const [hasSaved, setHasSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [savedCreds, setSavedCreds] = useState<{ username?: string; password?: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('lastCreatedDriver');
      if (raw) {
        const creds = JSON.parse(raw);
        setSavedCreds(creds);
        if (creds?.username) setIdentifier(creds.username);
        if (creds?.password) setPassword(creds.password);
        setHasSaved(true);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const useSaved = () => {
    try {
      const raw = localStorage.getItem('lastCreatedDriver');
      if (!raw) return;
      const creds = JSON.parse(raw);
      if (creds.username) setIdentifier(creds.username);
      if (creds.password) setPassword(creds.password);
      setSavedCreds(creds);
      setHasSaved(true);
    } catch (e) {}
  };

  const quickLogin = async () => {
    try {
      const raw = localStorage.getItem('lastCreatedDriver');
      if (!raw) return;
      const creds = JSON.parse(raw);
      if (!creds.username || !creds.password) return;
      setIdentifier(creds.username);
      setPassword(creds.password);
      await handleLogin();
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <Helmet>
        <title>Driver Login - MatatuConnect</title>
      </Helmet>

      <Header />

      <div className="container max-w-md mx-auto py-12">
        <div className="bg-white/90 rounded-2xl p-6 sm:p-8 shadow-2xl border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500 rounded-lg shadow">
              <Bus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Driver Portal</h1>
              <p className="text-sm text-muted-foreground">Sign in using your driver username (DRIVExxxx) or email</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm">Username or Email</Label>
              <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="DRIVE0001 or email@example.com" />
            </div>

            <div>
              <Label className="text-sm">Password</Label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" onClick={() => setShowPassword(s => !s)}>{showPassword ? 'Hide' : 'Show'}</button>
              </div>
            </div>

            {hasSaved && savedCreds && (
              <div className="p-3 bg-slate-50 border rounded-md text-sm flex items-center justify-between">
                <div>
                  <div className="font-mono">{savedCreds.username}</div>
                  <div className="text-xs text-muted-foreground">Password: {'••••••••'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={useSaved}>Use</Button>
                  <Button size="sm" variant="outline" onClick={() => { try { navigator.clipboard.writeText(`Username: ${savedCreds.username}\nPassword: ${savedCreds.password}`); toast({ title: 'Copied credentials to clipboard' }); } catch (e) { toast({ title: 'Copy failed' }); } }}>Copy</Button>
                  <Button size="sm" variant="secondary" onClick={async () => { await quickLogin(); }}>Quick Login</Button>
                </div>
              </div>
            )}

            <div className="flex gap-3 items-center">
              <Button className="flex-1" onClick={handleLogin}>
                Sign in
              </Button>
              <Button variant="outline" onClick={() => { navigate('/admin/login'); }}>Admin</Button>
            </div>

            <div className="text-sm text-muted-foreground mt-2">Tip: the admin dashboard can create driver accounts and provide credentials.</div>
          </div>
        </div>
      </div>
    </div>
  );
}