/**
 * useProfilingData — real-time hook for the profiling module.
 *
 * Subscribes to the /households, /puroks, and /residents collections
 * scoped by barangayId, using the same useCollection + useMemoFirebase
 * pattern as the rest of the app. Also provides write helpers with
 * audit logging.
 */

"use client";

import { useMemo } from "react";
import {
  collection,
  query,
  where,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useCollection } from "@/firebase";
import { useMemoFirebase, useFirebase } from "@/firebase";
import type { Household, Purok, ProfilingResident, AuditLogEntry } from "@/lib/profiling/types";
import { logAudit } from "@/lib/profiling/audit";

export function useProfilingData(barangayId: string | null | undefined, barangayName = "") {
  const { firestore } = useFirebase();

  // ── Puroks ──
  const puroksQuery = useMemoFirebase(() => {
    if (!firestore || !barangayId) return null;
    return query(collection(firestore, "puroks"), where("barangayId", "==", barangayId));
  }, [firestore, barangayId]);
  const { data: puroks, isLoading: isPuroksLoading } = useCollection<Purok>(puroksQuery);

  // ── Households ──
  const householdsQuery = useMemoFirebase(() => {
    if (!firestore || !barangayId) return null;
    return query(collection(firestore, "households"), where("barangayId", "==", barangayId));
  }, [firestore, barangayId]);
  const { data: households, isLoading: isHouseholdsLoading } = useCollection<Household>(householdsQuery);

  // ── Residents (extended with profiling fields) ──
  const residentsQuery = useMemoFirebase(() => {
    if (!firestore || !barangayId) return null;
    return query(collection(firestore, "residents"), where("barangayId", "==", barangayId));
  }, [firestore, barangayId]);
  const { data: residents, isLoading: isResidentsLoading } =
    useCollection<ProfilingResident>(residentsQuery);

  // ── Audit Logs ──
  const auditLogsQuery = useMemoFirebase(() => {
    if (!firestore || !barangayId) return null;
    return query(
      collection(firestore, "auditLogs"),
      where("barangayId", "==", barangayId),
    );
  }, [firestore, barangayId]);
  const { data: auditLogs, isLoading: isAuditLogsLoading } =
    useCollection<AuditLogEntry>(auditLogsQuery);

  const isLoading =
    isPuroksLoading || isHouseholdsLoading || isResidentsLoading;

  return {
    puroks: puroks ?? [],
    households: households ?? [],
    residents: residents ?? [],
    auditLogs: auditLogs ?? [],
    isLoading,
  };
}
