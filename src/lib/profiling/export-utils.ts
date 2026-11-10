/**
 * Excel and PDF export for the Barangay Profiling Module.
 *
 * Uses the already-installed `xlsx` and `jspdf` / `jspdf-autotable`
 * packages so no new export dependencies are required.
 */

import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { resolveBarangayDetails } from "@/lib/reports";
import type { Barangay } from "@/lib/types";

import type {
  Household,
  ProfilingResident,
  ReportType,
} from "./types";
import { computeAge, formatBirthdate } from "./age-utils";

// ─── Helpers ───────────────────────────────────────────────────────────

function fullizedName(r: ProfilingResident): string {
  return [r.firstName, r.middleName, r.lastName, r.extension]
    .filter(Boolean)
    .join(" ");
}

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Excel Export ──────────────────────────────────────────────────────

/** Column definitions for the masterlist Excel sheet. */
function buildMasterlistRows(residents: ProfilingResident[]): (string | number)[][] {
  return residents.map((r, idx) => {
    const age = computeAge(r.birthdate);
    return [
      idx + 1,
      fullizedName(r),
      r.sex ?? "",
      age ?? "",
      formatBirthdate(r.birthdate),
      r.civilStatus ?? "",
      r.relationshipToHead ?? "",
      r.citizenship ?? "",
      r.lengthOfResidencyYears != null ? `${r.lengthOfResidencyYears} yrs` : "",
      r.education ?? "",
      r.occupation ?? "",
      r.contactNumber ?? "",
      r.philhealthStatus ?? "",
      r.disability ?? "None",
      r.individualStatus ?? "Active",
      r.purok ?? "",
      r.address ?? "",
      (r.sectorTags ?? []).join(", "),
      (r.programBeneficiaries ?? [])
        .map((p) => `${p.programName} (${p.status})`)
        .join(", "),
      r.voterStatus ?? "Unknown",
      r.precinctNumber ?? "",
      r.isEligibleUnregistered ? "Yes" : "No",
    ];
  });
}

const MASTERLIST_COLUMNS = [
  "#",
  "Full Name",
  "Sex",
  "Age",
  "Birthdate",
  "Civil Status",
  "Relationship to Head",
  "Citizenship",
  "Residency (yrs)",
  "Education",
  "Occupation",
  "Contact #",
  "PhilHealth",
  "Disability",
  "Status",
  "Purok",
  "Address",
  "Sectors",
  "Programs",
  "Voter Status",
  "Precinct #",
  "Eligible/Unreg",
];

