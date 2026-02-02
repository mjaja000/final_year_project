import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
    } catch (err: any) {
      toast({ title: 'Login failed', description: err.message || 'Error', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Driver Login</h2>
        <div className="space-y-3">
          <Input placeholder="Username or Email (DRIVE0001 or email)" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="flex justify-between items-center">
            <Button onClick={handleLogin} className="bg-blue-600">Login</Button>
          </div>
        </div>
      </div>
    </div>
  );
}