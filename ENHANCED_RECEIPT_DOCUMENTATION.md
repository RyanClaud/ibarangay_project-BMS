# Enhanced Official Receipt - Documentation

## Overview
The official receipt now includes comprehensive payment tracking information including the reference number, transaction ID, payment date/time, and the actual payment proof screenshot uploaded by the resident.

## What's Included in the Receipt

### 1. Header Section
- Barangay seal/logo
- Barangay name and address
- "OFFICIAL RECEIPT" title

### 2. Receipt Identification
- **Receipt Number**: Auto-generated (e.g., RCP-2025-001)
- **Date Issued**: Current date when viewing receipt
- **Tracking Number**: Document request tracking number (e.g., IBGY-251116001)

### 3. Payer Information
- **Received from**: Resident's full name
- **For payment of**: Document type (e.g., Barangay Clearance)

### 4. Amount Section
- Large, prominent display of amount paid
- Formatted as Philippine Peso (₱)

### 5. Payment Details (Enhanced)
- ✅ **Payment Method**: GCash, PayMaya, Bank Transfer, etc.
- ✅ **Transaction ID**: The transaction ID from payment provider
- ✅ **Reference Number**: Document reference number for tracking
- ✅ **Payment Date**: Full date and time of payment
- ✅ **Verified by**: Barangay Treasurer confirmation

### 6. Payment Proof Screenshot (NEW!)
- ✅ **Visual Proof**: Actual screenshot uploaded by resident
- ✅ **Upload Timestamp**: When the screenshot was uploaded
- ✅ **Verification Badge**: "✓ Verified by Barangay Treasurer"
- ✅ **Print-friendly**: Optimized for printing

### 7. Important Notes
- Instructions about document release
- Reminder to present receipt when claiming
- Tracking information

### 8. Footer
- Online tracking instructions
- Computer-generated receipt notice
- Timestamp of receipt generation

## Visual Layout

```
┌─────────────────────────────────────────────────────┐
│                 OFFICIAL RECEIPT                    │
│              [Barangay Seal Image]                  │
│              BARANGAY MINA DE ORO                   │
│           Bongabong, Oriental Mindoro               │
├─────────────────────────────────────────────────────┤
│ Receipt No: RCP-2025-001                            │
│ Date Issued: November 16, 2025                      │
│ Tracking No: IBGY-251116001                         │
├─────────────────────────────────────────────────────┤
│ Received from: Ryan Claud                           │
│ For payment of: Barangay Clearance                  │
├─────────────────────────────────────────────────────┤
│              Amount Paid: ₱50.00                    │
├─────────────────────────────────────────────────────┤
│ Payment Method: GCash                               │
│ Transaction ID: APF12345XYZ                         │
│ Reference Number: REF-2025-001                      │
│ Payment Date: November 15, 2025, 2:30 PM           │
│ Verified by: Barangay Treasurer                     │
├─────────────────────────────────────────────────────┤
│ Payment Proof Attachment:                           │
│ Screenshot uploaded by resident for verification    │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │                                             │   │
│ │     [Payment Screenshot Image]              │   │
│ │                                             │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ Uploaded: Nov 15, 2025, 2:30 PM                    │
│ ✓ Verified by Barangay Treasurer                   │
├─────────────────────────────────────────────────────┤
│ IMPORTANT NOTE:                                     │
│ This is an official receipt for payment only.      │
│ The actual document will be released upon          │
│ completion of processing and signing by the        │
│ Barangay Captain.                                  │
│                                                     │
│ Please present this receipt when claiming your     │
│ document.                                          │
├─────────────────────────────────────────────────────┤
│ Track your request online                          │
│ Use tracking number: IBGY-251116001                │
│                                                     │
│ This is a computer-generated receipt and does not  │
│ require a signature.                               │
│ Issued: November 16, 2025, 10:00:00 AM            │
└─────────────────────────────────────────────────────┘
```

## Features & Benefits

### For Residents
✅ **Complete Transparency**: See exactly what was paid and when
✅ **Visual Proof**: Screenshot shows the actual payment made
✅ **Easy Verification**: All transaction details in one place
✅ **Printable**: Can print for records or claiming document
✅ **Downloadable**: Save as PDF for digital records

### For Staff (Treasurer/Secretary)
✅ **Quick Verification**: See payment proof without searching
✅ **Audit Trail**: Complete payment history visible
✅ **Dispute Resolution**: Screenshot helps resolve payment disputes
✅ **Professional**: Official-looking receipt builds trust

### For Barangay
✅ **Accountability**: Clear record of all transactions
✅ **Transparency**: Residents can verify their payments
✅ **Efficiency**: Reduces inquiries about payment status
✅ **Compliance**: Proper documentation for audits

## Payment Proof Display Logic

### When Screenshot Shows:
```typescript
if (paymentDetails.screenshotUrl && paymentDetails.method !== 'Free') {
  // Display payment proof section
}
```

**Shows for**:
- ✅ GCash payments
- ✅ PayMaya payments
- ✅ Bank Transfer payments
- ✅ Over the Counter payments

**Does NOT show for**:
- ❌ Free documents (Certificate of Indigency)
- ❌ Documents without payment proof

### Screenshot Display Features:
- **Responsive**: Scales to fit container
- **Max Height**: 400px on screen, 300px when printed
- **Centered**: Image centered in container
- **Border**: Clear border for visual separation
- **Background**: Light gray background for contrast
- **Print-friendly**: Optimized for printing without page breaks

## Print Optimization

