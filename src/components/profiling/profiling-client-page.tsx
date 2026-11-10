"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileSpreadsheet,
  FileText,
  Upload,
  Download,
  Filter,
  Users,
  Home,
  BarChart3,
  ShieldCheck,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";
import { useAppContext } from "@/contexts/app-context";
import { useProfilingData } from "@/hooks/use-profiling-data";
import { computeAge, formatBirthdate } from "@/lib/profiling/age-utils";
import {
  exportMasterlistExcel,
  exportHouseholdsExcel,
  exportMasterlistPdf,
  exportHouseholdsPdf,
  exportReportExcel,
  downloadImportTemplate,
} from "@/lib/profiling/export-utils";
import { logAudit } from "@/lib/profiling/audit";
import {
  SECTOR_TAGS,
  PROGRAM_NAMES,
  VOTER_STATUS_OPTIONS,
  SEX_OPTIONS,
  SECTOR_DESCRIPTIONS,
} from "@/lib/profiling/constants";
import {
  canEditData,
  canExportExcel,
  canExportPdf,
  canImportData,
  getHiddenFieldGroups,
} from "@/lib/profiling/access-control";
import type {
  ProfilingResident,
  ProfilingFilter,
  SectorTag,
  ProgramName,
  VoterStatus,
  Sex,
  IndividualStatus,
  Household,
} from "@/lib/profiling/types";
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useFirebase } from "@/firebase";
import { toast } from "@/hooks/use-toast";
import { AddIndividualDialog } from "./add-individual-dialog";
import { AddHouseholdDialog } from "./add-household-dialog";
import { BenefitsTab } from "./benefits-tab";

const DEFAULT_FILTER: ProfilingFilter = {
  purok: null,
  ageMin: null,
  ageMax: null,
  sex: null,
  sector: null,
  program: null,
  voterStatus: null,
  eligibleUnregisteredOnly: false,
  householdId: null,
  individualStatus: null,
  searchText: "",
};

