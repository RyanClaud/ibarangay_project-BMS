"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppContext } from "@/contexts/app-context";
import { useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import {
  FileText,
  User,
  MapPin,
  Banknote,
  FileCheck,
  Home,
  HandHeart,
  Briefcase,
  Award,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  documentType: z.enum(["Barangay Clearance", "Certificate of Residency", "Certificate of Indigency", "Business Permit", "Good Moral Character Certificate", "Solo Parent Certificate"]),
});

const DOCUMENT_PRICES: Record<string, number> = {
  'Barangay Clearance': 50.00,
  'Certificate of Residency': 75.00,
  'Certificate of Indigency': 0.00,
  'Business Permit': 250.00,
  'Good Moral Character Certificate': 100.00,
  'Solo Parent Certificate': 0.00,
};

const DOCUMENT_ICON_MAP: Record<string, { icon: any; color: string; bg: string }> = {
  'Barangay Clearance': { icon: FileCheck, color: 'text-[#246BDE]', bg: 'bg-[#EAF2FF]' },
  'Certificate of Residency': { icon: Home, color: 'text-[#10A875]', bg: 'bg-[#ECFDF5]' },
  'Certificate of Indigency': { icon: HandHeart, color: 'text-[#FFA51E]', bg: 'bg-[#FFF7ED]' },
  'Business Permit': { icon: Briefcase, color: 'text-[#8B5CF6]', bg: 'bg-[#F3E8FF]' },
  'Good Moral Character Certificate': { icon: Award, color: 'text-[#F59E0B]', bg: 'bg-[#FEF3C7]' },
  'Solo Parent Certificate': { icon: Users, color: 'text-[#EC4899]', bg: 'bg-[#FCE7F3]' },
};

