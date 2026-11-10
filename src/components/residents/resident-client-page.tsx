'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileDown, MoreHorizontal, Search, Info, FileText, FileSpreadsheet } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Resident } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { EditResidentDialog } from './edit-resident-dialog';
import { DeleteResidentDialog } from './delete-resident-dialog';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/app-context';
import { usePagination } from '@/hooks/use-pagination';
import { PaginationControl } from '@/components/ui/pagination-control';
import { exportResidentMasterlist } from '@/lib/reports';

export function ResidentClientPage() {
  const { residents, updateResident, deleteResident, barangayConfig, users } = useAppContext();
  const [filter, setFilter] = React.useState('');
  const [residentToEdit, setResidentToEdit] = React.useState<Resident | null>(null);
  const [residentToDelete, setResidentToDelete] = React.useState<Resident | null>(null);
  const router = useRouter();

  const officials = React.useMemo(() => {
    const sec = (users || []).find((u) => u.role === 'Secretary');
    const cap = (users || []).find((u) => u.role === 'Barangay Captain');
    return {
      secretaryName: sec?.name,
      captainName: cap?.name || barangayConfig?.captainName,
    };
  }, [users, barangayConfig]);

  const filteredData = React.useMemo(() => {
    return (residents || [])
      .filter(
        (resident) =>
          resident.firstName.toLowerCase().includes(filter.toLowerCase()) ||
          resident.lastName.toLowerCase().includes(filter.toLowerCase()) ||
          resident.userId.toLowerCase().includes(filter.toLowerCase()) ||
          resident.purok?.toLowerCase().includes(filter.toLowerCase())
      )
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [residents, filter]);

  // Table pagination
  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems,
    setCurrentPage,
    setPageSize,
  } = usePagination(filteredData, { initialPageSize: 10 });

  const handleUpdateResident = (residentId: string, dataToUpdate: Partial<Resident>) => {
    updateResident(residentId, dataToUpdate);
    setResidentToEdit(null);
  };

  const handleDeleteResident = (residentId: string) => {
    deleteResident(residentId);
    setResidentToDelete(null);
  };

  const handleViewProfile = (residentId: string) => {
    router.push(`/residents/${residentId}`);
  };

  const handleExportPdf = () => {
    if (filteredData && filteredData.length > 0) {
      exportResidentMasterlist('pdf', filteredData, barangayConfig, officials);
    }
  };

  const handleExportExcel = () => {
    if (filteredData && filteredData.length > 0) {
      exportResidentMasterlist('excel', filteredData, barangayConfig, officials);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Information Banner */}
      <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#EAF2FF] border border-[#BFDBFE] text-[#172B4D]">
        <div className="flex size-9 items-center justify-center rounded-xl bg-white text-[#246BDE] shrink-0 shadow-xs">
          <Info className="size-5" />
        </div>
        <div className="text-xs sm:text-sm">
          <span className="font-bold text-[#172B4D]">Resident Self-Registration:</span>{' '}
          <span className="text-[#4A5568]">
            Residents can register accounts online at <strong className="text-[#246BDE]">/register</strong> and their profiles will automatically sync to this directory.
          </span>
        </div>
      </div>

      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border border-[#E5EAF2] bg-white shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#718096]" />
          <Input
            placeholder="Search by name, Purok, or User ID..."
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] placeholder-[#718096] focus:bg-white focus:border-[#246BDE] outline-none"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-[#718096] font-medium mr-2 hidden sm:inline">
            {filteredData.length} resident records
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="rounded-xl border-[#E5EAF2] text-xs font-semibold text-[#172B4D] hover:bg-[#F8FAFC] h-10 gap-2"
              >
                <FileDown className="size-4 text-[#246BDE]" />
                <span>Export Masterlist</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl border-[#E5EAF2] p-1.5 shadow-lg">
              <DropdownMenuLabel className="text-xs font-semibold text-[#718096]">
                Official Export Formats
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={handleExportPdf}
                className="cursor-pointer text-xs rounded-lg px-2.5 py-2 font-medium text-[#172B4D] hover:bg-[#F0F4FA]"
              >
                <FileText className="mr-2 size-4 text-[#EF4655]" />
                <span>Download Official PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportExcel}
                className="cursor-pointer text-xs rounded-lg px-2.5 py-2 font-medium text-[#172B4D] hover:bg-[#F0F4FA]"
              >
                <FileSpreadsheet className="mr-2 size-4 text-[#10A875]" />
                <span>Download Excel (.xlsx)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Residents Table */}
      <div className="rounded-2xl border border-[#E5EAF2] bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <tr className="border-b border-[#E5EAF2] bg-[#F8FAFC] text-xs font-semibold text-[#718096]">
                <TableHead className="py-3 px-4 font-semibold">User ID</TableHead>
                <TableHead className="py-3 px-4 font-semibold">Full Name</TableHead>
                <TableHead className="hidden sm:table-cell py-3 px-4 font-semibold">Address / Purok</TableHead>
                <TableHead className="hidden md:table-cell py-3 px-4 font-semibold">Birthdate</TableHead>
                <TableHead className="text-right py-3 px-4 font-semibold">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody className="divide-y divide-[#F1F5F9]">
              {paginatedItems.length ? (
                paginatedItems.map((resident) => (
                  <TableRow
                    key={resident.id}
                    className="hover:bg-[#F9FAFC] transition-colors"
                  >
                    <TableCell className="py-3.5 px-4 font-medium">
                      <span className="px-2.5 py-1 bg-[#EAF2FF] text-[#246BDE] rounded-lg text-xs font-mono font-semibold">
                        {resident.userId}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 border border-[#E5EAF2]">
                          <AvatarImage src={resident.avatarUrl || undefined} alt={resident.firstName} />
                          <AvatarFallback className="bg-[#EAF2FF] text-[#246BDE] font-bold text-xs">
                            {resident.firstName?.[0]}
                            {resident.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-sm text-[#172B4D]">
                            {resident.firstName} {resident.lastName}
                          </div>
                          <div className="text-xs text-[#718096] md:hidden">
                            {resident.purok || resident.address}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell py-3.5 px-4 text-xs text-[#4A5568]">
                      {resident.purok ? `${resident.purok}, ` : ''}{resident.address}
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-3.5 px-4 text-xs text-[#718096]">
                      {resident.birthdate}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                            className="size-8 rounded-lg hover:bg-[#F0F4FA] text-[#718096] hover:text-[#172B4D]"
                          >
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl border-[#E5EAF2] p-1.5 shadow-lg">
                          <DropdownMenuLabel className="text-xs font-semibold text-[#718096] px-2 py-1">
                            Resident Options
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleViewProfile(resident.id)}
                            className="cursor-pointer text-xs rounded-lg px-2.5 py-2 text-[#172B4D]"
                          >
                            View Resident Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setResidentToEdit(resident)}
                            className="cursor-pointer text-xs rounded-lg px-2.5 py-2 text-[#172B4D]"
                          >
                            Edit Resident Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-[#EF4655] hover:bg-[#FEF2F2] cursor-pointer text-xs rounded-lg px-2.5 py-2 font-medium"
                            onClick={() => setResidentToDelete(resident)}
                          >
                            Delete Record
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center py-10">
                    <div className="flex flex-col items-center justify-center gap-1.5 text-[#718096]">
                      <p className="font-semibold text-sm text-[#172B4D]">No residents found</p>
                      <p className="text-xs">Try adjusting your search criteria</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Table Pagination */}
        {filteredData.length > 0 && (
          <div className="border-t border-[#E5EAF2] px-4 py-2 bg-[#F8FAFC]">
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="residents"
            />
          </div>
        )}
      </div>

      {residentToEdit && (
        <EditResidentDialog
          isOpen={!!residentToEdit}
          onClose={() => setResidentToEdit(null)}
          onUpdateResident={handleUpdateResident}
          resident={residentToEdit}
        />
      )}
      {residentToDelete && (
        <DeleteResidentDialog
          isOpen={!!residentToDelete}
          onClose={() => setResidentToDelete(null)}
          onConfirm={() => handleDeleteResident(residentToDelete.id)}
          residentName={`${residentToDelete.firstName} ${residentToDelete.lastName}`}
        />
      )}
    </div>
  );
}
