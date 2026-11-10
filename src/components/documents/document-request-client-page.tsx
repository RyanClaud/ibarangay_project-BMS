"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, CheckCircle, XCircle, FileSearch, Check, Trash2, Upload, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { DocumentRequest, DocumentRequestStatus } from "@/lib/types";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppContext } from "@/contexts/app-context";
import { toast } from "@/hooks/use-toast";
import { PaymentUploadDialog } from "./payment-upload-dialog";
import { PaymentVerificationDialog } from "./payment-verification-dialog";
import { PaymentReceipt } from "./payment-receipt";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationControl } from "@/components/ui/pagination-control";

const statusColors: Record<DocumentRequestStatus, string> = {
  Pending: "bg-[#FFF7ED] text-[#FFA51E] border-[#FED7AA]",
  Approved: "bg-[#ECFDF5] text-[#10A875] border-[#A7F3D0]",
  "Payment Submitted": "bg-[#F3E8FF] text-[#8B5CF6] border-[#E9D5FF]",
  "Payment Verified": "bg-[#EAF2FF] text-[#246BDE] border-[#BFDBFE]",
  "Ready for Pickup": "bg-[#ECFDF5] text-[#10A875] border-[#A7F3D0]",
  Released: "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]",
  Rejected: "bg-[#FEF2F2] text-[#EF4655] border-[#FECACA]",
};

const TABS: DocumentRequestStatus[] = ["Pending", "Approved", "Payment Submitted", "Payment Verified", "Ready for Pickup", "Released", "Rejected"];

