'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Zap,
  CheckCircle2,
  UserPlus,
  MessageSquare,
  CreditCard,
  FileText,
  Clock,
} from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';

interface ActivityEntry {
  id: string;
  title: string;
  details: string;
  time: string;
  timestamp: number;
  icon: any;
  iconColor: string;
  iconBg: string;
}

export function RecentActivityTimeline() {
  const { documentRequests, residents, incidents } = useAppContext();

  // Combine real database records dynamically
  const activities: ActivityEntry[] = useMemo(() => {
    const items: ActivityEntry[] = [];

    // Document Requests activities
    (documentRequests || []).forEach((req) => {
      const d = req.requestDate ? new Date(req.requestDate) : new Date();
      const ts = !isNaN(d.getTime()) ? d.getTime() : Date.now();
      const timeStr = !isNaN(d.getTime())
        ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Recently';

      if (req.status === 'Released' || req.status === 'Approved') {
        items.push({
          id: `req-app-${req.id}`,
          title: `${req.documentType} was ${req.status.toLowerCase()}`,
          details: `Requested by ${req.residentName}`,
          time: timeStr,
          timestamp: ts,
          icon: CheckCircle2,
          iconColor: 'text-[#10A875]',
          iconBg: 'bg-[#E6F7F0]',
        });
      } else if (req.status === 'Payment Submitted' || req.status === 'Payment Verified') {
        items.push({
          id: `req-pay-${req.id}`,
          title: 'Document fee payment received',
          details: `₱${(req.amount || 0).toFixed(2)} • ${req.residentName}`,
          time: timeStr,
          timestamp: ts,
          icon: CreditCard,
          iconColor: 'text-[#8B5CF6]',
          iconBg: 'bg-[#F3E8FF]',
        });
      } else {
        items.push({
          id: `req-new-${req.id}`,
          title: `New request: ${req.documentType}`,
          details: `Filed by ${req.residentName}`,
          time: timeStr,
          timestamp: ts,
          icon: FileText,
          iconColor: 'text-[#246BDE]',
          iconBg: 'bg-[#EAF2FF]',
        });
      }
    });

    // Residents registrations
    (residents || []).forEach((res) => {
      items.push({
        id: `res-${res.id}`,
        title: 'New resident profile registered',
        details: `${res.firstName} ${res.lastName} (${res.purok || 'Mina de Oro'})`,
        time: 'Registered',
        timestamp: Date.now() - 1000 * 60 * 60, // recent
        icon: UserPlus,
        iconColor: 'text-[#2474E8]',
        iconBg: 'bg-[#EAF2FF]',
      });
    });

    // Incidents reports
    (incidents || []).forEach((inc) => {
      const d = inc.dateFiled ? new Date(inc.dateFiled) : new Date();
      const ts = !isNaN(d.getTime()) ? d.getTime() : Date.now();
      const timeStr = !isNaN(d.getTime())
        ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Recently';

      items.push({
        id: `inc-${inc.id}`,
        title: `Blotter: ${inc.type}`,
        details: `Case ${inc.caseNumber} • ${inc.status}`,
        time: timeStr,
        timestamp: ts,
        icon: MessageSquare,
        iconColor: 'text-[#FFA51E]',
        iconBg: 'bg-[#FFF7ED]',
      });
    });

    // Sort newest first, limit to 4
    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 4);
  }, [documentRequests, residents, incidents]);

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#EAF2FF] text-[#246BDE]">
            <Zap className="size-5 fill-[#246BDE]" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#172B4D] tracking-tight">
            Recent Activity
          </h2>
        </div>
        <Link
          href="/reports"
          className="text-xs sm:text-sm font-semibold text-[#2474E8] hover:underline flex items-center gap-1 transition-colors"
        >
          View All &rarr;
        </Link>
      </div>

      {/* Activity Timeline List */}
      <div className="flex-1 space-y-3.5 divide-y divide-[#F1F5F9]">
        {activities.length > 0 ? (
          activities.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`flex items-start gap-3.5 ${idx !== 0 ? 'pt-3.5' : ''}`}
              >
                {/* Circular Icon */}
                <div
                  className={`flex size-9 items-center justify-center rounded-full shrink-0 ${item.iconBg} ${item.iconColor}`}
                >
                  <Icon className="size-4.5" />
                </div>

                {/* Text Info */}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-xs sm:text-[13px] font-semibold text-[#172B4D] leading-tight truncate">
                    {item.title}
                  </p>
                  <p className="text-[11px] sm:text-xs text-[#718096] leading-tight">
                    {item.details} • {item.time}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-xs text-[#718096]">
            <Clock className="size-6 text-[#718096] mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-[#172B4D]">No Recent Activity</p>
            <p className="text-[#8F9CAE]">Activity events will appear here as transactions occur.</p>
          </div>
        )}
      </div>
    </div>
  );
}
