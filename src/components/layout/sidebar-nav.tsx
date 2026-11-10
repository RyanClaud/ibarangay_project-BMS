'use client';

import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  UserCog,
  FileText,
  CircleDollarSign,
  BarChart3,
  Sparkles,
  Settings,
  LogOut,
  FileSignature,
  Loader2,
  Building2,
  ClipboardList
} from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';
import { useEffect, useState } from 'react';
import { Logo } from '../logo';
import { useNotificationCount } from '@/hooks/use-notification-count';
import { Badge } from '@/components/ui/badge';

const navItems = {
  Admin: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/residents', icon: Users, label: 'Residents' },
    { href: '/profiling', icon: ClipboardList, label: 'Barangay Profiling' },
    { href: '/users', icon: UserCog, label: 'Staff & Users' },
    { href: '/documents', icon: FileSignature, label: 'Documents' },
    { href: '/payments', icon: CircleDollarSign, label: 'Payments' },
    { href: '/reports', icon: BarChart3, label: 'Reports' },
    { href: '/insights', icon: Sparkles, label: 'AI Insights' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ],
  SuperAdmin: [
    { href: '/super-admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/barangays', icon: Building2, label: 'Barangays' },
    { href: '/system-users', icon: Users, label: 'System Users' },
    { href: '/system-analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/system-reports', icon: FileText, label: 'Reports' },
    { href: '/system-settings', icon: Settings, label: 'System Settings' },
  ],
  'Barangay Captain': [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/residents', icon: Users, label: 'Residents' },
    { href: '/profiling', icon: ClipboardList, label: 'Barangay Profiling' },
    { href: '/documents', icon: FileSignature, label: 'Documents' },
    { href: '/reports', icon: BarChart3, label: 'Reports' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ],
  Secretary: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/residents', icon: Users, label: 'Residents' },
    { href: '/profiling', icon: ClipboardList, label: 'Barangay Profiling' },
    { href: '/documents', icon: FileSignature, label: 'Documents' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ],
  Treasurer: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/payments', icon: CircleDollarSign, label: 'Payments' },
    { href: '/profiling', icon: ClipboardList, label: 'Barangay Profiling' },
    { href: '/reports', icon: BarChart3, label: 'Reports' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ],
  BHW: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/profiling', icon: ClipboardList, label: 'Barangay Profiling' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ],
  Encoder: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/profiling', icon: ClipboardList, label: 'Barangay Profiling' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ],
  Resident: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ],
};

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, barangayConfig, documentRequests } = useAppContext();
  const [isClient, setIsClient] = useState(false);
  
  // Get notification count for residents
  const notificationCount = useNotificationCount(
    currentUser?.role === 'Resident' ? documentRequests : null
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Determine what to display under the logo
  const getSubtitle = () => {
    if (!currentUser) return 'Loading...';
    if (currentUser.isSuperAdmin) return 'System Administration';
    return barangayConfig?.name || 'Barangay Management';
  };
  
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Use SuperAdmin nav items if user is super admin, otherwise use role-based items
  const userNavItems = currentUser 
    ? (currentUser.isSuperAdmin ? navItems.SuperAdmin : navItems[currentUser.role]) 
    : [];

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 p-1">
          <Logo className="size-12" />
          <div className="flex flex-col">
            <h2 className="font-headline text-lg font-semibold text-sidebar-foreground">iBarangay</h2>
            <p className="text-xs text-sidebar-foreground/80">{getSubtitle()}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {!isClient || !currentUser ? (
             <div className="flex justify-center p-4">
               <Loader2 className="animate-spin text-sidebar-foreground" />
             </div>
          ) : (
            userNavItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  className="font-body"
                  tooltip={{
                    children: item.label,
                    className: 'bg-primary text-primary-foreground',
                  }}
                >
                  <Link href={item.href} className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <item.icon />
                      <span>{item.label}</span>
                    </div>
                    {/* Show notification badge for dashboard if resident has notifications */}
                    {currentUser?.role === 'Resident' && item.href === '/dashboard' && notificationCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {notificationCount}
                      </Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              disabled={!isClient || !currentUser}
              tooltip={{
                children: 'Logout',
                className: 'bg-primary text-primary-foreground',
            }}>
                <LogOut />
                <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
