'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/contexts/app-context';
import {
  exportResidentMasterlist,
  exportMonthlyRevenue,
  exportDocumentIssuance,
} from '@/lib/reports';
import {
  FileDown,
  Users,
  CircleDollarSign,
  FileText,
  Loader2,
  TrendingUp,
  ShieldAlert,
  BarChart2,
  PieChart as PieChartIcon,
  Search,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { usePagination } from '@/hooks/use-pagination';
import { PaginationControl } from '@/components/ui/pagination-control';
import type { DocumentRequest, Resident, IncidentReport } from '@/lib/types';

type ReportType = 'residentMasterlist' | 'monthlyRevenue' | 'documentIssuance';

const reportTypes: {
  id: ReportType;
  title: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  handler: (format: 'pdf' | 'excel', data: any, config?: any, officials?: any) => void;
}[] = [
  {
    id: 'residentMasterlist',
    title: 'Resident Masterlist',
    description: 'Generate an official demographic list of all registered residents in the barangay.',
    icon: Users,
    iconBg: 'bg-[#EAF2FF]',
    iconColor: 'text-[#246BDE]',
    handler: (format, data, config, officials) => exportResidentMasterlist(format, data, config, officials),
  },
  {
    id: 'monthlyRevenue',
    title: 'Monthly Revenue Report',
    description: 'Financial ledger breakdown of revenues and clearance document fees collected.',
    icon: CircleDollarSign,
    iconBg: 'bg-[#ECFDF5]',
    iconColor: 'text-[#10A875]',
    handler: (format, data, config) => exportMonthlyRevenue(format, data, config),
  },
  {
    id: 'documentIssuance',
    title: 'Document Issuance Report',
    description: 'Audit log of all certificates, clearances, and permits issued in the reporting period.',
    icon: FileText,
    iconBg: 'bg-[#FFF7ED]',
    iconColor: 'text-[#FFA51E]',
    handler: (format, data, config) => exportDocumentIssuance(format, data, config),
  },
];

export default function ReportsPage() {
  const { residents, documentRequests, incidents, isDataLoading, barangayConfig, users } =
    useAppContext();
  const [tableSearch, setTableSearch] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'All' | '6m' | '1m'>('All');

  // ---------- 1. High-Level Metrics ----------
  const totalResidents = residents?.length || 0;

  const totalRevenue = useMemo(() => {
    return (documentRequests || [])
      .filter((r) =>
        ['Approved', 'Payment Verified', 'Ready for Pickup', 'Released'].includes(r.status)
      )
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }, [documentRequests]);

  const totalDocumentsIssued = useMemo(() => {
    return (documentRequests || []).filter((r) =>
      ['Payment Verified', 'Ready for Pickup', 'Released'].includes(r.status)
    ).length;
  }, [documentRequests]);

  const incidentResolutionRate = useMemo(() => {
    const total = incidents?.length || 0;
    if (total === 0) return 100;
    const resolved = incidents!.filter(
      (i) => i.status === 'Resolved' || i.status === 'Settled'
    ).length;
    return Math.round((resolved / total) * 100);
  }, [incidents]);

  // ---------- 2. Chart Datasets ----------
  // Monthly Revenue & Issuances (Last 6 Months)
  const monthlyTrendsData = useMemo(() => {
    const now = new Date();
    const months: {
      month: string;
      monthIdx: number;
      year: number;
      revenue: number;
      issuances: number;
    }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        monthIdx: d.getMonth(),
        year: d.getFullYear(),
        revenue: 0,
        issuances: 0,
      });
    }

    (documentRequests || []).forEach((req) => {
      if (!req.requestDate) return;
      const d = new Date(req.requestDate);
      if (isNaN(d.getTime())) return;
      const target = months.find(
        (m) => m.monthIdx === d.getMonth() && m.year === d.getFullYear()
      );
      if (target) {
        target.issuances += 1;
        if (
          ['Approved', 'Payment Verified', 'Ready for Pickup', 'Released'].includes(
            req.status
          )
        ) {
          target.revenue += Number(req.amount) || 0;
        }
      }
    });

    return months;
  }, [documentRequests]);

  // Document Requests by Type
  const documentTypeDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    (documentRequests || []).forEach((r) => {
      const type = r.documentType || 'Other';
      map[type] = (map[type] || 0) + 1;
    });

    const entries = Object.entries(map).map(([name, count]) => ({
      name: name.replace('Certificate of ', 'Cert. ').replace(' Certificate', ''),
      count,
    }));

    return entries.length > 0
      ? entries
      : [
          { name: 'Barangay Clearance', count: 0 },
          { name: 'Residency', count: 0 },
          { name: 'Indigency', count: 0 },
        ];
  }, [documentRequests]);

  // Population by Purok
  const purokDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    (residents || []).forEach((r) => {
      const purok = r.purok || 'Unspecified';
      map[purok] = (map[purok] || 0) + 1;
    });

    const entries = Object.entries(map).map(([purok, count]) => ({
      purok,
      count,
    }));

    return entries.length > 0
      ? entries
      : [
          { purok: 'Purok 1', count: 0 },
          { purok: 'Purok 2', count: 0 },
          { purok: 'Purok 3', count: 0 },
        ];
  }, [residents]);

  // Incident Status Breakdown
  const incidentBreakdown = useMemo(() => {
    const all = incidents || [];
    const unresolved = all.filter((i) => i.status === 'Unresolved').length;
    const investigating = all.filter((i) => i.status === 'Under Investigation').length;
    const resolved = all.filter((i) => i.status === 'Resolved').length;
    const settled = all.filter((i) => i.status === 'Settled').length;

    const data = [
      { name: 'Resolved', value: resolved, color: '#10A875' },
      { name: 'Settled', value: settled, color: '#246BDE' },
      { name: 'Under Investigation', value: investigating, color: '#FFA51E' },
      { name: 'Unresolved', value: unresolved, color: '#EF4655' },
    ].filter((item) => item.value > 0);

    return data.length > 0
      ? data
      : [{ name: 'No Incidents', value: 1, color: '#E5EAF2' }];
  }, [incidents]);

  // ---------- 3. Filtered Ledger Table & Pagination ----------
  const filteredLedger = useMemo(() => {
    return (documentRequests || []).filter((r) => {
      const q = tableSearch.toLowerCase();
      return (
        (r.trackingNumber || '').toLowerCase().includes(q) ||
        (r.residentName || '').toLowerCase().includes(q) ||
        (r.documentType || '').toLowerCase().includes(q) ||
        (r.status || '').toLowerCase().includes(q)
      );
    });
  }, [documentRequests, tableSearch]);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems,
    setCurrentPage,
    setPageSize,
  } = usePagination(filteredLedger, { initialPageSize: 10 });

  // Handle Export
  const handleExport = (reportId: ReportType, format: 'pdf' | 'excel') => {
    if (isDataLoading) {
      toast({
        title: 'Please wait',
        description: 'Data is still loading. Try again in a moment.',
        variant: 'destructive',
      });
      return;
    }

    const report = reportTypes.find((r) => r.id === reportId);
    if (!report) return;

    let data: any[] = [];
    switch (reportId) {
      case 'residentMasterlist':
        data = residents || [];
        break;
      case 'monthlyRevenue':
      case 'documentIssuance':
        data = documentRequests || [];
        break;
      default:
        data = [];
    }

    if (!data || data.length === 0) {
      toast({
        title: 'No Data Available',
        description: 'There are no records to generate this report yet.',
      });
      return;
    }

    try {
      const officials = {
        secretaryName: (users || []).find((u) => u.role === 'Secretary')?.name,
        captainName: (users || []).find((u) => u.role === 'Barangay Captain')?.name || barangayConfig?.captainName,
      };
      report.handler(format, data, barangayConfig, officials);
      toast({
        title: 'Report Downloaded',
        description: `Your ${report.title} (${format.toUpperCase()}) has been generated.`,
      });
    } catch (error) {
      console.error('Report generation failed:', error);
      toast({
        title: 'Export Failed',
        description: 'An error occurred while generating the report document.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172B4D]">
            Barangay Reports &amp; Analytics
          </h1>
          <p className="text-sm text-[#718096] mt-1">
            Real-time analytics, revenue performance, demographic breakdowns, and official export records.
          </p>
        </div>
      </div>

      {isDataLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-[#246BDE]" />
        </div>
      ) : (
        <>
          {/* Executive KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {/* 1. Total Population */}
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#EAF2FF] text-[#246BDE] shrink-0">
                  <Users className="size-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#718096] uppercase tracking-wide">
                    Registered Population
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D] leading-tight mt-0.5">
                    {totalResidents.toLocaleString()}
                  </h3>
                  <p className="text-xs text-[#10A875] font-semibold mt-1">
                    Verified constituents
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Total Revenue */}
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#ECFDF5] text-[#10A875] shrink-0">
                  <CircleDollarSign className="size-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#718096] uppercase tracking-wide">
                    Collected Revenue
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D] leading-tight mt-0.5">
                    ₱{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h3>
                  <p className="text-xs text-[#10A875] font-semibold mt-1">
                    Document fees verified
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Document Issuances */}
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#FFF7ED] text-[#FFA51E] shrink-0">
                  <FileText className="size-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#718096] uppercase tracking-wide">
                    Documents Issued
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D] leading-tight mt-0.5">
                    {totalDocumentsIssued}
                  </h3>
                  <p className="text-xs text-[#FFA51E] font-semibold mt-1">
                    Clearances &amp; certificates
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Blotter Resolution */}
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#F0F4FA] text-[#246BDE] shrink-0">
                  <ShieldAlert className="size-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#718096] uppercase tracking-wide">
                    Dispute Resolution
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D] leading-tight mt-0.5">
                    {incidentResolutionRate}%
                  </h3>
                  <p className="text-xs text-[#246BDE] font-semibold mt-1">
                    Settled / resolved cases
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Visual Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 1: Monthly Revenue & Issuance Trends */}
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-[#ECFDF5] text-[#10A875]">
                    <TrendingUp className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#172B4D]">
                      Monthly Revenue &amp; Issuances
                    </h2>
                    <p className="text-xs text-[#718096]">Past 6 months collection trend</p>
                  </div>
                </div>
                <div className="text-xs font-bold text-[#10A875]">
                  Total: ₱{totalRevenue.toFixed(2)}
                </div>
              </div>
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrendsData}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10A875" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#10A875" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} tick={{ fill: '#718096', fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#718096', fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: any, name: string) => [
                        name === 'Revenue (₱)' ? `₱${Number(val).toFixed(2)}` : val,
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: '#102D56',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue (₱)"
                      stroke="#10A875"
                      strokeWidth={2.5}
                      fill="url(#revenueFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Document Requests by Type */}
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-[#EAF2FF] text-[#246BDE]">
                    <BarChart2 className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#172B4D]">
                      Requests by Document Type
                    </h2>
                    <p className="text-xs text-[#718096]">Distribution of clearance types</p>
                  </div>
                </div>
              </div>
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={documentTypeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      tick={{ fill: '#718096', fontSize: 10 }}
                      interval={0}
                    />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#718096', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#102D56',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" name="Total Requests" fill="#246BDE" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Resident Population by Purok */}
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-[#F0F4FA] text-[#172B4D]">
                    <Users className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#172B4D]">
                      Population by Purok
                    </h2>
                    <p className="text-xs text-[#718096]">Demographic distribution</p>
                  </div>
                </div>
              </div>
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={purokDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="purok" tickLine={false} tick={{ fill: '#718096', fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#718096', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#102D56',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" name="Residents" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Incident Case Resolution Breakdown */}
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-[#FFF7ED] text-[#FFA51E]">
                    <PieChartIcon className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#172B4D]">
                      Blotter &amp; Incident Status
                    </h2>
                    <p className="text-xs text-[#718096]">Mediation and case settlement</p>
                  </div>
                </div>
              </div>
              <div className="h-64 w-full flex items-center justify-center pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incidentBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {incidentBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#102D56',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs">
                {incidentBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[#172B4D] font-medium">
                      {item.name}: {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Document Issuance & Fee Collection Ledger Table */}
          <div className="rounded-2xl border border-[#E5EAF2] bg-white overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[#E5EAF2] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#172B4D]">
                  Document Issuance &amp; Fee Ledger
                </h3>
                <p className="text-xs text-[#718096]">
                  Detailed audit records of clearance requests, payment verification, and release dates.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#718096]" />
                <Input
                  placeholder="Filter records..."
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 pl-9 rounded-xl border-[#E2E8F0] bg-white text-xs text-[#172B4D]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5EAF2] bg-[#F8FAFC] text-[#718096]">
                    <th className="py-3 px-4 font-semibold">Tracking #</th>
                    <th className="py-3 px-4 font-semibold">Requester</th>
                    <th className="py-3 px-4 font-semibold">Document Type</th>
                    <th className="py-3 px-4 font-semibold">Amount</th>
                    <th className="py-3 px-4 font-semibold">Date Requested</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {paginatedItems.length > 0 ? (
                    paginatedItems.map((req) => (
                      <tr key={req.id} className="hover:bg-[#F9FAFC] transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-[#246BDE]">
                          {req.trackingNumber || `REQ-${req.id.slice(0, 6)}`}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#172B4D]">
                          {req.residentName}
                        </td>
                        <td className="py-3 px-4 text-[#172B4D]">{req.documentType}</td>
                        <td className="py-3 px-4 font-semibold text-[#10A875]">
                          ₱{Number(req.amount || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-[#718096] whitespace-nowrap">
                          {req.requestDate || '—'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              req.status === 'Released' || req.status === 'Approved'
                                ? 'bg-[#ECFDF5] text-[#10A875] border border-[#A7F3D0]'
                                : req.status === 'Pending'
                                ? 'bg-[#FFF7ED] text-[#FFA51E] border border-[#FED7AA]'
                                : 'bg-[#EAF2FF] text-[#246BDE] border border-[#BFDBFE]'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[#718096]">
                        No records match your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredLedger.length > 0 && (
              <div className="border-t border-[#E5EAF2] px-4 py-2 bg-[#F8FAFC]">
                <PaginationControl
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  itemLabel="issuances"
                />
              </div>
            )}
          </div>

          {/* Supplementary Official Reports Export Center */}
          <div>
            <div className="pb-3">
              <h2 className="text-lg font-bold text-[#172B4D]">
                Supplementary Official Document Exports
              </h2>
              <p className="text-xs text-[#718096]">
                Generate PDF executive summaries or Excel spreadsheets for local auditing and archival.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {reportTypes.map((report) => {
                const Icon = report.icon;
                return (
                  <div
                    key={report.title}
                    className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-3.5 pb-3">
                        <div
                          className={`flex size-11 items-center justify-center rounded-2xl ${report.iconBg} ${report.iconColor} shrink-0`}
                        >
                          <Icon className="size-5.5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-[#172B4D] leading-tight">
                            {report.title}
                          </h3>
                        </div>
                      </div>
                      <p className="text-xs text-[#718096] leading-relaxed pb-4">
                        {report.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#E5EAF2] flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-[#246BDE] hover:bg-[#1E5CC0] text-white text-xs font-semibold rounded-xl h-9 gap-1.5 shadow-xs"
                        onClick={() => handleExport(report.id, 'pdf')}
                      >
                        <FileDown className="size-3.5" />
                        PDF Export
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-[#E5EAF2] text-[#172B4D] hover:bg-[#F8FAFC] text-xs font-semibold rounded-xl h-9 gap-1.5"
                        onClick={() => handleExport(report.id, 'excel')}
                      >
                        <FileDown className="size-3.5" />
                        Excel
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
