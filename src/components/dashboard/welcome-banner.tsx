'use client';

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';

export function WelcomeBanner() {
  const { currentUser } = useAppContext();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('October 31, 2026 • 10:24 AM');

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];
      const month = monthNames[now.getMonth()];
      const day = now.getDate();
      const year = now.getFullYear();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 becomes 12
      setCurrentTime(`${month} ${day}, ${year} • ${hours}:${minutes} ${ampm}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = currentUser?.name || 'Ryan Claud';
  const greeting = mounted ? getGreeting() : 'Good morning';

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#0C2340] via-[#123E75] to-[#1D5496] shadow-sm min-h-[140px] flex items-center">
      {/* Right side Barangay Hall background photo with gradient mask */}
      <div className="absolute right-0 top-0 bottom-0 w-full sm:w-2/3 md:w-3/5 lg:w-1/2 pointer-events-none select-none overflow-hidden">
        <img
          src="/images/barangay-hall.png"
          alt="Barangay Hall"
          className="w-full h-full object-cover object-right"
        />
        {/* Navy gradient overlay on left of image for smooth transition */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C2340] via-[#123E75]/80 sm:via-[#123E75]/60 to-transparent" />
      </div>

      {/* Banner Content */}
      <div className="relative z-10 flex w-full flex-col md:flex-row md:items-center justify-between p-5 md:p-7 gap-4">
        {/* Left: Barangay Seal & Welcome Text */}
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Barangay Seal */}
          <div className="relative flex size-16 sm:size-18 md:size-20 items-center justify-center rounded-full overflow-hidden bg-white/10 ring-2 ring-yellow-400/50 shadow-md shrink-0">
            <img
              src="/images/barangay-seal.png"
              alt="Barangay Mina de Oro Seal"
              className="size-16 sm:size-18 md:size-20 object-contain"
            />
          </div>

          {/* Welcome Message */}
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl md:text-[26px] font-bold text-white tracking-tight leading-tight">
              {greeting}, {displayName}!
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 font-normal">
              Here&apos;s what&apos;s happening in your barangay today.
            </p>
            <div className="flex items-center gap-1.5 pt-0.5 text-xs text-blue-200/80">
              <Calendar className="size-3.5 text-blue-200" />
              <span>{currentTime}</span>
            </div>
          </div>
        </div>

        {/* Right: Slogan (only displayed when width permits or fallback) */}
        <div className="hidden xl:flex flex-col items-end pr-4 text-right select-none">
          <span className="font-serif italic text-lg lg:text-xl text-white font-normal drop-shadow-md">
            Serving Our Community
          </span>
          <div className="relative inline-block">
            <span className="font-serif italic text-xl lg:text-2xl font-bold text-white drop-shadow-md">
              Together
            </span>
            <svg
              className="absolute -bottom-1.5 left-0 w-full overflow-visible"
              height="8"
              viewBox="0 0 100 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 5.5C30 2 70 2 99 6"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

