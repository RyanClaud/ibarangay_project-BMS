'use client';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, Clock, FileText, Package, XCircle } from "lucide-react";
import type { DocumentRequest } from "@/lib/types";
import { useRouter } from "next/navigation";

interface DocumentStatusAlertProps {
  requests: DocumentRequest[];
  onPayNow?: (request: DocumentRequest) => void;
}

export function DocumentStatusAlert({ requests, onPayNow }: DocumentStatusAlertProps) {
  const router = useRouter();

  // Filter requests by status
  const readyForPickup = requests.filter(r => r.status === 'Ready for Pickup');
  const paymentVerified = requests.filter(r => r.status === 'Payment Verified');
  const approved = requests.filter(r => r.status === 'Approved' && r.amount > 0);
  const rejected = requests.filter(r => r.status === 'Rejected');

  // Don't show anything if no important notifications
  if (readyForPickup.length === 0 && paymentVerified.length === 0 && approved.length === 0 && rejected.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Ready for Pickup - Highest Priority */}
      {readyForPickup.length > 0 && (
        <Alert className="rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5] text-[#172B4D]">
          <Package className="h-5 w-5 text-[#10A875]" />
          <AlertTitle className="text-[#172B4D] font-bold text-sm">
            {readyForPickup.length} Document{readyForPickup.length > 1 ? 's' : ''} Ready for Pickup! 🎉
          </AlertTitle>
          <AlertDescription className="text-xs text-[#4A5568]">
            <div className="mt-2 space-y-2">
              {readyForPickup.map(request => (
                <div key={request.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#E5EAF2]">
                  <div>
                    <p className="font-semibold text-xs text-[#172B4D]">{request.documentType}</p>
                    <p className="text-[11px] text-[#718096]">Tracking: {request.trackingNumber}</p>
                  </div>
                  <Badge variant="outline" className="bg-[#ECFDF5] text-[#10A875] border-[#A7F3D0] text-xs">
                    Ready
                  </Badge>
                </div>
              ))}
              <p className="text-xs mt-2 text-[#718096]">
                📍 Visit the barangay office during office hours to claim your document(s).
              </p>
              <p className="text-xs font-semibold text-[#172B4D]">
                ⏰ Office Hours: Monday–Friday, 8:00 AM – 5:00 PM
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Verified - Document Being Prepared */}
      {paymentVerified.length > 0 && (
        <Alert className="rounded-2xl border border-[#BFDBFE] bg-[#EAF2FF] text-[#172B4D]">
          <Clock className="h-5 w-5 text-[#246BDE]" />
          <AlertTitle className="text-[#172B4D] font-bold text-sm">
            {paymentVerified.length} Document{paymentVerified.length > 1 ? 's' : ''} Being Prepared
          </AlertTitle>
          <AlertDescription className="text-xs text-[#4A5568]">
            <div className="mt-2 space-y-2">
              {paymentVerified.map(request => (
                <div key={request.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#E5EAF2]">
                  <div>
                    <p className="font-semibold text-xs text-[#172B4D]">{request.documentType}</p>
                    <p className="text-[11px] text-[#718096]">Tracking: {request.trackingNumber}</p>
                  </div>
                  <Badge variant="outline" className="bg-[#EAF2FF] text-[#246BDE] border-[#BFDBFE] text-xs">
                    In Progress
                  </Badge>
                </div>
              ))}
              <p className="text-xs mt-2 text-[#718096]">
                Your payment has been verified. The document is being prepared and will be ready soon.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Approved - Needs Payment */}
      {approved.length > 0 && (
        <Alert className="rounded-2xl border border-[#FED7AA] bg-[#FFF7ED] text-[#172B4D]">
          <Bell className="h-5 w-5 text-[#FFA51E]" />
          <AlertTitle className="text-[#172B4D] font-bold text-sm">
            Action Required: Upload Payment Proof
          </AlertTitle>
          <AlertDescription className="text-xs text-[#4A5568]">
            <div className="mt-2 space-y-2">
              {approved.map(request => (
                <div key={request.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#E5EAF2]">
                  <div>
                    <p className="font-semibold text-xs text-[#172B4D]">{request.documentType}</p>
                    <p className="text-[11px] text-[#718096]">
                      Amount: {request.amount.toLocaleString('en-US', { style: 'currency', currency: 'PHP' })}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-[#246BDE] hover:bg-[#1E5CC0] text-white rounded-lg text-xs font-semibold h-8"
                    onClick={() => onPayNow ? onPayNow(request) : router.push('/dashboard')}
                  >
                    Pay Now
                  </Button>
                </div>
              ))}
              <p className="text-xs mt-2 text-[#718096]">
                Your request has been approved. Please upload your payment proof to continue processing.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Rejected */}
      {rejected.length > 0 && (
        <Alert className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] text-[#172B4D]">
          <XCircle className="h-5 w-5 text-[#EF4655]" />
          <AlertTitle className="text-[#172B4D] font-bold text-sm">
            {rejected.length} Request{rejected.length > 1 ? 's' : ''} Rejected
          </AlertTitle>
          <AlertDescription className="text-xs text-[#4A5568]">
            <div className="mt-2 space-y-2">
              {rejected.map(request => (
                <div key={request.id} className="bg-white p-3 rounded-xl border border-[#E5EAF2]">
                  <p className="font-semibold text-xs text-[#172B4D]">{request.documentType}</p>
                  <p className="text-[11px] text-[#718096]">Tracking: {request.trackingNumber}</p>
                </div>
              ))}
              <p className="text-xs mt-2 text-[#718096]">
                Please contact the barangay office for more information regarding this status.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
