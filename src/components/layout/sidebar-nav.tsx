'use client';

import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  UserCog,
  BarChart2,
  FileText,
  AlertCircle,
  CreditCard,
  BarChart3,
  Sparkles,
  Settings,
  LogOut,
  Building2,
  ClipboardList,
  Loader2,
  X,
} from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useNotificationCount } from '@/hooks/use-notification-count';
import { cn } from '@/lib/utils';
import type { Role } from '@/lib/types';

// Role-specific navigation configurations
const navItemsByRole: Record<string, { href: string; icon: any; label: string }[]> = {
  // Admin: manages staff, reports, analytics, settings (does NOT file or handle day-to-day clerk requests)
  Admin: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/users', icon: UserCog, label: 'Staff & Users' },
    { href: '/reports', icon: BarChart3, label: 'System Reports' },
    { href: '/insights', icon: Sparkles, label: 'AI Analytics' },
    { href: '/settings', icon: Settings, label: 'System Settings' },
  ],
  // Secretary: handles day-to-day desk operations (residents, documents, complaints/blotter, profiling)
  Secretary: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/residents', icon: Users, label: 'Residents' },
    { href: '/profiling', icon: ClipboardList, label: 'Barangay Profiling' },
    { href: '/documents', icon: FileText, label: 'Certificates & Clearances' },
    { href: '/incident-reports', icon: AlertCircle, label: 'Complaints & Incidents' },
    { href: '/reports', icon: BarChart3, label: 'Reports' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ],
  // Barangay Captain: executive authority
  'Barangay Captain': [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/residents', icon: Users, label: 'Residents' },
    { href: '/documents', icon: FileText, label: 'Certificates & Clearances' },
    { href: '/incident-reports', icon: AlertCircle, label: 'Complaints & Incidents' },
    { href: '/reports', icon: BarChart3, label: 'Executive Reports' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ],
  // Treasurer: financial tracking & payments
  Treasurer: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/payments', icon: CreditCard, label: 'Payments' },
    { href: '/documents', icon: FileText, label: 'Certificates & Clearances' },
    { href: '/reports', icon: BarChart3, label: 'Financial Reports' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ],
  // Resident: requests, filing complaints, receipts
  Resident: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/documents', icon: FileText, label: 'My Documents' },
    { href: '/incident-reports', icon: AlertCircle, label: 'File a Complaint' },
    { href: '/settings', icon: Settings, label: 'My Account' },
  ],
  // BHW: profiling and health demographic surveys
  BHW: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/profiling', icon: ClipboardList, label: 'Barangay Profiling' },
    { href: '/residents', icon: Users, label: 'Residents' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ],
  // Encoder: data profiling
  Encoder: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/profiling', icon: ClipboardList, label: 'Barangay Profiling' },
    { href: '/residents', icon: Users, label: 'Residents' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ],
  // SuperAdmin: multi-barangay platform control
  SuperAdmin: [
    { href: '/super-admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/barangays', icon: Building2, label: 'Barangays' },
    { href: '/system-users', icon: Users, label: 'System Users' },
    { href: '/system-analytics', icon: BarChart2, label: 'Analytics' },
    { href: '/system-reports', icon: BarChart3, label: 'Reports' },
    { href: '/system-settings', icon: Settings, label: 'System Settings' },
  ],
};

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, barangayConfig, documentRequests } = useAppContext();
  const { setOpenMobile, isMobile } = useSidebar();
  const [isClient, setIsClient] = useState(false);

  const notificationCount = useNotificationCount(
    currentUser?.role === 'Resident' ? documentRequests : null
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = () => {
    if (isMobile) setOpenMobile(false);
    logout();
    router.push('/login');
  };

  const getNavItems = () => {
    if (!currentUser) return navItemsByRole.Secretary;
    if (currentUser.isSuperAdmin) return navItemsByRole.SuperAdmin;
    return navItemsByRole[currentUser.role] || navItemsByRole.Secretary;
  };

  const items = getNavItems();
  const barangayName = barangayConfig?.name || 'Mina de Oro';

  const isItemActive = (href: string) => {
    if (href === '/dashboard' || href === '/super-admin') {
      return pathname === href || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <div
      className="flex h-full min-h-[100dvh] w-full flex-col justify-between bg-[#102D56] text-white"
      style={{ height: '100%', minHeight: '100dvh' }}
    >
      {/* Sidebar Header */}
      <SidebarHeader className="border-b border-white/10 px-5 py-4 flex flex-row items-center justify-between">
        <Link
          href="/dashboard"
          onClick={() => {
            if (isMobile) setOpenMobile(false);
          }}
          className="flex items-center gap-3 transition-opacity hover:opacity-90 min-w-0"
        >
          <div className="relative flex size-11 items-center justify-center rounded-full overflow-hidden bg-white/10 ring-2 ring-yellow-400/40 shrink-0">
            <img
              src="/images/barangay-seal.png"
              alt="Barangay Seal"
              className="size-11 object-contain"
            />
          </div>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <h2 className="text-lg font-bold tracking-tight text-white leading-tight truncate">
              iBarangay
            </h2>
            <p className="text-xs text-white/70 font-normal leading-tight truncate">
              {barangayName}
            </p>
          </div>
        </Link>

        {/* Mobile Close Button */}
        {isMobile && (
          <button
            type="button"
            onClick={() => setOpenMobile(false)}
            aria-label="Close Navigation"
            className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors shrink-0 ml-2"
          >
            <X className="size-5" />
          </button>
        )}
      </SidebarHeader>

      {/* Navigation Menu */}
      <SidebarContent className="flex-1 px-3 py-3 overflow-y-auto">
        <SidebarMenu className="space-y-1">
          {!isClient || !currentUser ? (
            <div className="flex justify-center p-6">
              <Loader2 className="animate-spin text-white/70" />
            </div>
          ) : (
            items.map((item) => {
              const active = isItemActive(item.href);
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    className={cn(
                      'group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 outline-none',
                      active
                        ? 'bg-[#246BDE] text-white shadow-sm font-semibold hover:bg-[#246BDE]'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    )}
                    tooltip={{
                      children: item.label,
                      className: 'bg-[#102D56] text-white border border-white/10',
                    }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                      }}
                      className="flex items-center justify-between w-full"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={cn(
                            'size-5 shrink-0 transition-transform group-hover:scale-105',
                            active ? 'text-white' : 'text-white/80 group-hover:text-white'
                          )}
                        />
                        <span className="truncate group-data-[collapsible=icon]:hidden">
                          {item.label}
                        </span>
                      </div>
                      {/* Resident Document Notifications */}
                      {currentUser?.role === 'Resident' && item.href === '/dashboard' && notificationCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="ml-auto h-5 min-w-5 px-1.5 flex items-center justify-center text-xs font-bold bg-[#EF4655] group-data-[collapsible=icon]:hidden"
                        >
                          {notificationCount}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })
          )}
        </SidebarMenu>
      </SidebarContent>

      {/* Sidebar Footer with Building Silhouette and Logout */}
      <SidebarFooter className="mt-auto shrink-0 border-t border-white/10 p-0 flex flex-col">
        {/* Subtle Building Graphic */}
        <div className="relative pt-3 px-4 pb-2 text-center overflow-hidden group-data-[collapsible=icon]:hidden">
          <div className="relative mx-auto w-full max-w-[200px] h-14 overflow-hidden rounded-md opacity-75">
            <img
              src="/images/sidebar-building.png"
              alt="Community Center"
              className="w-full h-full object-cover object-center filter brightness-95"
            />
          </div>
          <div className="mt-2 space-y-0.5">
            <p className="text-sm font-bold tracking-tight text-white leading-tight">
              iBarangay
            </p>
            <p className="text-[11px] text-white/60 leading-tight">
              A Smarter, Stronger Community
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <div className="border-t border-white/10 p-3">
          <button
            onClick={handleLogout}
            disabled={!isClient || !currentUser}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-5 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">Logout</span>
          </button>
        </div>
      </SidebarFooter>
    </div>
  );
}
