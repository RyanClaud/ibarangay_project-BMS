'use client';

import { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/app-context';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  Receipt,
  Plus,
  Calendar,
  Clock,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';
import { RequestForm } from '@/components/requests/request-form';
import { DocumentStatusAlert } from '@/components/notifications/document-status-alert';
import { PaymentDialog } from '@/components/requests/payment-dialog';
import { PaymentReceipt } from '@/components/documents/payment-receipt';
import { UpcomingEventsCard } from '@/components/dashboard/upcoming-events-card';
import { ResidentInfoCarousel } from '@/components/dashboard/resident-info-carousel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { DocumentRequest, DocumentRequestStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<DocumentRequestStatus, string> = {
  Pending: 'bg-[#FFF7ED] text-[#FFA51E] border-[#FED7AA]',
  Approved: 'bg-[#ECFDF5] text-[#10A875] border-[#A7F3D0]',
  'Payment Submitted': 'bg-[#F3E8FF] text-[#8B5CF6] border-[#E9D5FF]',
  'Payment Verified': 'bg-[#EAF2FF] text-[#246BDE] border-[#BFDBFE]',
  'Ready for Pickup': 'bg-[#ECFDF5] text-[#10A875] border-[#A7F3D0]',
  Released: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
  Rejected: 'bg-[#FEF2F2] text-[#EF4655] border-[#FECACA]',
};

interface ResidentComplaint {
  id: string;
  caseNumber: string;
  respondent: string;
  type: string;
  location: string;
  dateFiled: string;
  status: 'Unresolved' | 'Under Investigation' | 'Resolved' | 'Settled';
  description: string;
}

