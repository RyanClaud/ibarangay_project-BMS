/**
 * Bulk Excel/CSV import for the Barangay Profiling Module.
 *
 * Handles:
 *   1. File parsing (xlsx/csv) via the already-installed `xlsx` package
 *   2. Row-by-row validation with detailed error messages
 *   3. Duplicate detection (name + birthdate + household)
 *   4. Conversion to ProfilingResident objects ready for Firestore writes
 */

import * as XLSX from "xlsx";
import type {
  ProfilingResident,
  Sex,
  CivilStatus,
  RelationshipToHead,
  EducationLevel,
  PhilHealthStatus,
  DisabilityType,
  IndividualStatus,
  SectorTag,
  ProgramName,
  ProgramEnrollmentStatus,
  VoterStatus,
} from "./types";

// ─── Types ─────────────────────────────────────────────────────────────

export interface ImportRow {
  rowIndex: number; // 1-based row number from the Excel file
  raw: Record<string, string>;
  parsed: ParsedRow;
  errors: string[];
  warnings: string[];
  isDuplicate: boolean;
  duplicateMatch: string;
}

export interface ParsedRow {
  householdId: string;
  purok: string;
  address: string;
  firstName: string;
  middleName: string;
  lastName: string;
  extension: string;
  sex: Sex;
  birthdate: string; // normalized YYYY-MM-DD
  civilStatus: CivilStatus;
  relationshipToHead: RelationshipToHead;
  citizenship: string;
  residencyYears: number;
  education: EducationLevel;
  occupation: string;
  contactNumber: string;
  philhealth: PhilHealthStatus;
  disability: DisabilityType;
  sectorTags: SectorTag[];
  program: ProgramName | "";
  programStatus: ProgramEnrollmentStatus;
  dateEnrolled: string;
  issuingOffice: string;
  voterStatus: VoterStatus;
  precinctNumber: string;
  voterVerificationDate: string;
  individualStatus: IndividualStatus;
}

export interface ImportResult {
  rows: ImportRow[];
  totalRows: number;
  validRows: number;
  errorRows: number;
  duplicateRows: number;
}

// ─── Validation helpers ────────────────────────────────────────────────

const VALID_SEX = new Set(["Male", "Female"]);
const VALID_CIVIL: Record<string, CivilStatus> = {
  single: "Single",
  married: "Married",
  widowed: "Widowed",
  separated: "Separated",
  annulled: "Annulled",
};
const VALID_RELATIONSHIP = new Set([
  "Head", "Spouse", "Son", "Daughter", "Father", "Mother",
  "Brother", "Sister", "Grandfather", "Grandmother", "Grandson",
  "Granddaughter", "Uncle", "Aunt", "Nephew", "Niece", "Cousin",
  "Other Relative", "Boarder", "Household Helper", "Other",
]);
const VALID_EDUCATION = new Set([
  "No formal education", "Elementary", "Elementary Graduate",
  "High School", "High School Graduate", "Vocational",
  "College", "College Graduate", "Postgraduate",
]);
const VALID_PHILHEALTH = new Set(["Member", "Dependent", "None", "Unknown"]);
const VALID_DISABILITY = new Set([
  "None", "Visual", "Hearing", "Speech", "Physical", "Mental", "Multiple", "Other",
]);
const VALID_INDIVIDUAL_STATUS = new Set(["Active", "Deceased", "Transferred"]);
const VALID_VOTER = new Set(["Registered", "Not registered", "Transferred", "Unknown"]);
const VALID_SECTORS = new Set([
  "Senior Citizen", "PWD", "Solo Parent", "Indigenous Person",
  "OFW", "Youth", "Out-of-School Youth",
]);
const VALID_PROGRAMS = new Set([
  "4Ps", "Social Pension", "AICS", "TUPAD", "Scholarship", "Listahanan / NHTS-PR",
]);
const VALID_PROGRAM_STATUS = new Set(["Enrolled", "Pending", "Waitlisted", "Delisted", "Graduated"]);

