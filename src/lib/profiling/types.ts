/**
 * Barangay Profiling Module — Type Definitions
 *
 * These types ADD to the existing system. They do not modify or break
 * any existing types in src/lib/types.ts. The existing Resident type is
 * extended with optional profiling fields (see ProfilingResident below).
 *
 * Hierarchy: Barangay > Purok/Sitio > Household > Individual
 */

// ─── Roles ────────────────────────────────────────────────────────────

/**
 * Extended role type that includes the two new roles required by the
 * profiling module. The original Role union is still valid; these are
 * additional values that the app can now assign.
 */
export type ProfilingRole =
  | "Admin"
  | "Barangay Captain"
  | "Secretary"
  | "Treasurer"
  | "BHW"
  | "Encoder"
  | "Resident";

// ─── Purok / Sitio ──────────────────────────────────────────────────────

export interface Purok {
  id: string;
  barangayId: string;
  name: string; // e.g. "Purok 1", "Sitio Maligaya"
  description?: string;
  order: number; // for UI sorting
  createdAt: string;
}

// ─── Household ──────────────────────────────────────────────────────────

export type HousingType =
  | "Concrete"
  | "Semi-concrete"
  | "Wood"
  | "Bamboo"
  | "Mixed"
  | "Other";

export type HousingTenure =
  | "Owned"
  | "Rented"
  | "Informal settler"
  | "Government housing"
  | "Mortgaged"
  | "Other";

export type IncomeBracket =
  | "Below ₱10,000"
  | "₱10,000 – ₱19,999"
  | "₱20,000 – ₱39,999"
  | "₱40,000 – ₱59,999"
  | "₱60,000 – ₱99,999"
  | "₱100,000 and above";

export type DisasterRiskIndicator =
  | "Flood-prone"
  | "Landslide-prone"
  | "Storm-surge"
  | "Earthquake"
  | "Fire-prone"
  | "None";

export interface GpsCoordinates {
  lat: number;
  lng: number;
}

export interface Household {
  id: string; // auto-generated, e.g. "HH-BONG-0001"
  barangayId: string;
  purokId: string | null;
  purokName: string; // denormalised for easy display
  address: string; // full street / sitio address
  householdHeadId: string | null; // reference to residents/{id}
  householdHeadName: string; // denormalised
  memberCount: number;
  housingType: HousingType;
  housingTenure: HousingTenure;
  accessToWater: boolean;
  accessToElectricity: boolean;
  accessToToilet: boolean;
  incomeBracket: IncomeBracket | "";
  disasterRiskIndicators: DisasterRiskIndicator[];
  lastVerifiedDate: string | null; // ISO date
  consentObtained: boolean;
  consentDate: string | null;
  qrCodeDataUrl: string | null; // data URL of generated QR image
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

// ─── Individual (extended Resident) ─────────────────────────────────────

export type Sex = "Male" | "Female";

export type CivilStatus =
  | "Single"
  | "Married"
  | "Widowed"
  | "Separated"
  | "Annulled";

export type RelationshipToHead =
  | "Head"
  | "Spouse"
  | "Son"
  | "Daughter"
  | "Father"
  | "Mother"
  | "Brother"
  | "Sister"
  | "Grandfather"
  | "Grandmother"
  | "Grandson"
  | "Granddaughter"
  | "Uncle"
  | "Aunt"
  | "Nephew"
  | "Niece"
  | "Cousin"
  | "Other Relative"
  | "Boarder"
  | "Household Helper"
  | "Other";

export type EducationLevel =
  | "No formal education"
  | "Elementary"
  | "Elementary Graduate"
  | "High School"
  | "High School Graduate"
  | "Vocational"
  | "College"
  | "College Graduate"
  | "Postgraduate";

export type PhilHealthStatus = "Member" | "Dependent" | "None" | "Unknown";

export type DisabilityType =
  | "None"
  | "Visual"
  | "Hearing"
  | "Speech"
  | "Physical"
  | "Mental"
  | "Multiple"
  | "Other";

export type IndividualStatus = "Active" | "Deceased" | "Transferred";

// Sector tags
export type SectorTag =
  | "Senior Citizen"
  | "PWD"
  | "Solo Parent"
  | "Indigenous Person"
  | "OFW"
  | "Youth"
  | "Out-of-School Youth";

// ─── Program Beneficiary ───────────────────────────────────────────────

export type ProgramName =
  | "4Ps"
  | "Social Pension"
  | "AICS"
  | "TUPAD"
  | "Scholarship"
  | "Listahanan / NHTS-PR";

export type ProgramEnrollmentStatus =
  | "Enrolled"
  | "Pending"
  | "Waitlisted"
  | "Delisted"
  | "Graduated";

export interface ProgramBeneficiary {
  programName: ProgramName;
  status: ProgramEnrollmentStatus;
  dateEnrolled: string; // ISO date
  issuingOffice: string; // e.g. "DSWD", "DSWD Field Office IV-B", "LGU"
}

// ─── Voter Info ─────────────────────────────────────────────────────────

export type VoterStatus =
  | "Registered"
  | "Not registered"
  | "Transferred"
  | "Unknown";

export interface VoterInfo {
  voterStatus: VoterStatus;
  precinctNumber: string;
  verificationSource: string; // e.g. "COMELEC precinct list", "Self-reported"
  verificationDate: string | null; // ISO date
  isEligibleUnregistered: boolean; // computed: 18+ & 6mo residency (or 15–30 for SK) & not registered
}

// ─── Profiling Resident ─────────────────────────────────────────────────

/**
 * The full individual record used by the profiling module.
 * This EXTENDS the existing Resident type — all new fields are optional
 * so that existing residents continue to work without migration.
 */
export interface ProfilingResident {
  // ── Existing fields (unchanged) ──
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  purok: string;
  address: string;
  birthdate: string; // ISO date
  householdNumber: string;
  avatarUrl: string;
  email: string;
  barangayId: string;

