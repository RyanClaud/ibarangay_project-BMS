'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UserCog,
  Users,
  BarChart3,
  Sparkles,
  Settings,
  ShieldCheck,
  Plus,
  ArrowUpRight,
  Shield,
  Activity,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { UpcomingEventsCard } from '@/components/dashboard/upcoming-events-card';

export function AdminDashboardView() {
  const { currentUser, users, residents, barangayConfig } = useAppContext();
  const router = useRouter();

  // Active staff users belonging to this barangay
  const staffUsers = useMemo(() => {
    return (
      users?.filter(
        (u) =>
          u.role !== 'Resident' &&
          u.barangayId === currentUser?.barangayId &&
          !u.isDeleted
      ) || []
    );
  }, [users, currentUser]);

  const totalResidentsCount = (residents?.length || 0).toLocaleString();
  const barangayName = barangayConfig?.name || 'Mina de Oro';

  const adminKpis = [
    {
      title: 'Staff & Personnel',
      value: staffUsers.length.toString(),
      subtext: 'Authorized System Accounts',
      icon: UserCog,
      iconBg: 'bg-[#2474E8]',
      trend: 'Active Staff',
      trendColor: 'text-[#10A875]',
    },
    {
      title: 'Total Residents',
      value: totalResidentsCount,
      subtext: 'In Resident Registry',
      icon: Users,
      iconBg: 'bg-[#10A875]',
      trend: 'Verified Records',
      trendColor: 'text-[#10A875]',
    },
    {
      title: 'System Reports',
      value: '3 Core',
      subtext: 'Masterlist, Revenue & Issuance',
      icon: BarChart3,
      iconBg: 'bg-[#FFA51E]',
      trend: 'Ready to Export',
      trendColor: 'text-[#FFA51E]',
    },
    {
      title: 'System Health',
      value: '100%',
      subtext: 'Database & Auth Connected',
      icon: ShieldCheck,
      iconBg: 'bg-[#8B5CF6]',
      trend: 'Fully Operational',
      trendColor: 'text-[#10A875]',
    },
  ];

  return (
    <div className="space-y-5 md:space-y-6 max-w-7xl mx-auto">
      {/* Admin Executive Banner */}
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
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/15 text-xs font-semibold text-blue-200 mb-1">
              <Shield className="size-3 text-yellow-400" />
              <span>Administrator Portal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
              System Administration – {barangayName}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 mt-0.5">
              Manage authorized staff accounts, review security audit logs, and generate reports.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => router.push('/users')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#246BDE] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-[#1E5CC0] transition-colors"
          >
            <UserCog className="size-4" />
            <span>Manage Staff</span>
          </button>
          <button
            onClick={() => router.push('/reports')}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-white/20 transition-colors"
          >
            <BarChart3 className="size-4" />
            <span>Export Reports</span>
          </button>
        </div>
      </div>

      {/* Admin Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {adminKpis.map((kpi) => {
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

      {/* Middle Grid: Staff Directory (60%) & Quick Admin Tools (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Staff Directory */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#EAF2FF] text-[#246BDE]">
                  <UserCog className="size-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#172B4D] tracking-tight">
                    Authorized Barangay Staff
                  </h2>
                  <p className="text-xs text-[#718096]">
                    Personnel assigned to operational roles
                  </p>
                </div>
              </div>
              <Link
                href="/users"
                className="text-xs sm:text-sm font-semibold text-[#2474E8] hover:underline flex items-center gap-1"
              >
                Manage Staff →
              </Link>
            </div>

            {/* Staff Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs sm:text-[13px]">
                <thead>
                  <tr className="border-b border-[#E5EAF2] text-[#718096] font-semibold">
                    <th className="py-2.5 pr-3">Staff Name</th>
                    <th className="py-2.5 px-3">Assigned Role</th>
                    <th className="py-2.5 px-3">Email Address</th>
                    <th className="py-2.5 pl-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {staffUsers.length > 0 ? (
                    staffUsers.slice(0, 5).map((staff) => (
                      <tr key={staff.id} className="hover:bg-[#F9FAFC] transition-colors">
                        <td className="py-3 pr-3 font-semibold text-[#172B4D] whitespace-nowrap">
                          {staff.name}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF2FF] text-[#246BDE] border border-[#BFDBFE]">
                            {staff.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#718096] whitespace-nowrap">
                          {staff.email}
                        </td>
                        <td className="py-3 pl-3 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#10A875]">
                            <span className="size-1.5 rounded-full bg-[#10A875]" />
                            Active
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-[#718096]">
                        No staff accounts created yet. Click Manage Staff to register personnel.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5EAF2] flex justify-end">
            <Link
              href="/users"
              className="inline-flex items-center gap-2 rounded-xl bg-[#246BDE] hover:bg-[#1E5CC0] text-white px-3.5 py-1.5 text-xs font-semibold transition-colors shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Add Staff Account</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Administrative Controls & Shortcuts */}
        <div className="lg:col-span-5 xl:col-span-4 rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#E5EAF2]">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#EAF2FF] text-[#246BDE]">
              <Settings className="size-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#172B4D] tracking-tight">
              Administrative Shortcuts
            </h2>
          </div>

          <div className="space-y-3">
            <Link
              href="/users"
              className="group flex items-center justify-between p-3.5 rounded-xl border border-[#E5EAF2] hover:border-[#246BDE]/40 hover:bg-[#F8FAFC] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-[#EAF2FF] text-[#246BDE]">
                  <UserCog className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#172B4D] group-hover:text-[#246BDE] transition-colors">
                    Staff & Account Access
                  </h4>
                  <p className="text-xs text-[#718096]">
                    Create, edit, and assign roles
                  </p>
                </div>
              </div>
              <ArrowUpRight className="size-4 text-[#718096] group-hover:text-[#246BDE]" />
            </Link>

            <Link
              href="/reports"
              className="group flex items-center justify-between p-3.5 rounded-xl border border-[#E5EAF2] hover:border-[#246BDE]/40 hover:bg-[#F8FAFC] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-[#FFF7ED] text-[#FFA51E]">
                  <BarChart3 className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#172B4D] group-hover:text-[#FFA51E] transition-colors">
                    System Reports & Logs
                  </h4>
                  <p className="text-xs text-[#718096]">
                    Export PDF / Excel masterlists
                  </p>
                </div>
              </div>
              <ArrowUpRight className="size-4 text-[#718096] group-hover:text-[#FFA51E]" />
            </Link>

            <Link
              href="/insights"
              className="group flex items-center justify-between p-3.5 rounded-xl border border-[#E5EAF2] hover:border-[#246BDE]/40 hover:bg-[#F8FAFC] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-[#F3E8FF] text-[#8B5CF6]">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#172B4D] group-hover:text-[#8B5CF6] transition-colors">
                    AI Analytics & Trends
                  </h4>
                  <p className="text-xs text-[#718096]">
                    Intelligent barangay insights
                  </p>
                </div>
              </div>
              <ArrowUpRight className="size-4 text-[#718096] group-hover:text-[#8B5CF6]" />
            </Link>

            <Link
              href="/settings"
              className="group flex items-center justify-between p-3.5 rounded-xl border border-[#E5EAF2] hover:border-[#246BDE]/40 hover:bg-[#F8FAFC] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-[#E6F7F0] text-[#10A875]">
                  <Settings className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#172B4D] group-hover:text-[#10A875] transition-colors">
                    Barangay Configuration
                  </h4>
                  <p className="text-xs text-[#718096]">
                    Official seal, pricing & contact info
                  </p>
                </div>
              </div>
              <ArrowUpRight className="size-4 text-[#718096] group-hover:text-[#10A875]" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Overview Analytics Chart & Upcoming Barangay Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 xl:col-span-8">
          <OverviewChart />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <UpcomingEventsCard />
        </div>
      </div>
    </div>
  );
}

