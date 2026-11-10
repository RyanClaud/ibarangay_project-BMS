# Barangay Profiling Module — Design & Implementation

## Overview

The Profiling Module adds household-level and individual-level profiling to the existing iBarangay system. It generates a masterlist per barangay, identifies household members as beneficiaries, registered voters, non-voters, and sector-group members.

**Hierarchy:** Barangay > Purok/Sitio > Household > Individual

**Design principle:** Beneficiary, voter, and sector statuses are tags or flags on the individual record — not separate lists. Every list is a filtered view of one database.

---

## 1. Database Schema (Firestore Collections)

The profiling module **adds** three new collections and **extends** the existing `/residents` collection. No existing collections are modified or removed.

### New Collections

| Collection | Purpose |
|---|---|
| `/puroks/{purokId}` | Geographic subdivisions within a barangay |
| `/households/{householdId}` | Structured household data with QR-coded IDs |
| `/auditLogs/{logId}` | Append-only audit trail of all profiling actions |

### Extended Collection

| Collection | Change |
|---|---|
| `/residents/{residentId}` | New optional fields added (existing fields unchanged) |

---

### /puroks/{purokId}

```
{
  id: string              ← auto-generated
  barangayId: string      ← tenant isolation (same as existing pattern)
  name: string            ← e.g. "Purok 1", "Sitio Maligaya"
  description: string     ← optional notes
  order: number           ← UI sort order
  createdAt: string       ← ISO timestamp
}
```

**Indexes:** `barangayId` ASC, `barangayId` + `order` ASC

---

### /households/{householdId}

```
{
  id: string                          ← "HH-{BRGYCODE}-{SEQ}" e.g. "HH-BONG-0001"
  barangayId: string                  ← tenant isolation
  purokId: string | null              ← reference to /puroks
  purokName: string                    ← denormalised for display
  address: string                      ← full street/sitio address
  householdHeadId: string | null       ← reference to /residents
  householdHeadName: string            ← denormalised
  memberCount: number                  ← managed by import/create logic
  housingType: HousingType             ← Concrete | Semi-concrete | Wood | Bamboo | Mixed | Other
  housingTenure: HousingTenure         ← Owned | Rented | Informal settler | Government housing | Mortgaged | Other
  accessToWater: boolean
  accessToElectricity: boolean
  accessToToilet: boolean
  incomeBracket: IncomeBracket | ""    ← 6 bracket options
  disasterRiskIndicators: string[]    ← Flood-prone | Landslide-prone | Storm-surge | Earthquake | Fire-prone | None
  lastVerifiedDate: string | null     ← ISO date
  consentObtained: boolean             ← DPA compliance
  consentDate: string | null
  qrCodeDataUrl: string | null         ← base64 QR code image
  createdAt: string
  updatedAt: string
  createdBy: string                    ← user UID
  updatedBy: string                    ← user UID
}
```

**Indexes:** `barangayId` ASC, `barangayId` + `purokId` ASC

---

### /residents/{residentId} — Extended Fields

All fields below are **optional**. Existing residents work without any of them. New fields are added by the import process or manual entry.

```
// ── Existing fields (unchanged) ──
id, userId, firstName, lastName, purok, address, birthdate,
householdNumber, avatarUrl, email, barangayId

// ── New profiling fields ──
middleName?: string
extension?: string                     ← Jr., Sr., III
sex?: "Male" | "Female"
civilStatus?: CivilStatus              ← Single | Married | Widowed | Separated | Annulled
relationshipToHead?: RelationshipToHead ← Head | Spouse | Son | Daughter | ...
citizenship?: string                   ← default "Filipino"
lengthOfResidencyYears?: number
education?: EducationLevel             ← No formal education through Postgraduate
occupation?: string
contactNumber?: string
philhealthStatus?: PhilHealthStatus    ← Member | Dependent | None | Unknown
disability?: DisabilityType            ← None | Visual | Hearing | Speech | Physical | Mental | Multiple | Other
individualStatus?: IndividualStatus    ← Active | Deceased | Transferred
dateOfDeath?: string                   ← if deceased
transferDate?: string                  ← if transferred
transferLocation?: string

// ── Sector tags ──
sectorTags?: SectorTag[]               ← Senior Citizen | PWD | Solo Parent | Indigenous Person | OFW | Youth | Out-of-School Youth

// ── Program beneficiaries ──
programBeneficiaries?: ProgramBeneficiary[]
  // { programName, status, dateEnrolled, issuingOffice }

// ── Voter info ──
voterStatus?: VoterStatus              ← Registered | Not registered | Transferred | Unknown
precinctNumber?: string
voterVerificationSource?: string
voterVerificationDate?: string | null
isEligibleUnregistered?: boolean        ← computed flag

// ── Household link ──
householdId?: string | null

// ── DPA compliance ──
consentObtained?: boolean
consentDate?: string | null

// ── Audit ──
createdAt?: string
updatedAt?: string
createdBy?: string
updatedBy?: string
```

