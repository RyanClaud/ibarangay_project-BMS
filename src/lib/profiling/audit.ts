/**
 * Audit logging helper for the profiling module.
 *
 * Every view, create, edit, delete, and export action is logged to
 * the /auditLogs Firestore collection for accountability and DPA compliance.
 */

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import type { AuditAction, AuditEntity } from "./types";

export interface AuditContext {
  firestore: ReturnType<typeof import("firebase/firestore").getFirestore> | null;
  barangayId: string;
  userId: string;
  userName: string;
  userRole: string;
}

/** Write an audit log entry. Non-blocking — failures are logged, not thrown. */
export async function logAudit(
  ctx: AuditContext,
  action: AuditAction,
  entity: AuditEntity,
  entityId: string,
  details: string,
): Promise<void> {
  if (!ctx.firestore || !ctx.barangayId) {
    console.warn("Audit log skipped: missing context");
    return;
  }
  try {
    await addDoc(collection(ctx.firestore, "auditLogs"), {
      barangayId: ctx.barangayId,
      userId: ctx.userId,
      userName: ctx.userName,
      userRole: ctx.userRole,
      action,
      entity,
      entityId,
      details,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    // Audit logging should never break the user's operation
    console.error("Failed to write audit log:", err);
  }
}
