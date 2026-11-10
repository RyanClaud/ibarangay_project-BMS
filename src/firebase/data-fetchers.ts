'use server';

import { collection, getDocs, getFirestore } from "firebase/firestore";
import { initializeApp, getApps, getApp } from "firebase/app";
import { firebaseConfig } from "@/firebase/config";

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

/**
 * Fetches all resident documents from Firestore.
 */
export async function getResidents() {
  const residentsCol = collection(db, "residents");
  const residentSnapshot = await getDocs(residentsCol);
  const residentList = residentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return residentList;
}

/**
 * Fetches all document request documents from Firestore.
 */
export async function getDocumentRequests() {
  const requestsCol = collection(db, "documentRequests");
  const requestSnapshot = await getDocs(requestsCol);
  const requestList = requestSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return requestList;
}