  // ── New profiling fields (all optional) ──
  middleName?: string;
  extension?: string; // Jr., Sr., III, etc.
  sex?: Sex;
  civilStatus?: CivilStatus;
  relationshipToHead?: RelationshipToHead;
  citizenship?: string;
  lengthOfResidencyYears?: number;
  education?: EducationLevel;
  occupation?: string;
  contactNumber?: string;
  philhealthStatus?: PhilHealthStatus;
  disability?: DisabilityType;
  individualStatus?: IndividualStatus;
  dateOfDeath?: string; // if deceased
  transferDate?: string; // if transferred
  transferLocation?: string; // where they transferred to

  // Sector tags
  sectorTags?: SectorTag[];

  // Program beneficiaries
  programBeneficiaries?: ProgramBeneficiary[];

  // Voter info
  voterStatus?: VoterStatus;
  precinctNumber?: string;
  voterVerificationSource?: string;
  voterVerificationDate?: string | null;
  isEligibleUnregistered?: boolean;

  // Household link
  householdId?: string | null;

  // DPA compliance
  consentObtained?: boolean;
  consentDate?: string | null;

  // Audit
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

// ─── Audit Log ──────────────────────────────────────────────────────────

export type AuditAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "export"
  | "import";

export type AuditEntity =
  | "household"
  | "individual"
  | "masterlist"
  | "purok"
  | "import";

export interface AuditLogEntry {
  id: string;
  barangayId: string;
  userId: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  details: string;
  timestamp: string; // ISO timestamp
}

// ─── Filter / Masterlist ────────────────────────────────────────────────

export interface ProfilingFilter {
  purok: string | null;
  ageMin: number | null;
  ageMax: number | null;
  sex: Sex | null;
  sector: SectorTag | null;
  program: ProgramName | null;
  voterStatus: VoterStatus | null;
  eligibleUnregisteredOnly: boolean;
  householdId: string | null;
  individualStatus: IndividualStatus | null;
  searchText: string;
}

export type ReportType =
  | "barangay-masterlist"
  | "household-list"
  | "program-beneficiaries"
  | "voter-list"
  | "non-voter-list"
  | "eligible-unregistered"
  | "sector-list"
  | "demographic-summary";
