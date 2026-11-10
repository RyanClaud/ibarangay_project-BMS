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
import { Badge } from "@/components/ui/badge";
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
import { FileSpreadsheet, Users, Home } from "lucide-react";
import * as XLSX from "xlsx";

import type {
  ProfilingResident,
  Household,
  HouseholdBeneficiarySummary,
  ProgramName,
} from "@/lib/profiling/types";
import {
  PROGRAM_NAMES,
  PROGRAM_GROUPS,
  PROGRAM_BADGE_COLORS,
  PROGRAM_DESCRIPTIONS,
  PROGRAM_ISSUING_OFFICES,
  PROGRAM_STATUS_COLORS,
} from "@/lib/profiling/constants";
import {
  computeHouseholdBenefitSummaries,
  filterByProgram,
  filterByMinEnrolled,
  getTotalPerProgram,
} from "@/lib/profiling/household-benefits";

interface BenefitsTabProps {
  residents: ProfilingResident[];
  households: Household[];
  barangayName: string;
  canExport: boolean;
}

type ViewMode = "by-household" | "by-individual" | "summary";

export function BenefitsTab({
  residents,
  households,
  barangayName,
  canExport,
}: BenefitsTabProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>("by-household");
  const [programFilter, setProgramFilter] = React.useState<ProgramName | "all">("all");
  const [minEnrolled, setMinEnrolled] = React.useState<string>("");
  const [searchText, setSearchText] = React.useState("");

  // ── Computed data ──────────────────────────────────────────────────

  const allSummaries = React.useMemo(
    () => computeHouseholdBenefitSummaries(residents, households),
    [residents, households],
  );

  const filteredSummaries = React.useMemo(() => {
    let result = allSummaries;
    if (programFilter !== "all") {
      result = filterByProgram(result, programFilter as ProgramName);
    }
    const min = parseInt(minEnrolled, 10);
    if (!isNaN(min) && min > 0) {
      result = filterByMinEnrolled(result, min);
    }
    if (searchText) {
      const q = searchText.toLowerCase();
      result = result.filter(
        (s) =>
          s.householdId.toLowerCase().includes(q) ||
          s.householdHeadName.toLowerCase().includes(q) ||
          s.purokName.toLowerCase().includes(q),
      );
    }
    return result;
  }, [allSummaries, programFilter, minEnrolled, searchText]);

  const globalTotals = React.useMemo(
    () => getTotalPerProgram(allSummaries),
    [allSummaries],
  );

  // Residents enrolled in the filtered program
  const filteredBeneficiaryResidents = React.useMemo(() => {
    return residents.filter((r) => {
      if (programFilter !== "all") {
        return (r.programBeneficiaries ?? []).some(
          (p) => p.programName === programFilter && p.status !== "Delisted",
        );
      }
      return (r.programBeneficiaries ?? []).some((p) => p.status !== "Delisted");
    });
  }, [residents, programFilter]);

  // ── Stats ──────────────────────────────────────────────────────────

  const totalBeneficiaryResidents = residents.filter(
    (r) => (r.programBeneficiaries ?? []).some((p) => p.status !== "Delisted"),
  ).length;

  const totalHouseholdsWithPrograms = allSummaries.filter(
    (s) => s.enrolledMemberCount > 0,
  ).length;

  // ── Export ──────────────────────────────────────────────────────────

  const handleExportHouseholdSummary = () => {
    const programCols = PROGRAM_NAMES;
    const headers = [
      "Household ID",
      "Head",
      "Purok",
      "Address",
      "Total Members",
      "Enrolled Members",
      ...programCols,
    ];

    const rows = filteredSummaries.map((s) => [
      s.householdId,
      s.householdHeadName,
      s.purokName,
      s.address,
      s.totalMembers,
      s.enrolledMemberCount,
      ...programCols.map((p) => s.programCounts[p] ?? 0),
    ]);

    const title = programFilter === "all"
      ? `${barangayName.toUpperCase()} — HOUSEHOLD BENEFITS SUMMARY`
      : `${barangayName.toUpperCase()} — HOUSEHOLDS: ${programFilter}`;

    const allRows = [
      [title],
      [`Generated: ${new Date().toLocaleString("en-PH")}`],
      [],
      headers,
      ...rows,
    ];
    const ws = XLSX.utils.aoa_to_sheet(allRows);
    ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 2, 10) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Household Benefits");
    XLSX.writeFile(wb, `${barangayName}_HouseholdBenefits_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleExportIndividuals = () => {
    const headers = [
      "Name", "Sex", "Age", "Purok", "Household ID",
      "Program", "Status", "Date Enrolled", "Issuing Office", "Reference #",
    ];
    const rows: (string | number)[][] = [];
    for (const r of filteredBeneficiaryResidents) {
      for (const p of r.programBeneficiaries ?? []) {
        if (p.status === "Delisted") continue;
        if (programFilter !== "all" && p.programName !== programFilter) continue;
        const birthDate = r.birthdate ? new Date(r.birthdate) : null;
        const age = birthDate
          ? new Date().getFullYear() - birthDate.getFullYear()
          : "";
        rows.push([
          `${r.firstName} ${r.middleName ?? ""} ${r.lastName}`.trim(),
          r.sex ?? "",
          age,
          r.purok ?? "",
          r.householdId ?? r.householdNumber ?? "",
          p.programName,
          p.status,
          p.dateEnrolled,
          p.issuingOffice,
          (p as any).referenceNumber ?? "",
        ]);
      }
    }
    const allRows = [
      [`${barangayName.toUpperCase()} — INDIVIDUAL BENEFICIARIES${programFilter !== "all" ? `: ${programFilter}` : ""}`],
      [`Generated: ${new Date().toLocaleString("en-PH")}`],
      [],
      headers,
      ...rows,
    ];
    const ws = XLSX.utils.aoa_to_sheet(allRows);
    ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 2, 12) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Beneficiaries");
    XLSX.writeFile(wb, `${barangayName}_Beneficiaries_${programFilter === "all" ? "All" : programFilter.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold">{totalBeneficiaryResidents}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Enrolled individuals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold">{totalHouseholdsWithPrograms}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Households with programs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold">{PROGRAM_NAMES.filter((p) => (globalTotals[p] ?? 0) > 0).length}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Active programs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold">
              {Object.values(globalTotals).reduce((a, b) => a + b, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Total enrollments</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters ── */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <p className="text-xs text-muted-foreground mb-1">Program</p>
              <Select value={programFilter} onValueChange={(v) => setProgramFilter(v as ProgramName | "all")}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {PROGRAM_GROUPS.map((group) => (
                    <React.Fragment key={group.label}>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/50">
                        {group.label}
                      </div>
                      {group.programs.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                          {(globalTotals[p] ?? 0) > 0 && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({globalTotals[p]})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-40">
              <p className="text-xs text-muted-foreground mb-1">Min. enrolled members</p>
              <Input
                type="number"
                min="1"
                placeholder="Any"
                className="h-9"
                value={minEnrolled}
                onChange={(e) => setMinEnrolled(e.target.value)}
              />
            </div>

            <div className="flex-1 min-w-[180px]">
              <p className="text-xs text-muted-foreground mb-1">Search household</p>
              <Input
                placeholder="ID, head name, purok…"
                className="h-9"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            {/* View toggle */}
            <div className="flex border rounded-md overflow-hidden h-9">
              {(["by-household", "by-individual", "summary"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 text-xs font-medium transition-colors ${
                    viewMode === mode
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {mode === "by-household" ? "By Household" : mode === "by-individual" ? "By Individual" : "Summary"}
                </button>
              ))}
            </div>

            {canExport && (
              <>
                <Button variant="outline" size="sm" className="h-9" onClick={handleExportHouseholdSummary}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Household Excel
                </Button>
                <Button variant="outline" size="sm" className="h-9" onClick={handleExportIndividuals}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Individual Excel
                </Button>
              </>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            Showing{" "}
            <strong>
              {viewMode === "by-individual" ? filteredBeneficiaryResidents.length : filteredSummaries.length}
            </strong>{" "}
            {viewMode === "by-individual" ? "individuals" : "households"}
          </p>
        </CardContent>
      </Card>

      {/* ── View: By Household ── */}
      {viewMode === "by-household" && (
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Household</TableHead>
                  <TableHead className="font-semibold">Purok</TableHead>
                  <TableHead className="font-semibold text-center">Members</TableHead>
                  <TableHead className="font-semibold text-center">Enrolled</TableHead>
                  <TableHead className="font-semibold">Programs (enrolled count)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSummaries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No households match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSummaries.map((s) => (
                    <TableRow key={s.householdId}>
                      <TableCell>
                        <div className="font-medium text-sm">{s.householdHeadName}</div>
                        <div className="font-mono text-xs text-muted-foreground">{s.householdId}</div>
                      </TableCell>
                      <TableCell className="text-sm">{s.purokName || "—"}</TableCell>
                      <TableCell className="text-center">{s.totalMembers}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={s.enrolledMemberCount > 0 ? "default" : "secondary"}
                          className="font-mono"
                        >
                          {s.enrolledMemberCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {s.programs.length === 0 ? (
                            <span className="text-xs text-muted-foreground">None</span>
                          ) : (
                            s.programs.map((prog) => (
                              <span
                                key={prog}
                                className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border font-medium ${PROGRAM_BADGE_COLORS[prog]}`}
                              >
                                {prog}
                                {(s.programCounts[prog] ?? 0) > 1 && (
                                  <span className="font-bold">×{s.programCounts[prog]}</span>
                                )}
                              </span>
                            ))
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ── View: By Individual ── */}
      {viewMode === "by-individual" && (
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell">Purok</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">Household</TableHead>
                  <TableHead className="font-semibold">Programs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBeneficiaryResidents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No individuals match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBeneficiaryResidents.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-sm">
                        {r.firstName} {r.middleName ?? ""} {r.lastName}
                      </TableCell>
                      <TableCell className="text-sm hidden sm:table-cell">{r.purok || "—"}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground hidden md:table-cell">
                        {r.householdId ?? r.householdNumber ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(r.programBeneficiaries ?? [])
                            .filter((p) => p.status !== "Delisted")
                            .filter((p) => programFilter === "all" || p.programName === programFilter)
                            .map((p) => (
                              <span
                                key={p.programName}
                                className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded border font-medium ${PROGRAM_BADGE_COLORS[p.programName]}`}
                                title={`${p.status} — ${p.issuingOffice}${(p as any).referenceNumber ? ` — Ref: ${(p as any).referenceNumber}` : ""}`}
                              >
                                {p.programName}
                                <span className={`ml-1 text-xs ${PROGRAM_STATUS_COLORS[p.status]} px-1 rounded`}>
                                  {p.status}
                                </span>
                              </span>
                            ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ── View: Summary chart ── */}
      {viewMode === "summary" && (
        <div className="space-y-4">
          {PROGRAM_GROUPS.map((group) => {
            const activeProgramsInGroup = group.programs.filter(
              (p) => (globalTotals[p] ?? 0) > 0,
            );
            if (activeProgramsInGroup.length === 0) return null;
            return (
              <Card key={group.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
                    {group.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {group.programs.map((prog) => {
                    const count = globalTotals[prog] ?? 0;
                    const householdCount = allSummaries.filter(
                      (s) => (s.programCounts[prog] ?? 0) > 0,
                    ).length;
                    const maxCount = Math.max(...Object.values(globalTotals), 1);
                    const pct = Math.max((count / maxCount) * 100, count > 0 ? 2 : 0);
                    return (
                      <div key={prog} className="flex items-center gap-3">
                        <div className="w-44 shrink-0">
                          <span
                            className={`inline-block text-xs px-1.5 py-0.5 rounded border font-medium ${PROGRAM_BADGE_COLORS[prog]}`}
                          >
                            {prog}
                          </span>
                        </div>
                        <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full flex items-center justify-end pr-2 transition-all"
                            style={{ width: `${pct}%` }}
                          >
                            {count > 0 && (
                              <span className="text-xs text-primary-foreground font-medium">
                                {count}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground w-24 shrink-0 text-right">
                          {count > 0 ? (
                            <>
                              <span className="font-medium">{count}</span> ind.{" "}
                              <span>/ {householdCount} HH</span>
                            </>
                          ) : (
                            "—"
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}

          {Object.values(globalTotals).every((v) => v === 0) && (
            <div className="text-center text-muted-foreground py-8">
              No program enrollments recorded yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
