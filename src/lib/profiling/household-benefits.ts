/**
 * Household Beneficiary Summary — computed client-side.
 *
 * Groups residents by householdId and counts how many members of each
 * household are enrolled in each government program. No extra Firestore
 * reads — derived entirely from the existing residents[] array.
 */

import type { Household, HouseholdBeneficiarySummary, ProfilingResident, ProgramName } from "./types";
import { PROGRAM_NAMES } from "./constants";

/**
 * Compute per-household beneficiary counts from the full residents array.
 *
 * @param residents  - All ProfilingResident documents for this barangay
 * @param households - All Household documents for this barangay
 * @returns          - Map of householdId → HouseholdBeneficiarySummary
 */
export function computeHouseholdBenefitSummaries(
  residents: ProfilingResident[],
  households: Household[],
): HouseholdBeneficiarySummary[] {
  // Index households by ID for O(1) lookup
  const householdMap = new Map(households.map((h) => [h.id, h]));

  // Group residents by their householdId
  const byHousehold = new Map<string, ProfilingResident[]>();
  for (const r of residents) {
    const hhId = r.householdId ?? r.householdNumber ?? "";
    if (!hhId) continue;
    if (!byHousehold.has(hhId)) byHousehold.set(hhId, []);
    byHousehold.get(hhId)!.push(r);
  }

  const summaries: HouseholdBeneficiarySummary[] = [];

  for (const [hhId, members] of byHousehold.entries()) {
    const hh = householdMap.get(hhId);

    // Count enrolled members per program
    const programCounts: Record<string, number> = {};
    const programsPresent = new Set<ProgramName>();

    for (const member of members) {
      for (const bp of member.programBeneficiaries ?? []) {
        // Only count active/enrolled statuses
        if (bp.status === "Delisted") continue;
        const prog = bp.programName;
        programCounts[prog] = (programCounts[prog] ?? 0) + 1;
        programsPresent.add(prog);
      }
    }

    const enrolledMemberCount = members.filter(
      (m) => (m.programBeneficiaries ?? []).some((bp) => bp.status !== "Delisted"),
    ).length;

    summaries.push({
      householdId: hhId,
      householdHeadName: hh?.householdHeadName ?? members.find((m) => m.relationshipToHead === "Head")
        ? `${members.find((m) => m.relationshipToHead === "Head")!.firstName} ${members.find((m) => m.relationshipToHead === "Head")!.lastName}`
        : members[0] ? `${members[0].firstName} ${members[0].lastName}` : hhId,
      purokName: hh?.purokName ?? members[0]?.purok ?? "",
      address: hh?.address ?? members[0]?.address ?? "",
      totalMembers: members.length,
      enrolledMemberCount,
      programCounts,
      programs: [...programsPresent],
    });
  }

  // Sort by household ID
  return summaries.sort((a, b) => a.householdId.localeCompare(b.householdId));
}

/**
 * Filter household summaries to those with at least one member in a given program.
 */
export function filterByProgram(
  summaries: HouseholdBeneficiarySummary[],
  program: ProgramName | null,
): HouseholdBeneficiarySummary[] {
  if (!program) return summaries;
  return summaries.filter((s) => (s.programCounts[program] ?? 0) > 0);
}

/**
 * Filter household summaries to those with at least `minCount` enrolled members
 * across any program.
 */
export function filterByMinEnrolled(
  summaries: HouseholdBeneficiarySummary[],
  minCount: number,
): HouseholdBeneficiarySummary[] {
  return summaries.filter((s) => s.enrolledMemberCount >= minCount);
}

/**
 * Get the total count of enrolled individuals per program across all households.
 * Used for the dashboard program breakdown chart.
 */
export function getTotalPerProgram(
  summaries: HouseholdBeneficiarySummary[],
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const s of summaries) {
    for (const [prog, count] of Object.entries(s.programCounts)) {
      totals[prog] = (totals[prog] ?? 0) + count;
    }
  }
  return totals;
}