export function ResidentDashboardView() {
  const { currentUser, documentRequests, incidents, addIncident } = useAppContext();
  const { toast } = useToast();

  const [paymentRequest, setPaymentRequest] = useState<DocumentRequest | null>(null);
  const [receiptRequest, setReceiptRequest] = useState<DocumentRequest | null>(null);

  // Complaints from database for this resident
  const complaints = useMemo(() => {
    return (incidents || []).filter(
      (c) =>
        c.residentId === currentUser?.id ||
        c.complainant.toLowerCase() === (currentUser?.name || '').toLowerCase()
    );
  }, [incidents, currentUser]);

  // File complaint modal
  const [isFileComplaintOpen, setIsFileComplaintOpen] = useState(false);
  const [respondent, setRespondent] = useState('');
  const [incidentType, setIncidentType] = useState('Neighborhood Disturbance');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const residentRequests = useMemo(() => {
    return documentRequests || [];
  }, [documentRequests]);

  const totalRequests = residentRequests.length;
  const completedRequests = residentRequests.filter(
    (r) => r.status === 'Released'
  ).length;

  const handleFileComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondent || !description) return;

    try {
      await addIncident({
        complainant: currentUser?.name || 'Resident',
        respondent,
        type: incidentType,
        location: location || 'Barangay Mina de Oro',
        description,
      });

      setIsFileComplaintOpen(false);
      setRespondent('');
      setLocation('');
      setDescription('');

      toast({
        title: 'Complaint Submitted to Barangay Hall',
        description: 'Your incident report has been recorded. The Barangay Secretary will review and schedule mediation.',
      });
    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error.message || 'Could not submit report.',
        variant: 'destructive',
      });
    }
  };

  const getComplaintBadge = (status: ResidentComplaint['status']) => {
    switch (status) {
      case 'Unresolved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF2F2] text-[#EF4655] border border-[#FECACA]">
            Pending Review
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Payment Dialog */}
      {paymentRequest && (
        <PaymentDialog
          isOpen={!!paymentRequest}
          onClose={() => setPaymentRequest(null)}
          request={paymentRequest}
        />
      )}

      {/* Official Receipt Dialog */}
      {receiptRequest && (
        <Dialog
          open={!!receiptRequest}
          onOpenChange={(open) => !open && setReceiptRequest(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#172B4D]">
                Official Barangay Receipt
              </DialogTitle>
            </DialogHeader>
            <PaymentReceipt request={receiptRequest} />
          </DialogContent>
        </Dialog>
      )}

      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Resident Informational Carousel (Events, Public Services, Blotters, Emergency Contacts) */}
      <ResidentInfoCarousel
        onFileComplaint={() => setIsFileComplaintOpen(true)}
      />

      {/* Resident Document Status Alerts */}
      <DocumentStatusAlert
        requests={residentRequests}
        onPayNow={(request) => setPaymentRequest(request)}
      />

      {/* Resident KPI Cards & Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#2474E8] text-white shrink-0">
            <FileText className="size-6" />
          </div>
          <div>
            <p className="text-xs text-[#718096] font-medium">My Total Requests</p>
            <h3 className="text-2xl font-bold text-[#172B4D]">{totalRequests}</h3>
            <p className="text-[11px] text-[#2474E8] font-semibold">Active Clearances</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#10A875] text-white shrink-0">
            <CheckCircle2 className="size-6" />
          </div>
          <div>
            <p className="text-xs text-[#718096] font-medium">Released Documents</p>
            <h3 className="text-2xl font-bold text-[#172B4D]">{completedRequests}</h3>
            <p className="text-[11px] text-[#10A875] font-semibold">Ready for pickup</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#EF4655] text-white shrink-0">
            <ShieldAlert className="size-6" />
          </div>
          <div>
            <p className="text-xs text-[#718096] font-medium">My Filed Complaints</p>
            <h3 className="text-2xl font-bold text-[#172B4D]">{complaints.length}</h3>
            <p className="text-[11px] text-[#EF4655] font-semibold">Blotter Cases</p>
          </div>
        </div>
      </div>

      {/* Resident Main Section: Actions (Left) & Upcoming Barangay Events (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 xl:col-span-7 space-y-4 flex flex-col justify-between">
          {/* Action 1: Request Document Card */}
          <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs flex-1 flex flex-col justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#246BDE] shrink-0">
                <FileText className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172B4D]">
                  Request Barangay Clearance / Certificate
                </h3>
                <p className="text-xs text-[#718096] mt-0.5">
                  Apply online for Indigency, Residency, Barangay Clearance, or Business Permits.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E5EAF2] flex justify-end">
              <a
                href="#request-form-section"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#246BDE] hover:underline"
              >
                Fill out form below ↓
              </a>
            </div>
          </div>

          {/* Action 2: File a Complaint Card */}
          <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs flex-1 flex flex-col justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#FFA51E] shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172B4D]">
                  File a Complaint / Report Incident
                </h3>
                <p className="text-xs text-[#718096] mt-0.5">
                  Report noise disturbance, boundary disputes, sanitation, or grievances for barangay mediation.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E5EAF2] flex justify-end">
              <Button
                onClick={() => setIsFileComplaintOpen(true)}
                className="bg-[#246BDE] hover:bg-[#1E5CC0] text-white text-xs font-semibold rounded-xl h-8 px-3.5 shadow-xs gap-1.5"
              >
                <Plus className="size-3.5" />
                <span>File Complaint Now</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Right side: Live Upcoming Barangay Events Card */}
        <div id="upcoming-events-section" className="lg:col-span-5 xl:col-span-5 flex flex-col scroll-mt-24">
          <UpcomingEventsCard />
        </div>
      </div>

      {/* File Complaint Modal Dialog */}
      <Dialog open={isFileComplaintOpen} onOpenChange={setIsFileComplaintOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#172B4D]">
              File a Barangay Complaint / Blotter Incident
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFileComplaint} className="space-y-4 pt-2">
            <div className="p-3 bg-[#EAF2FF] rounded-xl text-xs text-[#246BDE]">
              <strong>Complainant:</strong> {currentUser?.name || 'Resident'} (Your account name will be logged as the official complainant)
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#172B4D]">
                Respondent Name (Person you are filing against)
              </Label>
              <Input
                required
                placeholder="Full name or party involved"
                value={respondent}
                onChange={(e) => setRespondent(e.target.value)}
                className="rounded-xl border-[#E2E8F0]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#172B4D]">
                Type of Complaint / Violation
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
                    Debt / Financial Obligation
                  </SelectItem>
                  <SelectItem value="Other">Other Community Complaint</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#172B4D]">
                Location of Incident
              </Label>
              <Input
                placeholder="e.g. Purok 3, Barangay Mina de Oro"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="rounded-xl border-[#E2E8F0]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#172B4D]">
                Detailed Statement &amp; Facts
              </Label>
              <Textarea
                required
                rows={4}
                placeholder="Please describe what happened, dates, times, and any witnesses..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl border-[#E2E8F0]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFileComplaintOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#246BDE] hover:bg-[#1E5CC0] text-white rounded-xl"
              >
                Submit Official Blotter
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tabs: My Documents vs My Filed Complaints */}
      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="bg-white p-1 border border-[#E5EAF2] rounded-xl h-auto">
          <TabsTrigger
            value="requests"
            className="rounded-lg text-xs font-semibold px-4 py-2 data-[state=active]:bg-[#246BDE] data-[state=active]:text-white"
          >
            My Document Requests ({residentRequests.length})
          </TabsTrigger>
          <TabsTrigger
            value="complaints"
            className="rounded-lg text-xs font-semibold px-4 py-2 data-[state=active]:bg-[#246BDE] data-[state=active]:text-white"
          >
            My Filed Complaints ({complaints.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Documents */}
        <TabsContent value="requests" className="mt-4">
          <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#E5EAF2] bg-[#F8FAFC]">
                    <TableHead className="font-semibold text-xs text-[#718096]">Tracking No.</TableHead>
                    <TableHead className="font-semibold text-xs text-[#718096]">Document</TableHead>
                    <TableHead className="font-semibold text-xs text-[#718096]">Date</TableHead>
                    <TableHead className="font-semibold text-xs text-[#718096]">Amount</TableHead>
                    <TableHead className="font-semibold text-xs text-[#718096]">Status</TableHead>
                    <TableHead className="text-right font-semibold text-xs text-[#718096]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {residentRequests.length ? (
                    residentRequests.map((request) => (
                      <TableRow key={request.id} className="hover:bg-[#F9FAFC] transition-colors">
                        <TableCell className="font-medium">
                          <span className="px-2.5 py-1 bg-[#EAF2FF] text-[#246BDE] rounded-lg text-xs font-mono font-semibold">
                            {request.trackingNumber}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-[#172B4D]">
                          {request.documentType}
                        </TableCell>
                        <TableCell className="text-[#718096] text-xs">
                          {new Date(request.requestDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="font-semibold text-[#172B4D]">
                          ₱{request.amount?.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              'font-semibold text-xs rounded-full',
                              statusColors[request.status]
                            )}
                          >
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {request.status === 'Approved' && request.amount > 0 && (
                              <Button
                                size="sm"
                                onClick={() => setPaymentRequest(request)}
                                className="h-8 bg-[#246BDE] hover:bg-[#1E5CC0] text-white text-xs rounded-lg"
                              >
                                <Banknote className="mr-1.5 size-3.5" />
                                Pay Now
                              </Button>
                            )}
                            {(request.status === 'Payment Verified' ||
                              request.status === 'Ready for Pickup' ||
                              request.status === 'Released') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setReceiptRequest(request)}
                                className="h-8 text-xs rounded-lg border-[#E2E8F0]"
                              >
                                <Receipt className="mr-1.5 size-3.5" />
                                Receipt
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-28 text-center text-[#718096] text-xs">
                        No document requests yet. Use the form below to apply.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Complaints */}
        <TabsContent value="complaints" className="mt-4">
          <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#E5EAF2] bg-[#F8FAFC]">
                    <TableHead className="font-semibold text-xs text-[#718096]">Case #</TableHead>
                    <TableHead className="font-semibold text-xs text-[#718096]">Respondent</TableHead>
                    <TableHead className="font-semibold text-xs text-[#718096]">Incident Type</TableHead>
                    <TableHead className="font-semibold text-xs text-[#718096]">Location</TableHead>
                    <TableHead className="font-semibold text-xs text-[#718096]">Date Filed</TableHead>
                    <TableHead className="font-semibold text-xs text-[#718096]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.length ? (
                    complaints.map((c) => (
                      <TableRow key={c.id} className="hover:bg-[#F9FAFC] transition-colors">
                        <TableCell className="font-mono font-semibold text-xs text-[#246BDE]">
                          {c.caseNumber}
                        </TableCell>
                        <TableCell className="font-semibold text-[#172B4D]">
                          {c.respondent}
                        </TableCell>
                        <TableCell className="text-[#172B4D] font-medium text-xs">
                          {c.type}
                        </TableCell>
                        <TableCell className="text-[#718096] text-xs">
                          {c.location}
                        </TableCell>
                        <TableCell className="text-[#718096] text-xs">
                          {c.dateFiled}
                        </TableCell>
                        <TableCell>
                          {getComplaintBadge(c.status)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-28 text-center text-[#718096] text-xs">
                        You have not filed any complaints. Click &quot;File Complaint Now&quot; if you need barangay assistance.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Request New Document Form Section */}
      <div id="request-form-section" className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#172B4D]">
            Request a New Document
          </h2>
          <p className="text-xs text-[#718096]">
            Fill out the form below. Your resident records will be automatically verified.
          </p>
        </div>
        <RequestForm />
      </div>
    </div>
  );
}

