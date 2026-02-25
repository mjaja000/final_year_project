import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import { useToast } from "@/components/ui/use-toast";
import { Shield, LogIn, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEMO_EMAIL = "admin@matatuconnect.test";
const DEMO_PASSWORD = "Admin@Matatu2024!";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionInvalidated, setSessionInvalidated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check if redirected due to session invalidation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('reason') === 'SESSION_INVALIDATED') {
      setSessionInvalidated(true);
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
    }
  }, [location]);

  const quickDemoLogin = async () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setIsLoading(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/demo_login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.user?.role || 'admin');
        localStorage.setItem('adminLoginTime', new Date().toISOString());
        localStorage.setItem('adminEmail', DEMO_EMAIL);
        toast({ title: 'Welcome back!', description: 'Admin portal access granted.' });
        navigate('/admin/dashboard');
      } else {
        toast({ title: 'Demo Login Failed', description: data.message || 'Invalid credentials', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Demo Login Failed', description: err.message || 'Error', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    if (!password) {
      toast({
        title: "Validation Error",
        description: "Please enter your password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const isDemo = email.trim() === DEMO_EMAIL && password === DEMO_PASSWORD;
      const endpoint = isDemo ? '/api/auth/demo_login' : '/api/auth/login';
      const res = await fetch((import.meta.env.VITE_API_URL || '') + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.user?.role || 'admin');
        localStorage.setItem('adminLoginTime', new Date().toISOString());
        localStorage.setItem('adminEmail', email.trim());

        toast({ title: 'Welcome back!', description: 'Admin portal access granted.' });
        navigate('/admin/dashboard');
      } else {
        toast({ title: 'Login Failed', description: data.message || 'Invalid credentials', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Login Failed', description: err.message || 'Error', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Login - MatatuConnect</title>
        <meta
          name="description"
          content="Administrator login portal for MatatuConnect transport management system."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Header />

        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        <main className="container max-w-md py-8 sm:py-12 px-4 relative z-10">
          <div className="text-center mb-6 sm:mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-2xl">
              <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Admin Portal
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              Sign in to access the dashboard
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl">
            {sessionInvalidated && (
              <div className="mb-6 p-4 bg-amber-500/20 border border-amber-500/50 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-100 mb-1">Session Ended</h3>
                  <p className="text-sm text-amber-200">
                    You logged in from another device. Your previous session has been ended for security.
                    <br />
                    <strong>Only one device can be active at a time.</strong>
                  </p>
                </div>
              </div>
            )}
            <form
              onSubmit={handleSubmit}
              className="space-y-4 sm:space-y-5 animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@matatuconnect.test"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="text-sm bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20 focus:border-green-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-gray-300">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="pr-10 text-sm bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20 focus:border-green-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full text-sm bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="animate-pulse-gentle">Signing in...</span>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Demo Credentials Hint */}
          <div
            className="mt-6 sm:mt-8 p-3 sm:p-4 bg-green-500/10 backdrop-blur-sm rounded-xl border border-green-500/20 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <p className="text-xs sm:text-sm font-medium text-green-400 mb-2">
              Demo Credentials:
            </p>
            <div className="space-y-1 text-xs sm:text-sm text-gray-300 mb-3">
              <p>
                Email:{" "}
                <code className="bg-white/10 px-1.5 py-0.5 rounded text-white text-xs">
                  {DEMO_EMAIL}
                </code>
              </p>
              <p>
                Password:{" "}
                <code className="bg-white/10 px-1.5 py-0.5 rounded text-white text-xs">
                  {DEMO_PASSWORD}
                </code>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setEmail(DEMO_EMAIL); setPassword(DEMO_PASSWORD); }}
                className="flex-1 text-xs py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border border-white/10 transition-all"
              >
                Fill Credentials
              </button>
              <button
                type="button"
                onClick={quickDemoLogin}
                disabled={isLoading}
                className="flex-1 text-xs py-2 px-3 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold border border-green-500/50 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : '⚡ Quick Demo Login'}
              </button>
            </div>
          </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminLogin;
