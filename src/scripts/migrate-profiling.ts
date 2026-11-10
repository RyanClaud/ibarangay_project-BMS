/**
 * Migration Script for the Barangay Profiling Module
 *
 * This script sets up the new Firestore collections required by the
 * profiling module. It is a one-time migration that:
 *
 *   1. Creates initial /puroks documents for each existing barangay
 *      (using purok names already present in resident records)
 *   2. Verifies that /households and /auditLogs collections are accessible
 *   3. Extends existing /residents documents with default profiling fields
 *      (all optional, so existing features keep working)
 *
 * Run with:  npx tsx src/scripts/migrate-profiling.ts
 *
 * This script uses the Firebase Admin SDK and requires the
 * FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL environment variables
 * from your .env.local file.
 */

import * as admin from "firebase-admin";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// ── Initialize Firebase Admin ──────────────────────────────────────────

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

// ── Migration Steps ────────────────────────────────────────────────────

async function migrate() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║  iBarangay Profiling Module — Migration v1.0         ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  // Step 1: Create puroks for each barangay
  console.log("── Step 1: Creating puroks from existing resident data ──");
  const barangaysSnap = await db.collection("barangays").get();
  console.log(`   Found ${barangaysSnap.size} barangay(s)`);

  for (const barangayDoc of barangaysSnap.docs) {
    const barangayId = barangayDoc.id;
    const barangayName = barangayDoc.data().name ?? "Unknown";

    // Find unique purok names in this barangay's residents
    const residentsSnap = await db
      .collection("residents")
      .where("barangayId", "==", barangayId)
      .get();

    const purokNames = new Set<string>();
    residentsSnap.docs.forEach((r) => {
      const purok = r.data().purok;
      if (purok && purok.trim() && purok !== "Not specified") {
        purokNames.add(purok.trim());
      }
    });

    console.log(
      `   ${barangayName}: found ${purokNames.size} unique purok(s): ${[...purokNames].join(", ")}`,
    );

    let order = 1;
    for (const purokName of purokNames) {
      const purokId = `${barangayId}_purok_${order}`;
      await db.collection("puroks").doc(purokId).set({
        barangayId,
        name: purokName,
        description: "",
        order,
        createdAt: new Date().toISOString(),
      });
      console.log(`     ✓ Created purok: ${purokName} (ID: ${purokId})`);
      order++;
    }
  }

  // Step 2: Extend existing residents with default profiling fields
  console.log("\n── Step 2: Extending existing residents with profiling fields ──");
  let extended = 0;
  const allResidentsSnap = await db.collection("residents").get();
  console.log(`   Found ${allResidentsSnap.size} resident(s)`);

  const batch = db.batch();
  let batchCount = 0;
  const MAX_BATCH = 450; // Firestore limit is 500

  for (const residentDoc of allResidentsSnap.docs) {
    const data = residentDoc.data();
    const updates: Record<string, unknown> = {};

    // Add defaults only for fields that don't already exist
    if (data.sex === undefined) updates.sex = "Male";
    if (data.civilStatus === undefined) updates.civilStatus = "Single";
    if (data.citizenship === undefined) updates.citizenship = "Filipino";
    if (data.individualStatus === undefined) updates.individualStatus = "Active";
    if (data.sectorTags === undefined) updates.sectorTags = [];
    if (data.programBeneficiaries === undefined) updates.programBeneficiaries = [];
    if (data.voterStatus === undefined) updates.voterStatus = "Unknown";
    if (data.consentObtained === undefined) updates.consentObtained = false;
    if (data.householdId === undefined) updates.householdId = data.householdNumber || null;

    if (Object.keys(updates).length > 0) {
      batch.update(db.collection("residents").doc(residentDoc.id), updates as Record<string, admin.firestore.FieldValue | Partial<unknown> | undefined>);
      batchCount++;
      extended++;

      if (batchCount >= MAX_BATCH) {
        await batch.commit();
        console.log(`   ✓ Extended ${batchCount} residents (batch committed)`);
        batchCount = 0;
      }
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    console.log(`   ✓ Extended ${batchCount} residents (final batch committed)`);
  }
  console.log(`   Total residents extended: ${extended}`);

  // Step 3: Verify new collections are accessible
  console.log("\n── Step 3: Verifying new collections ──");
  for (const collName of ["puroks", "households", "auditLogs"]) {
    try {
      const snap = await db.collection(collName).limit(1).get();
      console.log(`   ✓ /${collName} — accessible (${snap.size} initial doc(s))`);
    } catch (err) {
      console.error(`   ✗ /${collName} — ERROR:`, (err as Error).message);
    }
  }

  console.log("\n══════════════════════════════════════════════════════");
  console.log("  Migration complete! The profiling module is ready.");
  console.log("  Next steps:");
  console.log("    1. Deploy Firestore rules: firebase deploy --only firestore:rules");
  console.log("    2. Deploy Firestore indexes: firebase deploy --only firestore:indexes");
  console.log("    3. Import sample data or use the Import page in the app");
  console.log("══════════════════════════════════════════════════════\n");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
