# Payment Workflow Implementation Plan

## New Document Request Workflow

### Complete Flow:

```
1. Pending
   ↓ (Captain approves)
2. Approved
   ↓ (Resident pays & uploads proof)
3. Payment Submitted
   ↓ (Treasurer verifies payment)
4. Payment Verified
   ↓ (Secretary prints & Captain signs)
5. Ready for Pickup
   ↓ (Resident picks up document)
6. Released
```

### Alternative Flow:
```
Pending → Rejected (if Captain rejects)
```

---

## Detailed Status Descriptions

### 1. Pending
**Who**: Resident submits request
**What happens**: Request is created and waiting for approval
**Actions available**:
- Captain: Approve or Reject
- Admin: Approve or Reject

### 2. Approved
**Who**: Captain/Admin approves
**What happens**: Resident is notified to make payment
**Actions available**:
- Resident: Upload payment proof
- Captain: Can still reject if needed

### 3. Payment Submitted
**Who**: Resident uploads payment proof
**What happens**: Payment proof is waiting for treasurer verification
**What resident uploads**:
- Payment method (GCash, PayMaya, Bank Transfer, etc.)
- Reference number
- Screenshot/photo of payment proof
- Account name (optional)
- Payment date

**Actions available**:
- Treasurer: Verify or Reject payment
- Admin: Verify or Reject payment

### 4. Payment Verified
**Who**: Treasurer verifies payment
**What happens**: Payment confirmed, document can be prepared
**Actions available**:
- Secretary: Mark as "Ready for Pickup" (after printing & signing)
- Admin: Mark as "Ready for Pickup"

### 5. Ready for Pickup
**Who**: Secretary marks after Captain signs
**What happens**: Document is signed and ready for resident to pick up
**Actions available**:
- Secretary: Mark as "Released" (when resident picks up)
- Admin: Mark as "Released"

### 6. Released
**Who**: Secretary marks when resident picks up
**What happens**: Process complete
**Actions available**:
- View only (archived)

### 7. Rejected
**Who**: Captain/Admin rejects OR Treasurer rejects payment
**What happens**: Request is denied
**Reasons**:
- Incomplete requirements
- Invalid payment proof
- Fraudulent information
- Other reasons

---

## Payment Methods Supported

1. **GCash**
   - Reference Number: 13-digit transaction ID
   - Proof: Screenshot of successful transaction

2. **PayMaya**
   - Reference Number: Transaction reference
   - Proof: Screenshot of receipt

3. **Bank Transfer**
   - Reference Number: Bank reference number
   - Proof: Bank receipt or screenshot

4. **Over the Counter** (Optional)
   - Reference Number: Official receipt number
   - Proof: Photo of official receipt

---

## Receipt Generation

### Official Receipt Contains:
- Receipt Number (auto-generated)
- Date Issued
- Resident Name
- Document Type
- Amount Paid
- Payment Method
- Reference Number
- Barangay Seal
- "This is not the official document" notice

### Receipt Features:
- Printable
- Downloadable as PDF
- QR Code for verification (optional)
- Watermark: "OFFICIAL RECEIPT"

---

## User Interface Changes

### For Residents:

#### 1. After Approval (Status: Approved)
**Shows**:
- Payment instructions
- Amount to pay
- Payment methods available
- Upload payment proof button

**Upload Form**:
```
Payment Method: [Dropdown: GCash, PayMaya, Bank Transfer, etc.]
Reference Number: [Text input]
Account Name: [Text input] (optional)
Payment Date: [Date picker]
Upload Proof: [File upload - image only]
[Submit Payment Proof]
```

#### 2. After Payment Submission (Status: Payment Submitted)
**Shows**:
- "Payment proof submitted"
- "Waiting for treasurer verification"
- View uploaded proof
- Payment details

#### 3. After Verification (Status: Payment Verified)
**Shows**:
- "Payment verified"
- Download receipt button
- "Document is being prepared"

#### 4. Ready for Pickup (Status: Ready for Pickup)
**Shows**:
- "Your document is ready!"
- "Please visit the barangay office to pick up"
- Office hours
- What to bring (valid ID)

#### 5. Released (Status: Released)
**Shows**:
- "Document released"
- Release date
- Download receipt (if needed)

### For Treasurer:

#### Payment Verification Screen
**Shows list of**: Payment Submitted requests

**For each request shows**:
- Resident name
- Document type
- Amount
- Payment method
- Reference number
- Payment proof image (clickable to enlarge)
- Payment date

**Actions**:
- [Verify Payment] button
- [Reject Payment] button (with reason)
- Add remarks field

**Verification Form**:
```
Payment Details:
- Method: GCash
- Reference: 1234567890123
- Amount: ₱50.00
- Date: Nov 15, 2024

[View Proof Image] (opens in modal)

Remarks: [Text area]
[✓ Verify Payment] [✗ Reject Payment]
```

### For Secretary:

#### Document Preparation Screen
**Shows list of**: Payment Verified requests

**Actions**:
- Print document template
- After Captain signs: [Mark as Ready for Pickup]

**Release Screen**:
**Shows list of**: Ready for Pickup requests

**Actions**:
- [Mark as Released] (when resident picks up)
- Record who picked up (optional)

### For Captain:

