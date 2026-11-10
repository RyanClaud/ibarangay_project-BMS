'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirebase } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { Loader2, Wallet, QrCode } from "lucide-react";
import { useAppContext } from "@/contexts/app-context";
import Image from "next/image";

export function PaymentSettingsForm() {
  const { firestore, areServicesAvailable } = useFirebase();
  const { currentUser } = useAppContext();
  const [gcashNumber, setGcashNumber] = useState("");
  const [gcashName, setGcashName] = useState("");
  const [gcashQRCodeUrl, setGcashQRCodeUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is Treasurer or Admin
  const canEditPaymentSettings = currentUser?.role === 'Treasurer' || currentUser?.role === 'Admin' || currentUser?.isSuperAdmin;

  useEffect(() => {
    const fetchPaymentSettings = async () => {
      if (!firestore || !currentUser?.barangayId) return;
      setIsLoading(true);
      try {
        const configRef = doc(firestore, 'barangays', currentUser.barangayId);
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          const configData = configSnap.data();
          const paymentSettings = configData.paymentSettings || {};
          setGcashNumber(paymentSettings.gcashNumber || "");
          setGcashName(paymentSettings.gcashName || "");
          setGcashQRCodeUrl(paymentSettings.gcashQRCodeUrl || "");
        }
      } catch (e) {
        console.error("Failed to fetch payment settings:", e);
        toast({ 
          title: "Error", 
          description: "Could not fetch payment settings.", 
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (areServicesAvailable) {
      fetchPaymentSettings();
    } else {
      setIsLoading(false);
    }
  }, [firestore, areServicesAvailable, currentUser?.barangayId]);

  const handleSaveChanges = async () => {
    if (!firestore || !currentUser?.barangayId) {
      toast({ 
        title: "Firebase not initialized.", 
        description: "Please try again later.", 
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const configRef = doc(firestore, 'barangays', currentUser.barangayId);
      await setDoc(configRef, {
        paymentSettings: {
          gcashNumber,
          gcashName,
          gcashQRCodeUrl,
        }
      }, { merge: true });

      toast({ 
        title: "Payment Settings Saved", 
        description: "GCash payment information has been updated successfully." 
      });
    } catch (error: any) {
      console.error("Error saving payment settings: ", error);
      toast({ 
        title: "Save Failed", 
        description: error.message || "Could not save payment settings.", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#E5EAF2] bg-white p-8 shadow-sm flex justify-center items-center">
        <Loader2 className="animate-spin h-8 w-8 text-[#246BDE]" />
      </div>
    );
  }

  if (!canEditPaymentSettings) {
    return (
      <div className="rounded-2xl border border-[#E5EAF2] bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E5EAF2] bg-[#F8FAFC]">
          <h3 className="flex items-center gap-2 text-lg font-bold text-[#172B4D]">
            <Wallet className="size-5 text-[#246BDE]" />
            GCash Payment Settings
          </h3>
          <p className="text-xs text-[#718096] mt-1">View the official GCash payment details for your barangay.</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#172B4D]">GCash Number</Label>
            <p className="text-sm font-semibold text-[#172B4D]">{gcashNumber || "Not configured"}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#172B4D]">GCash Account Name</Label>
            <p className="text-sm font-semibold text-[#172B4D]">{gcashName || "Not configured"}</p>
          </div>
          {gcashQRCodeUrl && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#172B4D]">GCash QR Code</Label>
              <Image 
                src={gcashQRCodeUrl} 
                alt="GCash QR Code" 
                width={200} 
                height={200} 
                className="rounded-xl border border-[#E5EAF2] bg-white p-2" 
                unoptimized 
              />
            </div>
          )}
          <div className="bg-[#EAF2FF] p-3.5 rounded-xl border border-[#BFDBFE]">
            <p className="text-xs text-[#246BDE]">
              Only Treasurers and Administrators can edit barangay payment settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#E5EAF2] bg-white shadow-sm overflow-hidden">
      <div className="p-6 border-b border-[#E5EAF2] bg-[#F8FAFC]">
        <h3 className="flex items-center gap-2.5 text-lg font-bold text-[#172B4D]">
          <Wallet className="size-5 text-[#246BDE]" />
          GCash Payment Account Settings
        </h3>
        <p className="text-xs sm:text-sm text-[#718096] mt-1">
          Configure official GCash payment information for document requests. Residents will use this information to send payments.
        </p>
      </div>
      <div className="p-6 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="gcashNumber" className="text-xs font-semibold text-[#172B4D]">GCash Number *</Label>
          <Input 
            id="gcashNumber" 
            type="tel"
            placeholder="09XX XXX XXXX"
            value={gcashNumber} 
            onChange={(e) => setGcashNumber(e.target.value)}
            maxLength={11}
            className="h-10 rounded-xl border-[#E2E8F0] bg-[#F0F4FA] text-sm text-[#172B4D] placeholder-[#718096] focus:bg-white focus:border-[#246BDE]"
          />
          <p className="text-[11px] text-[#718096]">
            Enter the 11-digit mobile number registered with GCash
          </p>
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor="gcashName" className="text-xs font-semibold text-[#172B4D]">GCash Account Name *</Label>
          <Input 
            id="gcashName" 
            placeholder="Juan Dela Cruz"
            value={gcashName} 
            onChange={(e) => setGcashName(e.target.value)}
            className="h-10 rounded-xl border-[#E2E8F0] bg-[#F0F4FA] text-sm text-[#172B4D] placeholder-[#718096] focus:bg-white focus:border-[#246BDE]"
          />
          <p className="text-[11px] text-[#718096]">
            Enter the full registered name on the GCash account
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gcashQRCode" className="flex items-center gap-2 text-xs font-semibold text-[#172B4D]">
            <QrCode className="size-4 text-[#246BDE]" />
            GCash QR Code URL (Optional)
          </Label>
          <div className="space-y-3">
            {gcashQRCodeUrl && (
              <div className="flex justify-center p-4 bg-[#F8FAFC] rounded-xl border border-[#E5EAF2]">
                <Image 
                  src={gcashQRCodeUrl} 
                  alt="GCash QR Code Preview" 
                  width={200} 
                  height={200} 
                  className="rounded-xl border border-[#E5EAF2] bg-white p-2 shadow-xs" 
                  unoptimized 
                />
              </div>
            )}
            <Input 
              id="gcashQRCode" 
              type="url"
              placeholder="https://example.com/gcash-qr.png"
              value={gcashQRCodeUrl} 
              onChange={(e) => setGcashQRCodeUrl(e.target.value)}
              className="h-10 rounded-xl border-[#E2E8F0] bg-[#F0F4FA] text-sm text-[#172B4D] placeholder-[#718096] focus:bg-white focus:border-[#246BDE]"
            />
          </div>
          <p className="text-[11px] text-[#718096]">
            Upload your barangay official GCash QR code and paste the image URL here. Residents can scan it directly.
          </p>
        </div>

        <div className="bg-[#FFF7ED] p-3.5 rounded-xl border border-[#FED7AA]">
          <p className="text-xs text-[#FFA51E]">
            <strong className="text-[#172B4D]">Important:</strong> This payment account will be displayed to residents when settling document fees.
          </p>
        </div>
      </div>
      <div className="p-4 bg-[#F8FAFC] border-t border-[#E5EAF2] flex justify-end">
        <Button 
          onClick={handleSaveChanges} 
          disabled={isSaving || !areServicesAvailable || !gcashNumber || !gcashName}
          className="bg-[#246BDE] hover:bg-[#1E5CC0] text-white rounded-xl font-semibold text-xs h-10 px-5 shadow-xs"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSaving ? 'Saving...' : 'Save Payment Settings'}
        </Button>
      </div>
    </div>
  );
}
