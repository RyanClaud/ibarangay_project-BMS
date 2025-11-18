# Deploy Firebase Storage Rules - Fix CORS Error

## Error Explanation

The error you're seeing:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' 
has been blocked by CORS policy: Response to preflight request doesn't pass 
access control check: It does not have HTTP ok status.
```

This means:
1. Firebase Storage rules haven't been deployed yet
2. The upload is being rejected before it even starts
3. CORS error is a symptom, not the root cause

## Solution: Deploy Storage Rules

### Step 1: Deploy Storage Rules

Run this command in your terminal:

```bash
firebase deploy --only storage
```

### Expected Output:

```
=== Deploying to 'your-project-id'...

i  deploying storage
i  storage: checking storage.rules for compilation errors...
✔  storage: rules file storage.rules compiled successfully
i  storage: uploading rules storage.rules...
✔  storage: released rules storage.rules to firebase.storage/your-project-id

✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project-id/overview
```

### Step 2: Verify Deployment

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Click "Storage" in left menu
4. Click "Rules" tab
5. Verify you see the payment-proofs rules:

```
match /payment-proofs/{fileName} {
  allow read: if request.auth != null;
  allow write: if request.auth != null 
               && request.resource.size < 5 * 1024 * 1024
               && request.resource.contentType.matches('image/.*');
}
```

### Step 3: Test Payment Upload

1. Refresh your browser (Ctrl+R or Cmd+R)
2. Login as Resident
3. Click "Pay Now" on approved document
4. Fill in transaction ID
5. Upload screenshot
6. Click "Submit Payment"
7. Should work now!

## If Still Getting CORS Error

### Option 1: Wait a Few Minutes
Firebase Storage rules can take 1-2 minutes to propagate globally. Wait and try again.

### Option 2: Hard Refresh Browser
```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

### Option 3: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### Option 4: Check Firebase Storage is Enabled

1. Go to Firebase Console
2. Click "Storage" in left menu
3. If you see "Get Started", click it to enable Storage
4. Choose your location (same as Firestore)
5. Click "Done"
6. Deploy rules again: `firebase deploy --only storage`

## Storage Rules Explanation

### What the Rules Do:

**Payment Proofs** (`/payment-proofs/{fileName}`):
```javascript
allow read: if request.auth != null;
// Any authenticated user can read payment proofs
// Needed for: Residents viewing receipts, Staff verifying payments

allow write: if request.auth != null 
             && request.resource.size < 5 * 1024 * 1024
             && request.resource.contentType.matches('image/.*');
// Any authenticated user can upload
// Must be: Under 5MB, Image file type
// Needed for: Residents uploading payment screenshots
```

**Barangay Logos** (`/barangay-logos/{fileName}`):
```javascript
allow read: if true;
// Anyone can read logos (public)

allow write: if request.auth != null 
             && request.auth.token.isSuperAdmin == true
             && request.resource.size < 5 * 1024 * 1024
             && request.resource.contentType.matches('image/.*');
// Only Super Admins can upload logos
```

## Testing After Deployment

### Test 1: Upload Payment Screenshot
- [ ] Login as Resident
- [ ] Find approved document
- [ ] Click "Pay Now"
- [ ] Upload screenshot (< 5MB, image file)
- [ ] Should upload successfully
- [ ] No CORS error in console

### Test 2: View Receipt with Screenshot
- [ ] After payment submitted
- [ ] Click "View Receipt"
- [ ] Screenshot should display
- [ ] No CORS error in console

### Test 3: Staff View Payment Proof
- [ ] Login as Treasurer
- [ ] Go to Payments page
- [ ] Click "Verify Payment"
- [ ] Screenshot should display
- [ ] No CORS error in console

## Common Issues

### Issue 1: "Firebase CLI not found"
**Solution**:
```bash
npm install -g firebase-tools
firebase login
```

### Issue 2: "Permission denied"
**Solution**:
```bash
firebase login
# Make sure you're logged in with correct account
# Account must have Owner/Editor role on Firebase project
```

### Issue 3: "No project active"
**Solution**:
```bash
firebase use your-project-id
# Or
firebase use --add
# Then select your project
```

### Issue 4: "Rules file not found"
**Solution**:
- Make sure you're in project root directory
- Verify `storage.rules` file exists
- Check `firebase.json` has storage rules configured:

```json
{
  "storage": {
    "rules": "storage.rules"
  }
}
```

## Verify Firebase.json Configuration

Check your `firebase.json` file includes:

```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "hosting": {
    ...
  }
}
```

## Alternative: Deploy All Rules

If you want to deploy both Firestore and Storage rules:

```bash
firebase deploy --only firestore:rules,storage
```

Or deploy everything:

```bash
firebase deploy
```

## Summary

**Problem**: CORS error when uploading payment screenshot
**Cause**: Storage rules not deployed to Firebase
**Solution**: Run `firebase deploy --only storage`
**Result**: Payment uploads will work

**Quick Fix**:
```bash
# 1. Deploy storage rules
firebase deploy --only storage

# 2. Wait 1-2 minutes for propagation

# 3. Hard refresh browser (Ctrl+Shift+R)

# 4. Try payment upload again
```

After deploying, the payment submission should work perfectly!