/** Normalize a string cell (trim + collapse whitespace). */
function str(val: unknown): string {
  if (val == null) return "";
  return String(val).trim().replace(/\s+/g, " ");
}

/** Parse a date string into YYYY-MM-DD. Accepts various common formats. */
function normalizeDate(val: string): string {
  if (!val) return "";
  // Already ISO?
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  // Excel date serial number
  const serial = Number(val);
  if (!isNaN(serial) && serial > 30000 && serial < 80000) {
    const date = XLSX.SSF.parse_date_code(serial);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
    }
  }
  // Try MM/DD/YYYY or DD/MM/YYYY → prefer YYYY-MM-DD
  const parts = val.split(/[\/\-.]/);
  if (parts.length === 3) {
    let [m, d, y] = parts;
    // If the first part is 4 digits, it's YYYY-MM-DD
    if (parts[0].length === 4) {
      [y, m, d] = parts;
    }
    const month = parseInt(m, 10);
    const day = parseInt(d, 10);
    const year = parseInt(y, 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year > 1900) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
  // Last resort — let Date.parse try
  const parsed = new Date(val);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }
  return val; // invalid — will be caught by validation
}

/** Lookup a value case-insensitively in a map. */
function lookupEnum<T>(val: string, map: Record<string, T>): T | null {
  const key = val.toLowerCase();
  if (key in map) return map[key];
  return null;
}

// ─── Main Parse Function ───────────────────────────────────────────────

/**
 * Parse an uploaded Excel/CSV file into validated import rows.
 *
 * @param file The File or ArrayBuffer to parse
 * @param existingResidents Current residents in Firestore (for duplicate detection)
 * @returns ImportResult with per-row validation status
 */
