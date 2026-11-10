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
  CIVIL_STATUS_OPTIONS,
  DISABILITY_OPTIONS,
  EDUCATION_OPTIONS,
  INDIVIDUAL_STATUS_OPTIONS,
  PHILHEALTH_OPTIONS,
  PROGRAM_NAMES,
  PROGRAM_STATUSES,
  RELATIONSHIP_OPTIONS,
  SECTOR_TAGS,
  SEX_OPTIONS,
  VOTER_STATUS_OPTIONS,
} from "@/lib/profiling/constants";
import type { Household, ProfilingResident, Purok } from "@/lib/profiling/types";
import { computeEligibleUnregistered } from "@/lib/profiling/age-utils";

// ─── Schema ────────────────────────────────────────────────────────────

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  extension: z.string().optional(),
  sex: z.enum(["Male", "Female"]),
  birthdate: z.string().min(1, "Birthdate is required"),
  civilStatus: z.enum(["Single", "Married", "Widowed", "Separated", "Annulled"]),
  relationshipToHead: z.string().min(1, "Relationship is required"),
  citizenship: z.string().default("Filipino"),
  lengthOfResidencyYears: z.coerce.number().min(0).optional(),
  education: z.string().optional(),
  occupation: z.string().optional(),
  contactNumber: z.string().optional(),
  philhealthStatus: z.enum(["Member", "Dependent", "None", "Unknown"]).default("Unknown"),
  disability: z.string().default("None"),
  individualStatus: z.enum(["Active", "Deceased", "Transferred"]).default("Active"),
  householdId: z.string().optional(),
  purok: z.string().optional(),
  address: z.string().optional(),
  voterStatus: z.enum(["Registered", "Not registered", "Transferred", "Unknown"]).default("Unknown"),
  precinctNumber: z.string().optional(),
  sectorTags: z.array(z.string()).default([]),
});

type FormData = z.infer<typeof schema>;

// ─── Props ─────────────────────────────────────────────────────────────

interface AddIndividualDialogProps {
  isOpen: boolean;
  onClose: () => void;
  barangayId: string;
  barangayName: string;
  puroks: Purok[];
  households: Household[];
  onSave: (data: Omit<ProfilingResident, "id" | "userId" | "avatarUrl" | "email">) => Promise<void>;
}

// ─── Component ─────────────────────────────────────────────────────────

