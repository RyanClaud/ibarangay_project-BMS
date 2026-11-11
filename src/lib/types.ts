export type Role = "Admin" | "Barangay Captain" | "Secretary" | "Treasurer" | "BHW" | "Encoder" | "Resident";

export type DocumentPricing = {
  "Barangay Clearance": number;
  "Certificate of Residency": number;
  "Certificate of Indigency": number;
  "Business Permit": number;
  "Good Moral Character Certificate": number;
  "Solo Parent Certificate": number;
};

export type PaymentSettings = {
  gcashNumber?: string;
  gcashName?: string;
  gcashQRCodeUrl?: string;
};

export type EmergencyHotlines = {
  dutyDesk?: string; // Barangay Duty Desk / Hall Hotline (e.g. "(043) 288-1234")
  mdrrmo?: string; // MDRRMO / Municipal Disaster Rescue (e.g. "911 / 0917-123-4567")
  police?: string; // PNP Police Station / Patrol Desk (e.g. "166 / 0998-598-6321")
  fireStation?: string; // BFP Fire Station (e.g. "160 / (043) 288-1111")
  healthCenter?: string; // Rural Health Unit / Clinic Hotline (e.g. "0919-876-5432")
  additionalNotes?: string; // Optional advisory note or radio frequency
};

export interface BarangayOfficial {
  id: string;
  name: string;
  position: string; // e.g. "Punong Barangay", "Barangay Kagawad", "SK Chairperson", "Barangay Secretary", "Barangay Treasurer", "Chief Tanod"
  committee?: string; // e.g. "Committee on Peace and Order", "Committee on Health", etc.
  contactNumber?: string;
  term?: string; // e.g. "2023 - 2026"
  order?: number;
  isActive?: boolean;
}

export type Barangay = {
  id: string;
  name: string;
  address: string;
  municipality: string;
  province: string;
  region?: string;
  zipCode?: string;
  email?: string;
  captainName?: string;
  captainContact?: string;
  secretaryName?: string;
  secretaryContact?: string;
  treasurerName?: string;
  treasurerContact?: string;
  officials?: BarangayOfficial[];
  totalPopulation?: number;
  totalHouseholds?: number;
  totalVoters?: number;
  landArea?: string | number;
  updatedAt?: string;
  sealLogoUrl?: string;
  contactNumber?: string;
  isActive: boolean;
  createdAt: string;
  documentPricing?: DocumentPricing; // Custom pricing per barangay
  paymentSettings?: PaymentSettings; // GCash payment configuration
  emergencyHotlines?: EmergencyHotlines; // Emergency responder contact numbers
};

export type BarangayConfig = Barangay; // Alias for backward compatibility

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: Role;
  barangayId: string; // Assigned barangay
  residentId?: string; // Link user to a resident profile
  isSuperAdmin?: boolean; // Can manage multiple barangays
  status?: 'Active' | 'Inactive';
  isDeleted?: boolean; // Soft delete flag
  deletedAt?: string; // When the user was deleted
  deletedBy?: string; // Who deleted the user
  createdAt?: string;
  phone?: string;
};

export type Resident = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  purok: string;
  address: string;
  birthdate: string;
  householdNumber: string;
  avatarUrl: string;
  email: string;
  barangayId: string; // Assigned barangay
};

export type DocumentType = "Barangay Clearance" | "Certificate of Residency" | "Certificate of Indigency" | "Business Permit" | "Good Moral Character Certificate" | "Solo Parent Certificate";

export type DocumentRequestStatus = 
  | "Pending"           // Initial status - waiting for approval
  | "Approved"          // Approved by Captain - resident can now pay
  | "Payment Submitted" // Resident uploaded payment proof
  | "Payment Verified"  // Treasurer verified payment
  | "Ready for Pickup"  // Document signed and ready
  | "Released"          // Document picked up by resident
  | "Rejected";         // Request rejected

export type DocumentRequest = {
  id: string;
  residentId: string;
  residentName: string;
  documentType: DocumentType;
  requestDate: string;
  status: DocumentRequestStatus;
  trackingNumber: string;
  referenceNumber: string;
  amount: number;
  barangayId: string; // Assigned barangay
  approvalDate?: string;
  releaseDate?: string;
  paymentDetails?: {
    method: string;              // e.g., "GCash", "PayMaya", "Bank Transfer"
    referenceNumber: string;     // Transaction reference number
    accountName?: string;        // Name on payment account
    accountNumber?: string;      // Last 4 digits of account
    paymentDate: string;         // When payment was made
    proofImageUrl?: string;      // Screenshot of payment proof
    verifiedBy?: string;         // Treasurer who verified
    verifiedDate?: string;       // When payment was verified
    remarks?: string;            // Treasurer's remarks
    transactionId?: string;
    screenshotUrl?: string;
    screenshotBase64?: string;
  };
  residentSnapshot?: {
    firstName: string;
    lastName: string;
    address: string;
    birthdate: string;
  };
};

export type Payment = {
  id: string;
  documentRequestId: string;
  paymentDate: string;
  paymentMethod: string;
  amountPaid: number;
  transactionId: string;
  barangayId: string; // Assigned barangay
};

export type Official = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  email: string;
  contactNumber?: string;
  barangayId: string; // Assigned barangay
};

export type IncidentStatus = 'Unresolved' | 'Under Investigation' | 'Resolved' | 'Settled';

export type IncidentReport = {
  id: string;
  caseNumber: string;
  complainant: string;
  residentId?: string;
  respondent: string;
  type: string;
  location: string;
  dateFiled: string;
  status: IncidentStatus;
  description: string;
  barangayId: string;
  resolvedAt?: string;
  remarks?: string;
};

export type EventCategory =
  | 'Assembly'
  | 'Community'
  | 'Health'
  | 'Clean-Up'
  | 'Sports'
  | 'Emergency'
  | 'Distribution'
  | 'Other';

export interface BarangayEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "8:00 AM – 12:00 PM"
  location: string;
  category: EventCategory;
  barangayId: string;
  createdBy: string;
  creatorRole: string;
  createdAt: string;
}

export type NotificationType =
  | 'event'
  | 'document'
  | 'complaint'
  | 'resident'
  | 'payment'
  | 'system';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  targetRole?: 'Resident' | 'Staff' | 'All';
  recipientId?: string;
  barangayId: string;
  createdAt: string;
  readBy?: string[];
  createdBy?: string;
}

