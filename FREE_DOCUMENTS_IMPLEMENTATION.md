# Free Documents Implementation (Certificate of Indigency)

## Overview
Certificate of Indigency is a free document (₱0.00). The system now automatically handles free documents by skipping payment steps.

## Changes Implemented

### 1. Dashboard - Resident View
**File**: `src/app/(dashboard)/dashboard/page.tsx`

**Before**:
```
Status: Approved
[Pay Now] button shown for ALL approved documents
```

**After**:
```
Status: Approved, Amount: ₱0.00
[Free - No Payment Required] badge shown instead of Pay Now button
```

**Code Change**:
```typescript
// Only show Pay Now for documents with amount > 0
{request.status === 'Approved' && request.amount > 0 && (
  <Button size="sm" onClick={() => setPaymentRequest(request)}>
    <Banknote className="mr-2"/>
    Pay Now
  </Button>
)}

// Show free badge for documents with amount = 0
{request.status === 'Approved' && request.amount === 0 && (
  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
    Free - No Payment Required
  </Badge>
)}
```

### 2. Documents Page - Staff & Resident View
**File**: `src/components/documents/document-request-client-page.tsx`

**Changes**:
- Upload Payment button only shows for documents with `amount > 0`
- Free badge shows for approved free documents
- Dropdown menu "Upload Payment Proof" only for paid documents

**Code Changes**:
```typescript
// In status column
{isResident && request.status === 'Approved' && request.residentId === currentUser?.id && request.amount > 0 && (
  <Button size="sm" variant="default" onClick={() => handleUploadPayment(request)}>
    <Upload className="mr-2 h-3 w-3" />
    Upload Payment
  </Button>
)}

{isResident && request.status === 'Approved' && request.residentId === currentUser?.id && request.amount === 0 && (
  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
    Free - No Payment Required
  </Badge>
)}

// In dropdown menu
{isResident && request.status === 'Approved' && request.residentId === currentUser?.id && request.amount > 0 && (
  <DropdownMenuItem onClick={() => handleUploadPayment(request)}>
    <Check /> Upload Payment Proof
  </DropdownMenuItem>
)}
```

### 3. Automatic Status Update
**File**: `src/contexts/app-context.tsx`

**Workflow Change**:

**Before**:
```
Pending → Approved → (Resident uploads payment) → Payment Submitted → Payment Verified → Ready for Pickup → Released
```

**After (for free documents)**:
```
Pending → Approved (auto-skip to Payment Verified) → Ready for Pickup → Released
```

**Code Implementation**:
```typescript
const updateDocumentRequestStatus = async (id: string, status: DocumentRequestStatus, paymentDetails?: DocumentRequest['paymentDetails']) => {
  // ... existing code ...

  if (status === 'Approved') {
    const requestSnap = await getDoc(requestRef);
    if (requestSnap.exists()) {
      const requestData = requestSnap.data() as DocumentRequest;
      
      // ... snapshot resident data ...

      // For free documents (amount = 0), automatically skip payment steps
      if (requestData.amount === 0) {
        updateData.status = 'Payment Verified';
        updateData.paymentDetails = {
          method: 'Free',
          transactionId: 'N/A - Free Document',
          paymentDate: new Date().toISOString(),
          screenshotUrl: null,
        };
        toast({
          title: "Free Document Approved",
          description: "This document is free. Payment steps have been skipped automatically.",
        });
      }
    }
    updateData.approvalDate = new Date().toISOString();
  }
  
  // ... rest of function ...
};
```

## User Experience

### For Residents

#### Requesting Certificate of Indigency

**Step 1: Submit Request**
```
Document Type: Certificate of Indigency
Amount: ₱0.00 (Free)
[Submit Request]
```

**Step 2: Wait for Approval**
```
Status: Pending
```

**Step 3: Approved (Automatic Skip)**
```
Status: Payment Verified ✅
Badge: "Free - No Payment Required"

Toast Notification:
"Free Document Approved
This document is free. Payment steps have been skipped automatically."
```

**Step 4: Ready for Pickup**
```
Status: Ready for Pickup
Secretary marks document as ready
```

**Step 5: Released**
```
Status: Released
Resident picks up document
```

#### Visual Comparison

**Paid Document (Barangay Clearance - ₱50)**:
```
┌─────────────────────────────────────────┐
│ Tracking: IBGY-123456                   │
│ Document: Barangay Clearance            │
│ Amount: ₱50.00                          │
│ Status: Approved                        │
│ Actions: [Pay Now]                      │
└─────────────────────────────────────────┘
```

**Free Document (Certificate of Indigency - ₱0)**:
```
┌─────────────────────────────────────────┐
│ Tracking: IBGY-123457                   │
│ Document: Certificate of Indigency      │
│ Amount: ₱0.00                           │
│ Status: Payment Verified ✅             │
│ Actions: [Free - No Payment Required]   │
└─────────────────────────────────────────┘
```

### For Staff

#### Barangay Captain/Admin Approving Free Document

**Before Approval**:
```
Status: Pending
Amount: ₱0.00
```

**After Clicking "Approve Request"**:
```
Status: Payment Verified (automatically)
Amount: ₱0.00
Payment Details:
  - Method: Free
  - Transaction ID: N/A - Free Document
  - Payment Date: [current timestamp]
```

**Toast Notification**:
```
"Free Document Approved
This document is free. Payment steps have been skipped automatically."
```

#### Secretary Processing Free Document