**Indexes:** `barangayId` ASC, `barangayId` + `householdId` ASC

---

### /auditLogs/{logId}

```
{
  id: string
  barangayId: string
  userId: string
  userName: string
  userRole: string
  action: "view" | "create" | "edit" | "delete" | "export" | "import"
  entity: "household" | "individual" | "masterlist" | "purok" | "import"
  entityId: string
  details: string
  timestamp: ServerTimestamp
}
```

**Indexes:** `barangayId` ASC + `timestamp` DESC

---

## 2. Role-Based Access Control

Two new roles added to the existing `Role` type: **BHW** (Barangay Health Worker) and **Encoder**.

| Permission | Admin | Captain | Secretary | BHW | Treasurer | Encoder |
|---|---|---|---|---|---|---|
| View module | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Add/edit data | ✓ | ✗ | ✓ | ✓ | ✗ | ✓ |
| Mark deceased/transferred | ✓ | ✗ | ✓ | ✗ | ✗ | ✓ |
| Export Excel | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |
| Export PDF | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Import data | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Manage puroks | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| View voter info* | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| View income* | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |
| View PhilHealth* | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ |

*Sensitive fields hidden by role — UI masks these automatically.

**Super Admin** has full access to all profiling features across all barangays.

---

## 3. Voter Eligibility Logic

The `isEligibleUnregistered` flag is computed at write time:

| Condition | Rule |
|---|---|
| Regular voter | Age ≥ 18 AND residency ≥ 6 months |
| SK voter | Age 15–30 (can register in advance) |
| Must not be registered | `voterStatus` ≠ "Registered" and ≠ "Transferred" |

If `lengthOfResidencyYears` is unknown, residency is assumed eligible.

---

## 4. Compliance

### Data Privacy Act (RA 10173)
- `consentObtained` and `consentDate` fields on every household and individual
- Sensitive fields (voter, income, PhilHealth) hidden by role
- Audit log records every view, edit, export, and import
- Purpose statement displayed on the import page
- No data shared with third parties; AI queries use aggregate data only

### RA 11315 (CBMS) / RBI Alignment
- Field names align with CBMS indicators (housing, water, electricity, toilet, income, disaster risk)
- Resident data fields align with the Registry of Barangay Inhabitants (RBI)
- PSGC-compliant address hierarchy maintained through the existing system

### Voter Data Usage
- Voter information is for verification and service planning only
- No features for political targeting or sharing voter lists
- Voter data access is restricted to Admin, Captain, and Secretary roles

---

## 5. Migration Script

**File:** `src/scripts/migrate-profiling.ts`

**Run with:** `npx tsx src/scripts/migrate-profiling.ts`

**What it does:**
1. Reads existing `/barangays` and `/residents` collections
2. Creates `/puroks` documents from unique purok names found in existing residents
3. Extends existing `/residents` documents with default profiling fields (all optional)
4. Verifies that `/households` and `/auditLogs` collections are accessible

**After migration:**
1. Deploy rules: `firebase deploy --only firestore:rules`
2. Deploy indexes: `firebase deploy --only firestore:indexes`
3. Import sample data or use the in-app Import page

---

## 6. Implementation Plan (Phased)

### Phase 1 — Foundation (Week 1–2)

