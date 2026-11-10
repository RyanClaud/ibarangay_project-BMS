'use client';

import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { BarChart2 } from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';

type Period = 'This Month' | 'Last 3 Months' | 'Last 6 Months';

export function OverviewChart() {
  const { residents, documentRequests } = useAppContext();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('Last 6 Months');

  const chartData = useMemo(() => {
    const numMonths = selectedPeriod === 'This Month' ? 1 : selectedPeriod === 'Last 3 Months' ? 3 : 6;
    const now = new Date();
    const months: { month: string; year: number; monthIdx: number; residents: number; requests: number }[] = [];

    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      months.push({
        month: monthName,
        year: d.getFullYear(),
        monthIdx: d.getMonth(),
        residents: 0,
        requests: 0,
      });
    }

    const totalResidents = residents?.length || 0;
    const allRequests = documentRequests || [];

    // Tally real requests per month
    allRequests.forEach((req) => {
      if (!req.requestDate) return;
      const d = new Date(req.requestDate);
      if (isNaN(d.getTime())) return;
      const target = months.find(
        (m) => m.monthIdx === d.getMonth() && m.year === d.getFullYear()
      );
      if (target) {
        target.requests += 1;
      }
    });

    // Compute cumulative residents up to current month
    // If no individual registration timestamp, current total applies to the latest month
    months.forEach((m, idx) => {
      if (idx === months.length - 1) {
        m.residents = totalResidents;
      } else {
        // Linear baseline or 0 if only recent registrations
        m.residents = Math.max(0, Math.round(totalResidents * ((idx + 1) / months.length)));
      }
    });

    return months;
  }, [selectedPeriod, residents, documentRequests]);

  const periods: Period[] = ['This Month', 'Last 3 Months', 'Last 6 Months'];

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#EAF2FF] text-[#246BDE]">
            <BarChart2 className="size-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#172B4D] tracking-tight">
              Barangay Overview
            </h2>
            <p className="text-xs text-[#718096]">Real-time registration &amp; request activity</p>
          </div>
        </div>

        {/* Period Filter Buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#F4F7FC] p-1 rounded-xl">
          {periods.map((p) => {
            const active = selectedPeriod === p;
            return (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#246BDE] text-white shadow-xs'
                    : 'text-[#718096] hover:text-[#172B4D] hover:bg-white/60'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-5 text-xs font-semibold py-1">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#2474E8]" />
          <span className="text-[#172B4D]">Residents ({residents?.length || 0})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#10A875]" />
          <span className="text-[#172B4D]">Requests ({documentRequests?.length || 0})</span>
        </div>
      </div>

      {/* Area Chart */}
      <div className="h-56 sm:h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="residentsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2474E8" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#2474E8" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="requestsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10A875" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#10A875" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F0F4FA"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              axisLine={{ stroke: '#E5EAF2' }}
              tickLine={false}
              tick={{ fill: '#718096', fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#718096', fontSize: 11 }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#102D56',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              labelStyle={{ color: '#EAF2FF', fontWeight: 600 }}
              itemStyle={{ color: '#fff', padding: '2px 0' }}
            />
            <Area
              type="monotone"
              dataKey="residents"
              name="Residents"
              stroke="#2474E8"
              strokeWidth={2.5}
              fill="url(#residentsGradient)"
              activeDot={{ r: 5, fill: '#2474E8', stroke: '#fff', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="requests"
              name="Requests"
              stroke="#10A875"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#10A875', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#10A875', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
