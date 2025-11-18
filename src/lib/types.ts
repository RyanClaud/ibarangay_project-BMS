export type Role = "Admin" | "Barangay Captain" | "Secretary" | "Treasurer" | "Resident";

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

export type Barangay = {
  id: string;
  name: string;
  address: string;
  municipality: string;
  province: string;
  sealLogoUrl?: string;
  contactNumber?: string;
  isActive: boolean;
  createdAt: string;
  documentPricing?: DocumentPricing; // Custom pricing per barangay
  paymentSettings?: PaymentSettings; // GCash payment configuration
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
