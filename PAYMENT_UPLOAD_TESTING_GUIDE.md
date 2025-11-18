# Payment Screenshot Upload - Testing Guide

## What Was Fixed

The payment dialog now includes a **screenshot upload field** for residents to submit proof of payment.

## Changes Made

### 1. Updated Payment Dialog Component
**File**: `src/components/requests/payment-dialog.tsx`

**New Features**:
- ✅ File upload input with drag-and-drop area
- ✅ Image preview before submission
- ✅ File validation (image types only, max 5MB)
- ✅ Upload to Firebase Storage
- ✅ Screenshot URL saved with payment details

### 2. Updated Storage Rules
**File**: `storage.rules`

**New Rule**:
```
match /payment-proofs/{fileName} {
  allow read: if request.auth != null;
  allow write: if request.auth != null 
               && request.resource.size < 5 * 1024 * 1024
               && request.resource.contentType.matches('image/.*');
}
```

## How to Test

### Step 1: Deploy Storage Rules
```bash
firebase deploy --only storage
```

### Step 2: Login as Resident
1. Go to the application
2. Login with resident credentials
3. Navigate to "My Dashboard"

### Step 3: Find Approved Request
Look for a document request with status **"Approved"**

### Step 4: Click "Pay Now"
The payment dialog will open with 4 steps:

```
┌─────────────────────────────────────────┐
│ Complete Your Payment                   │
├─────────────────────────────────────────┤
│                                         │
│ Total Amount Due: ₱50.00                │
│                                         │
│ 1. Pay to this GCash Number:           │
│    0912-345-6789                        │
│                                         │
│ 2. Use this as Reference Number:       │
│    REF-123456                           │
│                                         │
│ 3. Enter Payment Transaction ID:       │
│    [Input field]                        │
│                                         │
│ 4. Upload Payment Screenshot:          │
│    ┌───────────────────────────────┐   │
│    │  📤 Click to upload           │   │ ← NEW!
│    │  PNG, JPG up to 5MB           │   │
│    └───────────────────────────────┘   │
│                                         │
│ [Cancel] [Submit Payment]               │
└─────────────────────────────────────────┘
```

### Step 5: Upload Screenshot
1. Click the upload area
2. Select an image file (PNG, JPG, etc.)
3. Preview will appear showing the image
4. You can remove and re-upload if needed

### Step 6: Submit Payment
1. Enter transaction ID
2. Upload screenshot
3. Click "Submit Payment"
4. Wait for upload to complete

### Expected Result
- ✅ Status changes to "Paid"
- ✅ Screenshot is uploaded to Firebase Storage
- ✅ Screenshot URL is saved in document request
- ✅ Toast notification: "Payment proof has been uploaded"

## Validation Rules

### File Type
- ✅ Only image files accepted (JPG, PNG, GIF, WebP, etc.)
- ❌ PDF, documents, videos rejected

### File Size
- ✅ Up to 5MB allowed
- ❌ Files larger than 5MB rejected

### Required Fields
Both fields are required:
- Transaction ID (text)
- Payment Screenshot (image)

## Error Handling

### "Invalid file type"
**Cause**: Non-image file selected
**Solution**: Upload a JPG or PNG image

### "File too large"
**Cause**: Image exceeds 5MB
**Solution**: Compress or resize the image

### "Screenshot required"
**Cause**: Trying to submit without uploading screenshot
**Solution**: Upload a screenshot before submitting

### "Submission Failed"
**Cause**: Network error or Firebase Storage issue
**Solution**: 
1. Check internet connection
2. Verify Firebase Storage is enabled
3. Check storage rules are deployed

## Storage Location

Screenshots are stored at:
```
gs://your-project.appspot.com/payment-proofs/{requestId}_{timestamp}_{filename}
```

Example:
```
payment-proofs/abc123_1700123456789_gcash_payment.png
```

## Viewing Uploaded Screenshots

### For Treasurer (Verification)
The treasurer can view uploaded screenshots in the payment verification dialog:

1. Go to Payments page
2. Find request with "Paid" status
3. Click "Verify Payment"
4. Screenshot is displayed in the dialog

### In Database
The screenshot URL is stored in the document request:
```json
{
  "paymentDetails": {
    "method": "GCash",
    "transactionId": "APF12345XYZ",
    "paymentDate": "2023-11-16T10:30:00Z",
    "screenshotUrl": "https://firebasestorage.googleapis.com/..."
  }
}
```

## Troubleshooting

### Upload Button Disabled
**Check**:
- Is transaction ID filled?
- Is screenshot uploaded?
- Both are required

### Preview Not Showing
**Check**:
- Is the file an image?
- Is the file corrupted?
- Try a different image

### Upload Takes Too Long
**Possible Causes**:
- Large file size (compress image)
- Slow internet connection
- Firebase Storage quota exceeded

### Permission Denied
**Check**:
- Are storage rules deployed?
- Is user authenticated?
- Check Firebase console for errors

## Security Notes

### Storage Rules
- ✅ Only authenticated users can upload
- ✅ Only image files allowed
- ✅ 5MB size limit enforced
- ✅ All authenticated users can read (for verification)

### File Naming
- Includes request ID (prevents conflicts)
- Includes timestamp (unique identifier)
- Includes original filename (for reference)

### Access Control
- Residents can upload their payment proofs
- Staff can view all payment proofs
- Public cannot access payment proofs

## Next Steps

After successful upload:
1. Treasurer receives notification
2. Treasurer verifies payment screenshot
3. Treasurer approves or rejects payment
4. If approved: Status → "Payment Verified"
5. Secretary can then release document

## Testing Checklist

- [ ] Deploy storage rules
- [ ] Login as resident
- [ ] Find approved request
- [ ] Click "Pay Now"
- [ ] See upload area (step 4)
- [ ] Click upload area
- [ ] Select image file
- [ ] See preview
- [ ] Enter transaction ID
- [ ] Click "Submit Payment"
- [ ] See "Uploading..." state
- [ ] See success toast
- [ ] Status changes to "Paid"
- [ ] Screenshot visible in Firebase Storage console
- [ ] Screenshot URL in Firestore document

## Firebase Console Verification

### Check Storage
1. Go to Firebase Console
2. Navigate to Storage
3. Look for `payment-proofs/` folder
4. Verify uploaded images are there

### Check Firestore
1. Go to Firebase Console
2. Navigate to Firestore
3. Open the document request
4. Check `paymentDetails.screenshotUrl` field
5. URL should point to Storage file

---

## Summary

The payment upload feature is now complete with:
- ✅ Image upload with preview
- ✅ File validation
- ✅ Firebase Storage integration
- ✅ Proper security rules
- ✅ Error handling
- ✅ User-friendly interface

Residents can now upload payment proof screenshots when submitting payments!
