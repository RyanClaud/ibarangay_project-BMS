'use server';

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase-config"; // Make sure this path is correct for your project

/**
 * Fetches all resident documents from Firestore.
 * NOTE: Replace this with your actual implementation if it's different.
 */
export async function getResidents() {
  // Example implementation:
  const residentsCol = collection(db, "residents");
  const residentSnapshot = await getDocs(residentsCol);
  const residentList = residentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return residentList;
}

/**
 * Fetches all document request documents from Firestore.
 * NOTE: Replace this with your actual implementation if it's different.
 */
export async function getDocumentRequests() {
  // Example implementation:
  const requestsCol = collection(db, "document_requests");
  const requestSnapshot = await getDocs(requestsCol);
  const requestList = requestSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return requestList;
}