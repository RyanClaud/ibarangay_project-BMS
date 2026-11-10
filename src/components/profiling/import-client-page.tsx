"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useAppContext } from "@/contexts/app-context";
import { useFirebase } from "@/firebase";
import { useProfilingData } from "@/hooks/use-profiling-data";
import {
  parseImportFile,
  groupByHousehold,
  type ImportResult,
  type ImportRow,
} from "@/lib/profiling/import-utils";
import { downloadImportTemplate } from "@/lib/profiling/export-utils";
import { computeEligibleUnregistered } from "@/lib/profiling/age-utils";
import { logAudit } from "@/lib/profiling/audit";
import { canImportData } from "@/lib/profiling/access-control";
import {
  collection,
  doc,
  writeBatch,
  setDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

export function ImportClientPage() {
  const { currentUser, barangayConfig } = useAppContext();
  const { firestore } = useFirebase();
  const barangayId = currentUser?.barangayId ?? null;
  const barangayName = barangayConfig?.name ?? "Barangay";
  const role = currentUser?.role ?? null;
  const isSuperAdmin = currentUser?.isSuperAdmin ?? false;

  const { residents, households, puroks } = useProfilingData(barangayId, barangayName);

  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);
  const [imported, setImported] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ── Access check ──
  const canImport = canImportData(role, isSuperAdmin);

  // ── File selection ──
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const importResult = await parseImportFile(file, residents);
      setResult(importResult);
      setImported(false);
      toast({
        title: "File parsed",
        description: `${importResult.totalRows} rows found, ${importResult.validRows} valid, ${importResult.errorRows} errors, ${importResult.duplicateRows} duplicates`,
      });
    } catch (err) {
      toast({
        title: "Import failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Commit import ──
  const handleCommitImport = async () => {
    if (!result || !firestore || !barangayId || !currentUser) return;
    setIsImporting(true);
    try {
      const validRows = result.rows.filter(
        (r) => r.errors.length === 0 && !r.isDuplicate,
      );
      const grouped = groupByHousehold(validRows);

      const batch = writeBatch(firestore);
      let householdsCreated = 0;
      let individualsCreated = 0;
      const now = new Date().toISOString();

      for (const [householdId, rows] of grouped.entries()) {
        // Check if household already exists
        const existingHh = households.find((h) => h.id === householdId);
        const firstRow = rows[0];
        const headRow = rows.find(
          (r) => r.parsed.relationshipToHead === "Head",
        ) ?? firstRow;

        if (!existingHh) {
          // Create the household document
          const householdData = {
            id: householdId,
            barangayId,
            purokId: null,
            purokName: firstRow.parsed.purok,
            address: firstRow.parsed.address,
            householdHeadId: null,
            householdHeadName: `${headRow.parsed.firstName} ${headRow.parsed.lastName}`,
            memberCount: rows.length,
            housingType: "Concrete",
            housingTenure: "Owned",
            accessToWater: false,
            accessToElectricity: false,
            accessToToilet: false,
            incomeBracket: "",
            disasterRiskIndicators: [],
            lastVerifiedDate: now.split("T")[0],
            consentObtained: true,
            consentDate: now.split("T")[0],
            qrCodeDataUrl: null,
            createdAt: now,
            updatedAt: now,
            createdBy: currentUser.id,
            updatedBy: currentUser.id,
          };
          batch.set(doc(firestore, "households", householdId), householdData);
          householdsCreated++;
        } else {
          // Update member count
          batch.update(doc(firestore, "households", householdId), {
            memberCount: (existingHh.memberCount ?? 0) + rows.length,
            updatedAt: now,
            updatedBy: currentUser.id,
          });
        }

        // Create/update individuals (as residents)
        for (const row of rows) {
          const p = row.parsed;
          const residentId = `PROF-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;
          const isHead = p.relationshipToHead === "Head";
          const isEligible = computeEligibleUnregistered({
            birthdate: p.birthdate,
            lengthOfResidencyYears: p.residencyYears,
            voterStatus: p.voterStatus,
          });

          const programBeneficiaries = p.program
            ? [
                {
                  programName: p.program,
                  status: p.programStatus,
                  dateEnrolled: p.dateEnrolled || now.split("T")[0],
                  issuingOffice: p.issuingOffice || "",
                },
              ]
            : [];

          const residentData = {
            id: residentId,
            userId: residentId,
            firstName: p.firstName,
            middleName: p.middleName || "",
            lastName: p.lastName,
            extension: p.extension || "",
            sex: p.sex,
            birthdate: p.birthdate,
            civilStatus: p.civilStatus,
            relationshipToHead: p.relationshipToHead,
            citizenship: p.citizenship,
            lengthOfResidencyYears: p.residencyYears,
            education: p.education,
            occupation: p.occupation,
            contactNumber: p.contactNumber,
            philhealthStatus: p.philhealth,
            disability: p.disability,
            individualStatus: p.individualStatus,
            sectorTags: p.sectorTags,
            programBeneficiaries,
            voterStatus: p.voterStatus,
            precinctNumber: p.precinctNumber,
            voterVerificationSource: p.voterVerificationDate
              ? "Import"
              : "",
            voterVerificationDate: p.voterVerificationDate || null,
            isEligibleUnregistered: isEligible,
            householdId,
            householdNumber: householdId,
            purok: p.purok,
            address: p.address || `${p.purok}, ${barangayName}`,
            email: "",
            avatarUrl: "",
            barangayId,
            consentObtained: true,
            consentDate: now.split("T")[0],
            createdAt: now,
            updatedAt: now,
            createdBy: currentUser.id,
            updatedBy: currentUser.id,
          };
          batch.set(doc(firestore, "residents", residentId), residentData);
          individualsCreated++;

          // If this is the head, set as householdHeadId
          if (isHead) {
            batch.update(doc(firestore, "households", householdId), {
              householdHeadId: residentId,
              householdHeadName: `${p.firstName} ${p.lastName}`,
            });
          }
        }
      }

      await batch.commit();

      // Log the import
      await logAudit(
        {
          firestore,
          barangayId,
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: role ?? "",
        },
        "import",
        "import",
        barangayId,
        `Imported ${individualsCreated} individuals across ${householdsCreated} new households`,
      );

      toast({
        title: "Import successful",
        description: `${individualsCreated} individuals added to ${householdsCreated} new households.`,
      });
      setImported(true);
    } catch (err) {
      console.error("Import error:", err);
      toast({
        title: "Import failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (!canImport) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/profiling">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profiling
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              You do not have permission to import data. Only Admin and Secretary
              roles can perform bulk imports.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Bulk Import
          </h1>
          <p className="text-muted-foreground">
            Upload an Excel or CSV file to add households and individuals in bulk.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/profiling">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profiling
          </Link>
        </Button>
      </div>

      {/* Step 1: Download template */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Download Template</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Download the Excel template with correct column headers and a sample
            row. Fill it in with your resident data, then upload it in Step 2.
          </p>
          <Button onClick={downloadImportTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download Import Template
          </Button>
        </CardContent>
      </Card>

      {/* Step 2: Upload file */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Upload Your Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select your filled-in Excel (.xlsx) or CSV file. We will validate
            every row and check for duplicates before anything is saved.
          </p>
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
              id="import-file-input"
            />
            <Button asChild>
              <label htmlFor="import-file-input" className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Preview and commit */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>
              Step 3: Review &amp; Import{" "}
              {imported && (
                <Badge variant="default" className="ml-2">
                  Completed
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-lg font-bold">{result.validRows}</div>
                  <p className="text-xs text-muted-foreground">Valid</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-lg font-bold">{result.errorRows}</div>
                  <p className="text-xs text-muted-foreground">Errors</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="text-lg font-bold">
                    {result.duplicateRows}
                  </div>
                  <p className="text-xs text-muted-foreground">Duplicates</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <Upload className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-lg font-bold">{result.totalRows}</div>
                  <p className="text-xs text-muted-foreground">Total Rows</p>
                </div>
              </div>
            </div>

            {/* Validation table */}
            <div className="rounded-lg border overflow-hidden max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0">
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold text-sm">Row</TableHead>
                    <TableHead className="font-semibold text-sm">Name</TableHead>
                    <TableHead className="font-semibold text-sm">HH ID</TableHead>
                    <TableHead className="font-semibold text-sm">Status</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-sm">
                      Issues
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.map((row: ImportRow) => (
                    <TableRow key={row.rowIndex}>
                      <TableCell className="text-xs">{row.rowIndex}</TableCell>
                      <TableCell className="text-sm">
                        {row.parsed.firstName} {row.parsed.lastName}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {row.parsed.householdId}
                      </TableCell>
                      <TableCell>
                        {row.errors.length > 0 ? (
                          <Badge variant="destructive" className="text-xs">
                            Error
                          </Badge>
                        ) : row.isDuplicate ? (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-yellow-100 text-yellow-800"
                          >
                            Duplicate
                          </Badge>
                        ) : (
                          <Badge
                            variant="default"
                            className="text-xs bg-green-100 text-green-800"
                          >
                            Valid
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs">
                        {row.errors.length > 0 ? (
                          <span className="text-red-600">
                            {row.errors.join("; ")}
                          </span>
                        ) : row.isDuplicate ? (
                          <span className="text-yellow-700">
                            {row.duplicateMatch ||
                              row.warnings.join("; ")}
                          </span>
                        ) : row.warnings.length > 0 ? (
                          <span className="text-yellow-600">
                            {row.warnings.join("; ")}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Commit button */}
            {result.validRows > 0 && !imported && (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                <p className="text-sm">
                  Ready to import{" "}
                  <strong>{result.validRows}</strong> valid individuals. This
                  action cannot be undone.
                </p>
                <Button onClick={handleCommitImport} disabled={isImporting}>
                  {isImporting ? "Importing…" : "Commit Import"}
                </Button>
              </div>
            )}
            {imported && (
              <div className="flex items-center gap-2 p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm">
                  Import complete. The data is now live. Go back to the Profiling
                  page to view it.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/profiling">View Masterlist</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
