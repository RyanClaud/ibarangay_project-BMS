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
  // DSWD
  "4Ps",
  "Social Pension",
  "AICS",
  "Listahanan / NHTS-PR",
  "CBMS",
  // DOLE
  "TUPAD",
  "DOLE Livelihood",
  // Education
  "CHED / TES Scholarship",
  "LGU Scholarship",
  // Social Insurance
  "SSS",
  "GSIS",
  "PhilHealth (Program)",
  // Agriculture
  "RCEF / Rice Subsidy",
  "Fertilizer Subsidy",
  "RSBSA",
  // LGU
  "LGU Aid / Local Assistance",
];

/** Programs grouped by agency for organised display in forms and reports. */
export const PROGRAM_GROUPS: { label: string; programs: ProgramName[] }[] = [
  {
    label: "DSWD Programs",
    programs: ["4Ps", "Social Pension", "AICS", "Listahanan / NHTS-PR", "CBMS"],
  },
  {
    label: "DOLE Programs",
    programs: ["TUPAD", "DOLE Livelihood"],
  },
  {
    label: "Education / Scholarship",
    programs: ["CHED / TES Scholarship", "LGU Scholarship"],
  },
  {
    label: "Social Insurance",
    programs: ["SSS", "GSIS", "PhilHealth (Program)"],
  },
  {
    label: "Agriculture (DA)",
    programs: ["RCEF / Rice Subsidy", "Fertilizer Subsidy", "RSBSA"],
  },
  {
    label: "LGU Programs",
    programs: ["LGU Aid / Local Assistance"],
  },
];

export const PROGRAM_DESCRIPTIONS: Record<ProgramName, string> = {
  "4Ps": "Pantawid Pamilyang Pilipino Program — cash transfer for poor households (DSWD)",
  "Social Pension": "Monthly stipend for indigent senior citizens (DSWD / NCSC)",
  AICS: "Assistance to Individuals in Crisis Situations (DSWD)",
  "Listahanan / NHTS-PR": "National Household Targeting System for Poverty Reduction (DSWD)",
  CBMS: "Community-Based Monitoring System — replacing Listahanan (DSWD)",
  TUPAD: "Tulong Panghanapbuhay sa Ating Disadvantaged/Displaced Workers (DOLE)",
  "DOLE Livelihood": "DOLE livelihood and emergency employment programs",
  "CHED / TES Scholarship": "Commission on Higher Education Tertiary Education Subsidy",
  "LGU Scholarship": "Scholarship granted by the local government unit",
  SSS: "Social Security System — private sector members and beneficiaries",
  GSIS: "Government Service Insurance System — public sector members and beneficiaries",
  "PhilHealth (Program)": "Philippine Health Insurance Corporation — program enrollment/subsidy",
  "RCEF / Rice Subsidy": "Rice Competitiveness Enhancement Fund / DA rice subsidy for farmers",
  "Fertilizer Subsidy": "Department of Agriculture fertilizer distribution program",
  RSBSA: "Registry System for Basic Sectors in Agriculture — DA farmer registry",
  "LGU Aid / Local Assistance": "Local barangay or municipal aid, cash assistance, or relief",
};

export const PROGRAM_ISSUING_OFFICES: Record<ProgramName, string> = {
  "4Ps": "DSWD",
  "Social Pension": "DSWD / NCSC",
  AICS: "DSWD",
  "Listahanan / NHTS-PR": "DSWD",
  CBMS: "DSWD / PSA",
  TUPAD: "DOLE",
  "DOLE Livelihood": "DOLE",
  "CHED / TES Scholarship": "CHED",
  "LGU Scholarship": "LGU",
  SSS: "SSS",
  GSIS: "GSIS",
  "PhilHealth (Program)": "PhilHealth",
  "RCEF / Rice Subsidy": "DA",
  "Fertilizer Subsidy": "DA",
  RSBSA: "DA",
  "LGU Aid / Local Assistance": "LGU",
};

/** Badge colour class per program for consistent visual identity. */
export const PROGRAM_BADGE_COLORS: Record<ProgramName, string> = {
  "4Ps":                        "bg-blue-100 text-blue-800 border-blue-200",
  "Social Pension":             "bg-purple-100 text-purple-800 border-purple-200",
  AICS:                         "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Listahanan / NHTS-PR":       "bg-sky-100 text-sky-800 border-sky-200",
  CBMS:                         "bg-cyan-100 text-cyan-800 border-cyan-200",
  TUPAD:                        "bg-orange-100 text-orange-800 border-orange-200",
  "DOLE Livelihood":            "bg-amber-100 text-amber-800 border-amber-200",
  "CHED / TES Scholarship":     "bg-green-100 text-green-800 border-green-200",
  "LGU Scholarship":            "bg-teal-100 text-teal-800 border-teal-200",
  SSS:                          "bg-red-100 text-red-800 border-red-200",
  GSIS:                         "bg-rose-100 text-rose-800 border-rose-200",
  "PhilHealth (Program)":       "bg-pink-100 text-pink-800 border-pink-200",
  "RCEF / Rice Subsidy":        "bg-lime-100 text-lime-800 border-lime-200",
  "Fertilizer Subsidy":         "bg-yellow-100 text-yellow-800 border-yellow-200",
  RSBSA:                        "bg-emerald-100 text-emerald-800 border-emerald-200",
  "LGU Aid / Local Assistance": "bg-gray-100 text-gray-800 border-gray-200",
};

export const PROGRAM_STATUSES: ProgramEnrollmentStatus[] = [
  "Enrolled",
  "Pending",
  "Waitlisted",
  "Delisted",
  "Graduated",
];

export const PROGRAM_STATUS_COLORS: Record<ProgramEnrollmentStatus, string> = {
  Enrolled:   "bg-green-100 text-green-800",
  Pending:    "bg-yellow-100 text-yellow-800",
  Waitlisted: "bg-orange-100 text-orange-800",
  Delisted:   "bg-red-100 text-red-800",
  Graduated:  "bg-blue-100 text-blue-800",
};

/** Programs that require an RSBSA registration flag. */
export const AGRICULTURE_PROGRAMS: ProgramName[] = [
  "RCEF / Rice Subsidy",
  "Fertilizer Subsidy",
  "RSBSA",
];

/** Programs that benefit from a reference/member number. */
export const PROGRAMS_WITH_REF_NUMBER: ProgramName[] = [
  "SSS",
  "GSIS",
  "PhilHealth (Program)",
  "4Ps",
  "CHED / TES Scholarship",
  "LGU Scholarship",
];

/** Programs where a grant year is relevant. */
export const SCHOLARSHIP_PROGRAMS: ProgramName[] = [
  "CHED / TES Scholarship",
  "LGU Scholarship",
];

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
