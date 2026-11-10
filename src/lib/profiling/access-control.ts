/**
 * Role-based access control for the profiling module.
 *
 * Checks are done against the user's role string. Super admins
 * always have full access (checked separately in calling code).
 */

import type { ProfilingRole } from "./types";
import { PROFILING_ACCESS } from "./constants";

/** Check if a role has a given permission. */
export function canAccess(
  role: string | null | undefined,
  permission: keyof typeof PROFILING_ACCESS,
): boolean {
  if (!role) return false;
  const allowed = PROFILING_ACCESS[permission] as string[];
  return allowed.includes(role);
}

/** Can this user open the profiling module? */
export function canViewModule(role: string | null | undefined, isSuperAdmin = false): boolean {
  if (isSuperAdmin) return true;
  return canAccess(role, "viewModule");
}

/** Can this user add/edit households and individuals? */
export function canEditData(role: string | null | undefined, isSuperAdmin = false): boolean {
  if (isSuperAdmin) return true;
  return canAccess(role, "editData");
}

/** Can this user mark someone deceased/transferred? */
export function canChangeStatus(role: string | null | undefined, isSuperAdmin = false): boolean {
  if (isSuperAdmin) return true;
  return canAccess(role, "changeStatus");
}

/** Can this user export to Excel? */
export function canExportExcel(role: string | null | undefined, isSuperAdmin = false): boolean {
  if (isSuperAdmin) return true;
  return canAccess(role, "exportExcel");
}

/** Can this user export to PDF? */
export function canExportPdf(role: string | null | undefined, isSuperAdmin = false): boolean {
  if (isSuperAdmin) return true;
  return canAccess(role, "exportPdf");
}

/** Can this user import bulk data? */
export function canImportData(role: string | null | undefined, isSuperAdmin = false): boolean {
  if (isSuperAdmin) return true;
  return canAccess(role, "importData");
}

/** Can this user manage puroks? */
export function canManagePuroks(role: string | null | undefined, isSuperAdmin = false): boolean {
  if (isSuperAdmin) return true;
  return canAccess(role, "managePuroks");
}

/** Can this user see voter info (sensitive)? */
export function canViewVoterInfo(role: string | null | undefined, isSuperAdmin = false): boolean {
  if (isSuperAdmin) return true;
  return canAccess(role, "viewVoterInfo");
}

/** Can this user see income bracket (sensitive)? */
export function canViewIncome(role: string | null | undefined, isSuperAdmin = false): boolean {
  if (isSuperAdmin) return true;
  return canAccess(role, "viewIncome");
}

/** Can this user see PhilHealth status? */
export function canViewPhilHealth(role: string | null | undefined, isSuperAdmin = false): boolean {
  if (isSuperAdmin) return true;
  return canAccess(role, "viewPhilHealth");
}

/**
 * Returns a list of field groups that should be hidden for the given role.
 * Used by the UI to mask sensitive fields.
 */
export function getHiddenFieldGroups(
  role: string | null | undefined,
  isSuperAdmin = false,
): string[] {
  if (isSuperAdmin) return [];
  const hidden: string[] = [];
  if (!canViewVoterInfo(role)) hidden.push("voter");
  if (!canViewIncome(role)) hidden.push("income");
  if (!canViewPhilHealth(role)) hidden.push("philhealth");
  return hidden;
}
