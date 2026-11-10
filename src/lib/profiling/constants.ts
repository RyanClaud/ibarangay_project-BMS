/**
 * Barangay Profiling Module — Constants & Enums
 *
 * Centralised lists for dropdowns, filters, and validation.
 * Import these in forms and filter UIs to keep values consistent.
 */

import type {
  SectorTag,
  ProgramName,
  ProgramEnrollmentStatus,
  Sex,
  CivilStatus,
  RelationshipToHead,
  EducationLevel,
  PhilHealthStatus,
  DisabilityType,
  IndividualStatus,
  HousingType,
  HousingTenure,
  IncomeBracket,
  DisasterRiskIndicator,
  VoterStatus,
  AuditAction,
  ProfilingRole,
} from "./types";

// ─── Sectors ────────────────────────────────────────────────────────────

export const SECTOR_TAGS: SectorTag[] = [
  "Senior Citizen",
  "PWD",
  "Solo Parent",
  "Indigenous Person",
  "OFW",
  "Youth",
  "Out-of-School Youth",
];

export const SECTOR_DESCRIPTIONS: Record<SectorTag, string> = {
  "Senior Citizen": "60 years old and above",
  PWD: "Person with Disability",
  "Solo Parent": "Solo Parent Act (RA 11861) qualified",
  "Indigenous Person": "Member of an Indigenous Peoples group",
  OFW: "Overseas Filipino Worker (or family member)",
  Youth: "15–30 years old (RA 8044 / SK)",
  "Out-of-School Youth": "15–30, not in school, not employed",
};

// ─── Programs ──────────────────────────────────────────────────────────

export const PROGRAM_NAMES: ProgramName[] = [
  "4Ps",
  "Social Pension",
  "AICS",
  "TUPAD",
  "Scholarship",
  "Listahanan / NHTS-PR",
];

export const PROGRAM_DESCRIPTIONS: Record<ProgramName, string> = {
  "4Ps": "Pantawid Pamilyang Pilipino Program (DSWD)",
  "Social Pension": "Social Pension for Indigent Senior Citizens (DSWD)",
  AICS: "Assistance to Individuals in Crisis Situation (DSWD)",
  TUPAD: "Tulong Panghanapbuhay sa Ating Disadvantaged/Displaced Workers (DOLE)",
  Scholarship: "LGU or government scholarship program",
  "Listahanan / NHTS-PR": "National Household Targeting System for Poverty Reduction",
};

export const PROGRAM_STATUSES: ProgramEnrollmentStatus[] = [
  "Enrolled",
  "Pending",
  "Waitlisted",
  "Delisted",
  "Graduated",
];

export const PROGRAM_ISSUING_OFFICES: Record<ProgramName, string> = {
  "4Ps": "DSWD",
  "Social Pension": "DSWD",
  AICS: "DSWD",
  TUPAD: "DOLE",
  Scholarship: "LGU",
  "Listahanan / NHTS-PR": "DSWD",
};

// ─── Individual dropdowns ───────────────────────────────────────────────

export const SEX_OPTIONS: Sex[] = ["Male", "Female"];

export const CIVIL_STATUS_OPTIONS: CivilStatus[] = [
  "Single",
  "Married",
  "Widowed",
  "Separated",
  "Annulled",
];

export const RELATIONSHIP_OPTIONS: RelationshipToHead[] = [
  "Head",
  "Spouse",
  "Son",
  "Daughter",
  "Father",
  "Mother",
  "Brother",
  "Sister",
  "Grandfather",
  "Grandmother",
  "Grandson",
  "Granddaughter",
  "Uncle",
  "Aunt",
  "Nephew",
  "Niece",
  "Cousin",
  "Other Relative",
  "Boarder",
  "Household Helper",
  "Other",
];

export const EDUCATION_OPTIONS: EducationLevel[] = [
  "No formal education",
  "Elementary",
  "Elementary Graduate",
  "High School",
  "High School Graduate",
  "Vocational",
  "College",
  "College Graduate",
  "Postgraduate",
];

