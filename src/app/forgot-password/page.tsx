'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Mail, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAppContext();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);

  // Prefill email from query parameter if directed from registration
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const emailParam = new URLSearchParams(window.location.search).get('email');
      if (emailParam) {
        setEmail(emailParam);
      }
      // Check stored reset cooldown
      const storedCooldown = localStorage.getItem('ibarangay_reset_cooldown');
      if (storedCooldown) {
        const remaining = Math.ceil((parseInt(storedCooldown, 10) - Date.now()) / 1000);
        if (remaining > 0) setResetCooldown(remaining);
      }
    }
  }, []);

  // Cooldown countdown
  React.useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = setInterval(() => {
      setResetCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resetCooldown]);

  const handleResetRequest = async (event: React.FormEvent) => {
    event.preventDefault();

    if (resetCooldown > 0) {
      toast({
        title: 'Please Wait',
        description: `Password reset request rate limited. Please wait ${resetCooldown}s before requesting again.`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await sendPasswordReset(email);
      setIsSubmitted(true);
      // Set 60-second cooldown
      const expiry = Date.now() + 60 * 1000;
      localStorage.setItem('ibarangay_reset_cooldown', String(expiry));
      setResetCooldown(60);
    } catch (error: any) {
      let description = 'An unknown error occurred. Please try again.';
      if (error.code === 'auth/invalid-email') {
        description = 'The email address you entered is not valid.';
      } else if (error.code === 'auth/user-not-found') {
        description = 'No account found with this email address.';
      } else if (error.code === 'auth/too-many-requests') {
        description = 'Too many password reset requests. Please try again later.';
        setResetCooldown(300);
      }
      toast({
        title: 'Reset Request Failed',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex flex-col justify-between selection:bg-[#246BDE] selection:text-white">
      {/* Top Header Bar */}
      <header className="bg-[#102D56] text-white border-b border-white/10 py-3.5 px-4 sm:px-6">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <div className="relative flex size-10 items-center justify-center rounded-full bg-white/10 ring-2 ring-yellow-400/50 shrink-0 overflow-hidden shadow-sm">
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
                  Security
                </span>
              </div>
              <p className="text-[11px] text-white/70 leading-tight mt-0.5">
                DICT MIMAROPA • Municipality of Bongabong
              </p>
            </div>
          </Link>

          <Link href="/login" className="text-xs text-white/80 hover:text-white font-medium flex items-center gap-1 transition-colors">
            <ArrowLeft className="size-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5EAF2] shadow-xl overflow-hidden p-6 sm:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="text-center space-y-2">
            <div className="size-16 rounded-full bg-[#EAF2FF] text-[#246BDE] mx-auto flex items-center justify-center mb-2">
              <Mail className="size-8 text-[#246BDE]" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#172B4D]">
              {isSubmitted ? 'Check Your Inbox' : 'Reset Your Password'}
            </h2>
            <p className="text-xs sm:text-sm text-[#718096] leading-relaxed">
              {isSubmitted
                ? `We have dispatched a secure password reset link to ${email}. Check your email inbox or spam folder.`
                : 'Enter your registered email address and we will send you instructions to recover your account.'}
            </p>
          </div>

          {isSubmitted ? (
            <div className="space-y-4">
              <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl p-4 text-center space-y-2">
                <CheckCircle2 className="size-6 text-[#10A875] mx-auto" />
                <p className="text-xs font-semibold text-[#10A875]">
                  Password reset link sent successfully!
                </p>
                <p className="text-[11px] text-[#718096]">
                  Follow the instructions in the email to choose a new password.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <Link href="/login">
                  <Button className="w-full h-11 rounded-xl bg-[#246BDE] hover:bg-[#1E5CC0] text-white font-bold text-sm shadow-md">
                    Return to Sign In
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="w-full text-center text-xs text-[#718096] hover:text-[#172B4D] font-medium py-1"
                >
                  Did not receive an email? Click to retry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetRequest} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-[#172B4D]">
                  Registered Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#718096]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g. resident@gmail.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-11 pl-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || resetCooldown > 0}
                className={`w-full h-11 rounded-xl text-white font-bold text-sm shadow-md transition-all gap-2 ${
                  resetCooldown > 0
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-[#246BDE] hover:bg-[#1E5CC0] hover:shadow-lg hover:scale-[1.01]'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : resetCooldown > 0 ? (
                  <span>Rate Limited (Wait {resetCooldown}s)</span>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-[#246BDE] hover:underline"
                >
                  Remembered your password? Back to Login
                </Link>
              </div>
            </form>
          )}

          <div className="pt-4 border-t border-[#E5EAF2] flex items-center justify-between text-[11px] text-[#718096]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3 text-emerald-600" />
              Secure Identity Verification
            </span>
            <span>RA 10173 Protected</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-[#718096] border-t border-[#E5EAF2] bg-white">
        <p>© 2026 iBarangay System • Developed by Ryan Claud • DICT MIMAROPA Region IV-B</p>
      </footer>
    </div>
  );
}
