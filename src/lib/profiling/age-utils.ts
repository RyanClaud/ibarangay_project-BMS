/**
 * Age computation and voter-eligibility flagging.
 */

import type { ProfilingResident, VoterStatus } from "./types";

/** Compute age in years from an ISO birthdate string. Returns null if invalid. */
export function computeAge(birthdate: string | null | undefined): number | null {
  if (!birthdate) return null;
  const birth = new Date(birthdate);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

/** Format birthdate for display (e.g. "Jan 15, 1990"). */
export function formatBirthdate(birthdate: string | null | undefined): string {
  if (!birthdate) return "—";
  const date = new Date(birthdate);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Determine if a resident is eligible to vote but not registered.
 *
 * Per Comelec rules:
 *   - Regular voter: at least 18 years old AND resident for at least 6 months
 *   - SK (Sangguniang Kabataan) voter: 15 to 30 years old (must be 18 to vote, but
 *     15–17 can register in advance)
 *
 * Returns true when:
 *   - age >= 18 OR (age >= 15 AND age <= 30 for SK)
 *   - lengthOfResidencyMonths >= 6 (if known; otherwise assume eligible)
 *   - voterStatus is NOT "Registered" and NOT "Transferred"
 */
export function computeEligibleUnregistered(
  resident: Pick<
    ProfilingResident,
    "birthdate" | "lengthOfResidencyYears" | "voterStatus"
  >,
): boolean {
  const age = computeAge(resident.birthdate);
  if (age === null) return false;

  // Must be at least 18 for regular, or 15–30 for SK eligibility
  const isVotingAge = age >= 18;
  const isSKAge = age >= 15 && age <= 30;
  if (!isVotingAge && !isSKAge) return false;

  // Must have at least 6 months residency (if known)
  const residencyMonths = (resident.lengthOfResidencyYears ?? 0) * 12;
  if (resident.lengthOfResidencyYears != null && residencyMonths < 6) {
    return false;
  }

  // Must not already be registered or transferred
  const status: VoterStatus = resident.voterStatus ?? "Unknown";
  return status !== "Registered" && status !== "Transferred";
}
