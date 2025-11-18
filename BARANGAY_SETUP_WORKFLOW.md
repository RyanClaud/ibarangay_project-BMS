# Barangay Setup Workflow

## Two-Step Process

Setting up barangays in the system is a **two-step process**:

### Step 1: Create Barangay Records (Bulk)
Use the **Bulk Create** feature to quickly create multiple barangay records.

**Location**: Barangays → Bulk Create button

**What it does**:
- Creates barangay records in Firestore
- Adds official PSGC codes
- Sets municipality, province, region
- Generates admin email (but doesn't create account yet)
- Sets barangay as active

**What it doesn't do**:
- ❌ Does NOT create Firebase Authentication accounts
- ❌ Does NOT create admin user records
- ❌ Does NOT send emails

**Why separate?**
- Safer: Prevents accidental duplicate accounts
- Flexible: You can create barangays now, admins later
- Controlled: Review barangays before creating admin access

### Step 2: Create Admin Accounts (Individual)
After barangays are created, add admin accounts as needed.

**Location**: Barangays page → "Create Admin" button (for each barangay)

**What it does**:
- Creates Firebase Authentication account
- Creates user record in Firestore
- Links admin to specific barangay
- Sets proper role and permissions

**When to do this**:
- When you're ready to give someone access
- When you have admin contact information
- When you want to activate a barangay

## Complete Workflow Example

### Scenario: Setup all barangays in Baco municipality

#### Phase 1: Bulk Create Barangays (2 minutes)
1. Go to **Barangays** → **Bulk Create**
2. Select **"Baco"** municipality
3. Click **"Select All"** (27 barangays)
4. Click **"Create 27 Selected Barangays"**
5. ✅ All 27 barangay records created

#### Phase 2: Create Admin Accounts (As Needed)
Option A - **Create All Admins Now**:
1. Go to **Barangays** page
2. For each barangay without admin:
   - Click **"Create Admin"** button
   - Enter admin name, email, password
   - Click **"Create Admin Account"**
3. Repeat for all 27 barangays

Option B - **Create Admins Gradually**:
1. Create admin accounts only for active barangays
2. Add more admins as barangays become operational
3. Keep some barangays without admins until needed

## Why This Approach?

### ✅ Advantages

1. **Safety First**
   - No accidental duplicate accounts
   - Review barangays before creating access
   - Control who gets admin access

2. **Flexibility**
   - Create all barangays at once
   - Add admins when ready
   - Different passwords for each admin

3. **Error Recovery**
   - If barangay creation fails, no orphaned accounts
   - If admin creation fails, barangay still exists
   - Easy to retry individual steps

4. **Audit Trail**
   - Clear record of when barangays were created
   - Clear record of when admins were added
   - Easy to track who has access

### ❌ Why Not Create Admins in Bulk?

**Security Risks**:
- All admins would have same default password
- No way to securely distribute passwords
- Accounts created before admins are ready

**Practical Issues**:
- Need unique email for each admin
- Need to verify admin information
- May not need all admins immediately

**Firebase Limitations**:
- Email-already-in-use errors if retrying
- Rate limiting on account creation
- Harder to troubleshoot bulk failures

## Alternative: Quick Admin Setup Script

If you need to create many admin accounts quickly, you can:

### Option 1: Use Default Credentials
Create a script that generates admin accounts with:
- Email: `admin@ibarangay[name].com`
- Password: `ChangeMe123!` (must be changed on first login)
- Name: `[Barangay Name] Admin`

### Option 2: Import from CSV
Prepare a CSV with admin details:
```csv
Barangay,Admin Name,Admin Email,Password
Alag,Juan Dela Cruz,juan@example.com,SecurePass123!
Bangkatan,Maria Santos,maria@example.com,SecurePass456!
```

Then create admins from the CSV data.

### Option 3: Batch Script
Create a Node.js script that:
1. Reads barangays without admins
2. Generates admin accounts with secure random passwords
3. Saves passwords to secure file
4. Creates accounts in batches

## Current Status Check

To see which barangays need admin accounts:

1. Go to **Barangays** page
2. Look for barangays with:
   - ❌ Red "No Admin" badge
   - 🟢 Green "Create Admin" button

3. Or check the count:
   - Total barangays: X
   - With admins: Y
   - Need admins: X - Y

## Best Practices

### For Testing (1-2 municipalities)
1. Bulk create barangays
2. Create 1-2 admin accounts to test
3. Verify login and permissions work
4. Then proceed with more

### For Production (All 426 barangays)
1. **Week 1**: Bulk create all barangays
2. **Week 2**: Create admins for priority municipalities
3. **Week 3**: Create admins for remaining municipalities
4. **Ongoing**: Add admins as barangays become active

### For Gradual Rollout
1. Create barangays for all municipalities
2. Create admins only for pilot barangays
3. Train pilot admins
4. Expand to more barangays based on readiness

## Troubleshooting

### "Email already in use" error
**Cause**: Trying to create admin with email that exists

**Solutions**:
1. Check if admin already exists for this barangay
2. Use different email address
3. Delete old account if it's a test account

### Barangay created but no admin
**This is normal!** Just create the admin when ready:
1. Find the barangay in the list
2. Click "Create Admin" button
3. Fill in admin details
4. Submit

### Want to bulk create admins anyway
**Create a custom script**:
1. See `src/scripts/quick-setup.ts` for examples
2. Modify to create admin accounts
3. Run with proper error handling
4. Save credentials securely

## Summary

**Bulk Create** = Fast barangay setup (records only)
**Create Admin** = Individual admin accounts (when needed)

This two-step approach is safer, more flexible, and easier to manage than trying to create everything at once.
