'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Shield,
} from 'lucide-react';
import { useAuth as useAppAuth } from '@/hooks/use-auth';
import { useAppContext } from '@/contexts/app-context';
import {
  checkRateLimit,
  recordFailedAttempt,
  recordSuccessfulLogin,
  RateLimitStatus,
  formatDuration,
  RATE_LIMIT_CONFIG,
} from '@/lib/auth-rate-limiter';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAppContext();
  const { user: authenticatedUser, isLoading: isAuthLoading } = useAppAuth();
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessingLogin, setIsProcessingLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Rate Limiting & Brute-Force State
  const [rateStatus, setRateStatus] = useState<RateLimitStatus>({
    allowed: true,
    isLocked: false,
    remainingAttempts: RATE_LIMIT_CONFIG.MAX_ACCOUNT_ATTEMPTS,
    lockoutSecondsRemaining: 0,
    totalAttempts: 0,
  });

  // Prefill email from query parameter if directed from registration or password reset
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const emailParam = new URLSearchParams(window.location.search).get('email');
      if (emailParam) {
        setCredential(emailParam);
      }
    }
  }, []);

  // Check rate limit on mount and whenever credential changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const status = checkRateLimit(credential);
      setRateStatus(status);
    }
  }, [credential]);

  // Live second-by-second countdown timer when in security lockout
  useEffect(() => {
    if (!rateStatus.isLocked || rateStatus.lockoutSecondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setRateStatus((prev) => {
        const nextSeconds = prev.lockoutSecondsRemaining - 1;
        if (nextSeconds <= 0) {
          // Cooldown finished, recheck fresh state
          return checkRateLimit(credential);
        }
        return {
          ...prev,
          lockoutSecondsRemaining: nextSeconds,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rateStatus.isLocked, rateStatus.lockoutSecondsRemaining, credential]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    // 1. Pre-flight rate limit check
    const currentStatus = checkRateLimit(credential);
    if (currentStatus.isLocked) {
      setRateStatus(currentStatus);
      toast({
        title: 'Security Cooldown Active',
        description: `Too many failed login attempts. Please wait ${formatDuration(currentStatus.lockoutSecondsRemaining)} before trying again.`,
        variant: 'destructive',
      });
      return;
    }

    setIsProcessingLogin(true);

    try {
      await login(credential, password);
      // Success resets rate limiter
      recordSuccessfulLogin(credential);
    } catch (error: any) {
      // Re-evaluate rate limit state after failed attempt
      const updatedStatus = checkRateLimit(credential);
      setRateStatus(updatedStatus);

      let description = 'An unknown error occurred.';
      if (error.code === 'auth/too-many-requests' || updatedStatus.isLocked) {
        description =
          updatedStatus.message ||
          `Account temporarily locked due to repeated incorrect password attempts. Please wait ${formatDuration(updatedStatus.lockoutSecondsRemaining || 60)}.`;
      } else {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            description =
              updatedStatus.remainingAttempts <= 2
                ? `Invalid credentials. Warning: Only ${updatedStatus.remainingAttempts} attempt${updatedStatus.remainingAttempts === 1 ? '' : 's'} remaining before security lockout.`
                : 'Invalid email or password. Please verify your credentials and try again.';
            break;
          case 'auth/invalid-email':
            description = 'The email address provided is not valid.';
            break;
          default:
            description = error.message || 'Please check your credentials and try again.';
            break;
        }
      }

      toast({
        title: updatedStatus.isLocked ? 'Security Lockout Engaged' : 'Authentication Failed',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsProcessingLogin(false);
    }
  };

  const isLoading = isAuthLoading || isProcessingLogin;

  if (isAuthLoading && !isProcessingLogin) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F4F7FC]">
        <Loader2 className="h-10 w-10 animate-spin text-[#246BDE]" />
      </div>
    );
  }

  if (authenticatedUser) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F4F7FC]">
        <Loader2 className="h-10 w-10 animate-spin text-[#246BDE]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex flex-col justify-between selection:bg-[#246BDE] selection:text-white">
      {/* Top Header Bar */}
      <header className="bg-[#102D56] text-white border-b border-white/10 py-3.5 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <div className="relative flex size-10 items-center justify-center rounded-full bg-white/10 ring-2 ring-yellow-400/50 shrink-0 overflow-hidden">
              <img
                src="/images/barangay-seal.png"
                alt="iBarangay Official Seal"
                className="size-10 object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white leading-none">
                  iBarangay
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#246BDE] text-white uppercase tracking-wider">
                  Portal
                </span>
              </div>
              <p className="text-[11px] text-white/70 leading-tight mt-0.5">
                DICT MIMAROPA • Municipality of Bongabong
              </p>
            </div>
          </Link>

          <Link href="/" className="text-xs text-white/80 hover:text-white font-medium flex items-center gap-1 transition-colors">
            <span>Back to Home</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Login Workspace */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl bg-white rounded-3xl border border-[#E5EAF2] shadow-xl overflow-hidden grid lg:grid-cols-12">
          
          {/* Left Hero Sidebar (Deep Navy matching dashboard) */}
          <div className="lg:col-span-5 bg-[#102D56] text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Ambient Watermark Circles */}
            <div className="absolute -right-16 -top-16 size-60 rounded-full border-[28px] border-white/10 pointer-events-none" />
            <div className="absolute -right-20 -bottom-20 size-72 rounded-full border-[36px] border-white/10 pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-white/90">
                <ShieldCheck className="size-3.5 text-emerald-400" />
                <span>Single Sign-On (SSO)</span>
              </div>

              {/* Title & Tagline */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  Welcome to iBarangay
                </h2>
                <p className="text-xs sm:text-sm text-white/75 mt-2 leading-relaxed">
                  Your unified gateway to community records, clearance processing, incident mediation, and municipal public safety.
                </p>
              </div>

              {/* Feature Points */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-2.5 text-xs text-white/90">
                  <CheckCircle2 className="size-4 text-[#246BDE] shrink-0 mt-0.5" />
                  <span>Instant status tracking for all clearance applications</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-white/90">
                  <CheckCircle2 className="size-4 text-[#10A875] shrink-0 mt-0.5" />
                  <span>Secured under RA 10173 Philippine Data Privacy Act</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-white/90">
                  <Shield className="size-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>Active brute-force rate limiting &amp; anti-hacking firewall</span>
                </div>
              </div>
            </div>

            {/* Bottom Graphic & Tagline */}
            <div className="relative z-10 pt-8 mt-6 border-t border-white/10 text-center space-y-2">
              <div className="mx-auto w-full max-w-[200px] h-14 overflow-hidden rounded-md opacity-85">
                <img
                  src="/images/sidebar-building.png"
                  alt="Community Center"
                  className="w-full h-full object-cover object-center filter brightness-95"
                />
              </div>
              <p className="text-xs font-bold text-white tracking-tight">
                Barangay Mina de Oro
              </p>
              <p className="text-[11px] text-white/60">
                A Smarter, Stronger Community
              </p>
            </div>
          </div>

          {/* Right Form Card (Clean White matching dashboard forms) */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white">
            <div className="space-y-5">
              {/* Form Header */}
              <div className="space-y-1.5">
                <h3 className="text-2xl font-bold tracking-tight text-[#172B4D]">
                  Sign In to Your Account
                </h3>
                <p className="text-xs sm:text-sm text-[#718096]">
                  Enter your registered credentials to access the resident or staff console.
                </p>
              </div>

              {/* ACTIVE RATE-LIMIT LOCKOUT BANNER */}
              {rateStatus.isLocked && (
                <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-red-900 space-y-2 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-red-700">
                      <ShieldAlert className="size-4 text-red-600 animate-pulse" />
                      <span>Security Lockout Active</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-200">
                      {formatDuration(rateStatus.lockoutSecondsRemaining)}
                    </span>
                  </div>
                  <p className="text-xs text-red-700 leading-relaxed">
                    Multiple failed login attempts detected. To protect against unauthorized credential attacks, signing in is temporarily restricted for this account.
                  </p>
                  {/* Live Progress Bar */}
                  <div className="w-full bg-red-200/80 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-red-600 h-full transition-all duration-1000 ease-linear rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(5, (rateStatus.lockoutSecondsRemaining / 60) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* WARNING BANNER FOR REMAINING ATTEMPTS */}
              {!rateStatus.isLocked && rateStatus.remainingAttempts <= 2 && rateStatus.totalAttempts > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 text-[11px] leading-relaxed text-amber-800">
                    <strong>Security Warning:</strong> Only <strong>{rateStatus.remainingAttempts}</strong> attempt{rateStatus.remainingAttempts === 1 ? '' : 's'} remaining before your account is temporarily locked for protection.
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="credential" className="text-xs font-bold text-[#172B4D]">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#718096]" />
                    <Input
                      id="credential"
                      type="email"
                      placeholder="e.g. resident@ibarangay.com"
                      required
                      value={credential}
                      onChange={(e) => setCredential(e.target.value)}
                      disabled={isLoading || rateStatus.isLocked}
                      className="h-11 pl-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] placeholder:text-[#A0AEC0] focus:bg-white focus:border-[#246BDE] transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-bold text-[#172B4D]">
                      Password
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold text-[#246BDE] hover:text-[#1E5CC0] hover:underline transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#718096]" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your account password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading || rateStatus.isLocked}
                      className="h-11 pl-10 pr-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] placeholder:text-[#A0AEC0] focus:bg-white focus:border-[#246BDE] transition-all disabled:opacity-60"
                    />
                    <button
                      type="button"
                      disabled={rateStatus.isLocked}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#172B4D] transition-colors cursor-pointer disabled:opacity-40"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button with Rate-Limit Lockout Indicator */}
                <Button
                  type="submit"
                  disabled={isLoading || rateStatus.isLocked}
                  className={`w-full h-11 rounded-xl text-white font-bold text-sm shadow-md transition-all gap-2 mt-2 ${
                    rateStatus.isLocked
                      ? 'bg-slate-400 hover:bg-slate-400 cursor-not-allowed opacity-80'
                      : 'bg-[#246BDE] hover:bg-[#1E5CC0] hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : rateStatus.isLocked ? (
                    <>
                      <Lock className="size-4 text-white/80" />
                      <span>Locked ({formatDuration(rateStatus.lockoutSecondsRemaining)} remaining)</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Registration Link & Guidance */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5EAF2] space-y-2 text-center text-xs">
                <p className="text-[#172B4D] font-medium">
                  Don&apos;t have an account yet?{' '}
                  <Link
                    href="/register"
                    className="font-bold text-[#246BDE] hover:text-[#1E5CC0] hover:underline ml-1"
                  >
                    Register as Resident
                  </Link>
                </p>
                <p className="text-[11px] text-[#718096]">
                  For barangay staff or official role accounts, contact your Barangay Administrator.
                </p>
              </div>
            </div>

            {/* Security Notice with Active Rate-Limiting indicator */}
            <div className="pt-6 mt-6 border-t border-[#E5EAF2] flex items-center justify-between text-[11px] text-[#718096]">
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <ShieldCheck className="size-3.5 text-emerald-600" />
                <span>Anti-Brute Force Protection Active</span>
              </span>
              <span>RA 10173 Protected</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Attribution */}
      <footer className="py-4 text-center text-xs text-[#718096] border-t border-[#E5EAF2] bg-white">
        <p>© 2026 iBarangay System • Developed by Ryan Claud • DICT MIMAROPA Region IV-B</p>
      </footer>
    </div>
  );
}