### Print Styles Applied:
```css
@media print {
  .no-print { display: none; }
  .payment-proof img {
    max-height: 300px;
    page-break-inside: avoid;
  }
}
```

### What Prints:
- ✅ All receipt information
- ✅ Payment proof screenshot (optimized size)
- ✅ Barangay seal/logo
- ✅ All transaction details

### What Doesn't Print:
- ❌ Print/Download buttons
- ❌ Dialog close button
- ❌ Navigation elements

## Use Cases

### Use Case 1: Resident Verification
**Scenario**: Resident wants to verify their payment was recorded correctly

**Steps**:
1. Login as Resident
2. Go to Dashboard
3. Find the document request
4. Click "View Receipt"
5. See complete payment details including screenshot
6. Verify transaction ID matches their payment
7. Print or download for records

### Use Case 2: Document Claiming
**Scenario**: Resident comes to claim document

**Steps**:
1. Resident shows printed receipt
2. Secretary verifies receipt number
3. Secretary can see payment proof on screen
4. Secretary releases document
5. Marks as "Released" in system

### Use Case 3: Payment Dispute
**Scenario**: Resident claims they paid but treasurer hasn't verified

**Steps**:
1. Treasurer opens receipt
2. Views payment screenshot
3. Checks transaction ID against bank records
4. Verifies or rejects payment
5. Resolves dispute with visual proof

### Use Case 4: Audit Trail
**Scenario**: Barangay needs to audit payments

**Steps**:
1. Open each receipt
2. Verify payment proof screenshots
3. Match transaction IDs with bank statements
4. Confirm all payments are legitimate
5. Complete audit with documentation

## Technical Implementation

### Data Structure:
```typescript
interface PaymentDetails {
  method: string;              // "GCash", "PayMaya", etc.
  transactionId: string;       // "APF12345XYZ"
  paymentDate: string;         // ISO date string
  screenshotUrl: string | null; // Firebase Storage URL
  verifiedBy?: string;         // Treasurer ID
}

interface DocumentRequest {
  id: string;
  trackingNumber: string;
  referenceNumber: string;
  residentName: string;
  documentType: string;
  amount: number;
  status: DocumentRequestStatus;
  paymentDetails?: PaymentDetails;
}
```

### Screenshot Storage:
- **Location**: Firebase Storage `/payment-proofs/`
- **Naming**: `{requestId}_{timestamp}_{filename}`
- **Access**: Authenticated users only
- **Size Limit**: 5MB maximum
- **Format**: JPG, PNG, GIF, WebP

### Security:
- ✅ Screenshots only visible to authenticated users
- ✅ Storage rules enforce image-only uploads
- ✅ Size limits prevent abuse
- ✅ URLs are secure Firebase Storage URLs

## Testing Checklist

### Test 1: Receipt with Payment Proof
- [ ] Create paid document request
- [ ] Upload payment screenshot
- [ ] Treasurer verifies payment
- [ ] Open receipt
- [ ] Verify screenshot displays
- [ ] Verify all payment details show
- [ ] Print receipt
- [ ] Verify screenshot prints correctly

### Test 2: Receipt for Free Document
- [ ] Create Certificate of Indigency
- [ ] Captain approves (auto-skip to Payment Verified)
- [ ] Open receipt
- [ ] Verify NO screenshot section shows
- [ ] Verify "Free" payment method shows
- [ ] Verify amount shows ₱0.00

### Test 3: Print Functionality
- [ ] Open receipt with screenshot
- [ ] Click "Print Receipt"
- [ ] Verify print preview shows screenshot
- [ ] Verify screenshot is properly sized
- [ ] Verify no page breaks in middle of screenshot
- [ ] Print or save as PDF

### Test 4: Mobile Responsiveness
- [ ] Open receipt on mobile device
- [ ] Verify screenshot scales properly
- [ ] Verify all text is readable
- [ ] Verify layout doesn't break
- [ ] Test print from mobile

### Test 5: Missing Screenshot
- [ ] Create document with payment but no screenshot
- [ ] Open receipt
- [ ] Verify payment details show
- [ ] Verify no error for missing screenshot
- [ ] Verify receipt still looks professional

## Troubleshooting

### Screenshot Not Showing
**Check**:
1. Is `paymentDetails.screenshotUrl` populated?
2. Is payment method "Free"? (Free documents don't show screenshot)
3. Is the Firebase Storage URL accessible?
4. Check browser console for image loading errors
5. Verify Firebase Storage rules allow read access

### Screenshot Too Large
**Solution**:
- CSS max-height limits size to 400px (screen) / 300px (print)
- Image scales proportionally
- Container has max-width: 100%

### Print Quality Issues
**Solution**:
- Use high-resolution screenshots
- Ensure screenshot is clear and readable
- Test print preview before printing
- Adjust printer settings for better quality

### Screenshot Not Printing
**Check**:
1. Browser print settings
2. "Print background graphics" enabled
3. Page breaks not cutting image
4. Print preview shows image

## Summary

**Enhanced Receipt Features**:
✅ Transaction ID displayed
✅ Reference number shown
✅ Payment date and time
✅ Payment proof screenshot embedded
✅ Upload timestamp
✅ Verification badge
✅ Print-optimized layout
✅ Professional appearance

**Benefits**:
- Complete payment transparency
- Visual proof of payment
- Easy verification for staff
- Audit-ready documentation
- Dispute resolution tool
- Professional presentation

The enhanced receipt provides a complete, transparent record of the payment transaction with visual proof, making it easy for residents to verify their payments and for staff to confirm transactions!
