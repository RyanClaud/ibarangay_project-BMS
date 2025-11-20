'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DocumentRequest, DocumentRequestStatus, PaymentSettings } from '@/lib/types';
import { Copy, Loader2, Upload, X, Image as ImageIcon, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/app-context';
import { useState, useRef, useEffect } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useFirebase } from '@/firebase/provider';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc } from 'firebase/firestore';
import NextImage from 'next/image';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: DocumentRequest;
}

export function PaymentDialog({ isOpen, onClose, request }: PaymentDialogProps) {
  const { updateDocumentRequestStatus } = useAppContext();
  const { storage, firestore } = useFirebase();
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [copiedNumber, setCopiedNumber] = useState(false);

  // Fetch payment settings when dialog opens
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      if (!firestore || !request.barangayId || !isOpen) return;
      
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

    fetchPaymentSettings();
  }, [firestore, request.barangayId, isOpen]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Reference number copied to clipboard." });
  }

  const copyGCashNumber = (number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
    toast({ title: "Copied!", description: "GCash number copied to clipboard." });
  }

  const compressImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image(); // Use native HTML Image constructor
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Aggressive compression: max 800px (smaller for Firestore)
          let width = img.width;
          let height = img.height;
          const maxSize = 800; // Reduced from 1200
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw image
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with aggressive compression
          let quality = 0.6; // Start with 60% quality
          let base64 = canvas.toDataURL('image/jpeg', quality);
          
          // If still too large, reduce quality further
          while (base64.length > 700000 && quality > 0.3) { // Target < 700KB
            quality -= 0.1;
            base64 = canvas.toDataURL('image/jpeg', quality);
          }
          
          if (base64.length > 900000) { // Max 900KB (leave room for other data)
            reject(new Error('Image too large even after compression. Please use a smaller image or take a new screenshot.'));
          } else {
            const sizeKB = (base64.length * 0.75 / 1024).toFixed(0);
            console.log(`Compressed to ${sizeKB}KB at ${(quality * 100).toFixed(0)}% quality`);
            resolve(base64);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ 
        title: "Invalid file type", 
        description: "Please upload an image file (JPG, PNG, etc.)", 
        variant: "destructive" 
      });
      return;
    }

    // Validate file size (5MB max before compression)
    if (file.size > 5 * 1024 * 1024) {
      toast({ 
        title: "File too large", 
        description: "Please upload an image smaller than 5MB", 
        variant: "destructive" 
      });
      return;
    }

    try {
      // Compress image to base64
      const base64Image = await compressImageToBase64(file);
      
      // Store the base64 string
      setPaymentScreenshot(file); // Keep file for reference
      setPreviewUrl(base64Image); // Use base64 for preview
      
      const sizeKB = (base64Image.length * 0.75 / 1024).toFixed(0);
      toast({
        title: "Image ready",
        description: `Compressed to ${sizeKB}KB - ready to upload`,
      });
    } catch (error: any) {
      console.error('Compression error:', error);
      toast({
        title: "Compression failed",
        description: error.message || "Please try a different image",
        variant: "destructive"
      });
      // Clear selection
      setPaymentScreenshot(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = () => {
    setPaymentScreenshot(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitPayment = async () => {
    if (!transactionId) {
        toast({ 
          title: "Transaction ID required", 
          description: "Please enter the transaction ID from your payment.", 
          variant: "destructive" 
        });
        return;
    }

    if (!paymentScreenshot || !previewUrl) {
        toast({ 
          title: "Screenshot required", 
          description: "Please upload a screenshot of your payment proof.", 
          variant: "destructive" 
        });
        return;
    }

    setIsSubmitting(true);
    
    try {
        console.log('Starting payment submission...');
        
        // Use the base64 image from preview (already compressed)
        const base64Image = previewUrl;
        
        // Verify size one more time
        const sizeInBytes = base64Image.length * 0.75;
        if (sizeInBytes > 900 * 1024) {
          throw new Error('Image too large. Please use a smaller image.');
        }

        const paymentDetails = {
            method: "GCash",
            transactionId: transactionId,
            paymentDate: new Date().toISOString(),
            screenshotBase64: base64Image, // Store base64 instead of URL
        };

        console.log('Updating document request status...');
        await updateDocumentRequestStatus(request.id, 'Payment Submitted', paymentDetails);
        console.log('Document request status updated successfully');
        
        toast({
            title: "Payment Submitted",
            description: "Your payment proof has been uploaded. A staff member will verify it shortly.",
        });
        
        // Reset form
        setTransactionId('');
        handleRemoveFile();
        onClose();
    } catch (error: any) {
        console.error('Payment submission error:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          stack: error.stack
        });
        
        toast({ 
          title: "Submission Failed", 
          description: error.message || "An error occurred while submitting your payment.", 
          variant: "destructive" 
        });
    } finally {
        setIsSubmitting(false);
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Payment</DialogTitle>
          <DialogDescription>
            Use the details below to pay via GCash, then enter the transaction ID to confirm.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
            <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Amount Due</p>
                <p className="text-4xl font-bold">{request.amount.toLocaleString('en-US', { style: 'currency', currency: 'PHP' })}</p>
            </div>
            {/* GCash Payment Information */}
            {paymentSettings?.gcashNumber ? (
              <div className="rounded-lg border bg-emerald-50 dark:bg-emerald-950 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    G
                  </div>
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                    1. Pay to this GCash Number:
                  </p>
                </div>
                
                <div className="flex items-center justify-between bg-white dark:bg-emerald-900 p-3 rounded">
                  <div>
                    <p className="text-xs text-muted-foreground">GCash Number</p>
                    <p className="font-mono text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                      {paymentSettings.gcashNumber}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => copyGCashNumber(paymentSettings.gcashNumber!)}
                  >
                    {copiedNumber ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {paymentSettings.gcashName && (
                  <div className="bg-white dark:bg-emerald-900 p-3 rounded">
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
            ) : (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <p className="text-sm text-muted-foreground">1. Pay to this GCash Number:</p>
                <p className="text-sm text-amber-600">GCash payment details not configured yet. Please contact the barangay office.</p>
              </div>
            )}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <p className="text-sm text-muted-foreground">2. Use this as the Reference Number:</p>
                 <div className="flex items-center justify-between gap-4">
                    <p className="font-mono text-lg font-semibold">{request.referenceNumber}</p>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(request.referenceNumber)}>
                        <Copy className="size-5" />
                    </Button>
                </div>
                 <p className="text-xs text-primary/80">
                    Important: Make sure to include this reference number in the message/notes section of your transaction.
                </p>
            </div>
             <div className="space-y-2">
                <Label htmlFor="transactionId" className="text-sm text-muted-foreground">3. Enter Payment Transaction ID:</Label>
                <Input 
                    id="transactionId"
                    placeholder="e.g., APF12345XYZ"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    disabled={isSubmitting}
                />
             </div>

             <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">4. Upload Payment Screenshot:</Label>
                <div className="space-y-3">
                  {!previewUrl ? (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="screenshot-upload"
                        disabled={isSubmitting}
                      />
                      <label 
                        htmlFor="screenshot-upload" 
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <div className="rounded-full bg-primary/10 p-3">
                          <Upload className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Click to upload screenshot</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="relative border rounded-lg overflow-hidden">
                      <img 
                        src={previewUrl} 
                        alt="Payment screenshot preview" 
                        className="w-full h-48 object-contain bg-muted"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveFile}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="p-2 bg-muted/50 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">
                          {paymentScreenshot?.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload a clear screenshot showing the payment confirmation with the transaction ID visible.
                </p>
             </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline" disabled={isSubmitting}>Cancel</Button>
           <Button onClick={handleSubmitPayment} disabled={isSubmitting || !transactionId || !paymentScreenshot}>
                {isSubmitting && <Loader2 className="animate-spin mr-2" />}
                {isSubmitting ? 'Uploading...' : 'Submit Payment'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
