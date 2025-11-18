'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2, Upload, Image as ImageIcon, Copy, Check } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import type { DocumentRequest, PaymentSettings } from '@/lib/types';
import Image from 'next/image';

interface PaymentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: DocumentRequest;
  onSuccess: () => void;
}

const PAYMENT_METHODS = [
  'GCash',
  'PayMaya',
  'Bank Transfer',
  'Over the Counter',
  'Other',
];

export function PaymentUploadDialog({
  isOpen,
  onClose,
  request,
  onSuccess,
}: PaymentUploadDialogProps) {
  const { storage, firestore } = useFirebase();
  const [isUploading, setIsUploading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [copiedNumber, setCopiedNumber] = useState(false);

  // Fetch payment settings
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      if (!firestore || !request.barangayId) return;
      
      try {
        const barangayRef = doc(firestore, 'barangays', request.barangayId);
        const barangaySnap = await getDoc(barangayRef);
        
        if (barangaySnap.exists()) {
          const data = barangaySnap.data();
          setPaymentSettings(data.paymentSettings || null);
        }
      } catch (error) {
        console.error('Error fetching payment settings:', error);
      }
    };

    if (isOpen) {
      fetchPaymentSettings();
    }
  }, [firestore, request.barangayId, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file (JPG, PNG)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setProofFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentMethod || !referenceNumber || !proofFile) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields and upload payment proof',
        variant: 'destructive',
      });
      return;
    }

    if (!storage || !firestore) {
      toast({
        title: 'Error',
        description: 'Firebase services not available',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload proof image to Firebase Storage
      const storageRef = ref(
        storage,
        `payment-proofs/${request.barangayId}/${request.id}/proof_${Date.now()}.jpg`
      );
      await uploadBytes(storageRef, proofFile);
      const proofImageUrl = await getDownloadURL(storageRef);

      // Update document request with payment details
      const requestRef = doc(firestore, 'documentRequests', request.id);
      await updateDoc(requestRef, {
        status: 'Payment Submitted',
        paymentDetails: {
          method: paymentMethod,
          referenceNumber: referenceNumber,
          accountName: accountName || undefined,
          paymentDate: paymentDate,
          proofImageUrl: proofImageUrl,
        },
        paymentSubmittedDate: new Date().toISOString(),
      });

      toast({
        title: 'Payment Proof Submitted',
        description: 'Your payment is being verified by the treasurer',
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error uploading payment proof:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to submit payment proof',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setPaymentMethod('');
    setReferenceNumber('');
    setAccountName('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setProofFile(null);
    setPreviewUrl(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
    toast({
      title: 'Copied!',
      description: 'GCash number copied to clipboard',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit Payment Proof</DialogTitle>
          <DialogDescription>
            Upload proof of payment for your {request.documentType}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Amount to Pay: ₱{request.amount.toFixed(2)}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Please pay this exact amount and upload proof of payment
            </p>
          </div>

          {/* GCash Payment Information */}
          {paymentSettings?.gcashNumber && (
            <div className="bg-emerald-50 dark:bg-emerald-950 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  G
                </div>
                <h4 className="font-semibold text-emerald-900 dark:text-emerald-100">
                  GCash Payment Details
                </h4>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-white dark:bg-emerald-900 p-2 rounded">
                  <div>
                    <p className="text-xs text-muted-foreground">GCash Number</p>
                    <p className="font-mono font-semibold text-emerald-900 dark:text-emerald-100">
                      {paymentSettings.gcashNumber}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(paymentSettings.gcashNumber!)}
                  >
                    {copiedNumber ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {paymentSettings.gcashName && (
                  <div className="bg-white dark:bg-emerald-900 p-2 rounded">
                    <p className="text-xs text-muted-foreground">Account Name</p>
                    <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                      {paymentSettings.gcashName}
                    </p>
                  </div>
                )}

                {paymentSettings.gcashQRCodeUrl && (
                  <div className="flex justify-center p-3 bg-white dark:bg-emerald-900 rounded">
                    <div className="text-center space-y-2">
                      <p className="text-xs text-muted-foreground">Scan to Pay</p>
                      <Image
                        src={paymentSettings.gcashQRCodeUrl}
                        alt="GCash QR Code"
                        width={150}
                        height={150}
                        className="rounded border-2 border-emerald-200"
                        unoptimized
                      />
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                💡 Send payment to this GCash number, then upload your payment proof below
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">
              Payment Method <span className="text-red-500">*</span>
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referenceNumber">
              Reference Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="referenceNumber"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g., 1234567890123"
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the transaction reference number from your payment
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountName">Account Name (Optional)</Label>
            <Input
              id="accountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Name on payment account"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">
              Payment Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proofFile">
              Upload Payment Proof <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="proofFile"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Upload a screenshot or photo of your payment receipt (Max 5MB)
            </p>
          </div>

          {previewUrl && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="border rounded-lg p-2">
                <img
                  src={previewUrl}
                  alt="Payment proof preview"
                  className="max-h-48 mx-auto rounded"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Submit Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
