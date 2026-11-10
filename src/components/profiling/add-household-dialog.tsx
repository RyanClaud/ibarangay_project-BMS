"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import {
  DISASTER_RISK_OPTIONS,
  HOUSING_TENURE_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  INCOME_BRACKET_OPTIONS,
} from "@/lib/profiling/constants";
import type { Household, Purok } from "@/lib/profiling/types";

// ─── Schema ────────────────────────────────────────────────────────────

const schema = z.object({
  id: z.string().min(1, "Household ID is required"),
  purokId: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  householdHeadName: z.string().min(1, "Household head name is required"),
  memberCount: z.coerce.number().min(1).default(1),
  housingType: z.enum(["Concrete", "Semi-concrete", "Wood", "Bamboo", "Mixed", "Other"]).default("Concrete"),
  housingTenure: z.enum(["Owned", "Rented", "Informal settler", "Government housing", "Mortgaged", "Other"]).default("Owned"),
  accessToWater: z.boolean().default(false),
  accessToElectricity: z.boolean().default(false),
  accessToToilet: z.boolean().default(false),
  incomeBracket: z.string().optional(),
  disasterRiskIndicators: z.array(z.string()).default([]),
  lastVerifiedDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Props ─────────────────────────────────────────────────────────────

interface AddHouseholdDialogProps {
  isOpen: boolean;
  onClose: () => void;
  barangayId: string;
  barangayName: string;
  puroks: Purok[];
  nextSequence: number; // used to suggest the next household ID
  onSave: (data: Omit<Household, "createdAt" | "updatedAt" | "createdBy" | "updatedBy" | "consentObtained" | "consentDate" | "qrCodeDataUrl">) => Promise<void>;
}

// ─── Helpers ───────────────────────────────────────────────────────────

function suggestHouseholdId(barangayName: string, seq: number): string {
  const words = barangayName.trim().split(/\s+/);
  const code = words
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);
  return `HH-${code}-${String(seq).padStart(4, "0")}`;
}

// ─── Component ─────────────────────────────────────────────────────────

export function AddHouseholdDialog({
  isOpen,
  onClose,
  barangayId,
  barangayName,
  puroks,
  nextSequence,
  onSave,
}: AddHouseholdDialogProps) {
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: suggestHouseholdId(barangayName, nextSequence),
      housingType: "Concrete",
      housingTenure: "Owned",
      accessToWater: false,
      accessToElectricity: false,
      accessToToilet: false,
      disasterRiskIndicators: [],
      memberCount: 1,
    },
  });

  // Refresh suggested ID when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      form.setValue("id", suggestHouseholdId(barangayName, nextSequence));
    }
  }, [isOpen, barangayName, nextSequence, form]);

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      const selectedPurok = puroks.find((p) => p.id === data.purokId);
      await onSave({
        id: data.id,
        barangayId,
        purokId: data.purokId ?? null,
        purokName: selectedPurok?.name ?? "",
        address: data.address,
        householdHeadId: null,
        householdHeadName: data.householdHeadName,
        memberCount: data.memberCount,
        housingType: data.housingType,
        housingTenure: data.housingTenure,
        accessToWater: data.accessToWater,
        accessToElectricity: data.accessToElectricity,
        accessToToilet: data.accessToToilet,
        incomeBracket: (data.incomeBracket ?? "") as Household["incomeBracket"],
        disasterRiskIndicators: data.disasterRiskIndicators as Household["disasterRiskIndicators"],
        lastVerifiedDate: data.lastVerifiedDate ?? new Date().toISOString().split("T")[0],
      });
      form.reset();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Household</DialogTitle>
          <DialogDescription>
            Register a new household in the barangay profiling system.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <Form {...form}>
            <form id="add-household-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">

              {/* ── Identification ── */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
                  Identification
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField control={form.control} name="id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Household ID *</FormLabel>
                      <FormControl><Input placeholder="HH-BRGY-0001" {...field} /></FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">Auto-suggested. You can change it.</p>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="householdHeadName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Household Head *</FormLabel>
                      <FormControl><Input placeholder="Juan Dela Cruz" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </section>

              {/* ── Location ── */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
                  Location
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField control={form.control} name="purokId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purok / Sitio</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select purok" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {puroks.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street / House Address *</FormLabel>
                      <FormControl><Input placeholder="123 Rizal St" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </section>

              {/* ── Housing ── */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
                  Housing
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField control={form.control} name="memberCount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Members</FormLabel>
                      <FormControl><Input type="number" min="1" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="housingType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Housing Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {HOUSING_TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="housingTenure" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenure</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {HOUSING_TENURE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Utilities */}
                <div className="flex flex-wrap gap-6 pt-1">
                  {(["accessToWater", "accessToElectricity", "accessToToilet"] as const).map((key) => (
                    <FormField key={key} control={form.control} name={key} render={({ field }) => (
                      <FormItem>
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          {key === "accessToWater" ? "Water" : key === "accessToElectricity" ? "Electricity" : "Toilet"}
                        </label>
                      </FormItem>
                    )} />
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField control={form.control} name="incomeBracket" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Income Bracket</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INCOME_BRACKET_OPTIONS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lastVerifiedDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Verified Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </section>

              {/* ── Disaster Risk ── */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
                  Disaster Risk Indicators
                </h3>
                <FormField control={form.control} name="disasterRiskIndicators" render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {DISASTER_RISK_OPTIONS.map((risk) => (
                        <label key={risk} className="flex items-center gap-2 cursor-pointer text-sm">
                          <Checkbox
                            checked={(field.value ?? []).includes(risk)}
                            onCheckedChange={(checked) => {
                              const current = field.value ?? [];
                              field.onChange(
                                checked
                                  ? [...current, risk]
                                  : current.filter((r) => r !== risk),
                              );
                            }}
                          />
                          {risk}
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
              </section>

            </form>
          </Form>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" form="add-household-form" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Saving…" : "Add Household"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