| Task | Deliverable |
|---|---|
| Add profiling types | `src/lib/profiling/types.ts` |
| Add constants & enums | `src/lib/profiling/constants.ts` |
| Add age/voter utilities | `src/lib/profiling/age-utils.ts` |
| Add access-control utilities | `src/lib/profiling/access-control.ts` |
| Add QR code utility | `src/lib/profiling/qr-utils.ts` |
| Add audit logging | `src/lib/profiling/audit.ts` |
| Update Firestore rules | `firestore.rules` — add puroks, households, auditLogs |
| Update Firestore indexes | `firestore.indexes.json` — add composite indexes |
| Update Role type | `src/lib/types.ts` — add BHW, Encoder |
| Update sidebar navigation | `sidebar-nav.tsx` — add profiling menu item |
| Install qrcode dependency | `npm install qrcode @types/qrcode` |
| Run migration script | `src/scripts/migrate-profiling.ts` |

### Phase 2 — Data Layer (Week 2–3)

| Task | Deliverable |
|---|---|
| Profiling data hook | `src/hooks/use-profiling-data.ts` |
| Excel export utilities | `src/lib/profiling/export-utils.ts` |
| Excel import utilities | `src/lib/profiling/import-utils.ts` |
| Import template generator | `downloadImportTemplate()` in export-utils |
| Sample data CSV | `public/sample-profiling-data.csv` (10 households) |

### Phase 3 — UI Layer (Week 3–4)

| Task | Deliverable |
|---|---|
| Main profiling page | `src/app/(dashboard)/profiling/page.tsx` |
| Masterlist with filters | `src/components/profiling/profiling-client-page.tsx` |
| Import page | `src/app/(dashboard)/profiling/import/page.tsx` |
| Import client component | `src/components/profiling/import-client-page.tsx` |
| Dashboard with charts | Masterlist tab → Dashboard tab (in profiling-client-page) |
| Audit log viewer | Reports tab → Audit log section |

### Phase 4 — Household Management (Week 4–5)

| Task | Deliverable |
|---|---|
| Household add/edit form | Dialog component with Zod validation |
| Individual add/edit form | Dialog component with all profiling fields |
| Purok management | Settings section for adding/renaming puroks |
| QR code display | QR image on household detail view |
| Mark deceased/transferred | Status change with reason + date |

### Phase 5 — Reports & Certificates (Week 5–6)

| Task | Deliverable |
|---|---|
| Prebuilt reports | All 8 report types with Excel export |
| PDF certificate generation | Pull from profiling data into existing certificate flow |
| Household verification reminder | Annual reminder to re-verify household data |

### Phase 6 — Polish & Testing (Week 6–7)

| Task | Deliverable |
|---|---|
| Mobile-responsive testing | All profiling pages tested on mobile |
| Offline support verification | PWA offline caching tested for profiling pages |
| Role-based access testing | All 7 roles tested for correct field visibility |
| Data validation testing | Import with malformed data, duplicates, edge cases |
| User guide | `docs/PROFILING_USER_GUIDE.md` |

---

## 7. File Structure

```
src/lib/profiling/
  types.ts              ← All type definitions
  constants.ts          ← Enums, dropdown options, access matrix
  age-utils.ts          ← Age computation, eligible-unregistered flag
  access-control.ts     ← Role-based access checks
  qr-utils.ts           ← QR code generation
  audit.ts              ← Audit logging to Firestore
  import-utils.ts       ← Excel/CSV parsing, validation, duplicate detection
  export-utils.ts       ← Excel export, PDF export, import template

src/hooks/
  use-profiling-data.ts ← Real-time Firestore subscriptions for profiling

src/components/profiling/
  profiling-client-page.tsx  ← Main masterlist + filters + dashboard
  import-client-page.tsx     ← Import UI with validation preview

src/app/(dashboard)/profiling/
  page.tsx                   ← Main profiling page
  import/page.tsx            ← Import page

src/scripts/
  migrate-profiling.ts      ← One-time migration script

public/
  sample-profiling-data.csv ← 10 households for testing (38 individuals)

docs/
  PROFILING_MODULE_DESIGN.md    ← This document
  PROFILING_USER_GUIDE.md       ← Staff user guide
```

---

## 8. Dependencies Added

| Package | Version | Purpose |
|---|---|---|
| `qrcode` | ^1.5.4 | QR code generation for household IDs |
| `@types/qrcode` | ^1.5.5 | TypeScript definitions |

No other new dependencies required — `xlsx`, `jspdf`, `jspdf-autotable` are already installed.

---

*Document version 1.0 — August 2026*