export async function parseImportFile(
  file: File,
  existingResidents: ProfilingResident[],
): Promise<ImportResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
    defval: "",
  });

  // Build existing-duplicate keys: firstName|lastName|birthdate|householdId
  const existingKeys = new Set(
    existingResidents.map((r) =>
      duplicateKey(r.firstName, r.lastName, r.birthdate, r.householdId ?? r.householdNumber ?? ""),
    ),
  );

  const rows: ImportRow[] = [];

  for (let i = 0; i < rawData.length; i++) {
    const raw = rawData[i];
    const errors: string[] = [];
    const warnings: string[] = [];

    const householdId = str(raw["Household ID"] ?? raw["household_id"] ?? raw["HouseholdID"]);
    const purok = str(raw["Purok"] ?? raw["purok"]);
    const address = str(raw["Address"] ?? raw["address"]);
    const firstName = str(raw["First Name"] ?? raw["first_name"] ?? raw["FirstName"]);
    const middleName = str(raw["Middle Name"] ?? raw["middle_name"] ?? raw["MiddleName"]);
    const lastName = str(raw["Last Name"] ?? raw["last_name"] ?? raw["LastName"]);
    const extension = str(raw["Extension"] ?? raw["extension"] ?? raw["Ext"]);
    const sexRaw = str(raw["Sex"] ?? raw["sex"] ?? raw["Gender"]);
    const birthdateRaw = str(raw["Birthdate (YYYY-MM-DD)"] ?? raw["Birthdate"] ?? raw["birthdate"]);
    const civilRaw = str(raw["Civil Status"] ?? raw["civil_status"] ?? raw["CivilStatus"]);
    const relRaw = str(raw["Relationship to Head"] ?? raw["relationship_to_head"] ?? raw["Relationship"]);
    const citizenship = str(raw["Citizenship"] ?? raw["citizenship"]) || "Filipino";
    const residencyStr = str(raw["Residency (years)"] ?? raw["residency_years"] ?? raw["Residency"]);
    const educationRaw = str(raw["Education"] ?? raw["education"]);
    const occupation = str(raw["Occupation"] ?? raw["occupation"]);
    const contactNumber = str(raw["Contact Number"] ?? raw["contact_number"] ?? raw["Contact"]);
    const philhealthRaw = str(raw["PhilHealth"] ?? raw["philhealth"]);
    const disabilityRaw = str(raw["Disability"] ?? raw["disability"]);
    const sectorsRaw = str(raw["Sector Tags (comma-separated)"] ?? raw["sector_tags"] ?? raw["Sectors"]);
    const programRaw = str(raw["Program"] ?? raw["program"]);
    const programStatusRaw = str(raw["Program Status"] ?? raw["program_status"]);
    const dateEnrolledRaw = str(raw["Date Enrolled"] ?? raw["date_enrolled"]);
    const issuingOffice = str(raw["Issuing Office"] ?? raw["issuing_office"]);
    const voterRaw = str(raw["Voter Status"] ?? raw["voter_status"]);
    const precinctNumber = str(raw["Precinct Number"] ?? raw["precinct_number"] ?? raw["Precinct"]);
    const voterDateRaw = str(raw["Voter Verification Date"] ?? raw["voter_verification_date"]);
    const statusRaw = str(raw["Individual Status"] ?? raw["individual_status"] ?? raw["Status"]);

    // ── Required field validation ──
    if (!firstName) errors.push("First name is required");
    if (!lastName) errors.push("Last name is required");
    if (!householdId) errors.push("Household ID is required");

    // Sex
    let sex: Sex = "Male";
    if (!sexRaw) {
      errors.push("Sex is required");
    } else if (VALID_SEX.has(sexRaw)) {
      sex = sexRaw as Sex;
    } else {
      errors.push(`Invalid sex "${sexRaw}" — must be Male or Female`);
    }

    // Birthdate
    const birthdate = normalizeDate(birthdateRaw);
    if (!birthdateRaw) {
      errors.push("Birthdate is required");
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate) || isNaN(new Date(birthdate).getTime())) {
      errors.push(`Invalid birthdate "${birthdateRaw}" — use YYYY-MM-DD`);
    }

    // Civil status
    const civil = lookupEnum(civilRaw, VALID_CIVIL);
    if (!civilRaw) {
      errors.push("Civil status is required");
    } else if (!civil) {
      errors.push(`Invalid civil status "${civilRaw}"`);
    }

    // Relationship to head
    if (!relRaw) {
      errors.push("Relationship to head is required");
    } else if (!VALID_RELATIONSHIP.has(relRaw)) {
      errors.push(`Invalid relationship "${relRaw}"`);
    }

    // Education
    if (educationRaw && !VALID_EDUCATION.has(educationRaw)) {
      errors.push(`Invalid education "${educationRaw}"`);
    }

    // PhilHealth
    if (philhealthRaw && !VALID_PHILHEALTH.has(philhealthRaw)) {
      errors.push(`Invalid PhilHealth status "${philhealthRaw}"`);
    }

    // Disability
    if (disabilityRaw && !VALID_DISABILITY.has(disabilityRaw)) {
      errors.push(`Invalid disability "${disabilityRaw}"`);
    }

    // Individual status
    const individualStatus: IndividualStatus = statusRaw && VALID_INDIVIDUAL_STATUS.has(statusRaw)
      ? (statusRaw as IndividualStatus)
      : "Active";
    if (statusRaw && !VALID_INDIVIDUAL_STATUS.has(statusRaw)) {
      errors.push(`Invalid individual status "${statusRaw}"`);
    }

    // Voter status
    let voterStatus: VoterStatus = "Unknown";
    if (voterRaw && VALID_VOTER.has(voterRaw)) {
      voterStatus = voterRaw as VoterStatus;
    } else if (voterRaw) {
      warnings.push(`Invalid voter status "${voterRaw}" — set to Unknown`);
    }

    // Sectors
    const sectorTags: SectorTag[] = [];
    if (sectorsRaw) {
      for (const s of sectorsRaw.split(",").map((x) => x.trim())) {
        if (VALID_SECTORS.has(s)) {
          sectorTags.push(s as SectorTag);
        } else {
          warnings.push(`Unknown sector "${s}" — skipped`);
        }
      }
    }

    // Program
    let program: ProgramName | "" = "";
    if (programRaw) {
      if (VALID_PROGRAMS.has(programRaw)) {
        program = programRaw as ProgramName;
      } else {
        warnings.push(`Unknown program "${programRaw}" — skipped`);
      }
    }

    let programStatus: ProgramEnrollmentStatus = "Enrolled";
    if (programStatusRaw) {
      if (VALID_PROGRAM_STATUS.has(programStatusRaw)) {
        programStatus = programStatusRaw as ProgramEnrollmentStatus;
      } else {
        warnings.push(`Invalid program status "${programStatusRaw}" — set to Enrolled`);
      }
    }

    const dateEnrolled = dateEnrolledRaw ? normalizeDate(dateEnrolledRaw) : "";
    const voterVerificationDate = voterDateRaw ? normalizeDate(voterDateRaw) : "";
    const residencyYears = residencyStr ? parseInt(residencyStr, 10) || 0 : 0;

    // ── Duplicate detection ──
    const dupKey = duplicateKey(firstName, lastName, birthdate, householdId);
    const isDuplicate = existingKeys.has(dupKey);

    const parsed: ParsedRow = {
      householdId,
      purok,
      address,
      firstName,
      middleName,
      lastName,
      extension,
      sex,
      birthdate,
      civilStatus: civil ?? "Single",
      relationshipToHead: (VALID_RELATIONSHIP.has(relRaw) ? relRaw : "Other") as RelationshipToHead,
      citizenship,
      residencyYears,
      education: (educationRaw && VALID_EDUCATION.has(educationRaw) ? educationRaw : "No formal education") as EducationLevel,
      occupation,
      contactNumber,
      philhealth: (philhealthRaw && VALID_PHILHEALTH.has(philhealthRaw) ? philhealthRaw : "Unknown") as PhilHealthStatus,
      disability: (disabilityRaw && VALID_DISABILITY.has(disabilityRaw) ? disabilityRaw : "None") as DisabilityType,
      sectorTags,
      program,
      programStatus,
      dateEnrolled,
      issuingOffice,
      voterStatus,
      precinctNumber,
      voterVerificationDate,
      individualStatus,
    };

    rows.push({
      rowIndex: i + 2, // +2 because row 1 is headers, and i is 0-based
      raw: raw as Record<string, string>,
      parsed,
      errors,
      warnings,
      isDuplicate,
      duplicateMatch: isDuplicate ? `${firstName} ${lastName} (born ${birthdate}) in ${householdId}` : "",
    });
  }

  // Also detect duplicates within the uploaded file
  const seenInFile = new Map<string, number>();
  for (const row of rows) {
    const key = duplicateKey(
      row.parsed.firstName,
      row.parsed.lastName,
      row.parsed.birthdate,
      row.parsed.householdId,
    );
    if (seenInFile.has(key)) {
      if (!row.isDuplicate) {
        row.isDuplicate = true;
        row.warnings.push(`Duplicate of row ${seenInFile.get(key)} in this file`);
      }
    } else {
      seenInFile.set(key, row.rowIndex);
    }
  }

  const validRows = rows.filter((r) => r.errors.length === 0 && !r.isDuplicate).length;
  const errorRows = rows.filter((r) => r.errors.length > 0).length;
  const duplicateRows = rows.filter((r) => r.isDuplicate).length;

  return {
    rows,
    totalRows: rows.length,
    validRows,
    errorRows,
    duplicateRows,
  };
}

/** Build a composite key for duplicate detection. */
function duplicateKey(
  firstName: string,
  lastName: string,
  birthdate: string,
  householdId: string,
): string {
  return `${firstName.toLowerCase()}|${lastName.toLowerCase()}|${birthdate}|${householdId.toLowerCase()}`;
}

/** Group valid import rows by household ID (for batch writes). */
export function groupByHousehold(rows: ImportRow[]): Map<string, ImportRow[]> {
  const map = new Map<string, ImportRow[]>();
  for (const row of rows) {
    if (row.errors.length > 0) continue;
    const key = row.parsed.householdId;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }
  return map;
}
