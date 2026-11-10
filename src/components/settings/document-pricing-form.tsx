"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useFirebase } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  Banknote,
  FileCheck,
  Home,
  HandHeart,
  Briefcase,
  Award,
  Users,
} from "lucide-react";
import { useAppContext } from "@/contexts/app-context";
import type { DocumentPricing } from "@/lib/types";

const DEFAULT_PRICING: DocumentPricing = {
  "Barangay Clearance": 50.00,
  "Certificate of Residency": 75.00,
  "Certificate of Indigency": 0.00,
  "Business Permit": 250.00,
  "Good Moral Character Certificate": 100.00,
  "Solo Parent Certificate": 0.00,
};

const DOCUMENT_ICON_CONFIG: Record<
  keyof DocumentPricing,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  'Barangay Clearance': { icon: FileCheck, color: 'text-[#246BDE]', bg: 'bg-[#EAF2FF]' },
  'Certificate of Residency': { icon: Home, color: 'text-[#10A875]', bg: 'bg-[#ECFDF5]' },
  'Certificate of Indigency': { icon: HandHeart, color: 'text-[#FFA51E]', bg: 'bg-[#FFF7ED]' },
  'Business Permit': { icon: Briefcase, color: 'text-[#8B5CF6]', bg: 'bg-[#F3E8FF]' },
  'Good Moral Character Certificate': { icon: Award, color: 'text-[#F59E0B]', bg: 'bg-[#FEF3C7]' },
  'Solo Parent Certificate': { icon: Users, color: 'text-[#EC4899]', bg: 'bg-[#FCE7F3]' },
};

export function DocumentPricingForm() {
  const { firestore, areServicesAvailable } = useFirebase();
  const { currentUser } = useAppContext();
  const [pricing, setPricing] = useState<DocumentPricing>(DEFAULT_PRICING);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPricing = async () => {
      if (!firestore || !currentUser?.barangayId) return;
      setIsLoading(true);
      try {
        const barangayRef = doc(firestore, 'barangays', currentUser.barangayId);
        const barangaySnap = await getDoc(barangayRef);
        if (barangaySnap.exists()) {
          const data = barangaySnap.data();
          setPricing(data.documentPricing || DEFAULT_PRICING);
        }
      } catch (e) {
        console.error("Failed to fetch pricing:", e);
        toast({ 
          title: "Error", 
          description: "Could not fetch document pricing.", 
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    if (areServicesAvailable) {
      fetchPricing();
    } else {
      setIsLoading(false);
    }
  }, [firestore, areServicesAvailable, currentUser?.barangayId]);

  const handlePriceChange = (docType: keyof DocumentPricing, value: string) => {
    const numValue = parseFloat(value) || 0;
    setPricing(prev => ({
      ...prev,
      [docType]: numValue
    }));
  };

  const handleSave = async () => {
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
      const barangayRef = doc(firestore, 'barangays', currentUser.barangayId);
      await setDoc(barangayRef, {
        documentPricing: pricing
      }, { merge: true });

      toast({ 
        title: "Pricing Updated", 
        description: "Document pricing has been saved successfully." 
      });
    } catch (error: any) {
      console.error("Error saving pricing: ", error);
      toast({ 
        title: "Save Failed", 
        description: error.message || "Could not save pricing.", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    setPricing(DEFAULT_PRICING);
    toast({ 
      title: "Reset to Defaults", 
      description: "Pricing has been reset. Click 'Save Changes' to apply." 
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#E5EAF2] bg-white p-8 shadow-sm flex justify-center items-center">
        <Loader2 className="animate-spin h-8 w-8 text-[#246BDE]" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#E5EAF2] bg-white shadow-sm overflow-hidden">
      <div className="p-6 border-b border-[#E5EAF2] bg-[#F8FAFC]">
        <h3 className="flex items-center gap-2.5 text-lg font-bold text-[#172B4D]">
          <Banknote className="size-5 text-[#246BDE]" />
          Document Pricing Configuration
        </h3>
        <p className="text-xs sm:text-sm text-[#718096] mt-1">
          Set the official fees for each document type in your barangay. These prices will automatically apply to resident requests.
        </p>
      </div>
      <div className="p-6 space-y-4">
        <div className="bg-[#EAF2FF] border border-[#BFDBFE] rounded-xl p-3.5">
          <p className="text-xs text-[#246BDE]">
            <strong>💡 Tip:</strong> Set the price to ₱0.00 for documents that should be issued free of charge (e.g. Indigency).
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {(Object.keys(pricing) as Array<keyof DocumentPricing>).map((docType) => {
            const iconConfig = DOCUMENT_ICON_CONFIG[docType] || {
              icon: FileCheck,
              color: 'text-[#246BDE]',
              bg: 'bg-[#EAF2FF]',
            };
            const DocIcon = iconConfig.icon;
            return (
              <div key={docType} className="space-y-2 p-3.5 rounded-xl border border-[#E5EAF2] bg-[#F8FAFC]">
                <Label htmlFor={docType} className="flex items-center gap-2 text-xs font-semibold text-[#172B4D]">
                  <div className={`flex size-6 items-center justify-center rounded-lg ${iconConfig.bg} ${iconConfig.color} shrink-0`}>
                    <DocIcon className="size-3.5" />
                  </div>
                  <span className="truncate">{docType}</span>
                </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718096] font-bold text-xs">
                  ₱
                </span>
                <Input
                  id={docType}
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricing[docType]}
                  onChange={(e) => handlePriceChange(docType, e.target.value)}
                  className="pl-7 h-10 rounded-xl border-[#E2E8F0] bg-white text-sm font-semibold text-[#172B4D] focus:border-[#246BDE]"
                  placeholder="0.00"
                />
              </div>
            </div>
          );
        })}
        </div>
      </div>
      <div className="p-4 bg-[#F8FAFC] border-t border-[#E5EAF2] flex flex-col sm:flex-row justify-between items-center gap-3">
        <Button 
          variant="outline" 
          onClick={handleResetToDefaults}
          disabled={isSaving}
          className="w-full sm:w-auto rounded-xl border-[#E5EAF2] text-[#172B4D] hover:bg-[#F8FAFC] text-xs font-semibold h-10 px-4"
        >
          Reset to Defaults
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !areServicesAvailable}
          className="w-full sm:w-auto bg-[#246BDE] hover:bg-[#1E5CC0] text-white rounded-xl font-semibold text-xs h-10 px-5 shadow-xs"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSaving ? 'Saving...' : 'Save Pricing Changes'}
        </Button>
      </div>
    </div>
  );
}
