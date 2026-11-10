'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  CircleDollarSign,
  Banknote,
  Receipt,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';

export function TreasurerDashboardView() {
  const { documentRequests, barangayConfig } = useAppContext();
  const router = useRouter();

  const safeRequests = documentRequests || [];

  const totalRevenue = safeRequests
    .filter((r) => r.status === 'Released' || r.status === 'Payment Verified')
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const pendingPayments = safeRequests.filter(
    (r) => r.status === 'Payment Submitted' || r.status === 'Approved'
  ).length;

  const verifiedPaymentsCount = safeRequests.filter(
    (r) => r.status === 'Payment Verified' || r.status === 'Ready for Pickup' || r.status === 'Released'
  ).length;

  const recentTransactions = safeRequests
    .filter((r) => r.status === 'Payment Verified' || r.status === 'Ready for Pickup' || r.status === 'Released')
    .slice(0, 6);

  const treasurerKpis = [
    {
      title: 'Total Revenue',
      value: `₱${totalRevenue.toLocaleString()}`,
      trend: '+12.5% this month',
      icon: CircleDollarSign,
      iconBg: 'bg-[#10A875]',
      trendColor: 'text-[#10A875]',
    },
    {
      title: 'Pending Verification',
      value: pendingPayments.toString(),
      trend: 'GCash & Cash Proofs',
      icon: Clock,
      iconBg: 'bg-[#FFA51E]',
      trendColor: 'text-[#FFA51E]',
    },
    {
      title: 'Verified Receipts',
      value: verifiedPaymentsCount.toString(),
      trend: 'Official Receipts Issued',
      icon: Receipt,
      iconBg: 'bg-[#2474E8]',
      trendColor: 'text-[#2474E8]',
    },
    {
      title: 'Active Methods',
      value: 'GCash / Cash',
      trend: 'Online & Over-the-counter',
      icon: CreditCard,
      iconBg: 'bg-[#8B5CF6]',
      trendColor: 'text-[#8B5CF6]',
    },
  ];

  return (
    <div className="space-y-5 md:space-y-6 max-w-7xl mx-auto">
      {/* Treasurer Welcome Banner */}
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
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/15 text-xs font-semibold text-emerald-300 mb-1">
              <Banknote className="size-3 text-emerald-400" />
              <span>Office of the Barangay Treasurer</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
              Treasury &amp; Financial Management
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 mt-0.5">
              Verify resident GCash payments, track clearance fee collections, and issue official receipts.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Link
            href="/payments"
            className="inline-flex items-center gap-2 rounded-xl bg-[#246BDE] hover:bg-[#1E5CC0] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors"
          >
            <span>Verify Payments ({pendingPayments})</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {treasurerKpis.map((kpi) => {
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

      {/* Middle & Bottom Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Recent Payment Transactions */}
        <div className="lg:col-span-8 rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
            <h3 className="text-base font-bold text-[#172B4D]">
              Recent Verified Collections
            </h3>
            <Link
              href="/payments"
              className="text-xs font-semibold text-[#246BDE] hover:underline"
            >
              View All Transactions →
            </Link>
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs sm:text-[13px]">
              <thead>
                <tr className="border-b border-[#E5EAF2] text-[#718096] font-semibold">
                  <th className="py-2.5 pr-3">Resident</th>
                  <th className="py-2.5 px-3">Document Type</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 pl-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((req) => (
                    <tr key={req.id} className="hover:bg-[#F9FAFC] transition-colors">
                      <td className="py-3 pr-3 font-semibold text-[#172B4D]">
                        {req.residentName}
                      </td>
                      <td className="py-3 px-3 text-[#172B4D]">
                        {req.documentType}
                      </td>
                      <td className="py-3 px-3 font-bold text-[#172B4D]">
                        ₱{req.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#10A875] border border-[#A7F3D0]">
                          Verified
                        </span>
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <Link
                          href="/payments"
                          className="text-xs text-[#246BDE] font-semibold hover:underline"
                        >
                          View Receipt
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-[#718096]">
                      No transaction history recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: GCash & Payment Settings Quick Card */}
        <div className="lg:col-span-4 rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5EAF2]">
            <h3 className="text-base font-bold text-[#172B4D]">
              Barangay Payment Settings
            </h3>
            <Link
              href="/settings"
              className="text-xs font-semibold text-[#246BDE] hover:underline"
            >
              Edit Settings →
            </Link>
          </div>
          <div className="p-4 rounded-xl bg-[#F0F4FA] border border-[#E2E8F0] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#172B4D]">GCash Number:</span>
              <span className="font-mono text-[#246BDE] font-bold">
                {barangayConfig?.paymentSettings?.gcashNumber || '0917-123-4567'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#172B4D]">Account Name:</span>
              <span className="text-[#172B4D]">
                {barangayConfig?.paymentSettings?.gcashName || 'Barangay Mina de Oro Treasury'}
              </span>
            </div>
          </div>
          <p className="text-xs text-[#718096]">
            Residents use this number to transfer clearance fees. Make sure the GCash number is updated.
          </p>
        </div>
      </div>
    </div>
  );
}

