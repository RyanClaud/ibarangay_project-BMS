'use client';

import * as React from 'react';
import type { DocumentRequest } from '@/lib/types';
import { useAppContext } from '@/contexts/app-context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Receipt, Search } from 'lucide-react';
import { usePagination } from '@/hooks/use-pagination';
import { PaginationControl } from '@/components/ui/pagination-control';

export function PaymentsClientPage() {
  const { documentRequests } = useAppContext();
  const [searchQuery, setSearchQuery] = React.useState('');

  const verifiedPayments = React.useMemo(() => {
    return (documentRequests || [])
      .filter(
        (req) =>
          req.status === 'Payment Verified' ||
          req.status === 'Ready for Pickup' ||
          req.status === 'Released'
      )
      .sort(
        (a, b) =>
          new Date(b.paymentDetails?.paymentDate || b.requestDate || 0).getTime() -
          new Date(a.paymentDetails?.paymentDate || a.requestDate || 0).getTime()
      );
  }, [documentRequests]);

  const filteredPayments = React.useMemo(() => {
    const q = searchQuery.toLowerCase();
    return verifiedPayments.filter(
      (req) =>
        (req.residentName || '').toLowerCase().includes(q) ||
        (req.trackingNumber || '').toLowerCase().includes(q) ||
        (req.documentType || '').toLowerCase().includes(q) ||
        (req.paymentDetails?.referenceNumber || '').toLowerCase().includes(q)
    );
  }, [verifiedPayments, searchQuery]);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems,
    setCurrentPage,
    setPageSize,
  } = usePagination(filteredPayments, { initialPageSize: 10 });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5EAF2]">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#246BDE]">
              <Receipt className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172B4D]">
                Verified Payment Transactions
              </h3>
              <p className="text-xs text-[#718096]">
                A complete audit log of verified document fees and released certificates.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#718096]" />
            <Input
              placeholder="Search payments..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 pl-9 rounded-xl border-[#E2E8F0] bg-white text-xs text-[#172B4D]"
            />
          </div>
        </div>

        <div className="overflow-x-auto pt-3">
          <Table>
            <TableHeader>
              <tr className="border-b border-[#E5EAF2] bg-[#F8FAFC] text-xs font-semibold text-[#718096]">
                <TableHead className="py-3 px-4 font-semibold">Resident</TableHead>
                <TableHead className="py-3 px-4 font-semibold">Document Type</TableHead>
                <TableHead className="py-3 px-4 font-semibold">Amount Paid</TableHead>
                <TableHead className="py-3 px-4 font-semibold">Payment Status</TableHead>
              </tr>
            </TableHeader>
            <TableBody className="divide-y divide-[#F1F5F9]">
              {paginatedItems.length > 0 ? (
                paginatedItems.map((req) => (
                  <TableRow key={req.id} className="hover:bg-[#F9FAFC] transition-colors">
                    <TableCell className="py-3.5 px-4">
                      <div className="font-semibold text-sm text-[#172B4D]">{req.residentName}</div>
                      <div className="text-xs font-mono text-[#718096]">{req.trackingNumber}</div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs font-medium text-[#172B4D]">
                      {req.documentType}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 font-bold text-sm text-[#10A875]">
                      ₱{(Number(req.amount) || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      {req.status === 'Payment Verified' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF2FF] text-[#246BDE] border border-[#BFDBFE]">
                          Payment Verified
                        </span>
                      )}
                      {req.status === 'Ready for Pickup' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#10A875] border border-[#A7F3D0]">
                          Ready for Pickup
                        </span>
                      )}
                      {req.status === 'Released' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                          Released
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-xs text-[#718096]">
                    No verified payment transactions found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {filteredPayments.length > 0 && (
          <div className="border-t border-[#E5EAF2] px-4 py-2 bg-[#F8FAFC]">
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="transactions"
            />
          </div>
        )}
      </div>
    </div>
  );
}
