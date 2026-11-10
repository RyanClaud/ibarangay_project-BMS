'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';

interface DisplayRequest {
  id: string;
  trackingNumber: string;
  documentType: string;
  residentName: string;
  requestDate: string;
  status: string;
}

export function PendingRequestsTable() {
  const { documentRequests } = useAppContext();
  const router = useRouter();

  // Retrieve strictly genuine pending or verification requests from database
  const tableData: DisplayRequest[] = useMemo(() => {
    if (!documentRequests) return [];

    return documentRequests
      .filter((r) => r.status === 'Pending' || r.status === 'Payment Submitted')
      .map((r) => {
        const d = new Date(r.requestDate);
        const formattedDate = isNaN(d.getTime())
          ? 'Recently'
          : d.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
        return {
          id: r.id,
          trackingNumber: r.trackingNumber || `REQ-${r.id.slice(0, 6)}`,
          documentType: r.documentType,
          residentName: r.residentName || 'Resident',
          requestDate: formattedDate,
          status: r.status === 'Payment Submitted' ? 'For Verification' : r.status,
        };
      })
      .slice(0, 5);
  }, [documentRequests]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF7ED] text-[#FFA51E] border border-[#FED7AA]">
            Pending
          </span>
        );
      case 'For Verification':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF2FF] text-[#246BDE] border border-[#BFDBFE]">
            For Verification
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F4F7FC] text-[#718096]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Table Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#EAF2FF] text-[#246BDE]">
            <FileText className="size-5" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#172B4D] tracking-tight">
            Pending Document Requests
          </h2>
        </div>
        <Link
          href="/documents"
          className="text-xs sm:text-sm font-semibold text-[#2474E8] hover:underline flex items-center gap-1 transition-colors"
        >
          View All &rarr;
        </Link>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E5EAF2] text-[#718096]">
              <th className="py-2.5 px-3 font-semibold">Request #</th>
              <th className="py-2.5 px-3 font-semibold">Document Type</th>
              <th className="py-2.5 px-3 font-semibold">Requester</th>
              <th className="py-2.5 px-3 font-semibold">Date Requested</th>
              <th className="py-2.5 px-3 font-semibold">Status</th>
              <th className="py-2.5 px-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {tableData.length > 0 ? (
              tableData.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-[#F9FAFC] transition-colors group"
                >
                  <td className="py-3 px-3 font-mono font-medium text-[#172B4D]">
                    {row.trackingNumber}
                  </td>
                  <td className="py-3 px-3 font-medium text-[#172B4D]">
                    {row.documentType}
                  </td>
                  <td className="py-3 px-3 text-[#172B4D] font-medium">
                    {row.residentName}
                  </td>
                  <td className="py-3 px-3 text-[#718096] whitespace-nowrap">
                    {row.requestDate}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {getStatusBadge(row.status)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => router.push('/documents')}
                      className="inline-flex items-center justify-center rounded-lg bg-[#2474E8] px-3 py-1 font-semibold text-white shadow-xs transition-colors hover:bg-[#1E5CC0] text-xs"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-[#718096]">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <CheckCircle2 className="size-6 text-[#10A875]" />
                    <span className="font-semibold text-[#172B4D]">All Caught Up!</span>
                    <span className="text-[#8F9CAE]">No pending document requests awaiting review.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
