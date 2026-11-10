'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';
import { useAppContext } from '@/contexts/app-context';
import { useTheme } from 'next-themes';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Settings as SettingsIcon,
  CheckCircle2,
  FileText,
  AlertCircle,
  Calendar,
  CreditCard,
  Volume2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppNotification } from '@/lib/types';
import { playNotificationSound } from '@/lib/notification-sound';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function Header({ className }: { className?: string }) {
  const { toggleSidebar } = useSidebar();
  const {
    currentUser,
    logout,
    residents,
    documentRequests,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useAppContext();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const prevUnreadCountRef = useRef<number | null>(null);

  // Play notification chime whenever a new notification arrives
  useEffect(() => {
    if (
      prevUnreadCountRef.current !== null &&
      unreadNotificationsCount > prevUnreadCountRef.current
    ) {
      playNotificationSound();
    }
    prevUnreadCountRef.current = unreadNotificationsCount;
  }, [unreadNotificationsCount]);

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'RC';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatTimeAgo = (isoString?: string): string => {
    if (!isoString) return 'Just now';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'event':
        return {
          bg: 'bg-[#EAF2FF] text-[#246BDE]',
          icon: <Calendar className="size-4" />,
        };
      case 'document':
        return {
          bg: 'bg-[#E6F7F0] text-[#10A875]',
          icon: <CheckCircle2 className="size-4" />,
        };
      case 'complaint':
        return {
          bg: 'bg-[#FFF7ED] text-[#FFA51E]',
          icon: <AlertCircle className="size-4" />,
        };
      case 'resident':
        return {
          bg: 'bg-[#EAF2FF] text-[#246BDE]',
          icon: <UserIcon className="size-4" />,
        };
      case 'payment':
        return {
          bg: 'bg-[#F3E8FF] text-[#8B5CF6]',
          icon: <CreditCard className="size-4" />,
        };
      default:
        return {
          bg: 'bg-[#F0F4FA] text-[#718096]',
          icon: <Bell className="size-4" />,
        };
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (currentUser && !(notif.readBy || []).includes(currentUser.id)) {
      await markNotificationAsRead(notif.id);
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const displayName = currentUser?.name || 'Ryan Claud';
  const displayRole = currentUser?.role || 'Administrator';
  const displayInitials = getInitials(displayName);

  // Search filtering
  const filteredResidents = (residents || [])
    .filter(
      (r) =>
        r.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.purok?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 4);

  const filteredRequests = (documentRequests || [])
    .filter(
      (req) =>
        req.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.documentType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.residentName?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 4);

  const hasSearchResults =
    searchQuery.trim().length > 0 &&
    (filteredResidents.length > 0 || filteredRequests.length > 0);

  return (
    <div className="sticky top-0 z-30 w-full bg-white border-b border-[#E5EAF2]">
      <header className="flex h-[70px] sm:h-[76px] w-full items-center justify-between px-3 sm:px-6 md:px-8 transition-colors">
        {/* Left side: Toggle button and Global Search */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 mr-2 sm:mr-4">
          {/* Sidebar Toggle Button */}
          <button
            onClick={toggleSidebar}
            aria-label="Toggle Navigation"
            className="flex size-9 sm:size-10 items-center justify-center rounded-xl text-[#172B4D] hover:bg-[#F0F4FA] transition-colors shrink-0"
          >
            <Menu className="size-5 sm:size-6 text-[#172B4D]" />
          </button>

          {/* Global Search Input (Desktop/Tablet) */}
          <div ref={searchContainerRef} className="relative w-full max-w-xs md:max-w-md hidden sm:block">
            <div className="relative flex items-center">
              <Search className="absolute left-4 size-4.5 text-[#718096] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search residents, requests, or records..."
                className="w-full h-10 sm:h-11 pl-11 pr-10 rounded-full bg-[#F0F4FA] border border-[#E2E8F0] text-xs sm:text-sm text-[#172B4D] placeholder-[#718096] transition-all focus:bg-white focus:border-[#246BDE] focus:ring-2 focus:ring-[#246BDE]/20 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 text-[#718096] hover:text-[#172B4D]"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Quick Search Dropdown */}
            {isSearchOpen && hasSearchResults && (
              <div className="absolute top-12 sm:top-13 left-0 right-0 z-50 rounded-2xl border border-[#E5EAF2] bg-white p-3 shadow-xl space-y-3">
                {filteredResidents.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#718096] uppercase px-2 mb-1.5">
                      Residents
                    </p>
                    <div className="space-y-1">
                      {filteredResidents.map((r) => (
                        <Link
                          key={r.id}
                          href={`/residents`}
                          onClick={() => setIsSearchOpen(false)}
                          className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm hover:bg-[#F0F4FA] text-[#172B4D] transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <UserIcon className="size-4 text-[#246BDE]" />
                            <span className="font-medium">
                              {r.firstName} {r.lastName}
                            </span>
                          </div>
                          <span className="text-xs text-[#718096]">{r.purok}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {filteredRequests.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#718096] uppercase px-2 mb-1.5">
                      Document Requests
                    </p>
                    <div className="space-y-1">
                      {filteredRequests.map((req) => (
                        <Link
                          key={req.id}
                          href="/documents"
                          onClick={() => setIsSearchOpen(false)}
                          className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm hover:bg-[#F0F4FA] text-[#172B4D] transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="size-4 text-[#FFA51E]" />
                            <span className="font-medium truncate max-w-[180px]">
                              {req.documentType}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-[#718096]">
                            {req.trackingNumber}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Search Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            aria-label="Search"
            className="sm:hidden flex size-9 items-center justify-center rounded-xl text-[#172B4D] hover:bg-[#F0F4FA] transition-colors shrink-0"
          >
            <Search className="size-4.5 text-[#172B4D]" />
          </button>
        </div>

        {/* Right side: Notifications and User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          {/* Notification Bell with Blinking Indicator & Ripple */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                aria-label="Notifications"
                className={cn(
                  'relative flex size-9 sm:size-10 items-center justify-center rounded-full text-[#172B4D] hover:bg-[#F0F4FA] transition-all',
                  unreadNotificationsCount > 0 && 'bg-[#F0F6FF] text-[#246BDE]'
                )}
              >
                <Bell className="size-5 sm:size-5.5 text-[#172B4D]" />
                {unreadNotificationsCount > 0 && (
                  <>
                    {/* Blinking Beacon Ping (Pulse Wave) */}
                    <span className="absolute -top-0.5 -right-0.5 flex size-4.5 pointer-events-none">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4655] opacity-75" />
                    </span>

                    {/* High-visibility Pulsing Number Badge */}
                    <span className="absolute -top-1 -right-1 flex min-w-4.5 h-4.5 items-center justify-center rounded-full bg-[#EF4655] px-1 text-[9px] font-black text-white ring-2 ring-white shadow-sm animate-pulse">
                      {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                    </span>
                  </>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 sm:w-88 p-0 rounded-2xl shadow-xl border-[#E5EAF2] max-w-[92vw]">
              <div className="p-3.5 border-b border-[#E5EAF2] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-[#172B4D]">Notifications</h3>
                  {unreadNotificationsCount > 0 ? (
                    <Badge variant="secondary" className="bg-[#EAF2FF] text-[#246BDE] text-xs font-semibold">
                      {unreadNotificationsCount} New
                    </Badge>
                  ) : (
                    <span className="text-[11px] text-[#718096]">Caught up</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => playNotificationSound()}
                    title="Test chime sound"
                    className="flex items-center gap-1 text-[11px] text-[#718096] hover:text-[#246BDE] transition-colors px-1.5 py-0.5 rounded-md hover:bg-[#F0F4FA]"
                  >
                    <Volume2 className="size-3.5 text-[#246BDE]" />
                    <span className="hidden sm:inline">Sound</span>
                  </button>
                  {unreadNotificationsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllNotificationsAsRead()}
                      className="text-xs font-semibold text-[#246BDE] hover:underline transition-colors"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
              </div>
              <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
                {!notifications || notifications.length === 0 ? (
                  <div className="p-6 text-center space-y-2">
                    <div className="size-10 rounded-full bg-[#F0F4FA] mx-auto flex items-center justify-center text-[#718096]">
                      <Bell className="size-5" />
                    </div>
                    <p className="text-xs font-bold text-[#172B4D]">No notifications yet</p>
                    <p className="text-[11px] text-[#718096]">
                      You will receive real-time alerts for document requests, blotters, and community events.
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isUnread = !currentUser || !(n.readBy || []).includes(currentUser.id);
                    const iconInfo = getNotificationIcon(n.type);
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={cn(
                          'flex items-start gap-3 p-2.5 rounded-xl transition-colors cursor-pointer text-left',
                          isUnread ? 'bg-[#F4F8FF] hover:bg-[#EAF2FF]' : 'hover:bg-[#F8FAFC]'
                        )}
                      >
                        <div
                          className={cn(
                            'size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                            iconInfo.bg
                          )}
                        >
                          {iconInfo.icon}
                        </div>
                        <div className="space-y-0.5 text-xs flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p
                              className={cn(
                                'truncate text-xs',
                                isUnread
                                  ? 'font-bold text-[#172B4D]'
                                  : 'font-semibold text-[#172B4D]'
                              )}
                            >
                              {n.title}
                            </p>
                            {isUnread && (
                              <span className="size-2 rounded-full bg-[#246BDE] shrink-0" />
                            )}
                          </div>
                          <p className="text-[#718096] line-clamp-2 text-[11px] leading-tight">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-[#A0AEC0] pt-0.5">
                            {formatTimeAgo(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="p-3 border-t border-[#E5EAF2] text-center">
                <Link
                  href="/dashboard"
                  className="text-xs font-semibold text-[#246BDE] hover:underline"
                >
                  View all activities
                </Link>
              </div>
            </PopoverContent>
          </Popover>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 sm:gap-2.5 rounded-full py-1 pl-1 pr-1 sm:pr-2 hover:bg-[#F0F4FA] transition-colors outline-none cursor-pointer">
                {/* Avatar with Initials */}
                <div className="flex size-9 sm:size-10 items-center justify-center rounded-full bg-[#1E6DEB] text-white font-bold text-xs sm:text-sm shadow-xs shrink-0">
                  {displayInitials}
                </div>

                {/* User Name & Role (Hidden on mobile phones to prevent overflow) */}
                <div className="hidden md:flex flex-col text-left max-w-[120px] lg:max-w-[160px]">
                  <span className="text-sm font-semibold text-[#172B4D] leading-tight truncate">
                    {displayName}
                  </span>
                  <span className="text-xs text-[#718096] leading-tight truncate">
                    {displayRole}
                  </span>
                </div>

                {/* Chevron Down */}
                <ChevronDown className="size-3.5 sm:size-4 text-[#718096]" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 rounded-2xl border-[#E5EAF2] p-2 shadow-xl"
            >
            <DropdownMenuLabel className="font-normal px-2 py-1.5">
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-semibold text-[#172B4D] leading-none">
                  {displayName}
                </p>
                <p className="text-xs text-[#718096] leading-none">
                  {currentUser?.email || 'admin@ibarangay.gov.ph'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#E5EAF2]" />

            <DropdownMenuItem asChild>
              <Link
                href="/settings"
                className="flex items-center gap-2.5 px-2.5 py-2 text-sm text-[#172B4D] rounded-lg cursor-pointer"
              >
                <SettingsIcon className="size-4 text-[#718096]" />
                <span>Account Settings</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="px-2.5 py-2">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 text-sm text-[#172B4D]">
                  <Sun className="size-4 text-amber-500" />
                  <span>Light Mode</span>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={() =>
                    setTheme(theme === 'dark' ? 'light' : 'dark')
                  }
                />
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-[#E5EAF2]" />

            <DropdownMenuItem
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="flex items-center gap-2.5 px-2.5 py-2 text-sm text-[#EF4655] hover:bg-[#FEF2F2] rounded-lg cursor-pointer font-medium"
            >
              <LogOut className="size-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>

    {/* Mobile Search Bar Dropdown */}
    {isMobileSearchOpen && (
      <div className="sm:hidden px-3.5 pb-3 pt-1 border-t border-[#E5EAF2] bg-[#F8FAFC]">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 size-4 text-[#718096] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            autoFocus
            placeholder="Search residents, requests, or records..."
            className="w-full h-10 pl-10 pr-9 rounded-xl bg-white border border-[#CBD5E1] text-xs text-[#172B4D] focus:outline-none focus:border-[#246BDE]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-[#718096]"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    )}
  </div>
  );
}
