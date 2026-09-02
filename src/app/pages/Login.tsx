import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { GraduationCap, Shield, UserCheck, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ThemeToggle } from '../components/ThemeToggle';
import ttuLogo from '../../assets/TTU LOGO.png';

export const Login = (): React.ReactElement => {
  const navigate = useNavigate();
  const { login, user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'student') navigate('/student', { replace: true });
      else if (user.role === 'supervisor') navigate('/supervisor', { replace: true });
      else navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const [showPassword, setShowPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState<UserRole>('student');

  const navigateToDashboard = (role: UserRole) => {
    if (role === 'student') navigate('/student');
    else if (role === 'supervisor') navigate('/supervisor');
    else navigate('/admin');
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const role = await login(loginEmail, loginPassword, loginRole);
      toast.success('Welcome back!');
      navigateToDashboard(role);
    } catch {
      toast.error('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { value: 'student',    label: 'Student',        icon: GraduationCap },
    { value: 'supervisor', label: 'Supervisor',      icon: UserCheck },
    { value: 'admin',      label: 'Administrator',   icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-4xl grid lg:grid-cols-2 bg-card rounded-2xl shadow-xl overflow-hidden border border-border">

        {/* ── Left panel ── */}
        <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden bg-gradient-to-br from-[#1e2130] to-[#2a3158]">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10 bg-[radial-gradient(circle,#4361ee,transparent)]" />
          <div className="absolute bottom-10 -left-10 w-48 h-48 rounded-full opacity-10 bg-[radial-gradient(circle,#10b981,transparent)]" />

          <div className="relative z-10">
            <img src={ttuLogo} alt="TTU Logo" className="h-16 w-auto max-w-[220px] object-contain" />
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white leading-tight mb-3">
              Manage your<br />attachment journey
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Submit reports, receive grades, and track your industrial attachment progress — all in one place.
            </p>

            <div className="mt-8 space-y-4">
              {[
                { icon: '📄', text: 'Submit weekly reports with file uploads' },
                { icon: '📊', text: 'Real-time grading and supervisor feedback' },
                { icon: '🔔', text: 'Instant notifications via email & live updates' },
                { icon: '🔒', text: 'Fast, secure role-based access for students and staff' },
              ].map(f => (
                <div key={f.text} className="flex items-center gap-3">
                  <span className="text-base">{f.icon}</span>
                  <span className="text-white/70 text-sm">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-white/25 text-xs">
            © 2026 Takoradi Technical University
          </p>
        </div>

        {/* ── Right panel ── */}
        <div className="flex flex-col justify-center p-8 sm:p-10">
          <div className="flex lg:hidden mb-6">
            <img src={ttuLogo} alt="TTU Logo" className="h-14 w-auto max-w-[190px] object-contain" />
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              Sign in to your account
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Takoradi Technical University — Industrial Attachment Portal
            </p>
          </div>

          {/* LOGIN FORM */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-role">I am a</Label>
              <Select value={loginRole} onValueChange={v => setLoginRole(v as UserRole)}>
                <SelectTrigger id="login-role" className="h-11 bg-input-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      <div className="flex items-center gap-2">
                        <r.icon className="w-4 h-4 text-primary" />
                        {r.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-email">
                {loginRole === 'student' ? 'Student Index Number' : 'Staff ID'}
              </Label>
              <Input
                id="login-email"
                type="text"
                placeholder={loginRole === 'student' ? 'Index Number (e.g. 0420000001)' : 'Staff ID (e.g. STF-001)'}
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                required
                className="h-11 bg-input-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                  className="h-11 bg-input-background pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {(loginRole === 'admin' || loginRole === 'supervisor') && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-700 font-medium">
                  You'll receive an SMS verification code on your registered phone number.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full h-11 rounded-lg mt-2 disabled:opacity-60"
            >
              {isLoading ? 'Signing in…' : (
                <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