export const PHILHEALTH_OPTIONS: PhilHealthStatus[] = [
  "Member",
  "Dependent",
  "None",
  "Unknown",
];

export const DISABILITY_OPTIONS: DisabilityType[] = [
  "None",
  "Visual",
  "Hearing",
  "Speech",
  "Physical",
  "Mental",
  "Multiple",
  "Other",
];

export const INDIVIDUAL_STATUS_OPTIONS: IndividualStatus[] = [
  "Active",
  "Deceased",
  "Transferred",
];

// ─── Household dropdowns ────────────────────────────────────────────────

export const HOUSING_TYPE_OPTIONS: HousingType[] = [
  "Concrete",
  "Semi-concrete",
  "Wood",
  "Bamboo",
  "Mixed",
  "Other",
];

export const HOUSING_TENURE_OPTIONS: HousingTenure[] = [
  "Owned",
  "Rented",
  "Informal settler",
  "Government housing",
  "Mortgaged",
  "Other",
];

export const INCOME_BRACKET_OPTIONS: IncomeBracket[] = [
  "Below ₱10,000",
  "₱10,000 – ₱19,999",
  "₱20,000 – ₱39,999",
  "₱40,000 – ₱59,999",
  "₱60,000 – ₱99,999",
  "₱100,000 and above",
];

export const DISASTER_RISK_OPTIONS: DisasterRiskIndicator[] = [
  "Flood-prone",
  "Landslide-prone",
  "Storm-surge",
  "Earthquake",
  "Fire-prone",
  "None",
];

// ─── Voter ─────────────────────────────────────────────────────────────

export const VOTER_STATUS_OPTIONS: VoterStatus[] = [
  "Registered",
  "Not registered",
  "Transferred",
  "Unknown",
];

// ─── Audit ─────────────────────────────────────────────────────────────

export const AUDIT_ACTIONS: AuditAction[] = [
  "view",
  "create",
  "edit",
  "delete",
  "export",
  "import",
];

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  view: "Viewed",
  create: "Created",
  edit: "Edited",
  delete: "Deleted",
  export: "Exported",
  import: "Imported",
};

// ─── Roles ─────────────────────────────────────────────────────────────

export const PROFILING_ROLES: ProfilingRole[] = [
  "Admin",
  "Barangay Captain",
  "Secretary",
  "Treasurer",
  "BHW",
  "Encoder",
  "Resident",
];

/**
 * Access control matrix for the profiling module.
 * Used by canAccess() in access-control.ts.
 */
export const PROFILING_ACCESS = {
  // Who can open the profiling module at all
  viewModule: [
    "Admin",
    "Barangay Captain",
    "Secretary",
    "Treasurer",
    "BHW",
    "Encoder",
  ] as ProfilingRole[],

  // Who can add/edit households and individuals
  editData: ["Admin", "Secretary", "BHW", "Encoder"] as ProfilingRole[],

  // Who can mark a person as deceased/transferred
  changeStatus: ["Admin", "Secretary", "Encoder"] as ProfilingRole[],

  // Who can export to Excel
  exportExcel: ["Admin", "Barangay Captain", "Secretary", "Treasurer"] as ProfilingRole[],

  // Who can export to PDF
  exportPdf: [
    "Admin",
    "Barangay Captain",
    "Secretary",
    "Treasurer",
    "BHW",
  ] as ProfilingRole[],

  // Who can import bulk data
  importData: ["Admin", "Secretary"] as ProfilingRole[],

  // Who can manage puroks
  managePuroks: ["Admin", "Secretary"] as ProfilingRole[],

  // Who can see voter information (sensitive)
  viewVoterInfo: ["Admin", "Barangay Captain", "Secretary"] as ProfilingRole[],

  // Who can see income bracket (sensitive)
  viewIncome: ["Admin", "Barangay Captain", "Secretary", "Treasurer"] as ProfilingRole[],

  // Who can see PhilHealth status
  viewPhilHealth: ["Admin", "Secretary", "BHW"] as ProfilingRole[],
} as const;