export function AddIndividualDialog({
  isOpen,
  onClose,
  barangayId,
  barangayName,
  puroks,
  households,
  onSave,
}: AddIndividualDialogProps) {
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      citizenship: "Filipino",
      philhealthStatus: "Unknown",
      disability: "None",
      individualStatus: "Active",
      voterStatus: "Unknown",
      sectorTags: [],
    },
  });

  // When a household is selected, auto-fill purok and address
  const selectedHouseholdId = form.watch("householdId");
  React.useEffect(() => {
    if (!selectedHouseholdId || selectedHouseholdId === "__none__") return;
    const hh = households.find((h) => h.id === selectedHouseholdId);
    if (!hh) return;
    if (hh.purokName) form.setValue("purok", hh.purokName);
    if (hh.address) form.setValue("address", hh.address);
  }, [selectedHouseholdId, households, form]);

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      const isEligible = computeEligibleUnregistered({
        birthdate: data.birthdate,
        lengthOfResidencyYears: data.lengthOfResidencyYears,
        voterStatus: data.voterStatus,
      });

      const now = new Date().toISOString();
      await onSave({
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        extension: data.extension,
        sex: data.sex,
        birthdate: data.birthdate,
        civilStatus: data.civilStatus,
        relationshipToHead: data.relationshipToHead as ProfilingResident["relationshipToHead"],
        citizenship: data.citizenship,
        lengthOfResidencyYears: data.lengthOfResidencyYears,
        education: data.education as ProfilingResident["education"],
        occupation: data.occupation,
        contactNumber: data.contactNumber,
        philhealthStatus: data.philhealthStatus,
        disability: data.disability as ProfilingResident["disability"],
        individualStatus: data.individualStatus,
        voterStatus: data.voterStatus,
        precinctNumber: data.precinctNumber,
        isEligibleUnregistered: isEligible,
        sectorTags: data.sectorTags as ProfilingResident["sectorTags"],
        programBeneficiaries: [],
        householdId: data.householdId === "__none__" ? null : (data.householdId ?? null),
        householdNumber: data.householdId === "__none__" ? "" : (data.householdId ?? ""),
        purok: data.purok ?? "",
        address: data.address ?? `${data.purok ?? ""}, ${barangayName}`,
        barangayId,
        consentObtained: true,
        consentDate: now.split("T")[0],
        createdAt: now,
        updatedAt: now,
      });
      form.reset();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 shrink-0">
          <DialogHeader>
            <DialogTitle>Add Individual</DialogTitle>
            <DialogDescription>
              Add a new person to the barangay profiling masterlist.
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 min-h-0 px-6">
          <Form {...form}>
            <form id="add-individual-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-4">

              {/* ── Personal Information ── */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl><Input placeholder="Juan" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="middleName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl><Input placeholder="Reyes" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl><Input placeholder="Dela Cruz" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <FormField control={form.control} name="extension" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ext. (Jr./Sr.)</FormLabel>
                      <FormControl><Input placeholder="Jr." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="sex" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sex *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SEX_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="birthdate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birthdate *</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="civilStatus" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Civil Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CIVIL_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField control={form.control} name="citizenship" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Citizenship</FormLabel>
                      <FormControl><Input placeholder="Filipino" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lengthOfResidencyYears" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Residency (years)</FormLabel>
                      <FormControl><Input type="number" min="0" placeholder="0" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="contactNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl><Input placeholder="09XXXXXXXXX" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </section>

              {/* ── Household & Location ── */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
                  Household & Location
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField control={form.control} name="householdId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Household</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select household (optional)" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">No household / enter manually</SelectItem>
                          {households.map((h) => (
                            <SelectItem key={h.id} value={h.id}>
                              {h.id} — {h.householdHeadName || h.address}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="relationshipToHead" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship to Head *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RELATIONSHIP_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField control={form.control} name="purok" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purok / Sitio</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select purok" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {puroks.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street / House Address</FormLabel>
                      <FormControl><Input placeholder="123 Rizal St" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </section>

              {/* ── Socio-economic ── */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
                  Socio-economic Profile
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField control={form.control} name="education" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Education</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EDUCATION_OPTIONS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="occupation" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Occupation</FormLabel>
                      <FormControl><Input placeholder="Farmer" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="philhealthStatus" render={({ field }) => (
                    <FormItem>
                      <FormLabel>PhilHealth</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PHILHEALTH_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField control={form.control} name="disability" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disability</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DISABILITY_OPTIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="individualStatus" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INDIVIDUAL_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </section>

              {/* ── Sector Tags ── */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
                  Sector Tags
                </h3>
                <FormField control={form.control} name="sectorTags" render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {SECTOR_TAGS.map((tag) => (
                        <label key={tag} className="flex items-center gap-2 cursor-pointer text-sm">
                          <Checkbox
                            checked={(field.value ?? []).includes(tag)}
                            onCheckedChange={(checked) => {
                              const current = field.value ?? [];
                              field.onChange(
                                checked
                                  ? [...current, tag]
                                  : current.filter((t) => t !== tag),
                              );
                            }}
                          />
                          {tag}
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
              </section>

              {/* ── Voter Information ── */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
                  Voter Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField control={form.control} name="voterStatus" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voter Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VOTER_STATUS_OPTIONS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="precinctNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precinct Number</FormLabel>
                      <FormControl><Input placeholder="0123A" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </section>

            </form>
          </Form>
        </ScrollArea>

        <div className="px-6 py-4 border-t shrink-0">
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" form="add-individual-form" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Saving…" : "Add Individual"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
