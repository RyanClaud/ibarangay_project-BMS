# 📋 Multi-Barangay Deployment Checklist

Use this checklist to ensure a smooth deployment of the multi-barangay feature.

## Pre-Deployment

### 1. Backup (CRITICAL)
- [ ] Export Firestore database from Firebase Console
- [ ] Save backup file to secure location
- [ ] Document current database state
- [ ] Test backup restoration process (optional but recommended)

### 2. Code Review
- [ ] Review all modified files
- [ ] Check TypeScript compilation: `npm run typecheck`
- [ ] Run linter: `npm run lint`
- [ ] Test locally: `npm run dev`

### 3. Environment Check
- [ ] Firebase project is accessible
- [ ] Firebase CLI is installed: `firebase --version`
- [ ] Logged into Firebase: `firebase login`
- [ ] Correct project selected: `firebase use`

## Deployment Steps

### Step 1: Deploy Security Rules (5 minutes)
- [ ] Review `firestore.rules` file
- [ ] Deploy rules: `firebase deploy --only firestore:rules`
- [ ] Verify deployment in Firebase Console
- [ ] Check for any rule errors

### Step 2: Create Default Barangay (2 minutes)

**Via Firebase Console:**
- [ ] Navigate to Firestore Database
- [ ] Create collection: `barangays`
- [ ] Add document with ID: `default`
- [ ] Add required fields:
  ```
  id: "default"
  name: "Barangay Mina De Oro"
  address: "Bongabong, Oriental Mindoro"
  municipality: "Bongabong"
  province: "Oriental Mindoro"
  isActive: true
  createdAt: [current timestamp]
  ```
- [ ] Save document

### Step 3: Migrate Existing Data (10-30 minutes)

**Choose Migration Method:**

#### Option A: Automated Script (Recommended)
- [ ] Install Firebase Admin: `npm install firebase-admin`
- [ ] Download service account key from Firebase Console
- [ ] Update script with credentials
- [ ] Run: `npx tsx src/scripts/migrate-to-multi-barangay.ts`
- [ ] Verify migration logs
- [ ] Check sample documents in Firestore

#### Option B: Manual Migration
- [ ] Add `barangayId: "default"` to all documents in:
  - [ ] `/users` collection
  - [ ] `/residents` collection
  - [ ] `/documentRequests` collection
  - [ ] `/payments` collection (if exists)
  - [ ] `/officials` collection (if exists)
- [ ] Add `isSuperAdmin: true` to admin users in `/users`
- [ ] Verify all documents updated

### Step 4: Create Firestore Indexes (5 minutes)

**Method 1: Automatic (Recommended)**
- [ ] Start application: `npm run dev`
- [ ] Navigate through all pages
- [ ] Click index creation links in console errors
- [ ] Wait for indexes to build

**Method 2: Manual**
- [ ] Go to Firebase Console → Firestore → Indexes
- [ ] Create composite indexes:
  - [ ] `residents`: `barangayId` (Asc) + `__name__` (Asc)
  - [ ] `documentRequests`: `barangayId` (Asc) + `status` (Asc)
  - [ ] `documentRequests`: `barangayId` (Asc) + `residentId` (Asc)
  - [ ] `users`: `barangayId` (Asc) + `role` (Asc)
- [ ] Wait for indexes to build (may take several minutes)

### Step 5: Deploy Application (5 minutes)
- [ ] Build application: `npm run build`
- [ ] Fix any build errors
- [ ] Deploy to hosting: `firebase deploy --only hosting`
- [ ] Verify deployment URL

## Post-Deployment Testing

### Basic Functionality
- [ ] Application loads without errors
- [ ] Can access login page
- [ ] Can log in with existing credentials
- [ ] Dashboard displays correctly
- [ ] Navigation works properly

### Data Verification
- [ ] Existing residents are visible
- [ ] Document requests are visible
- [ ] User profiles load correctly
- [ ] Barangay config displays properly
- [ ] No "permission denied" errors

### Multi-Barangay Features
- [ ] Super admin sees "Barangays" menu item
- [ ] Can access `/barangays` page
- [ ] Can view existing barangay
- [ ] Can create new barangay
- [ ] Can edit barangay details
- [ ] Can activate/deactivate barangay

### CRUD Operations
- [ ] Create new resident (check barangayId is set)
- [ ] Edit existing resident
- [ ] Create document request (check barangayId is set)
- [ ] Process document request
- [ ] View reports (scoped to barangay)

### Security Testing
- [ ] Regular admin cannot access other barangays
- [ ] Resident can only see their own data
- [ ] Super admin can see all barangays
- [ ] Data isolation is enforced
- [ ] Security rules are working

## Rollback Plan (If Needed)

### If Issues Occur:
1. [ ] Restore Firestore backup
2. [ ] Revert to previous code version
3. [ ] Deploy old security rules
4. [ ] Verify application works
5. [ ] Document issues encountered

## Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Monitor error logs
- [ ] Check user feedback
- [ ] Verify all features working
- [ ] Document any issues

### Short-term (Week 1)
- [ ] Create additional barangays (if needed)
- [ ] Assign users to barangays
- [ ] Train staff on new features
- [ ] Update user documentation

### Long-term (Month 1)
- [ ] Review query performance
- [ ] Optimize indexes if needed
- [ ] Gather user feedback
- [ ] Plan enhancements

## Success Criteria

✅ **Deployment is successful when:**
- [ ] All existing functionality works
- [ ] No data loss occurred
- [ ] Users can log in and access their data
- [ ] Super admin can manage barangays
- [ ] Data isolation is verified
- [ ] No critical errors in logs
- [ ] Performance is acceptable

## Support Resources

### Documentation
- `QUICK_START_MULTI_BARANGAY.md` - Quick setup guide
- `MULTI_BARANGAY_MIGRATION.md` - Detailed migration guide
- `MULTI_BARANGAY_CHANGES.md` - Technical changes
- `IMPLEMENTATION_COMPLETE.md` - Implementation summary

### Troubleshooting
- Check browser console for errors
- Review Firestore rules in Firebase Console
- Verify document structure in Firestore
- Check Firebase logs for backend errors

### Common Issues
1. **Permission denied**: Deploy updated rules
2. **Data not showing**: Add barangayId to documents
3. **Can't access barangays page**: Add isSuperAdmin flag
4. **Slow queries**: Create required indexes

## Notes

### Important Reminders
- ⚠️ Always backup before making changes
- ⚠️ Test in development environment first
- ⚠️ Deploy during low-traffic periods
- ⚠️ Have rollback plan ready
- ⚠️ Monitor closely after deployment

### Estimated Timeline
- Pre-deployment: 30 minutes
- Deployment: 30-60 minutes
- Testing: 30 minutes
- **Total: 1.5-2 hours**

### Team Coordination
- [ ] Notify users of maintenance window
- [ ] Have technical support available
- [ ] Document deployment process
- [ ] Schedule post-deployment review

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete | ⬜ Rolled Back

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________
