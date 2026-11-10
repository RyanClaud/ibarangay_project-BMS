/**
 * Excel and PDF export for the Barangay Profiling Module.
 *
 * Uses the already-installed `xlsx` and `jspdf` / `jspdf-autotable`
 * packages so no new export dependencies are required.
 */

import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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

// ─── PDF Export ────────────────────────────────────────────────────────

/**
 * Export the masterlist as a PDF table.
 * Uses jspdf + jspdf-autotable for clean tabular output.
 */
export function exportMasterlistPdf(
  residents: ProfilingResident[],
  barangayName: string,
  reportTitle: string,
): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Header
  doc.setFontSize(14);
  doc.text(barangayName.toUpperCase(), 14, 15);
  doc.setFontSize(11);
  doc.text(reportTitle, 14, 22);
  doc.setFontSize(8);
  doc.text(
    `Generated: ${new Date().toLocaleString("en-PH")}  |  Total: ${residents.length} records`,
    14,
    27,
  );

  const columns = [
    "#",
    "Name",
    "Sex",
    "Age",
    "Birthdate",
    "Civil Status",
    "Purok",
    "Sectors",
    "Voter",
    "Programs",
  ];

  const rows = residents.map((r, idx) => [
    idx + 1,
    fullizedName(r),
    r.sex ?? "",
    computeAge(r.birthdate) ?? "",
    formatBirthdate(r.birthdate),
    r.civilStatus ?? "",
    r.purok ?? "",
    (r.sectorTags ?? []).join(", "),
    r.voterStatus ?? "Unknown",
    (r.programBeneficiaries ?? [])
      .map((p) => p.programName)
      .join(", "),
  ]);

  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 32,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [37, 99, 235], fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 10 },
    },
  });

  doc.save(`${barangayName}_${reportTitle.replace(/\s+/g, "_")}_${todayString()}.pdf`);
}

/** Export a household list as a PDF. */
export function exportHouseholdsPdf(
  households: Household[],
  barangayName: string,
): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFontSize(14);
  doc.text(barangayName.toUpperCase(), 14, 15);
  doc.setFontSize(11);
  doc.text("Household List", 14, 22);
  doc.setFontSize(8);
  doc.text(
    `Generated: ${new Date().toLocaleString("en-PH")}  |  Total: ${households.length} households`,
    14,
    27,
  );

  const columns = [
    "Household ID",
    "Purok",
    "Address",
    "Head",
    "Members",
    "Type",
    "Tenure",
    "Income",
    "Risk",
  ];

  const rows = households.map((h) => [
    h.id,
    h.purokName || "",
    h.address,
    h.householdHeadName,
    h.memberCount,
    h.housingType,
    h.housingTenure,
    h.incomeBracket || "",
    h.disasterRiskIndicators.join(", "),
  ]);

  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 32,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [37, 99, 235], fontSize: 7 },
  });

  doc.save(`${barangayName}_Households_${todayString()}.pdf`);
}

// ─── Import Template ──────────────────────────────────────────────────

/**
 * Generate a downloadable Excel template with headers and one sample row
 * for bulk import. The user downloads this, fills it, and uploads it.
 */
export function downloadImportTemplate(): void {
  const headers = [
    "Household ID",
    "Purok",
    "Address",
    "First Name",
    "Middle Name",
    "Last Name",
    "Extension",
    "Sex",
    "Birthdate (YYYY-MM-DD)",
    "Civil Status",
    "Relationship to Head",
    "Citizenship",
    "Residency (years)",
    "Education",
    "Occupation",
    "Contact Number",
    "PhilHealth",
    "Disability",
    "Sector Tags (comma-separated)",
    "Program",
    "Program Status",
    "Date Enrolled",
    "Issuing Office",
    "Voter Status",
    "Precinct Number",
    "Voter Verification Date",
    "Individual Status",
  ];

  const sampleRow = [
    "HH-BRGY-0001",
    "Purok 1",
    "123 Rizal St, Purok 1",
    "Juan",
    "Reyes",
    "Dela Cruz",
    "Jr.",
    "Male",
    "1985-03-15",
    "Married",
    "Head",
    "Filipino",
    "10",
    "College Graduate",
    "Farmer",
    "09171234567",
    "Member",
    "None",
    "Senior Citizen, OFW",
    "4Ps",
    "Enrolled",
    "2023-01-15",
    "DSWD",
    "Registered",
    "0123A",
    "2024-06-01",
    "Active",
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow, sampleRow]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 2, 14) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Import Template");

  // Add an instructions sheet
  const instructions = [
    ["BULK IMPORT TEMPLATE — INSTRUCTIONS"],
    [],
    ["1. Download this template and fill in your resident data."],
    ["2. One row per individual. Multiple individuals in the same household"],
    ["   should share the same Household ID."],
    ["3. Use the exact dropdown values for Sex, Civil Status, Education, etc."],
    ["4. Dates must be in YYYY-MM-DD format."],
    ["5. Sector Tags: comma-separated (e.g. 'Senior Citizen, PWD')"],
    ["6. Program fields: leave blank if the person is not a beneficiary."],
    ["7. Duplicate detection: name + birthdate + household ID must be unique."],
    ["8. Save as .xlsx or .csv before uploading."],
    [],
    ["Voter Status options: Registered, Not registered, Transferred, Unknown"],
    ["Sex options: Male, Female"],
    ["Civil Status: Single, Married, Widowed, Separated, Annulled"],
    ["Education: No formal education, Elementary, Elementary Graduate, High School, High School Graduate, Vocational, College, College Graduate, Postgraduate"],
    ["PhilHealth: Member, Dependent, None, Unknown"],
    ["Disability: None, Visual, Hearing, Speech, Physical, Mental, Multiple, Other"],
    ["Individual Status: Active, Deceased, Transferred"],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(instructions);
  ws2["!cols"] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Instructions");

  XLSX.writeFile(wb, "iBarangay_Import_Template.xlsx");
}