export function ProfilingClientPage() {
  const { currentUser, barangayConfig } = useAppContext();
  const { firestore } = useFirebase();
  const barangayId = currentUser?.barangayId ?? null;
  const barangayName = barangayConfig?.name ?? "Barangay";
  const role = currentUser?.role ?? null;
  const isSuperAdmin = currentUser?.isSuperAdmin ?? false;

  const { puroks, households, residents, auditLogs, isLoading } =
    useProfilingData(barangayId, barangayName);

  const [filter, setFilter] = React.useState<ProfilingFilter>(DEFAULT_FILTER);
  const [activeReport, setActiveReport] = React.useState<string>("all");

  // ── Add dialogs state ──
  const [isAddIndividualOpen, setIsAddIndividualOpen] = React.useState(false);
  const [isAddHouseholdOpen, setIsAddHouseholdOpen] = React.useState(false);

  // ── Filtering logic ──
  const filteredResidents = React.useMemo(() => {
    return residents.filter((r) => {
      // Search text
      if (filter.searchText) {
        const q = filter.searchText.toLowerCase();
        const fullName =
          `${r.firstName} ${r.middleName ?? ""} ${r.lastName} ${r.extension ?? ""}`.toLowerCase();
        if (!fullName.includes(q)) return false;
      }

      // Purok
      if (filter.purok && filter.purok !== "all") {
        const purokName =
          puroks.find((p) => p.id === filter.purok)?.name ?? "";
        if (r.purok !== purokName && r.purok !== filter.purok) return false;
      }

      // Age range
      const age = computeAge(r.birthdate);
      if (filter.ageMin != null && (age ?? -1) < filter.ageMin) return false;
      if (filter.ageMax != null && (age ?? 999) > filter.ageMax) return false;

      // Sex
      if (filter.sex && r.sex !== filter.sex) return false;

      // Sector
      if (filter.sector && !(r.sectorTags ?? []).includes(filter.sector))
        return false;

      // Program
      if (
        filter.program &&
        !(r.programBeneficiaries ?? []).some((p) => p.programName === filter.program)
      )
        return false;

      // Voter status
      if (filter.voterStatus && r.voterStatus !== filter.voterStatus) return false;

      // Eligible but unregistered
      if (filter.eligibleUnregisteredOnly && !r.isEligibleUnregistered)
        return false;

      // Household
      if (filter.householdId && filter.householdId !== "all") {
        if (r.householdId !== filter.householdId) return false;
      }

      // Individual status
      if (filter.individualStatus && (r.individualStatus ?? "Active") !== filter.individualStatus)
        return false;

      return true;
    });
  }, [residents, filter, puroks]);

  // ── Hidden field groups based on role ──
  const hiddenGroups = getHiddenFieldGroups(role, isSuperAdmin);
  const showVoter = !hiddenGroups.includes("voter");
  const showIncome = !hiddenGroups.includes("income");
  const showPhilHealth = !hiddenGroups.includes("philhealth");

  // ── Audit helper ──
  const audit = React.useCallback(
    (action: "export" | "view", details: string) => {
      if (!firestore || !currentUser) return;
      logAudit(
        {
          firestore,
          barangayId: barangayId ?? "",
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: role ?? "",
        },
        action,
        "masterlist",
        barangayId ?? "",
        details,
      );
    },
    [firestore, currentUser, barangayId, role],
  );

  // ── Export handlers ──
  const handleExportExcel = () => {
    const filtersApplied = buildFilterDescription(filter, puroks);
    exportMasterlistExcel(filteredResidents, barangayName, filtersApplied);
    audit("export", `Exported masterlist to Excel (${filteredResidents.length} records)`);
  };

  const handleExportPdf = () => {
    exportMasterlistPdf(filteredResidents, barangayName, "Barangay Masterlist");
    audit("export", `Exported masterlist to PDF (${filteredResidents.length} records)`);
  };

  const handleExportHouseholdsExcel = () => {
    exportHouseholdsExcel(households, barangayName);
    audit("export", `Exported household list to Excel (${households.length} records)`);
  };

  const handleExportHouseholdsPdf = () => {
    exportHouseholdsPdf(households, barangayName);
    audit("export", `Exported household list to PDF (${households.length} records)`);
  };

  const handlePrebuiltReport = (reportType: string) => {
    setActiveReport(reportType);
    switch (reportType) {
      case "voter-list":
        exportReportExcel("voter-list", filteredResidents, barangayName);
        audit("export", "Exported registered voter list to Excel");
        break;
      case "non-voter-list":
        exportReportExcel("non-voter-list", filteredResidents, barangayName);
        audit("export", "Exported non-voter list to Excel");
        break;
      case "eligible-unregistered":
        exportReportExcel("eligible-unregistered", filteredResidents, barangayName);
        audit("export", "Exported eligible-but-unregistered list to Excel");
        break;
      case "program-beneficiaries":
        exportReportExcel("program-beneficiaries", filteredResidents, barangayName);
        audit("export", "Exported program beneficiary list to Excel");
        break;
      case "demographic-summary":
        exportReportExcel("demographic-summary", filteredResidents, barangayName);
        audit("export", "Exported demographic summary to Excel");
        break;
    }
  };

  // ── Save handlers ──
  const handleSaveIndividual = async (
    data: Omit<ProfilingResident, "id" | "userId" | "avatarUrl" | "email">,
  ) => {
    if (!firestore || !barangayId) return;
    const newId = `PROF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await setDoc(doc(firestore, "residents", newId), {
      ...data,
      id: newId,
      userId: newId,
      avatarUrl: "",
      email: "",
    });
    await logAudit(
      { firestore, barangayId, userId: currentUser!.id, userName: currentUser!.name, userRole: role ?? "" },
      "create", "individual", newId,
      `Added individual: ${data.firstName} ${data.lastName}`,
    );
    toast({ title: "Individual added", description: `${data.firstName} ${data.lastName} has been added to the masterlist.` });
  };

  const handleSaveHousehold = async (
    data: Omit<Household, "createdAt" | "updatedAt" | "createdBy" | "updatedBy" | "consentObtained" | "consentDate" | "qrCodeDataUrl">,
  ) => {
    if (!firestore || !barangayId) return;
    const now = new Date().toISOString();
    await setDoc(doc(firestore, "households", data.id), {
      ...data,
      consentObtained: true,
      consentDate: now.split("T")[0],
      qrCodeDataUrl: null,
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser?.id ?? "",
      updatedBy: currentUser?.id ?? "",
    });
    await logAudit(
      { firestore, barangayId, userId: currentUser!.id, userName: currentUser!.name, userRole: role ?? "" },
      "create", "household", data.id,
      `Added household: ${data.id} — ${data.householdHeadName}`,
    );
    toast({ title: "Household added", description: `Household ${data.id} has been registered.` });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading profiling data…</p>
      </div>
    );
  }

  // ── Dashboard stats ──
  const totalResidents = residents.length;
  const totalHouseholds = households.length;
  const totalVoters = residents.filter((r) => r.voterStatus === "Registered").length;
  const totalEligibleUnreg = residents.filter((r) => r.isEligibleUnregistered).length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Barangay Profiling
          </h1>
          <p className="text-muted-foreground">
            Masterlist, households, beneficiaries, voters, and sector groups for{" "}
            {barangayName}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canImportData(role, isSuperAdmin) && (
            <Button asChild variant="outline">
              <Link href="/profiling/import">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Link>
            </Button>
          )}
          {canImportData(role, isSuperAdmin) && (
            <Button variant="outline" onClick={downloadImportTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Template
            </Button>
          )}
          {canExportExcel(role, isSuperAdmin) && (
            <Button variant="outline" onClick={handleExportExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          )}
          {canExportPdf(role, isSuperAdmin) && (
            <Button variant="outline" onClick={handleExportPdf}>
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="masterlist" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
          <TabsTrigger value="masterlist">
            <Users className="mr-2 h-4 w-4" />
            Masterlist
          </TabsTrigger>
          <TabsTrigger value="households">
            <Home className="mr-2 h-4 w-4" />
            Households
          </TabsTrigger>
          <TabsTrigger value="benefits">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Benefits
          </TabsTrigger>
          <TabsTrigger value="dashboard">
            <BarChart3 className="mr-2 h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="mr-2 h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* ── MASTERLIST TAB ── */}
        <TabsContent value="masterlist" className="space-y-4">
          {/* Add button */}
          {canEditData(role, isSuperAdmin) && (
            <div className="flex justify-end">
              <Button onClick={() => setIsAddIndividualOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Individual
              </Button>
            </div>
          )}
          {/* Filter Bar */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search */}
                <Input
                  placeholder="🔍 Search by name…"
                  value={filter.searchText}
                  onChange={(e) =>
                    setFilter({ ...filter, searchText: e.target.value })
                  }
                  className="h-9"
                />

                {/* Purok */}
                <Select
                  value={filter.purok ?? "all"}
                  onValueChange={(v) =>
                    setFilter({
                      ...filter,
                      purok: v === "all" ? null : v,
                    })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Puroks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Puroks</SelectItem>
                    {puroks.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sex */}
                <Select
                  value={filter.sex ?? "all"}
                  onValueChange={(v) =>
                    setFilter({ ...filter, sex: v === "all" ? null : (v as Sex) })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Sexes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sexes</SelectItem>
                    {SEX_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sector */}
                <Select
                  value={filter.sector ?? "all"}
                  onValueChange={(v) =>
                    setFilter({
                      ...filter,
                      sector: v === "all" ? null : (v as SectorTag),
                    })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Sectors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sectors</SelectItem>
                    {SECTOR_TAGS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Program */}
                <Select
                  value={filter.program ?? "all"}
                  onValueChange={(v) =>
                    setFilter({
                      ...filter,
                      program: v === "all" ? null : (v as ProgramName),
                    })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Programs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {PROGRAM_NAMES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Voter status */}
                {showVoter && (
                  <Select
                    value={filter.voterStatus ?? "all"}
                    onValueChange={(v) =>
                      setFilter({
                        ...filter,
                        voterStatus:
                          v === "all" ? null : (v as VoterStatus),
                      })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Voter Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Voter Status</SelectItem>
                      {VOTER_STATUS_OPTIONS.map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Individual status */}
                <Select
                  value={filter.individualStatus ?? "all"}
                  onValueChange={(v) =>
                    setFilter({
                      ...filter,
                      individualStatus:
                        v === "all" ? null : (v as IndividualStatus),
                    })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Deceased">Deceased</SelectItem>
                    <SelectItem value="Transferred">Transferred</SelectItem>
                  </SelectContent>
                </Select>

                {/* Age range */}
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min age"
                    className="h-9"
                    value={filter.ageMin ?? ""}
                    onChange={(e) =>
                      setFilter({
                        ...filter,
                        ageMin: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                  />
                  <span className="text-muted-foreground">–</span>
                  <Input
                    type="number"
                    placeholder="Max age"
                    className="h-9"
                    value={filter.ageMax ?? ""}
                    onChange={(e) =>
                      setFilter({
                        ...filter,
                        ageMax: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filter.eligibleUnregisteredOnly}
                    onChange={(e) =>
                      setFilter({
                        ...filter,
                        eligibleUnregisteredOnly: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-input"
                  />
                  Eligible but unregistered only
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilter(DEFAULT_FILTER)}
                >
                  Clear filters
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <strong>{filteredResidents.length}</strong> of{" "}
                {totalResidents} individuals
              </p>
            </CardContent>
          </Card>

          {/* Masterlist Table */}
          <div className="rounded-lg border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">#</TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Sex</TableHead>
                    <TableHead className="font-semibold">Age</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">Birthdate</TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold">Purok</TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold">Sectors</TableHead>
                    {showVoter && (
                      <TableHead className="hidden lg:table-cell font-semibold">Voter</TableHead>
                    )}
                    <TableHead className="hidden lg:table-cell font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResidents.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={showVoter ? 9 : 8}
                        className="text-center text-muted-foreground py-8"
                      >
                        No individuals match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResidents.map((r, idx) => (
                      <TableRow key={r.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="font-medium">
                          {r.firstName} {r.middleName ?? ""} {r.lastName}{" "}
                          {r.extension ?? ""}
                        </TableCell>
                        <TableCell>{r.sex ?? "—"}</TableCell>
                        <TableCell>{computeAge(r.birthdate) ?? "—"}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatBirthdate(r.birthdate)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {r.purok || "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {(r.sectorTags ?? []).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {(r.programBeneficiaries ?? []).map((p) => (
                              <Badge
                                key={p.programName}
                                variant="outline"
                                className="text-xs"
                              >
                                {p.programName}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        {showVoter && (
                          <TableCell className="hidden lg:table-cell">
                            {r.voterStatus ?? "Unknown"}
                            {r.isEligibleUnregistered && (
                              <Badge
                                variant="destructive"
                                className="ml-1 text-xs"
                              >
                                Eligible/Unreg
                              </Badge>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="hidden lg:table-cell">
                          <Badge
                            variant={
                              (r.individualStatus ?? "Active") === "Active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {r.individualStatus ?? "Active"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* ── HOUSEHOLDS TAB ── */}
        <TabsContent value="households" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <strong>{totalHouseholds}</strong> households registered
            </p>
            <div className="flex gap-2">
              {canEditData(role, isSuperAdmin) && (
                <Button onClick={() => setIsAddHouseholdOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Household
                </Button>
              )}
              {canExportExcel(role, isSuperAdmin) && (
                <Button variant="outline" size="sm" onClick={handleExportHouseholdsExcel}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export Excel
                </Button>
              )}
              {canExportPdf(role, isSuperAdmin) && (
                <Button variant="outline" size="sm" onClick={handleExportHouseholdsPdf}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
              )}
            </div>
          </div>
          <div className="rounded-lg border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">Household ID</TableHead>
                    <TableHead className="font-semibold">Purok</TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold">Address</TableHead>
                    <TableHead className="font-semibold">Head</TableHead>
                    <TableHead className="font-semibold">Members</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">Type</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">Income</TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold">Verified</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {households.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No households registered yet. Use Import to add them.
                      </TableCell>
                    </TableRow>
                  ) : (
                    households.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="font-mono text-xs">{h.id}</TableCell>
                        <TableCell>{h.purokName || h.purokId || "—"}</TableCell>
                        <TableCell className="hidden sm:table-cell">{h.address}</TableCell>
                        <TableCell>{h.householdHeadName || "—"}</TableCell>
                        <TableCell>{h.memberCount}</TableCell>
                        <TableCell className="hidden md:table-cell">{h.housingType}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {showIncome ? (h.incomeBracket || "—") : "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {h.lastVerifiedDate ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* ── BENEFITS TAB ── */}
        <TabsContent value="benefits">
          <BenefitsTab
            residents={residents}
            households={households}
            barangayName={barangayName}
            canExport={canExportExcel(role, isSuperAdmin)}
          />
        </TabsContent>

        {/* ── DASHBOARD TAB ── */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{totalResidents}</div>
                <p className="text-sm text-muted-foreground">Total Individuals</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{totalHouseholds}</div>
                <p className="text-sm text-muted-foreground">Households</p>
              </CardContent>
            </Card>
            {showVoter && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{totalVoters}</div>
                  <p className="text-sm text-muted-foreground">Registered Voters</p>
                </CardContent>
              </Card>
            )}
            {showVoter && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-orange-600">
                    {totalEligibleUnreg}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Eligible / Unregistered
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Per-Purok breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Individuals per Purok</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {puroks.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No puroks defined yet.
                  </p>
                ) : (
                  puroks.map((p) => {
                    const count = residents.filter(
                      (r) =>
                        r.purok === p.name || r.purok === p.id,
                    ).length;
                    const pct = totalResidents
                      ? Math.round((count / totalResidents) * 100)
                      : 0;
                    return (
                      <div key={p.id} className="flex items-center gap-3">
                        <div className="w-24 text-sm font-medium">{p.name}</div>
                        <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${Math.max(pct, 3)}%` }}
                          >
                            <span className="text-xs text-primary-foreground">
                              {count}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sector breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Individuals per Sector</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SECTOR_TAGS.map((tag) => {
                  const count = residents.filter((r) =>
                    (r.sectorTags ?? []).includes(tag),
                  ).length;
                  return (
                    <div
                      key={tag}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{tag}</p>
                        <p className="text-xs text-muted-foreground">
                          {SECTOR_DESCRIPTIONS[tag]}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-lg">
                        {count}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Program breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Beneficiaries per Program</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {PROGRAM_NAMES.map((prog) => {
                  const count = residents.filter((r) =>
                    (r.programBeneficiaries ?? []).some(
                      (p) => p.programName === prog,
                    ),
                  ).length;
                  return (
                    <div key={prog} className="flex items-center gap-3">
                      <div className="w-40 text-sm font-medium">{prog}</div>
                      <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full flex items-center justify-end pr-2"
                          style={{
                            width: `${Math.max(
                              totalResidents ? (count / totalResidents) * 100 : 0,
                              count > 0 ? 5 : 0,
                            )}%`,
                          }}
                        >
                          <span className="text-xs text-white">{count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Voter status breakdown */}
          {showVoter && (
            <Card>
              <CardHeader>
                <CardTitle>Voter Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {VOTER_STATUS_OPTIONS.map((v) => {
                    const count = residents.filter(
                      (r) => (r.voterStatus ?? "Unknown") === v,
                    ).length;
                    return (
                      <div
                        key={v}
                        className="text-center p-4 border rounded-lg"
                      >
                        <div className="text-2xl font-bold">{count}</div>
                        <p className="text-xs text-muted-foreground">{v}</p>
                      </div>
                    );
                  })}
                  <div className="text-center p-4 border rounded-lg border-orange-300 bg-orange-50">
                    <div className="text-2xl font-bold text-orange-600">
                      {totalEligibleUnreg}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Eligible / Unreg
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── REPORTS TAB ── */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prebuilt Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Click any report to generate and download it as an Excel file.
                The current filters will be applied.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ReportButton
                  label="Barangay Masterlist"
                  description="Full list of all individuals with all fields"
                  onClick={() => {
                    exportMasterlistExcel(filteredResidents, barangayName, buildFilterDescription(filter, puroks));
                    audit("export", "Exported barangay masterlist (prebuilt)");
                  }}
                  disabled={!canExportExcel(role, isSuperAdmin)}
                />
                <ReportButton
                  label="Household List with Members"
                  description="List of all households with member counts"
                  onClick={handleExportHouseholdsExcel}
                  disabled={!canExportExcel(role, isSuperAdmin)}
                />
                <ReportButton
                  label="Program Beneficiary Lists"
                  description="Beneficiaries per government program"
                  onClick={() => handlePrebuiltReport("program-beneficiaries")}
                  disabled={!canExportExcel(role, isSuperAdmin)}
                />
                {showVoter && (
                  <ReportButton
                    label="Registered Voter List"
                    description="All registered voters with precinct numbers"
                    onClick={() => handlePrebuiltReport("voter-list")}
                    disabled={!canExportExcel(role, isSuperAdmin)}
                  />
                )}
                {showVoter && (
                  <ReportButton
                    label="Non-Voter List"
                    description="Individuals not registered to vote"
                    onClick={() => handlePrebuiltReport("non-voter-list")}
                    disabled={!canExportExcel(role, isSuperAdmin)}
                  />
                )}
                {showVoter && (
                  <ReportButton
                    label="Eligible but Unregistered"
                    description="18+ and 6+ months residency, not yet registered"
                    onClick={() => handlePrebuiltReport("eligible-unregistered")}
                    disabled={!canExportExcel(role, isSuperAdmin)}
                  />
                )}
                <ReportButton
                  label="Sector Lists"
                  description="Individuals grouped by sector tag"
                  onClick={() => handlePrebuiltReport("sector-list")}
                  disabled={!canExportExcel(role, isSuperAdmin)}
                />
                <ReportButton
                  label="Demographic Summary"
                  description="Population breakdown by age, sex, sector, voter"
                  onClick={() => handlePrebuiltReport("demographic-summary")}
                  disabled={!canExportExcel(role, isSuperAdmin)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Audit log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Audit Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold text-sm">When</TableHead>
                      <TableHead className="font-semibold text-sm">User</TableHead>
                      <TableHead className="font-semibold text-sm">Action</TableHead>
                      <TableHead className="hidden sm:table-cell font-semibold text-sm">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                          No audit entries yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs
                        .slice()
                        .reverse()
                        .slice(0, 50)
                        .map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs">
                              {(() => {
                                const ts = log.timestamp as unknown;
                                if (typeof ts === "string") {
                                  return new Date(ts).toLocaleString("en-PH");
                                }
                                if (ts && typeof ts === "object" && "seconds" in ts) {
                                  return new Date(
                                    (ts as { seconds: number }).seconds * 1000,
                                  ).toLocaleString("en-PH");
                                }
                                return "—";
                              })()}
                            </TableCell>
                            <TableCell className="text-sm">{log.userName}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {log.action}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm">
                              {log.details}
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ── */}
      <AddIndividualDialog
        isOpen={isAddIndividualOpen}
        onClose={() => setIsAddIndividualOpen(false)}
        barangayId={barangayId ?? ""}
        barangayName={barangayName}
        puroks={puroks}
        households={households}
        onSave={handleSaveIndividual}
      />

      <AddHouseholdDialog
        isOpen={isAddHouseholdOpen}
        onClose={() => setIsAddHouseholdOpen(false)}
        barangayId={barangayId ?? ""}
        barangayName={barangayName}
        puroks={puroks}
        nextSequence={households.length + 1}
        onSave={handleSaveHousehold}
      />
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────

function ReportButton({
  label,
  description,
  onClick,
  disabled,
}: {
  label: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="outline"
      className="h-auto py-3 flex flex-col items-start text-left"
      onClick={onClick}
      disabled={disabled}
    >
      <span className="font-semibold">{label}</span>
      <span className="text-xs text-muted-foreground font-normal">
        {description}
      </span>
    </Button>
  );
}

function buildFilterDescription(
  filter: ProfilingFilter,
  puroks: { id: string; name: string }[],
): string {
  const parts: string[] = [];
  if (filter.purok) {
    const p = puroks.find((p) => p.id === filter.purok);
    parts.push(`Purok: ${p?.name ?? filter.purok}`);
  }
  if (filter.ageMin != null || filter.ageMax != null) {
    parts.push(`Age: ${filter.ageMin ?? 0}–${filter.ageMax ?? 999}`);
  }
  if (filter.sex) parts.push(`Sex: ${filter.sex}`);
  if (filter.sector) parts.push(`Sector: ${filter.sector}`);
  if (filter.program) parts.push(`Program: ${filter.program}`);
  if (filter.voterStatus) parts.push(`Voter: ${filter.voterStatus}`);
  if (filter.eligibleUnregisteredOnly) parts.push("Eligible/Unregistered only");
  if (filter.individualStatus) parts.push(`Status: ${filter.individualStatus}`);
  return parts.join("; ");
}
