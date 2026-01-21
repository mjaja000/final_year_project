import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import { useToast } from "@/components/ui/use-toast";
import { Shield, LogIn, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEMO_EMAIL = "admin@matatuconnect.test";
const DEMO_PASSWORD = "password123";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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

    // Simulate authentication delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      localStorage.setItem("adminAuth", "true");
      localStorage.setItem("adminEmail", email);
      localStorage.setItem("adminLoginTime", new Date().toISOString());
      toast({
        title: "Welcome back!",
        description: "Admin portal access granted.",
      });
      navigate("/admin/dashboard");
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid email or password. Check the demo credentials below.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
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

      <div className="min-h-screen bg-background">
        <Header />

        <main className="container max-w-md py-12 px-4">
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Admin Portal
            </h1>
            <p className="text-muted-foreground">
              Sign in to access the dashboard
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@matatuconnect.test"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
              variant="hero"
              className="w-full"
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
            className="mt-8 p-4 bg-secondary/50 rounded-lg animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <p className="text-sm font-medium text-secondary-foreground mb-2">
              Demo Credentials:
            </p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                Email:{" "}
                <code className="bg-background px-1.5 py-0.5 rounded text-foreground">
                  {DEMO_EMAIL}
                </code>
              </p>
              <p>
                Password:{" "}
                <code className="bg-background px-1.5 py-0.5 rounded text-foreground">
                  {DEMO_PASSWORD}
                </code>
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminLogin;
