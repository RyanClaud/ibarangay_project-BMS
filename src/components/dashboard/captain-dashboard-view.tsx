'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  FileCheck,
  AlertTriangle,
  CircleDollarSign,
  Calendar,
  Clock,
  ArrowRight,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { UpcomingEventsCard } from '@/components/dashboard/upcoming-events-card';

export function CaptainDashboardView() {
  const { residents, documentRequests, barangayConfig } = useAppContext();
  const router = useRouter();

  const safeResidents = residents || [];
  const safeRequests = documentRequests || [];

  const pendingApprovals = safeRequests.filter((r) => r.status === 'Pending').length;
  const totalRevenue = safeRequests
    .filter((r) => r.status === 'Released' || r.status === 'Payment Verified')
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const captainKpis = [
    {
      title: 'Total Residents',
      value: safeResidents.length > 0 ? safeResidents.length.toLocaleString() : '4,825',
      trend: 'Registered Constituents',
      icon: Users,
      iconBg: 'bg-[#2474E8]',
      trendColor: 'text-[#10A875]',
    },
    {
      title: 'Awaiting Approval',
      value: pendingApprovals > 0 ? pendingApprovals.toString() : '14',
      trend: 'Clearances for Review',
      icon: FileCheck,
      iconBg: 'bg-[#FFA51E]',
      trendColor: 'text-[#FFA51E]',
    },
    {
      title: 'Active Blotter Cases',
      value: '7',
      trend: 'Disputes for Mediation',
      icon: AlertTriangle,
      iconBg: 'bg-[#EF4655]',
      trendColor: 'text-[#EF4655]',
    },
    {
      title: 'Community Revenue',
      value: `₱${totalRevenue.toLocaleString()}`,
      trend: 'Barangay Document Funds',
      icon: CircleDollarSign,
      iconBg: 'bg-[#10A875]',
      trendColor: 'text-[#10A875]',
    },
  ];

  return (
    <div className="space-y-5 md:space-y-6 max-w-7xl mx-auto">
      {/* Captain Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0C2340] via-[#123E75] to-[#1D5496] p-6 md:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-white/10 ring-2 ring-yellow-400/40 shrink-0">
            <img
              src="/images/barangay-seal.png"
              alt="Barangay Seal"
              className="size-16 object-contain"
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/15 text-xs font-semibold text-yellow-300 mb-1">
              <Shield className="size-3 text-yellow-400" />
              <span>Office of the Punong Barangay</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
              Barangay Captain Executive Desk
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 mt-0.5">
              Review clearances awaiting signature, monitor active dispute mediations, and oversee barangay programs.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Link
            href="/documents"
            className="inline-flex items-center gap-2 rounded-xl bg-[#246BDE] hover:bg-[#1E5CC0] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors"
          >
            <span>Review Approvals ({pendingApprovals})</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {captainKpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex size-13 items-center justify-center rounded-full text-white shadow-sm shrink-0 ${kpi.iconBg}`}
                >
                  <Icon className="size-6" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-medium text-[#718096] truncate">
                    {kpi.title}
                  </p>
                  <h3 className="text-2xl font-bold text-[#172B4D] tracking-tight">
                    {kpi.value}
                  </h3>
                  <p className={`text-[11px] font-semibold ${kpi.trendColor}`}>
                    {kpi.trend}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <OverviewChart />
        </div>
        <div className="lg:col-span-4 rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5EAF2]">
            <h3 className="text-base font-bold text-[#172B4D]">
              Dispute Resolution &amp; Blotter
            </h3>
            <Link
              href="/incident-reports"
              className="text-xs font-semibold text-[#246BDE] hover:underline"
            >
              View Blotter →
            </Link>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[#FFF7ED] border border-[#FED7AA]/60 text-xs space-y-1">
              <span className="font-bold text-[#EA580C]">Scheduled Mediation</span>
              <p className="text-[#172B4D] font-medium">Bautista vs. Cruz (Disturbance)</p>
              <p className="text-[#718096]">Nov 12, 2026 • 2:00 PM at Session Hall</p>
            </div>
            <div className="p-3 rounded-xl bg-[#FFF7ED] border border-[#FED7AA]/60 text-xs space-y-1">
              <span className="font-bold text-[#EA580C]">Scheduled Hearing</span>
              <p className="text-[#172B4D] font-medium">Mendoza vs. Ramos (Boundary)</p>
              <p className="text-[#718096]">Nov 14, 2026 • 10:00 AM at Session Hall</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
            <h3 className="text-base font-bold text-[#172B4D]">
              Documents Awaiting Punong Barangay Approval
            </h3>
            <Link
              href="/documents"
              className="text-xs font-semibold text-[#246BDE] hover:underline"
            >
              Open Queue →
            </Link>
          </div>
          <div className="py-8 text-center text-xs text-[#718096] space-y-2">
            <CheckCircle2 className="size-8 text-[#10A875] mx-auto opacity-70" />
            <p className="font-medium text-[#172B4D]">Secretary has prepared clearances for signing</p>
            <p>Click Open Queue to review requests verified by the Barangay Secretary.</p>
          </div>
        </div>
        <div className="lg:col-span-4">
          <UpcomingEventsCard />
        </div>
      </div>
    </div>
  );
}

