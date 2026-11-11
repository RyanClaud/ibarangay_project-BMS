'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  AlertCircle,
  Settings,
  Users,
  CreditCard,
  BarChart3,
  Building2,
  Menu,
} from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { currentUser, unreadNotificationsCount } = useAppContext();
  const { toggleSidebar } = useSidebar();

  if (!currentUser) return null;

  // Primary mobile bottom navigation links per role
  const getMobileLinks = () => {
    if (currentUser.isSuperAdmin) {
      return [
        { href: '/super-admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/barangays', label: 'Barangays', icon: Building2 },
        { href: '/system-users', label: 'Users', icon: Users },
        { href: '/system-analytics', label: 'Analytics', icon: BarChart3 },
        { href: '/system-settings', label: 'Settings', icon: Settings },
      ];
    }

    switch (currentUser.role) {
      case 'Resident':
        return [
          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/documents', label: 'Documents', icon: FileText },
          { href: '/incident-reports', label: 'Complaints', icon: AlertCircle },
          { href: '/settings', label: 'Account', icon: Settings },
        ];
      case 'Secretary':
        return [
          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/residents', label: 'Residents', icon: Users },
          { href: '/documents', label: 'Documents', icon: FileText },
          { href: '/incident-reports', label: 'Blotters', icon: AlertCircle },
        ];
      case 'Admin':
        return [
          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/users', label: 'Staff', icon: Users },
          { href: '/reports', label: 'Reports', icon: BarChart3 },
          { href: '/settings', label: 'Settings', icon: Settings },
        ];
      case 'Treasurer':
        return [
          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/payments', label: 'Payments', icon: CreditCard },
          { href: '/documents', label: 'Clearances', icon: FileText },
          { href: '/reports', label: 'Reports', icon: BarChart3 },
        ];
      case 'Barangay Captain':
        return [
          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/residents', label: 'Residents', icon: Users },
          { href: '/documents', label: 'Clearances', icon: FileText },
          { href: '/reports', label: 'Reports', icon: BarChart3 },
        ];
      default:
        return [
          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/documents', label: 'Documents', icon: FileText },
          { href: '/settings', label: 'Settings', icon: Settings },
        ];
    }
  };

  const links = getMobileLinks();

  const isLinkActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#102D56]/95 text-white border-t border-white/10 shadow-[0_-4px_25px_rgba(0,0,0,0.4)] backdrop-blur-lg px-2 py-2 flex items-center justify-around select-none safe-area-pb"
    >
      {links.map((link) => {
        const Icon = link.icon;
        const active = isLinkActive(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px]',
              active
                ? 'text-white'
                : 'text-white/65 hover:text-white hover:bg-white/5'
            )}
          >
            {/* Active Highlight Glow/Pill */}
            {active && (
              <span className="absolute -top-1.5 w-6 h-0.5 rounded-full bg-[#246BDE] shadow-[0_0_8px_#246BDE]" />
            )}
            <div
              className={cn(
                'flex size-8 items-center justify-center rounded-xl transition-transform',
                active ? 'bg-[#246BDE] text-white scale-105 shadow-sm' : ''
              )}
            >
              <Icon className="size-4.5" />
            </div>
            <span
              className={cn(
                'text-[10px] font-medium leading-tight mt-0.5 tracking-tight',
                active ? 'font-bold text-white' : 'text-white/70'
              )}
            >
              {link.label}
            </span>

            {/* Notification Badge on Dashboard */}
            {link.href === '/dashboard' && unreadNotificationsCount > 0 && (
              <span className="absolute top-0.5 right-2 size-2 rounded-full bg-[#EF4655] ring-2 ring-[#102D56] animate-pulse" />
            )}
          </Link>
        );
      })}

      {/* Menu / Drawer Toggle */}
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="Open Full Menu"
        className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-white/65 hover:text-white hover:bg-white/5 transition-all min-w-[56px]"
      >
        <div className="flex size-8 items-center justify-center rounded-xl bg-white/10 text-white/80">
          <Menu className="size-4.5" />
        </div>
        <span className="text-[10px] font-medium leading-tight mt-0.5 tracking-tight text-white/70">
          More
        </span>
      </button>
    </nav>
  );
}