export function RequestForm() {
  const { addDocumentRequest, currentUser, residents, documentPricing } = useAppContext();
  const [selectedDoc, setSelectedDoc] = useState<string>("Barangay Clearance");
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentType: "Barangay Clearance",
    },
  });

  const resident = useMemo(() => {
    if (currentUser?.residentId && residents) {
      return residents.find(res => res.id === currentUser.residentId);
    }
    return null;
  }, [currentUser, residents]);

  // Use barangay-specific pricing if available, otherwise fall back to defaults
  const pricing: Record<string, number> = (documentPricing || DOCUMENT_PRICES) as Record<string, number>;
  const selectedPrice = pricing[selectedDoc] || 0;


  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentUser || !currentUser.residentId || !resident) {
        toast({
            title: "Error",
            description: "Could not identify the current resident. Please log in again.",
            variant: "destructive",
        });
        return;
    }

    // Get amount from barangay-specific pricing
    const amount = pricing[values.documentType] || 0;

    addDocumentRequest({
        residentId: currentUser.residentId,
        residentName: currentUser.name,
        documentType: values.documentType,
        amount: amount,
    });
    
    toast({
        title: "Request Submitted",
        description: `Your ${values.documentType} request has been submitted successfully.`,
    });
    
    form.reset({ documentType: "Barangay Clearance" });
  }

  return (
    <div className="rounded-2xl border border-[#E5EAF2] bg-white shadow-sm overflow-hidden">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="p-6 border-b border-[#E5EAF2] bg-[#F8FAFC]">
            <h3 className="flex items-center gap-2.5 text-xl font-bold text-[#172B4D]">
              <FileText className="size-5 text-[#246BDE]" />
              New Document Request
            </h3>
            <p className="text-xs sm:text-sm text-[#718096] mt-1">
              Select a document to request. Your verified profile details will be auto-filled.
            </p>
          </div>
          <div className="grid gap-5 p-6">
            <FormField
              control={form.control}
              name="documentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-[#172B4D]">Document Type</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedDoc(value);
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 rounded-xl border-[#E2E8F0] bg-[#F0F4FA] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]">
                        <div className="flex items-center gap-2.5">
                          {(() => {
                            const itemConfig = DOCUMENT_ICON_MAP[selectedDoc] || {
                              icon: FileCheck,
                              color: 'text-[#246BDE]',
                              bg: 'bg-[#EAF2FF]',
                            };
                            const DocIcon = itemConfig.icon;
                            return (
                              <span
                                className={`flex size-6 items-center justify-center rounded-md ${itemConfig.bg} ${itemConfig.color} shrink-0`}
                              >
                                <DocIcon className="size-3.5" />
                              </span>
                            );
                          })()}
                          <SelectValue placeholder="Select a document to request" />
                        </div>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl border-[#E5EAF2]">
                      {(Object.keys(pricing) as Array<keyof typeof DOCUMENT_PRICES>).map((docType) => {
                        const price = pricing[docType];
                        const itemConfig = DOCUMENT_ICON_MAP[docType] || {
                          icon: FileText,
                          color: 'text-[#246BDE]',
                          bg: 'bg-[#EAF2FF]',
                        };
                        const DocIcon = itemConfig.icon;
                        return (
                          <SelectItem key={docType} value={docType} className="text-sm py-2.5 rounded-lg cursor-pointer">
                            <div className="flex items-center justify-between w-full gap-4">
                              <span className="flex items-center gap-2.5 text-[#172B4D]">
                                <span
                                  className={`flex size-6 items-center justify-center rounded-md ${itemConfig.bg} ${itemConfig.color} shrink-0`}
                                >
                                  <DocIcon className="size-3.5" />
                                </span>
                                <span className="font-medium">{docType}</span>
                              </span>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${price === 0 ? 'bg-[#ECFDF5] text-[#10A875]' : 'bg-[#EAF2FF] text-[#246BDE]'}`}>
                                {price === 0 ? 'FREE' : `₱${price.toFixed(2)}`}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price Display */}
            <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E5EAF2]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="size-5 text-[#246BDE]" />
                  <span className="font-semibold text-sm text-[#172B4D]">Official Document Fee:</span>
                </div>
                {selectedPrice === 0 ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#10A875] border border-[#A7F3D0]">
                    FREE
                  </span>
                ) : (
                  <span className="text-xl font-bold text-[#246BDE]">
                    ₱{selectedPrice.toFixed(2)}
                  </span>
                )}
              </div>
              {selectedPrice === 0 && (
                <p className="text-xs text-[#718096] mt-1.5">
                  This document is provided free of charge for barangay constituents.
                </p>
              )}
            </div>

            {resident && (
              <div className="bg-[#EAF2FF] p-4 rounded-xl border border-[#BFDBFE] space-y-2.5">
                <h4 className="font-bold text-xs uppercase tracking-wide text-[#246BDE] flex items-center gap-2">
                  <User className="size-4" />
                  Constituent Information (Auto-Filled)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#718096]">Full Name:</span>
                    <p className="font-semibold text-[#172B4D]">{resident.firstName} {resident.lastName}</p>
                  </div>
                  <div>
                    <span className="text-[#718096]">Barangay Address:</span>
                    <p className="font-semibold text-[#172B4D]">{resident.address}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl p-3.5">
              <p className="text-xs text-[#FFA51E]">
                <strong className="text-[#172B4D]">📌 Note:</strong> After submitting, you will receive a tracking number to monitor your request status.
                {selectedPrice > 0 && " Payment verification will be required upon document approval."}
              </p>
            </div>
          </div>
          <div className="p-4 bg-[#F8FAFC] border-t border-[#E5EAF2] flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-[#718096]">
              Standard processing time: 1–2 business days
            </p>
            <Button 
              type="submit" 
              className="w-full sm:w-auto bg-[#246BDE] hover:bg-[#1E5CC0] text-white rounded-xl font-semibold text-xs h-10 px-5 shadow-xs"
            >
              <FileText className="mr-2 size-4" />
              Submit Request
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