export function DocumentRequestClientPage() {
  const { documentRequests, updateDocumentRequestStatus, deleteDocumentRequest, currentUser } = useAppContext();
  const [filter, setFilter] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<DocumentRequestStatus | 'All'>('Pending');
  const [selectedRequest, setSelectedRequest] = React.useState<DocumentRequest | null>(null);
  const [showPaymentUpload, setShowPaymentUpload] = React.useState(false);
  const [showPaymentVerification, setShowPaymentVerification] = React.useState(false);
  const [showReceipt, setShowReceipt] = React.useState(false);
  const router = useRouter();

  const handleStatusChange = (id: string, status: DocumentRequestStatus) => {
    updateDocumentRequestStatus(id, status);
    toast({
      title: "Request Updated",
      description: `Request status has been changed to ${status}.`,
    });
  };

  const handleDelete = (id: string) => {
    deleteDocumentRequest(id);
    toast({
      title: "Request Deleted",
      description: `The request has been permanently removed.`,
      variant: "destructive",
    });
  }

  const handleViewCertificate = (requestId: string) => {
    router.push(`/documents/certificate/${requestId}`);
  };

  const filteredData = React.useMemo(() => {
    return (documentRequests || []).filter(
      (request) =>
        (request.residentName.toLowerCase().includes(filter.toLowerCase()) ||
        (request.trackingNumber && request.trackingNumber.toLowerCase().includes(filter.toLowerCase()))) &&
        (activeTab === 'All' || request.status === activeTab)
    ).sort((a,b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  }, [documentRequests, filter, activeTab]);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems,
    setCurrentPage,
    setPageSize,
  } = usePagination(filteredData, { initialPageSize: 10 });

  // Role-based permissions
  const canApprove = currentUser?.role === 'Admin' || currentUser?.role === 'Barangay Captain' || currentUser?.role === 'Secretary';
  const canVerifyPayment = currentUser?.role === 'Admin' || currentUser?.role === 'Treasurer';
  const canMarkReady = currentUser?.role === 'Admin' || currentUser?.role === 'Secretary';
  const canRelease = currentUser?.role === 'Admin' || currentUser?.role === 'Secretary';
  const canDelete = currentUser?.role === 'Admin' || currentUser?.role === 'Barangay Captain';
  const isResident = currentUser?.role === 'Resident';

  const handleRefresh = () => {
    // Trigger refresh by closing dialogs
    setSelectedRequest(null);
  };

  const handleUploadPayment = (request: DocumentRequest) => {
    setSelectedRequest(request);
    setShowPaymentUpload(true);
  };

  const handleVerifyPayment = (request: DocumentRequest) => {
    setSelectedRequest(request);
    setShowPaymentVerification(true);
  };

  const handleViewReceipt = (request: DocumentRequest) => {
    setSelectedRequest(request);
    setShowReceipt(true);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border border-[#E5EAF2] bg-white shadow-xs">
        <Input
          placeholder="Search by resident name or tracking number..."
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="max-w-full sm:max-w-md h-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] placeholder-[#718096] focus:bg-white focus:border-[#246BDE] outline-none"
        />
        <div className="text-xs font-semibold text-[#718096]">
          {filteredData.length} {filteredData.length === 1 ? 'request' : 'requests'} found
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="bg-white p-1 border border-[#E5EAF2] rounded-xl h-auto grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1">
          <TabsTrigger value="All" className="text-xs rounded-lg data-[state=active]:bg-[#246BDE] data-[state=active]:text-white">All</TabsTrigger>
          <TabsTrigger value="Pending" className="text-xs rounded-lg data-[state=active]:bg-[#246BDE] data-[state=active]:text-white">Pending</TabsTrigger>
          <TabsTrigger value="Approved" className="text-xs rounded-lg data-[state=active]:bg-[#246BDE] data-[state=active]:text-white">Approved</TabsTrigger>
          <TabsTrigger value="Payment Submitted" className="text-xs rounded-lg data-[state=active]:bg-[#246BDE] data-[state=active]:text-white">Payment</TabsTrigger>
          <TabsTrigger value="Payment Verified" className="text-xs rounded-lg data-[state=active]:bg-[#246BDE] data-[state=active]:text-white">Verified</TabsTrigger>
          <TabsTrigger value="Ready for Pickup" className="text-xs rounded-lg data-[state=active]:bg-[#246BDE] data-[state=active]:text-white">Ready</TabsTrigger>
          <TabsTrigger value="Released" className="text-xs rounded-lg data-[state=active]:bg-[#246BDE] data-[state=active]:text-white">Released</TabsTrigger>
          <TabsTrigger value="Rejected" className="text-xs rounded-lg data-[state=active]:bg-[#246BDE] data-[state=active]:text-white">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="rounded-2xl border border-[#E5EAF2] bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#E5EAF2] bg-[#F8FAFC] text-xs font-semibold text-[#718096] hover:bg-[#F8FAFC]">
              <TableHead className="hidden sm:table-cell font-semibold text-[#718096]">Tracking No.</TableHead>
              <TableHead className="font-semibold text-[#718096]">Resident</TableHead>
              <TableHead className="hidden md:table-cell font-semibold text-[#718096]">Document</TableHead>
              <TableHead className="hidden lg:table-cell font-semibold text-[#718096]">Date Requested</TableHead>
              <TableHead className="font-semibold text-[#718096]">Status</TableHead>
              <TableHead className="text-right font-semibold text-[#718096]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length ? (
              paginatedItems.map((request) => (
                <TableRow key={request.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium hidden sm:table-cell">
                    <span className="px-2.5 py-1 bg-[#EAF2FF] text-[#246BDE] rounded-lg text-xs font-mono font-semibold">
                      {request.trackingNumber}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{request.residentName}</div>
                    <div className="text-xs text-muted-foreground md:hidden">{request.documentType}</div>
                    <div className="text-xs text-muted-foreground sm:hidden font-mono">{request.trackingNumber}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm font-medium">{request.documentType}</span>
                    <div className="text-xs text-muted-foreground">₱{request.amount.toLocaleString()}</div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="text-sm font-medium">
                      {new Date(request.requestDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(request.requestDate).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <Badge variant="outline" className={cn("font-semibold text-xs", statusColors[request.status])}>
                        {request.status}
                      </Badge>
                      {/* Show Approve button for staff when pending */}
                      {canApprove && request.status === 'Pending' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleStatusChange(request.id, 'Approved')}
                          className="w-full bg-[#246BDE] hover:bg-[#1E5CC0] text-white rounded-lg text-xs"
                        >
                          <CheckCircle className="mr-2 h-3 w-3" />
                          Approve
                        </Button>
                      )}
                      {/* Show Upload Payment button for residents when approved (only if amount > 0) */}
                      {isResident && request.status === 'Approved' && request.residentId === currentUser?.id && request.amount > 0 && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleUploadPayment(request)}
                          className="w-full bg-[#246BDE] hover:bg-[#1E5CC0] text-white rounded-lg text-xs"
                        >
                          <Upload className="mr-2 h-3 w-3" />
                          Upload Payment
                        </Button>
                      )}
                      {/* Show Free badge for approved free documents */}
                      {isResident && request.status === 'Approved' && request.residentId === currentUser?.id && request.amount === 0 && (
                        <Badge variant="outline" className="bg-[#ECFDF5] text-[#10A875] border-[#A7F3D0]">
                          Free - No Payment Required
                        </Badge>
                      )}
                      {/* Show Mark as Ready button for Secretary when payment verified */}
                      {canMarkReady && request.status === 'Payment Verified' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleStatusChange(request.id, 'Ready for Pickup')}
                          className="w-full bg-[#10A875] hover:bg-[#0D875E] text-white rounded-lg text-xs"
                        >
                          <Check className="mr-2 h-3 w-3" />
                          Mark Ready
                        </Button>
                      )}
                      {/* Show Mark as Released button for Secretary when ready for pickup */}
                      {canRelease && request.status === 'Ready for Pickup' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleStatusChange(request.id, 'Released')}
                          className="w-full bg-[#246BDE] hover:bg-[#1E5CC0] text-white rounded-lg text-xs"
                        >
                          <Check className="mr-2 h-3 w-3" />
                          Mark Released
                        </Button>
                      )}
                      {/* Show View Receipt button when payment is verified */}
                      {(request.status === 'Payment Verified' || request.status === 'Ready for Pickup' || request.status === 'Released') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewReceipt(request)}
                          className="w-full rounded-lg border-[#E5EAF2] hover:bg-[#F8FAFC] text-xs font-semibold"
                        >
                          View Receipt
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost" className="hover:bg-[#F0F4FA] rounded-lg">
                          <MoreHorizontal className="h-4 w-4 text-[#718096]" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="font-semibold">Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => router.push(`/residents/${request.residentId}`)}>
                          <FileSearch /> View Resident
                        </DropdownMenuItem>

                        {(request.status === 'Payment Verified' || request.status === 'Ready for Pickup' || request.status === 'Released') && (
                          <DropdownMenuItem onClick={() => handleViewCertificate(request.id)}>
                            <FileSearch /> View Certificate
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />

                        {/* Approve (Captain/Admin) */}
                        {canApprove && request.status === 'Pending' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'Approved')}>
                            <CheckCircle /> Approve Request
                          </DropdownMenuItem>
                        )}
                        
                        {/* Upload Payment (Resident) - only for paid documents */}
                        {isResident && request.status === 'Approved' && request.residentId === currentUser?.id && request.amount > 0 && (
                          <DropdownMenuItem onClick={() => handleUploadPayment(request)}>
                            <Check /> Upload Payment Proof
                          </DropdownMenuItem>
                        )}

                        {/* View Payment Proof & Verify (Treasurer) */}
                        {canVerifyPayment && request.status === 'Payment Submitted' && (
                          <DropdownMenuItem onClick={() => handleVerifyPayment(request)}>
                            <CheckCircle /> Verify Payment
                          </DropdownMenuItem>
                        )}

                        {/* View Receipt */}
                        {(request.status === 'Payment Verified' || request.status === 'Ready for Pickup' || request.status === 'Released') && (
                          <DropdownMenuItem onClick={() => handleViewReceipt(request)}>
                            <FileSearch /> View Receipt
                          </DropdownMenuItem>
                        )}

                        {/* Mark as Ready for Pickup (Secretary after payment verified) */}
                        {canMarkReady && request.status === 'Payment Verified' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(request.id, 'Ready for Pickup')}
                              className="bg-green-50 text-green-700 focus:bg-green-100 focus:text-green-800"
                            >
                              <Check className="mr-2" /> Mark as Ready for Pickup
                            </DropdownMenuItem>
                          </>
                        )}

                        {/* Mark as Released (Secretary when resident picks up) */}
                        {canRelease && request.status === 'Ready for Pickup' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(request.id, 'Released')}
                              className="bg-blue-50 text-blue-700 focus:bg-blue-100 focus:text-blue-800"
                            >
                              <Check className="mr-2" /> Mark as Released
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        {/* Reject */}
                        {request.status !== 'Rejected' && request.status !== 'Released' && (
                          <DropdownMenuItem className="text-destructive" onClick={() => handleStatusChange(request.id, 'Rejected')}>
                            <XCircle /> Reject Request
                          </DropdownMenuItem>
                        )}

                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(request.id)}>
                              <Trash2 /> Delete Permanently
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center py-10">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-[#F0F4FA] text-[#718096]">
                      <FileText className="size-6 text-[#718096]" />
                    </div>
                    <p className="font-bold text-sm text-[#172B4D]">No document requests found</p>
                    <p className="text-xs text-[#718096]">Try adjusting your search criteria or switch to another status tab</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {filteredData.length > 0 && (
          <div className="border-t border-[#E5EAF2] px-4 py-2 bg-[#F8FAFC]">
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="requests"
            />
          </div>
        )}
      </div>

      {/* Payment Upload Dialog */}
      {selectedRequest && (
        <PaymentUploadDialog
          isOpen={showPaymentUpload}
          onClose={() => {
            setShowPaymentUpload(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
          onSuccess={handleRefresh}
        />
      )}

      {/* Payment Verification Dialog */}
      {selectedRequest && (
        <PaymentVerificationDialog
          isOpen={showPaymentVerification}
          onClose={() => {
            setShowPaymentVerification(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
          onSuccess={handleRefresh}
        />
      )}

      {/* Receipt Dialog */}
      {selectedRequest && (
        <Dialog open={showReceipt} onOpenChange={(open) => {
          setShowReceipt(open);
          if (!open) setSelectedRequest(null);
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Official Receipt</DialogTitle>
            </DialogHeader>
            <PaymentReceipt request={selectedRequest} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
