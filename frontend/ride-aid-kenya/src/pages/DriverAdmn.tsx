import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';

const DEMO_ADMIN_EMAIL = 'admin@matatuconnect.test';
const DEMO_ADMIN_PASSWORD = 'password123';
const API_BASE = import.meta.env.VITE_API_URL || '';

export default function DriverAdmn() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Admin form
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  // Driver form
  const [identifier, setIdentifier] = useState('');
  const [driverPassword, setDriverPassword] = useState('');
  const [driverLoading, setDriverLoading] = useState(false);

  useEffect(() => {
    // Prefill with demo admin details so testers can sign in quickly
    setAdminEmail(DEMO_ADMIN_EMAIL);
  }, []);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword) return toast({ title: 'Missing fields', description: 'Please enter admin email and password', variant: 'destructive' });
    setAdminLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    // Forward to admin login page (use demo login there) 
    navigate('/admin/login');
    setAdminLoading(false);
  };

  const handleDriverLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier.trim() || !driverPassword) return toast({ title: 'Missing fields', description: 'Please enter username/email and password', variant: 'destructive' });
    setDriverLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password: driverPassword })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.user.role);
        toast({ title: 'Driver logged in', description: 'Welcome back' });
        navigate('/driver/dashboard');
      } else {
        toast({ title: 'Driver login failed', description: data.message || 'Invalid credentials', variant: 'destructive' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err || 'Error');
      toast({ title: 'Driver login failed', description: message || 'Error', variant: 'destructive' });
    } finally {
      setDriverLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Sign in - MatatuConnect</title>
      </Helmet>

      <Header />

      <main className="container py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Admin Login Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-3">Admin Login</h2>
            <p className="text-sm text-muted-foreground mb-4">Sign in with admin credentials to access the admin dashboard.</p>
            <form onSubmit={handleAdminSubmit} className="space-y-3">
              <div>
                <Label htmlFor="adminEmail" className="text-sm">Email</Label>
                <Input id="adminEmail" placeholder="admin@matatuconnect.test" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
              </div>

              <div>
                <Label htmlFor="adminPassword" className="text-sm">Password</Label>
                <Input id="adminPassword" type="password" placeholder="Enter admin password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
              </div>

              <Button type="submit" className="w-full" disabled={adminLoading}>{adminLoading ? 'Signing in...' : 'Sign in as Admin'}</Button>
            </form>

            <div className="mt-4 text-sm text-muted-foreground">
              The Driver login is available separately: <a href="/driver/login" className="underline">Go to Driver Login</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