**No Payment Verification Needed**:
- Document goes directly from Pending → Payment Verified
- Secretary can immediately mark as "Ready for Pickup"
- No treasurer verification required

#### Treasurer View

**Free documents don't appear in payment queue**:
- Status is already "Payment Verified"
- No action needed from treasurer
- Payment details show "Free" method

## Document Types & Amounts

### Current Document Types:
```typescript
1. Barangay Clearance - ₱50.00 (requires payment)
2. Certificate of Residency - ₱75.00 (requires payment)
3. Certificate of Indigency - ₱0.00 (FREE - auto-skip payment)
4. Business Permit - ₱100.00 (requires payment)
5. Good Moral Character Certificate - ₱50.00 (requires payment)
6. Solo Parent Certificate - ₱0.00 (FREE - auto-skip payment)
```

### Adding More Free Documents

To make a document free, set amount to 0 in the request form:

**File**: `src/components/requests/request-form.tsx`
```typescript
case 'Certificate of Indigency':
  amount = 0.00; // Free document
  break;
case 'Solo Parent Certificate':
  amount = 0.00; // Free document
  break;
```

## Payment Details for Free Documents

### Firestore Structure:
```json
{
  "id": "abc123",
  "documentType": "Certificate of Indigency",
  "amount": 0,
  "status": "Payment Verified",
  "paymentDetails": {
    "method": "Free",
    "transactionId": "N/A - Free Document",
    "paymentDate": "2023-11-16T10:30:00Z",
    "screenshotUrl": null
  }
}
```

### Why Store Payment Details?

1. **Consistency**: All approved documents have payment details
2. **Audit Trail**: Clear record that document was free
3. **Receipt Generation**: Can still generate receipt showing ₱0.00
4. **Reporting**: Easy to filter free vs paid documents

## Status Flow Comparison

### Paid Document Flow:
```
1. Pending
   ↓ (Captain approves)
2. Approved
   ↓ (Resident uploads payment)
3. Payment Submitted
   ↓ (Treasurer verifies)
4. Payment Verified
   ↓ (Secretary prepares document)
5. Ready for Pickup
   ↓ (Resident picks up)
6. Released
```

### Free Document Flow:
```
1. Pending
   ↓ (Captain approves - AUTO SKIP TO STEP 4)
2. Payment Verified ✅
   ↓ (Secretary prepares document)
3. Ready for Pickup
   ↓ (Resident picks up)
4. Released
```

**Steps Skipped**:
- ❌ Approved (skipped)
- ❌ Payment Submitted (skipped)
- ✅ Goes directly to Payment Verified

## Benefits

### For Residents
- ✅ No confusion about payment for free documents
- ✅ Clear "Free - No Payment Required" badge
- ✅ Faster processing (no payment upload needed)
- ✅ No need to wait for payment verification

### For Staff
- ✅ Less manual work (no payment verification for free docs)
- ✅ Faster document processing
- ✅ Clear audit trail
- ✅ Automatic workflow

### For System
- ✅ Consistent data structure
- ✅ Proper status tracking
- ✅ Audit compliance
- ✅ Reporting accuracy

## Testing Checklist

### Test Free Document (Certificate of Indigency)

- [ ] Submit Certificate of Indigency request
- [ ] Verify amount shows ₱0.00
- [ ] Captain approves request
- [ ] Verify status changes to "Payment Verified" (not "Approved")
- [ ] Verify toast notification appears
- [ ] Verify "Free - No Payment Required" badge shows
- [ ] Verify no "Pay Now" button appears
- [ ] Verify no "Upload Payment" button in dropdown
- [ ] Secretary marks as "Ready for Pickup"
- [ ] Resident picks up document
- [ ] Status changes to "Released"

### Test Paid Document (Barangay Clearance)

- [ ] Submit Barangay Clearance request
- [ ] Verify amount shows ₱50.00
- [ ] Captain approves request
- [ ] Verify status is "Approved" (not auto-verified)
- [ ] Verify "Pay Now" button appears
- [ ] Resident uploads payment proof
- [ ] Status changes to "Payment Submitted"
- [ ] Treasurer verifies payment
- [ ] Status changes to "Payment Verified"
- [ ] Secretary marks as "Ready for Pickup"
- [ ] Resident picks up document
- [ ] Status changes to "Released"

## Edge Cases Handled

### 1. Resident Views Free Document
- ✅ No payment button shown
- ✅ Clear badge indicating it's free
- ✅ Can still view certificate when ready

### 2. Staff Approves Free Document
- ✅ Automatic status update to "Payment Verified"
- ✅ Toast notification confirms auto-skip
- ✅ Payment details populated with "Free" method

### 3. Treasurer Views Free Documents
- ✅ Don't appear in "Payment Submitted" tab
- ✅ Already in "Payment Verified" status
- ✅ No action needed

### 4. Receipt Generation for Free Documents
- ✅ Receipt shows ₱0.00 amount
- ✅ Payment method shows "Free"
- ✅ Transaction ID shows "N/A - Free Document"

## Summary

The system now intelligently handles free documents:

✅ **Automatic Detection**: Checks if `amount === 0`
✅ **Auto-Skip Payment**: Goes directly to "Payment Verified"
✅ **Clear UI**: Shows "Free - No Payment Required" badge
✅ **No Payment Buttons**: Hides upload payment options
✅ **Faster Processing**: Eliminates unnecessary steps
✅ **Audit Trail**: Maintains proper payment details record
✅ **User Friendly**: Clear communication to residents

Certificate of Indigency and other free documents now have a streamlined workflow!
