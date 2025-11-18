# Quick Start: Setting Up Oriental Mindoro Barangays

## TL;DR

1. **Bulk Create Barangays** → Creates 426 barangay records (fast, safe)
2. **Create Admin Accounts** → Add admins individually as needed (controlled, secure)

## Step-by-Step Guide

### 1. Bulk Create All Barangays (~5 minutes)

Navigate to: **Barangays → Bulk Create**

For each municipality:
1. Select municipality from dropdown
2. Click "Select All"
3. Click "Create X Selected Barangays"
4. Repeat for all 15 municipalities

**Result**: All 426 barangay records created with:
- ✅ Official PSGC codes
- ✅ Municipality/Province data
- ✅ Auto-generated admin emails
- ✅ Active status

### 2. Create Admin Accounts (As Needed)

Navigate to: **Barangays** (main page)

For each barangay:
1. Find barangay in the list
2. Click "Create Admin" button
3. Enter:
   - Admin name
   - Admin email (pre-filled)
   - Admin password
4. Click "Create Admin Account"

**Result**: Admin can now log in and manage their barangay

## Why Two Steps?

**The "email-already-in-use" error you saw happens when trying to create duplicate admin accounts.**

By separating barangay creation from admin creation:
- ✅ No duplicate account errors
- ✅ Create barangays quickly in bulk
- ✅ Add admins when ready
- ✅ Different passwords for each admin
- ✅ Easy to retry if something fails

## Quick Setup Options

### Option A: Create Everything Now
1. Bulk create all 426 barangays (5 min)
2. Create all 426 admin accounts (30-60 min)
3. Done!

### Option B: Gradual Rollout
1. Bulk create all 426 barangays (5 min)
2. Create admins for pilot municipalities (10 min)
3. Add more admins as barangays become active
4. Ongoing

### Option C: Municipality by Municipality
1. Bulk create barangays for one municipality
2. Create admin accounts for that municipality
3. Test and verify
4. Repeat for next municipality

## Recommended Approach

**For Production Deployment**:

**Day 1**: Bulk create all barangays
- Go to Bulk Create
- Process all 15 municipalities
- Verify 426 barangays created

**Day 2-7**: Create priority admins
- Start with capital (Calapan City - 62 barangays)
- Add major municipalities (Naujan, Bongabong, Pinamalayan)
- Test admin access and features

**Week 2+**: Complete admin setup
- Add remaining municipality admins
- Distribute credentials securely
- Train admins on system usage

## Files Created

1. **oriental_mindoro_barangays_psgc.csv** - Official PSGC data (backup/reference)
2. **BULK_CREATE_GUIDE.md** - Detailed bulk create documentation
3. **BARANGAY_SETUP_WORKFLOW.md** - Complete workflow explanation
4. **PSGC_INTEGRATION_GUIDE.md** - PSGC library documentation

## Need Help?

**Error: "Email already in use"**
- This means an admin account already exists
- Check if admin was already created for this barangay
- Use a different email or delete the old test account

**Barangay created but no admin**
- This is normal! Admins are created separately
- Click "Create Admin" button when ready

**Want to bulk create admins**
- See BARANGAY_SETUP_WORKFLOW.md for script options
- Consider security implications
- Test with small batch first

## Summary

The new **Bulk Create** feature makes it easy to set up all 426 barangays quickly and safely. Admin accounts are created separately to avoid errors and give you control over access.

**Next Steps**:
1. Try bulk creating barangays for one municipality
2. Create an admin account for testing
3. Verify everything works
4. Proceed with full deployment