#### Approval Screen
**Shows list of**: Pending requests

**Actions**:
- [Approve] button
- [Reject] button (with reason)

---

## Database Schema Updates

### DocumentRequest Collection

```typescript
{
  id: string;
  residentId: string;
  residentName: string;
  documentType: string;
  requestDate: string;
  status: DocumentRequestStatus;
  trackingNumber: string;
  referenceNumber: string;
  amount: number;
  barangayId: string;
  
  // New fields
  paymentDetails: {
    method: string;              // "GCash", "PayMaya", etc.
    referenceNumber: string;     // Transaction reference
    accountName?: string;        // Payer name
    accountNumber?: string;      // Last 4 digits
    paymentDate: string;         // ISO date
    proofImageUrl?: string;      // Firebase Storage URL
    verifiedBy?: string;         // Treasurer user ID
    verifiedDate?: string;       // ISO date
    remarks?: string;            // Treasurer notes
  };
  
  // Timestamps
  approvalDate?: string;
  paymentSubmittedDate?: string;
  paymentVerifiedDate?: string;
  readyForPickupDate?: string;
  releaseDate?: string;
  
  // Rejection
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedDate?: string;
}
```

---

## File Upload Implementation

### Storage Structure:
```
/payment-proofs/
  /{barangayId}/
    /{requestId}/
      /proof.jpg
```

### Upload Rules:
- Max file size: 5MB
- Allowed formats: JPG, PNG, PDF
- Automatic compression for images
- Secure URLs (authenticated access)

### Security:
- Only request owner can upload
- Only treasurer/admin can view
- Files deleted after 90 days (optional)

---

## Receipt Template

```
╔════════════════════════════════════════╗
║     OFFICIAL RECEIPT                   ║
║     [Barangay Seal]                    ║
║                                        ║
║  BARANGAY MINA DE ORO                  ║
║  Bongabong, Oriental Mindoro           ║
║                                        ║
╠════════════════════════════════════════╣
║                                        ║
║  Receipt No: RCP-2024-001              ║
║  Date: November 15, 2024               ║
║                                        ║
║  Received from:                        ║
║  JUAN DELA CRUZ                        ║
║                                        ║
║  For payment of:                       ║
║  BARANGAY CLEARANCE                    ║
║                                        ║
║  Amount: ₱50.00                        ║
║  Payment Method: GCash                 ║
║  Reference: 1234567890123              ║
║                                        ║
║  Verified by: Maria Santos             ║
║  (Barangay Treasurer)                  ║
║                                        ║
╠════════════════════════════════════════╣
║                                        ║
║  NOTE: This is an official receipt     ║
║  for payment only. The actual          ║
║  document will be released upon        ║
║  completion of processing.             ║
║                                        ║
║  Track your request:                   ║
║  Tracking No: REQ-2024-001             ║
║                                        ║
╚════════════════════════════════════════╝
```

---

## Implementation Steps

### Phase 1: Update Types & Status Flow
- [x] Update DocumentRequestStatus type
- [x] Update DocumentRequest type with payment details
- [ ] Update status colors in UI
- [ ] Update status badges

### Phase 2: Payment Upload (Resident)
- [ ] Create payment upload form component
- [ ] Implement file upload to Firebase Storage
- [ ] Update request status to "Payment Submitted"
- [ ] Show payment instructions after approval

### Phase 3: Payment Verification (Treasurer)
- [ ] Create payment verification screen
- [ ] Show payment proof images
- [ ] Implement verify/reject actions
- [ ] Add remarks functionality

### Phase 4: Receipt Generation
- [ ] Create receipt template component
- [ ] Implement print functionality
- [ ] Implement PDF download
- [ ] Add receipt number generation

### Phase 5: Document Preparation (Secretary)
- [ ] Update document preparation workflow
- [ ] Add "Mark as Ready for Pickup" action
- [ ] Add "Mark as Released" action
- [ ] Track pickup details

### Phase 6: Notifications
- [ ] Email notification after approval (payment instructions)
- [ ] Email notification after payment verification (receipt)
- [ ] Email notification when ready for pickup
- [ ] SMS notifications (optional)

---

## Benefits

### For Residents:
- ✅ Pay online (no need to visit office for payment)
- ✅ Get instant receipt
- ✅ Track payment status
- ✅ Transparent process
- ✅ Proof of payment saved

### For Treasurer:
- ✅ Easy payment verification
- ✅ View payment proofs
- ✅ Track all payments
- ✅ Generate financial reports
- ✅ Reduce cash handling

### For Secretary:
- ✅ Clear workflow
- ✅ Know which documents to prepare
- ✅ Track document status
- ✅ Organized pickup process

### For Captain:
- ✅ Focus on approvals only
- ✅ Payment handled separately
- ✅ Clear audit trail

### For Barangay:
- ✅ Reduced foot traffic
- ✅ Faster processing
- ✅ Better record keeping
- ✅ Transparent transactions
- ✅ Digital receipts

---

## Next Steps

1. Implement payment upload form
2. Set up Firebase Storage for payment proofs
3. Create treasurer verification screen
4. Build receipt template
5. Update document request workflow
6. Test complete flow
7. Deploy and train staff

This implementation will modernize the document request process and make it more convenient for residents while maintaining proper verification and audit trails.
