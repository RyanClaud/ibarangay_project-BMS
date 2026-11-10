'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAppContext();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Prefill email from query parameter if directed from registration
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const emailParam = new URLSearchParams(window.location.search).get('email');
      if (emailParam) {
        setEmail(emailParam);
      }
    }
  }, []);

  const handleResetRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      await sendPasswordReset(email);
      setIsSubmitted(true); // Show success message
    } catch (error: any) {
      let description = 'An unknown error occurred. Please try again.';
      if (error.code === 'auth/invalid-email') {
        description = 'The email address you entered is not valid.';
      }
      toast({
          title: 'Request Failed',
          description: description,
          variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-700 to-orange-600"></div>
      
      {/* Animated Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative bg-white/95 backdrop-blur-xl p-6 rounded-full border-4 border-white/50 shadow-2xl">
              <Image 
                src="/icon.png" 
                alt="iBarangay Logo" 
                width={80} 
                height={80} 
                className="object-contain drop-shadow-lg"
              />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold font-headline text-white drop-shadow-2xl">
                Password Recovery
              </h1>
              <p className="text-white/80 text-sm">
                DICT MIMAROPA - Oriental Mindoro
              </p>
            </div>
          </div>

          {/* Reset Card */}
          <Card className="bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
            
            <CardHeader className="relative space-y-1">
              <CardTitle className="text-2xl font-bold text-white">
                {isSubmitted ? 'Check Your Email' : 'Reset Password'}
              </CardTitle>
              <CardDescription className="text-white/70">
                {isSubmitted 
                  ? "We've sent you instructions to reset your password." 
                  : "Enter your email address and we'll send you a reset link."
                }
              </CardDescription>
            </CardHeader>

            {isSubmitted ? (
              <CardContent className="relative space-y-4">
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"></div>
                    <div className="relative bg-green-500/20 p-4 rounded-full">
                      <CheckCircle className="h-16 w-16 text-green-400" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="font-medium text-white">Email Sent Successfully!</p>
                    <p className="text-sm text-white/70">
                      If an account exists with <span className="font-semibold text-orange-300">{email}</span>, you'll receive password reset instructions shortly.
                    </p>
                  </div>
                </div>
              </CardContent>
            ) : (
              <form onSubmit={handleResetRequest}>
                <CardContent className="relative space-y-5 pt-2">
                  <div className="space-y-2 group">
                    <Label htmlFor="email" className="text-white/90 font-medium">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 group-focus-within:text-orange-400 transition-colors" />
                      <Input 
                        id="email" 
                        type="email"
                        placeholder="admin@ibarangay.com" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className="pl-11 bg-white/10 border-white/30 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-orange-400/50 transition-all duration-300 h-12"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="relative flex-col gap-4 pt-2">
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending Reset Link...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-5 w-5" />
                        Send Reset Link
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            )}

            <CardFooter className="relative">
              <Button 
                variant="ghost" 
                className="w-full text-white/80 hover:text-white hover:bg-white/10 transition-colors" 
                asChild
              >
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" /> 
                  Back to Login
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Footer */}
          <div className="text-center space-y-2">
            <p className="text-white/60 text-xs">
              Powered by DICT MIMAROPA Region IV-B
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