/** Export the resident masterlist to an Excel file. */
export function exportMasterlistExcel(
  residents: ProfilingResident[],
  barangayName: string,
  filtersApplied: string,
): void {
  const dataRows = buildMasterlistRows(residents);

  // Build all rows together: title block → blank → headers → data
  const titleRows: (string | number)[][] = [
    [`${barangayName.toUpperCase()} — BARANGAY MASTERLIST`],
    [`Generated: ${new Date().toLocaleString("en-PH")}`],
    ...(filtersApplied ? [[`Filters: ${filtersApplied}`]] : []),
    [], // blank spacer row
  ];

  const allRows = [...titleRows, MASTERLIST_COLUMNS, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Set column widths
  ws["!cols"] = MASTERLIST_COLUMNS.map((col) => ({
    wch: Math.max(col.length + 2, 14),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Masterlist");

  XLSX.writeFile(wb, `${barangayName}_Masterlist_${todayString()}.xlsx`);
}

/** Export the household list (with member counts) to Excel. */
export function exportHouseholdsExcel(
  households: Household[],
  barangayName: string,
): void {
  const columns = [
    "Household ID",
    "Purok",
    "Address",
    "Household Head",
    "Members",
    "Housing Type",
    "Tenure",
    "Water",
    "Electricity",
    "Toilet",
    "Income Bracket",
    "Disaster Risk",
    "Last Verified",
  ];

  const rows = households.map((h) => [
    h.id,
    h.purokName || h.purokId || "",
    h.address,
    h.householdHeadName,
    h.memberCount,
    h.housingType,
    h.housingTenure,
    h.accessToWater ? "Yes" : "No",
    h.accessToElectricity ? "Yes" : "No",
    h.accessToToilet ? "Yes" : "No",
    h.incomeBracket || "",
    h.disasterRiskIndicators.join(", "),
    h.lastVerifiedDate ?? "—",
  ]);

  const ws = XLSX.utils.aoa_to_sheet([columns, ...rows]);
  ws["!cols"] = columns.map((col) => ({ wch: Math.max(col.length + 2, 12) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Households");

  XLSX.writeFile(wb, `${barangayName}_Households_${todayString()}.xlsx`);
}

/** Export any report type to Excel, choosing the appropriate columns. */
export function exportReportExcel(
  reportType: ReportType,
  residents: ProfilingResident[],
  barangayName: string,
): void {
  switch (reportType) {
    case "barangay-masterlist":
      exportMasterlistExcel(residents, barangayName, "");
      break;
    case "household-list":
      // This overload is handled separately via exportHouseholdsExcel
      exportMasterlistExcel(residents, barangayName, "Household List View");
      break;
    case "program-beneficiaries":
      exportBeneficiariesExcel(residents, barangayName);
      break;
    case "voter-list":
      exportMasterlistExcel(
        residents.filter((r) => r.voterStatus === "Registered"),
        barangayName,
        "Registered Voters Only",
      );
      break;
    case "non-voter-list":
      exportMasterlistExcel(
        residents.filter((r) => r.voterStatus === "Not registered"),
        barangayName,
        "Non-Voters Only",
      );
      break;
    case "eligible-unregistered":
      exportMasterlistExcel(
        residents.filter((r) => r.isEligibleUnregistered),
        barangayName,
        "Eligible but Unregistered",
      );
      break;
    case "sector-list":
      exportMasterlistExcel(residents, barangayName, "Sector Members");
      break;
    case "demographic-summary":
      exportDemographicSummaryExcel(residents, barangayName);
      break;
  }
}

/** Export program beneficiary lists to Excel. */
function exportBeneficiariesExcel(
  residents: ProfilingResident[],
  barangayName: string,
): void {
  const columns = [
    "Full Name",
    "Age",
    "Sex",
    "Purok",
    "Program",
    "Status",
    "Date Enrolled",
    "Issuing Office",
  ];

  const rows: (string | number)[][] = [];
  for (const r of residents) {
    for (const p of r.programBeneficiaries ?? []) {
      rows.push([
        fullizedName(r),
        computeAge(r.birthdate) ?? "",
        r.sex ?? "",
        r.purok ?? "",
        p.programName,
        p.status,
        p.dateEnrolled,
        p.issuingOffice,
      ]);
    }
  }

  const ws = XLSX.utils.aoa_to_sheet([columns, ...rows]);
  ws["!cols"] = columns.map((col) => ({ wch: Math.max(col.length + 2, 12) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Beneficiaries");

  XLSX.writeFile(wb, `${barangayName}_Beneficiaries_${todayString()}.xlsx`);
}

/** Export a demographic summary to Excel. */
function exportDemographicSummaryExcel(
  residents: ProfilingResident[],
  barangayName: string,
): void {
  const total = residents.length;
  const bySex = {
    Male: residents.filter((r) => r.sex === "Male").length,
    Female: residents.filter((r) => r.sex === "Female").length,
  };
  const ageGroups = {
    "0–5": residents.filter((r) => (computeAge(r.birthdate) ?? -1) <= 5).length,
    "6–12": residents.filter((r) => {
      const a = computeAge(r.birthdate) ?? -1;
      return a >= 6 && a <= 12;
    }).length,
    "13–17": residents.filter((r) => {
      const a = computeAge(r.birthdate) ?? -1;
      return a >= 13 && a <= 17;
    }).length,
    "18–30": residents.filter((r) => {
      const a = computeAge(r.birthdate) ?? -1;
      return a >= 18 && a <= 30;
    }).length,
    "31–59": residents.filter((r) => {
      const a = computeAge(r.birthdate) ?? -1;
      return a >= 31 && a <= 59;
    }).length,
    "60+": residents.filter((r) => (computeAge(r.birthdate) ?? -1) >= 60).length,
  };

  const ws = XLSX.utils.aoa_to_sheet([
    ["DEMOGRAPHIC SUMMARY"],
    [barangayName.toUpperCase()],
    [`Generated: ${new Date().toLocaleString("en-PH")}`],
    [],
    ["Total Population", total],
    [],
    ["By Sex", "Count"],
    ["Male", bySex.Male],
    ["Female", bySex.Female],
    [],
    ["By Age Group", "Count"],
    ...Object.entries(ageGroups),
    [],
    ["By Voter Status", "Count"],
    ["Registered", residents.filter((r) => r.voterStatus === "Registered").length],
    ["Not registered", residents.filter((r) => r.voterStatus === "Not registered").length],
    ["Eligible/Unregistered", residents.filter((r) => r.isEligibleUnregistered).length],
    ["Unknown", residents.filter((r) => r.voterStatus === "Unknown").length],
    [],
    ["By Sector", "Count"],
    ...[
      "Senior Citizen",
      "PWD",
      "Solo Parent",
      "Indigenous Person",
      "OFW",
      "Youth",
      "Out-of-School Youth",
    ].map((s) => [
      s,
      residents.filter((r) => (r.sectorTags ?? []).includes(s as never)).length,
    ]),
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Demographic Summary");

  XLSX.writeFile(wb, `${barangayName}_Demographics_${todayString()}.xlsx`);
}

// ─── PDF Export (Official Philippine LGU Format) ───────────────────────

function drawProfilingOfficialHeader(
  doc: jsPDF,
  details: ReturnType<typeof resolveBarangayDetails>,
  title: string,
  totalRecords: number,
  recordTypeLabel: string
) {
  const pageWidth = doc.internal.pageSize.width || 297;
  const centerX = pageWidth / 2;

  // Vector Crests on both sides
  const drawSeal = (cx: number, cy: number) => {
    doc.setDrawColor(16, 45, 86);
    doc.setLineWidth(0.7);
    doc.circle(cx, cy, 9.5, "S");
    doc.setDrawColor(255, 165, 30);
    doc.setLineWidth(0.35);
    doc.circle(cx, cy, 8, "S");
    doc.setFillColor(234, 242, 255);
    doc.circle(cx, cy, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(4.5);
    doc.setTextColor(16, 45, 86);
    doc.text("OFFICIAL", cx, cy - 1.8, { align: "center" });
    doc.text("SEAL", cx, cy + 1, { align: "center" });
    doc.setFontSize(3.5);
    doc.setTextColor(255, 165, 30);
    doc.text("★ ★ ★", cx, cy + 3.2, { align: "center" });
  };

  drawSeal(28, 19.5);
  drawSeal(pageWidth - 28, 19.5);

  // Republic Header Texts
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(74, 85, 104);
  doc.text("Republic of the Philippines", centerX, 11, { align: "center" });
  doc.text(`Province of ${details.province}`, centerX, 14.5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(`MUNICIPALITY OF ${details.municipality.toUpperCase()}`, centerX, 18.5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(16, 45, 86);
  doc.text(`BARANGAY ${details.name.toUpperCase()}`, centerX, 24, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(36, 107, 222);
  doc.text("OFFICE OF THE SANGGUNIANG BARANGAY", centerX, 28, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(113, 128, 150);
  doc.text(
    `${details.address}  •  Contact: ${details.contactNumber}  •  Email: ${details.email}`,
    centerX,
    31.5,
    { align: "center" }
  );

  // Divider Lines
  doc.setDrawColor(16, 45, 86);
  doc.setLineWidth(0.8);
  doc.line(14, 34.5, pageWidth - 14, 34.5);
  doc.setDrawColor(255, 165, 30);
  doc.setLineWidth(0.35);
  doc.line(14, 35.6, pageWidth - 14, 35.6);

  // Banner Box
  const boxY = 38.5;
  const boxHeight = 10;
  const boxWidth = pageWidth - 28;
  doc.setFillColor(234, 242, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(14, boxY, boxWidth, boxHeight, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(16, 45, 86);
  doc.text(title.toUpperCase(), 19, boxY + 4.5);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.5);
  doc.setTextColor(113, 128, 150);
  doc.text("Official Demographic Record & Community Profiling Registry pursuant to R.A. No. 7160", 19, boxY + 8);

  const rightX = pageWidth - 19;
  const today = new Date().toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(23, 43, 77);
  doc.text(`Generated: ${today}`, rightX, boxY + 4.5, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(36, 107, 222);
  doc.text(`Total Records: ${totalRecords} ${recordTypeLabel}`, rightX, boxY + 8, { align: "right" });
}

function appendSignaturesAndFooters(
  doc: jsPDF,
  details: ReturnType<typeof resolveBarangayDetails>,
  documentType: string
) {
  let finalY = (doc as any).lastAutoTable?.finalY || 160;
  if (finalY > 155) {
    doc.addPage();
    finalY = 30;
  } else {
    finalY += 10;
  }

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(74, 85, 104);
  doc.text(
    "CERTIFICATION: I hereby certify under official oath that this document is a true, faithful, and official registry record of this Barangay as officially maintained in the Barangay Information Management System.",
    148.5,
    finalY,
    { align: "center", maxWidth: 260 }
  );

  finalY += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(113, 128, 150);
  doc.text("Prepared & Certified Correct by:", 35, finalY);
  doc.text("Attested & Approved by:", 195, finalY);

  finalY += 14;

  doc.setDrawColor(113, 128, 150);
  doc.setLineWidth(0.3);
  doc.line(35, finalY, 115, finalY);
  doc.line(195, finalY, 275, finalY);

  finalY += 4.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(16, 45, 86);
  doc.text(details.secretaryName.toUpperCase(), 75, finalY, { align: "center" });
  doc.text(details.captainName.toUpperCase(), 235, finalY, { align: "center" });

  finalY += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(74, 85, 104);
  doc.text("Barangay Secretary", 75, finalY, { align: "center" });
  doc.text("Punong Barangay / Barangay Captain", 235, finalY, { align: "center" });

  finalY += 3.5;
  doc.text(`Barangay ${details.name}`, 75, finalY, { align: "center" });
  doc.text(`Barangay ${details.name}`, 235, finalY, { align: "center" });

  // Running Footers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.height || 210;
    const pageWidth = doc.internal.pageSize.width || 297;

    doc.setDrawColor(229, 234, 242);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(113, 128, 150);
    doc.text(
      `iBarangay Digital Management System — Official ${documentType}  •  Barangay ${details.name}, ${details.municipality}, ${details.province}`,
      14,
      pageHeight - 7
    );
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 7, { align: "right" });
  }
}

/**
 * Export the masterlist as a PDF table with official Philippine Barangay Header.
 */
export function exportMasterlistPdf(
  residents: ProfilingResident[],
  barangayNameOrConfig: string | Partial<Barangay>,
  reportTitle = "Official Barangay Masterlist",
): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const config = typeof barangayNameOrConfig === "string" ? { name: barangayNameOrConfig } : barangayNameOrConfig;
  const details = resolveBarangayDetails(residents as any, config);

  drawProfilingOfficialHeader(doc, details, reportTitle, residents.length, "Inhabitants");

  const columns = [
    "#",
    "Resident ID",
    "Full Name",
    "Sex",
    "Age",
    "Birthdate",
    "Civil Status",
    "Purok",
    "Household #",
    "Sectors",
    "Voter Status",
  ];

  const rows = residents.map((r, idx) => [
    idx + 1,
    r.userId || r.id?.slice(0, 8),
    fullizedName(r),
    r.sex ?? "—",
    computeAge(r.birthdate) ?? "—",
    formatBirthdate(r.birthdate),
    r.civilStatus ?? "—",
    r.purok ?? "—",
    r.householdNumber || "—",
    (r.sectorTags ?? []).join(", ") || "None",
    r.voterStatus ?? "Unknown",
  ]);

  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 51,
    margin: { left: 14, right: 14, top: 40, bottom: 18 },
    styles: { fontSize: 7, cellPadding: 1.8, textColor: [23, 43, 77], lineColor: [229, 234, 242], lineWidth: 0.1 },
    headStyles: { fillColor: [16, 45, 86], textColor: [255, 255, 255], fontSize: 7.5, fontStyle: "bold", halign: "left" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 24, fontStyle: "bold", textColor: [36, 107, 222] },
      2: { cellWidth: 44, fontStyle: "bold" },
      3: { cellWidth: 14, halign: "center" },
      4: { cellWidth: 10, halign: "center" },
      5: { cellWidth: 20, halign: "center" },
      6: { cellWidth: 20 },
      7: { cellWidth: 24 },
      8: { cellWidth: 22, halign: "center" },
      9: { cellWidth: 55 },
      10: { cellWidth: 28, halign: "center" },
    },
  });

  appendSignaturesAndFooters(doc, details, "Resident Masterlist");
  doc.save(`${details.name.replace(/\s+/g, "_")}_Official_Masterlist_${todayString()}.pdf`);
}

/** Export a household list as a PDF with official Philippine Barangay Header. */
export function exportHouseholdsPdf(
  households: Household[],
  barangayNameOrConfig: string | Partial<Barangay>,
): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const config = typeof barangayNameOrConfig === "string" ? { name: barangayNameOrConfig } : barangayNameOrConfig;
  const details = resolveBarangayDetails(null, config);

  drawProfilingOfficialHeader(doc, details, "Official Household Profiling Registry", households.length, "Households");

  const columns = [
    "Household ID",
    "Purok",
    "Address",
    "Head of Family",
    "Members",
    "Housing Type",
    "Tenure",
    "Income Bracket",
    "Disaster Risk",
  ];

  const rows = households.map((h) => [
    h.id,
    h.purokName || "—",
    h.address,
    h.householdHeadName,
    h.memberCount,
    h.housingType,
    h.housingTenure,
    h.incomeBracket || "—",
    h.disasterRiskIndicators.join(", ") || "None",
  ]);

  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 51,
    margin: { left: 14, right: 14, top: 40, bottom: 18 },
    styles: { fontSize: 7, cellPadding: 1.8, textColor: [23, 43, 77], lineColor: [229, 234, 242], lineWidth: 0.1 },
    headStyles: { fillColor: [16, 45, 86], textColor: [255, 255, 255], fontSize: 7.5, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  appendSignaturesAndFooters(doc, details, "Household Registry");
  doc.save(`${details.name.replace(/\s+/g, "_")}_Official_Households_${todayString()}.pdf`);
}

// ─── Import Template ──────────────────────────────────────────────────

/**
 * Generate a downloadable Excel template with headers and sample rows
 * for bulk import. Supports up to 3 programs per individual.
 */
export function downloadImportTemplate(): void {
  const headers = [
    // Identity & location
    "Household ID",
    "Purok",
    "Address",
    "First Name",
    "Middle Name",
    "Last Name",
    "Extension",
    // Demographics
    "Sex",
    "Birthdate (YYYY-MM-DD)",
    "Civil Status",
    "Relationship to Head",
    "Citizenship",
    "Residency (years)",
    // Socio-economic
    "Education",
    "Occupation",
    "Contact Number",
    "PhilHealth",
    "Disability",
    "Sector Tags (comma-separated)",
    // Program 1
    "Program",
    "Program Status",
    "Date Enrolled",
    "Issuing Office",
    "Reference Number",
    // Program 2
    "Program 2",
    "Program Status 2",
    "Date Enrolled 2",
    "Issuing Office 2",
    "Reference Number 2",
    // Program 3
    "Program 3",
    "Program Status 3",
    "Date Enrolled 3",
    "Issuing Office 3",
    "Reference Number 3",
    // Voter
    "Voter Status",
    "Precinct Number",
    "Voter Verification Date",
    // Status
    "Individual Status",
  ];

  const sampleRow1 = [
    "HH-BRGY-0001", "Purok 1", "123 Rizal St, Purok 1",
    "Juan", "Reyes", "Dela Cruz", "Jr.",
    "Male", "1985-03-15", "Married", "Head", "Filipino", "10",
    "College Graduate", "Farmer", "09171234567", "Member", "None",
    "Senior Citizen",
    "4Ps", "Enrolled", "2023-01-15", "DSWD", "HH-123456",
    "RSBSA", "Enrolled", "2022-06-01", "DA", "",
    "PhilHealth (Program)", "Enrolled", "2020-01-01", "PhilHealth", "12-345678901-2",
    "Registered", "0123A", "2024-06-01", "Active",
  ];

  const sampleRow2 = [
    "HH-BRGY-0001", "Purok 1", "123 Rizal St, Purok 1",
    "Maria", "Santos", "Dela Cruz", "",
    "Female", "1988-07-22", "Married", "Spouse", "Filipino", "10",
    "High School Graduate", "Housewife", "09181234567", "Dependent", "None",
    "OFW",
    "SSS", "Enrolled", "2010-03-01", "SSS", "33-1234567-8",
    "AICS", "Enrolled", "2024-01-10", "DSWD", "",
    "", "", "", "", "",
    "Registered", "0123B", "2024-06-01", "Active",
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow1, sampleRow2]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 2, 14) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Import Template");

  // Instructions sheet
  const instructions: (string | number)[][] = [
    ["BULK IMPORT TEMPLATE — INSTRUCTIONS"],
    [],
    ["1. Download this template and fill in your resident data."],
    ["2. One row per individual. People in the same household share the same Household ID."],
    ["3. Use the exact values listed below for dropdowns (Sex, Civil Status, etc.)."],
    ["4. Dates must be in YYYY-MM-DD format (e.g. 1985-03-15)."],
    ["5. Sector Tags: comma-separated (e.g. 'Senior Citizen, PWD')."],
    ["6. Up to 3 programs per person using Program, Program 2, Program 3 columns."],
    ["7. Leave program columns blank if the person has no program enrollment."],
    ["8. Duplicate detection uses: name + birthdate + household ID."],
    ["9. Save as .xlsx or .csv before uploading."],
    [],
    ["── DROPDOWN VALUES ──────────────────────────────────────────────────"],
    [],
    ["Sex:", "Male, Female"],
    ["Civil Status:", "Single, Married, Widowed, Separated, Annulled"],
    ["Relationship to Head:", "Head, Spouse, Son, Daughter, Father, Mother, Brother, Sister,"],
    ["", "Grandfather, Grandmother, Grandson, Granddaughter, Uncle, Aunt,"],
    ["", "Nephew, Niece, Cousin, Other Relative, Boarder, Household Helper, Other"],
    ["PhilHealth:", "Member, Dependent, None, Unknown"],
    ["Disability:", "None, Visual, Hearing, Speech, Physical, Mental, Multiple, Other"],
    ["Individual Status:", "Active, Deceased, Transferred"],
    ["Voter Status:", "Registered, Not registered, Transferred, Unknown"],
    ["Program Status:", "Enrolled, Pending, Waitlisted, Delisted, Graduated"],
    [],
    ["── EDUCATION ────────────────────────────────────────────────────────"],
    ["", "No formal education, Elementary, Elementary Graduate,"],
    ["", "High School, High School Graduate, Vocational,"],
    ["", "College, College Graduate, Postgraduate"],
    [],
    ["── PROGRAM NAMES ────────────────────────────────────────────────────"],
    ["DSWD Programs:", "4Ps, Social Pension, AICS, Listahanan / NHTS-PR, CBMS"],
    ["DOLE Programs:", "TUPAD, DOLE Livelihood"],
    ["Education:", "CHED / TES Scholarship, LGU Scholarship"],
    ["Social Insurance:", "SSS, GSIS, PhilHealth (Program)"],
    ["Agriculture (DA):", "RCEF / Rice Subsidy, Fertilizer Subsidy, RSBSA"],
    ["LGU Programs:", "LGU Aid / Local Assistance"],
    [],
    ["── SECTOR TAGS ──────────────────────────────────────────────────────"],
    ["", "Senior Citizen, PWD, Solo Parent, Indigenous Person, OFW, Youth, Out-of-School Youth"],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(instructions);
  ws2["!cols"] = [{ wch: 24 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Instructions");

  XLSX.writeFile(wb, "iBarangay_Import_Template.xlsx");
}
