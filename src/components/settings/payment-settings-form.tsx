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
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center p-8">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!canEditPaymentSettings) {
    return (
      <Card className="border-t-4 border-t-blue-500">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            GCash Payment Settings
          </CardTitle>
          <CardDescription>View the GCash payment information for your barangay.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>GCash Number</Label>
            <p className="text-sm text-muted-foreground">{gcashNumber || "Not configured"}</p>
          </div>
          <div className="space-y-2">
            <Label>GCash Account Name</Label>
            <p className="text-sm text-muted-foreground">{gcashName || "Not configured"}</p>
          </div>
          {gcashQRCodeUrl && (
            <div className="space-y-2">
              <Label>GCash QR Code</Label>
              <Image 
                src={gcashQRCodeUrl} 
                alt="GCash QR Code" 
                width={200} 
                height={200} 
                className="rounded-lg border bg-white p-2" 
                unoptimized 
              />
            </div>
          )}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Only Treasurers and Administrators can edit payment settings.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-t-4 border-t-green-500 hover:shadow-xl transition-all">
      <CardHeader className="bg-gradient-to-r from-green-50 to-transparent dark:from-green-950">
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          GCash Payment Settings
        </CardTitle>
        <CardDescription>
          Configure GCash payment information for document requests. Residents will use this information to send payments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="gcashNumber">GCash Number *</Label>
          <Input 
            id="gcashNumber" 
            type="tel"
            placeholder="09XX XXX XXXX"
            value={gcashNumber} 
            onChange={(e) => setGcashNumber(e.target.value)}
            maxLength={11}
          />
          <p className="text-xs text-muted-foreground">
            Enter the 11-digit mobile number registered with GCash
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="gcashName">GCash Account Name *</Label>
          <Input 
            id="gcashName" 
            placeholder="Juan Dela Cruz"
            value={gcashName} 
            onChange={(e) => setGcashName(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Enter the full name registered with the GCash account
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gcashQRCode" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            GCash QR Code URL (Optional)
          </Label>
          <div className="space-y-3">
            {gcashQRCodeUrl && (
              <div className="flex justify-center p-4 bg-muted rounded-lg">
                <Image 
                  src={gcashQRCodeUrl} 
                  alt="GCash QR Code Preview" 
                  width={200} 
                  height={200} 
                  className="rounded-lg border-2 border-border bg-white p-2" 
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
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Upload your GCash QR code to an image hosting service and paste the URL here. Residents can scan this to pay directly.
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            <strong>Important:</strong> This information will be visible to residents when they need to make payments. Ensure all details are accurate.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSaveChanges} 
          disabled={isSaving || !areServicesAvailable || !gcashNumber || !gcashName}
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSaving ? 'Saving...' : 'Save Payment Settings'}
        </Button>
      </CardFooter>
    </Card>
  );
}
