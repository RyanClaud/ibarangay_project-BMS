'use client';

import { useAppContext } from '@/contexts/app-context';
import { Loader2 } from 'lucide-react';
import { AdminDashboardView } from '@/components/dashboard/admin-dashboard-view';
import { SecretaryDashboardView } from '@/components/dashboard/secretary-dashboard-view';
import { CaptainDashboardView } from '@/components/dashboard/captain-dashboard-view';
import { TreasurerDashboardView } from '@/components/dashboard/treasurer-dashboard-view';
import { ResidentDashboardView } from '@/components/dashboard/resident-dashboard-view';

export default function DashboardPage() {
  const { currentUser, isDataLoading } = useAppContext();

  if (!currentUser || isDataLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="size-10 animate-spin text-[#246BDE]" />
      </div>
    );
  }

  // 1. Resident Dashboard (with document requests, payment receipts, and resident complaint filing)
  if (currentUser.role === 'Resident') {
    return <ResidentDashboardView />;
  }

  // 2. Admin Dashboard (manages staff users, reports, analytics, audit logs)
  if (currentUser.role === 'Admin') {
    return <AdminDashboardView />;
  }

  // 3. Secretary Dashboard (manages operational desk: residents, clearances, blotter complaints, upcoming events)
  if (currentUser.role === 'Secretary') {
    return <SecretaryDashboardView />;
  }

  // 4. Barangay Captain Dashboard (executive approvals, dispute resolution oversight, community revenue)
  if (currentUser.role === 'Barangay Captain') {
    return <CaptainDashboardView />;
  }

  // 5. Treasurer Dashboard (finance tracking, GCash payment verification, official receipts)
  if (currentUser.role === 'Treasurer') {
    return <TreasurerDashboardView />;
  }

  // 6. BHW, Encoder or general staff fallback
  return <SecretaryDashboardView />;
}
