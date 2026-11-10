'use client';

import { Users, FileText, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';

export function KpiCards() {
  const { residents, documentRequests, incidents } = useAppContext();

  // Dynamic counts strictly from database
  const totalResidentsCount = residents ? residents.length : 0;
  const totalResidentsStr = totalResidentsCount.toLocaleString();

  const pendingCount = (documentRequests || []).filter(
    (r) => r.status === 'Pending' || r.status === 'Payment Submitted'
  ).length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const processedCount = (documentRequests || []).filter((r) => {
    const isProcessed = [
      'Approved',
      'Payment Verified',
      'Ready for Pickup',
      'Released',
    ].includes(r.status);
    if (!isProcessed) return false;
    if (!r.requestDate) return true;
    const d = new Date(r.requestDate);
    return (
      !isNaN(d.getTime()) &&
      d.getMonth() === currentMonth &&
      d.getFullYear() === currentYear
    );
  }).length;

  const unresolvedCount = (incidents || []).filter(
    (i) => i.status === 'Unresolved'
  ).length;

  const cards = [
    {
      title: 'Total Residents',
      value: totalResidentsStr,
      change: 'Active',
      period: 'Registered in barangay',
      trendColor: 'text-[#10A875]',
      icon: Users,
      iconBg: 'bg-[#2474E8]',
      cardBorder: 'hover:border-[#2474E8]/30',
      watermark: Users,
      watermarkColor: 'text-[#2474E8]/10',
    },
    {
      title: 'Pending Requests',
      value: pendingCount.toString(),
      change: pendingCount > 0 ? `${pendingCount} queue` : 'Clear',
      period: 'Awaiting clerk review',
      trendColor: pendingCount > 0 ? 'text-[#FFA51E]' : 'text-[#10A875]',
      icon: FileText,
      iconBg: 'bg-[#FFA51E]',
      cardBorder: 'hover:border-[#FFA51E]/30',
      watermark: Clock,
      watermarkColor: 'text-[#FFA51E]/10',
    },
    {
      title: 'Processed This Month',
      value: processedCount.toString(),
      change: `${processedCount} total`,
      period: 'Issued & verified documents',
      trendColor: 'text-[#10A875]',
      icon: CheckCircle2,
      iconBg: 'bg-[#10A875]',
      cardBorder: 'hover:border-[#10A875]/30',
      watermark: CheckCircle2,
      watermarkColor: 'text-[#10A875]/10',
    },
    {
      title: 'Unresolved Incidents',
      value: unresolvedCount.toString(),
      change: unresolvedCount > 0 ? `${unresolvedCount} active` : 'None',
      period: 'Blotter cases under mediation',
      trendColor: unresolvedCount > 0 ? 'text-[#EF4655]' : 'text-[#10A875]',
      icon: AlertTriangle,
      iconBg: 'bg-[#EF4655]',
      cardBorder: 'hover:border-[#EF4655]/30',
      watermark: AlertTriangle,
      watermarkColor: 'text-[#EF4655]/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const Watermark = card.watermark;
        return (
          <div
            key={card.title}
            className={`relative overflow-hidden rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md ${card.cardBorder}`}
          >
            {/* Watermark Icon in background right */}
            <div className={`absolute -right-3 -bottom-3 pointer-events-none select-none ${card.watermarkColor}`}>
              <Watermark className="size-24 stroke-[1.2]" />
            </div>

            <div className="relative z-10 flex items-center gap-4">
              {/* Circular Colored Icon */}
              <div
                className={`flex size-13 items-center justify-center rounded-full text-white shadow-sm shrink-0 ${card.iconBg}`}
              >
                <Icon className="size-6.5 stroke-[2.2]" />
              </div>

              {/* Stat Details */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#718096] uppercase tracking-wide truncate">
                  {card.title}
                </p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D] tracking-tight leading-none mt-1">
                  {card.value}
                </h3>
                <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                  <span className={`font-bold ${card.trendColor}`}>
                    {card.change}
                  </span>
                  <span className="text-[#8F9CAE] truncate">{card.period}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
