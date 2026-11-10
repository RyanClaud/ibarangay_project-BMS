'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Calendar,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/app-context';
import type { IncidentReport, IncidentStatus } from '@/lib/types';
import { usePagination } from '@/hooks/use-pagination';
import { PaginationControl } from '@/components/ui/pagination-control';

export default function IncidentReportsPage() {
  const { currentUser, incidents, addIncident, updateIncidentStatus, isDataLoading } =
    useAppContext();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);

  // Form states (used by residents)
  const [respondent, setRespondent] = useState('');
  const [incidentType, setIncidentType] = useState('Neighborhood Disturbance');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const isResident = currentUser?.role === 'Resident';
  const isSecretaryOrCaptain =
    currentUser?.role === 'Secretary' ||
    currentUser?.role === 'Barangay Captain' ||
    currentUser?.role === 'Admin' ||
    currentUser?.isSuperAdmin;

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondent || !description) return;

    try {
      setIsSubmitting(true);
      await addIncident({
        complainant: currentUser?.name || 'Resident Complainant',
        respondent,
        type: incidentType,
        location: location || 'Barangay Mina de Oro',
        description,
      });

      setIsAddOpen(false);
      setRespondent('');
      setLocation('');
      setDescription('');

      toast({
        title: 'Incident Report Filed',
        description: 'Your report has been submitted to the Barangay Hall for review and mediation.',
      });
    } catch (error: any) {
      toast({
        title: 'Filing Failed',
        description: error.message || 'Could not record your incident report.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: IncidentStatus) => {
    try {
      await updateIncidentStatus(id, newStatus);
      setSelectedIncident(null);
      toast({
        title: 'Case Status Updated',
        description: `Case status has been updated to ${newStatus}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Could not update status.',
        variant: 'destructive',
      });
    }
  };

  // Filter complaints: If resident, show their filed complaints
  const allIncidents = incidents || [];
  const displayedIncidents = allIncidents.filter((item) => {
    if (isResident) {
      return (
        item.residentId === currentUser?.id ||
        item.complainant.toLowerCase() === (currentUser?.name || '').toLowerCase()
      );
    }
    return true;
  });

  const filteredIncidents = displayedIncidents.filter((item) => {
    const matchesSearch =
      item.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.complainant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.respondent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Table pagination
  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems,
    setCurrentPage,
    setPageSize,
  } = usePagination(filteredIncidents, { initialPageSize: 10 });

  // Dynamic statistics
  const totalCases = displayedIncidents.length;
  const unresolved = displayedIncidents.filter((i) => i.status === 'Unresolved').length;
  const underInvestigation = displayedIncidents.filter(
    (i) => i.status === 'Under Investigation'
  ).length;
  const settledOrResolved = displayedIncidents.filter(
    (i) => i.status === 'Resolved' || i.status === 'Settled'
  ).length;

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'Unresolved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF2F2] text-[#EF4655] border border-[#FECACA]">
            Unresolved
          </span>
        );
      case 'Under Investigation':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF7ED] text-[#FFA51E] border border-[#FED7AA]">
            Under Investigation
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#10A875] border border-[#A7F3D0]">
            Resolved
          </span>
        );
      case 'Settled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF2FF] text-[#246BDE] border border-[#BFDBFE]">
            Settled Amicably
          </span>
        );
    }
  };

  const formatDate = (isoOrStr: string) => {
    if (!isoOrStr) return '—';
    const d = new Date(isoOrStr);
    if (isNaN(d.getTime())) return isoOrStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172B4D]">
            {isResident ? 'My Filed Complaints & Blotter Reports' : 'Barangay Complaints & Incident Management'}
          </h1>
          <p className="text-sm text-[#718096] mt-1">
            {isResident
              ? 'Track the status of incidents or complaints you have filed with the barangay hall.'
              : 'Managed by the Barangay Secretary & Punong Barangay for peace, order, and dispute resolution.'}
          </p>
        </div>

        {/* Resident File Complaint Button (Residents feature) */}
        {isResident && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#246BDE] hover:bg-[#1E5CC0] text-white rounded-xl shadow-xs gap-2 font-semibold h-10 px-4">
                <Plus className="size-4.5" />
                <span>File a Complaint</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg rounded-2xl p-6">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-[#172B4D]">
                  File Incident / Blotter Report
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateIncident} className="space-y-4 pt-2">
                <div className="p-3 bg-[#EAF2FF] rounded-xl text-xs text-[#246BDE]">
                  <strong>Complainant:</strong> {currentUser?.name || 'Resident'}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#172B4D]">
                    Respondent Name (Person you are filing against)
                  </Label>
                  <Input
                    required
                    placeholder="Full name of respondent"
                    value={respondent}
                    onChange={(e) => setRespondent(e.target.value)}
                    className="rounded-xl border-[#E2E8F0]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#172B4D]">
                    Type of Incident
                  </Label>
                  <Select value={incidentType} onValueChange={setIncidentType}>
                    <SelectTrigger className="rounded-xl border-[#E2E8F0]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Neighborhood Disturbance">
                        Neighborhood Noise / Disturbance
                      </SelectItem>
                      <SelectItem value="Boundary & Fence Dispute">
                        Boundary & Property Dispute
                      </SelectItem>
                      <SelectItem value="Sanitation Violation">
                        Sanitation / Garbage Dumping
                      </SelectItem>
                      <SelectItem value="Physical Altercation">
                        Harassment / Altercation
                      </SelectItem>
                      <SelectItem value="Financial Obligation">
                        Financial Obligation / Debt
                      </SelectItem>
                      <SelectItem value="Other">Other Community Grievance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#172B4D]">
                    Location / Purok
                  </Label>
                  <Input
                    placeholder="e.g. Purok 3, Near Chapel"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="rounded-xl border-[#E2E8F0]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#172B4D]">
                    Statement / Details
                  </Label>
                  <Textarea
                    required
                    rows={4}
                    placeholder="Describe what occurred, dates, times, and witnesses..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="rounded-xl border-[#E2E8F0]"
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddOpen(false)}
                    className="rounded-xl"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#246BDE] hover:bg-[#1E5CC0] text-white rounded-xl gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                    <span>Submit Report</span>
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Dynamic Metric Cards (No Mock Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-full bg-[#EAF2FF] text-[#246BDE] flex items-center justify-center">
              <ShieldAlert className="size-5.5" />
            </div>
            <div>
              <p className="text-xs text-[#718096]">Total Cases</p>
              <h3 className="text-2xl font-bold text-[#172B4D]">{totalCases}</h3>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-full bg-[#FEF2F2] text-[#EF4655] flex items-center justify-center">
              <AlertTriangle className="size-5.5" />
            </div>
            <div>
              <p className="text-xs text-[#718096]">Unresolved</p>
              <h3 className="text-2xl font-bold text-[#EF4655]">{unresolved}</h3>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-full bg-[#FFF7ED] text-[#FFA51E] flex items-center justify-center">
              <Clock className="size-5.5" />
            </div>
            <div>
              <p className="text-xs text-[#718096]">Under Investigation</p>
              <h3 className="text-2xl font-bold text-[#FFA51E]">{underInvestigation}</h3>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-full bg-[#ECFDF5] text-[#10A875] flex items-center justify-center">
              <CheckCircle2 className="size-5.5" />
            </div>
            <div>
              <p className="text-xs text-[#718096]">Settled / Resolved</p>
              <h3 className="text-2xl font-bold text-[#10A875]">{settledOrResolved}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E5EAF2]">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#718096]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by case #, name, or type..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#F0F4FA] border border-[#E2E8F0] text-sm text-[#172B4D] placeholder-[#718096] focus:bg-white focus:border-[#246BDE] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['All', 'Unresolved', 'Under Investigation', 'Resolved', 'Settled'].map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === status
                    ? 'bg-[#246BDE] text-white shadow-xs'
                    : 'bg-[#F4F7FC] text-[#718096] hover:text-[#172B4D]'
                }`}
              >
                {status}
              </button>
            )
          )}
        </div>
      </div>

      {/* Incidents Table */}
      <div className="rounded-2xl border border-[#E5EAF2] bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E5EAF2] bg-[#F8FAFC] text-xs font-semibold text-[#718096]">
                <th className="py-3 px-4">Case #</th>
                <th className="py-3 px-4">Complainant vs Respondent</th>
                <th className="py-3 px-4">Incident Type</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Date Filed</th>
                <th className="py-3 px-4">Status</th>
                {isSecretaryOrCaptain && <th className="py-3 px-4 text-right">Secretary Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {paginatedItems.length > 0 ? (
                paginatedItems.map((inc) => (
                  <tr key={inc.id} className="hover:bg-[#F9FAFC] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-xs text-[#246BDE]">
                      {inc.caseNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#172B4D]">
                        {inc.complainant}
                      </div>
                      <div className="text-xs text-[#718096]">
                        vs {inc.respondent}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#172B4D] font-medium text-xs">
                      {inc.type}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#718096]">
                      {inc.location}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#718096] whitespace-nowrap">
                      {formatDate(inc.dateFiled)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(inc.status)}
                    </td>
                    {isSecretaryOrCaptain && (
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Dialog
                          open={selectedIncident?.id === inc.id}
                          onOpenChange={(open) => !open && setSelectedIncident(null)}
                        >
                          <DialogTrigger asChild>
                            <button
                              onClick={() => setSelectedIncident(inc)}
                              className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-[#EAF2FF] text-[#246BDE] hover:bg-[#D4E5FE] transition-colors"
                            >
                              Manage Case
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md rounded-2xl p-6">
                            <DialogHeader>
                              <DialogTitle className="text-base font-bold text-[#172B4D]">
                                Manage Blotter: {inc.caseNumber}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 py-2 text-xs">
                              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2] space-y-1">
                                <p className="font-semibold text-[#172B4D]">
                                  {inc.complainant} vs {inc.respondent}
                                </p>
                                <p className="text-[#718096]">{inc.type} • {inc.location}</p>
                                <p className="text-[#172B4D] pt-1 italic">&quot;{inc.description}&quot;</p>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs font-semibold text-[#172B4D]">
                                  Update Case Status
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateStatus(inc.id, 'Under Investigation')}
                                    className="text-xs rounded-xl border-[#FED7AA] text-[#EA580C] hover:bg-[#FFF7ED]"
                                  >
                                    Under Investigation
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateStatus(inc.id, 'Settled')}
                                    className="text-xs rounded-xl border-[#BFDBFE] text-[#246BDE] hover:bg-[#EAF2FF]"
                                  >
                                    Settled Amicably
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateStatus(inc.id, 'Resolved')}
                                    className="text-xs rounded-xl border-[#A7F3D0] text-[#10A875] hover:bg-[#ECFDF5]"
                                  >
                                    Case Resolved
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateStatus(inc.id, 'Unresolved')}
                                    className="text-xs rounded-xl border-[#FECACA] text-[#EF4655] hover:bg-[#FEF2F2]"
                                  >
                                    Mark Unresolved
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-[#718096]">
                    {isDataLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="size-5 animate-spin text-[#246BDE]" />
                        <span>Loading incident records...</span>
                      </div>
                    ) : isResident ? (
                      'You have not filed any incident reports. Click "File a Complaint" above if you need assistance.'
                    ) : (
                      'No complaints match the filter criteria.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        {filteredIncidents.length > 0 && (
          <div className="border-t border-[#E5EAF2] px-4 py-2 bg-[#F8FAFC]">
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="complaints"
            />
          </div>
        )}
      </div>
    </div>
  );
}
