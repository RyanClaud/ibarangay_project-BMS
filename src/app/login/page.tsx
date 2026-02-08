'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth as useAppAuth } from '@/hooks/use-auth';
import { useAppContext } from '@/contexts/app-context';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAppContext();
  const { user: authenticatedUser, isLoading: isAuthLoading } = useAppAuth();
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessingLogin, setIsProcessingLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Email/password authentication only - Google auth removed

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsProcessingLogin(true);

    try {
      await login(credential, password);
    } catch (error: any) {
      let description = 'An unknown error occurred.';
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          description = 'Invalid credentials. Please try again.';
          break;
        case 'auth/invalid-email':
          description = 'The email address is not valid.';
          break;
        default:
          description = error.message || 'Please check your credentials and try again.';
          break;
      }
      toast({
          title: 'Login Failed',
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
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  if (authenticatedUser) {
     return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-700 to-orange-600"></div>
      
      {/* Animated Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          
          {/* Logo Section with DICT MIMAROPA Branding */}
          <Link href="/" className="flex flex-col items-center space-y-6 group cursor-pointer">
            {/* Logo Container with Hover Effect */}
            <div 
              className="relative"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className={`absolute inset-0 bg-gradient-to-r from-orange-500 to-blue-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 ${isHovered ? 'animate-pulse' : ''}`}></div>
              <div className="relative bg-white/95 backdrop-blur-xl p-6 rounded-full border-4 border-white/50 shadow-2xl transform group-hover:scale-110 transition-transform duration-500">
                <Image 
                  src="/icon.png" 
                  alt="iBarangay Logo" 
                  width={100} 
                  height={100} 
                  className="object-contain drop-shadow-lg"
                />
              </div>
            </div>

            {/* Title Section */}
            <div className="text-center space-y-3">
              <h1 className="text-4xl md:text-5xl font-bold font-headline text-white drop-shadow-2xl animate-in fade-in slide-in-from-top-2 duration-700 group-hover:scale-105 transition-transform">
                iBarangay
              </h1>
              <div className="flex items-center justify-center gap-2 text-sm text-white/90 animate-in fade-in slide-in-from-top-3 duration-900">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/50"></div>
                <span className="font-medium">DICT MIMAROPA</span>
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/50"></div>
              </div>
              <p className="text-white/80 text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-1000">
                Oriental Mindoro Digital Governance
              </p>
            </div>
          </Link>

          {/* Login Card */}
          <Card className="bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
            
            <CardHeader className="relative space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold text-white text-center">Welcome Back</CardTitle>
              <CardDescription className="text-white/70 text-center">
                Sign in to access your dashboard
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleLogin}>
              <CardContent className="relative space-y-5 pt-2">
                {/* Email Input */}
                <div className="space-y-2 group">
                  <Label htmlFor="credential" className="text-white/90 font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 group-focus-within:text-orange-400 transition-colors" />
                    <Input 
                      id="credential" 
                      type="email"
                      placeholder="admin@ibarangay.com" 
                      required 
                      value={credential}
                      onChange={(e) => setCredential(e.target.value)}
                      disabled={isLoading}
                      className="pl-11 bg-white/10 border-white/30 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-orange-400/50 transition-all duration-300 h-12"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2 group">
                  <Label htmlFor="password" className="text-white/90 font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 group-focus-within:text-orange-400 transition-colors" />
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password" 
                      required 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="pl-11 pr-11 bg-white/10 border-white/30 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-orange-400/50 transition-all duration-300 h-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="text-right">
                    <Link 
                      href="/forgot-password" 
                      className="text-sm text-orange-300 hover:text-orange-200 hover:underline transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="relative flex flex-col gap-4 pt-2">
                {/* Login Button */}
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                {/* Register Link */}
                <div className="flex flex-col gap-2 text-sm text-center text-white/70 pt-2">
                  <p>
                    Resident?{' '}
                    <Link 
                      href="/register" 
                      className="font-semibold text-orange-300 hover:text-orange-200 hover:underline transition-colors"
                    >
                      Register Here
                    </Link>
                  </p>
                  <p className="text-xs">
                    For staff accounts, contact your barangay administrator
                  </p>
                </div>
              </CardFooter>
            </form>
          </Card>

          {/* Footer Branding */}
          <div className="text-center space-y-2 animate-in fade-in duration-1000 delay-300">
            <p className="text-white/60 text-xs">
              Developed by RYAN LANUEVO CLAUD
            </p>
            <p className="text-white/40 text-xs">
              © 2024 iBarangay. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
