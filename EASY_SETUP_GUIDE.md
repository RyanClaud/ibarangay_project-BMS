# 🚀 Easy Setup Guide - No Manual Input Required!

## Option 1: Browser Setup Page (EASIEST!) ⭐

### Step 1: Navigate to Setup Page
1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser and go to:
   ```
   http://localhost:9002/setup
   ```

### Step 2: Fill in the Form
You'll see a simple form with these fields (pre-filled with defaults):

- **Super Admin Email:** `admin@dict.gov.ph` (you can change this)
- **Super Admin Password:** `Admin@123456` (you can change this)
- **Barangay Name:** `Barangay Mina De Oro`
- **Municipality:** `Bongabong`
- **Province:** `Oriental Mindoro`

### Step 3: Click "Start Setup"
- The system will automatically:
  - ✅ Create the default barangay in Firestore
  - ✅ Create the super admin authentication user
  - ✅ Create the super admin user document
  - ✅ Set up all required fields

### Step 4: Login
- After setup completes, you'll see your credentials
- Click "Go to Login"
- Login with the email and password you set
- You're done! 🎉

---

## Option 2: Command Line Script

### Step 1: Update Firebase Config
Edit `src/scripts/quick-setup.ts` and make sure your Firebase config is correct.

### Step 2: Run the Script
```bash
npx tsx src/scripts/quick-setup.ts
```

### Step 3: Follow the Output
The script will show you the credentials it created.

---

## 🎯 What Gets Created Automatically

### 1. Default Barangay Document
```
Collection: barangays
Document ID: default

Fields:
- id: "default"
- name: "Barangay Mina De Oro"
- address: "Bongabong, Oriental Mindoro"
- municipality: "Bongabong"
- province: "Oriental Mindoro"
- isActive: true
- createdAt: (current timestamp)
```

### 2. Super Admin User Document
```
Collection: users
Document ID: (auto-generated)

Fields:
- id: (same as document ID)
- name: "DICT Super Admin"
- email: "admin@dict.gov.ph"
- role: "Admin"
- barangayId: "default"
- isSuperAdmin: true
- avatarUrl: (auto-generated)
```

### 3. Firebase Authentication User
```
Email: admin@dict.gov.ph
Password: Admin@123456
UID: (matches user document ID)
```

---

## ✅ After Setup

### You Should See:
1. ✅ Login page loads without errors
2. ✅ Can login with your credentials
3. ✅ "Barangays" menu item in sidebar
4. ✅ Can access `/barangays` page
5. ✅ Can create new barangays

### First Steps:
1. **Change Your Password**
   - Go to Settings → Account
   - Change from default password

2. **Customize Barangay Info**
   - Go to Barangays page
   - Edit the default barangay
   - Add your barangay seal/logo

3. **Add More Barangays** (if needed)
   - Click "Add Barangay"
   - Fill in the details
   - Create admins for each barangay

---

## 🆘 Troubleshooting

### "Firebase not initialized"
- Make sure your `.env.local` file has all Firebase credentials
- Restart your development server

### "Email already in use"
- The email is already registered
- Use a different email OR
- Login with existing credentials

### "Permission denied"
- Make sure Firestore rules are deployed:
  ```bash
  firebase deploy --only firestore:rules
  ```

### Setup page not loading
- Check that the file exists: `src/app/setup/page.tsx`
- Restart your dev server
- Clear browser cache

---

## 🔐 Security Notes

### Default Credentials
The default password is `Admin@123456` - **CHANGE THIS IMMEDIATELY** after first login!

### Production Setup
For production:
1. Use a strong, unique password
2. Use a real email address
3. Enable 2FA if possible
4. Limit super admin access to 1-2 people

---

## 📋 Quick Comparison

| Method | Difficulty | Time | Best For |
|--------|-----------|------|----------|
| **Browser Setup Page** | ⭐ Easy | 2 min | Everyone |
| Command Line Script | ⭐⭐ Medium | 3 min | Developers |
| Manual Firestore | ⭐⭐⭐ Hard | 10 min | Advanced users |

**Recommendation:** Use the Browser Setup Page! It's the easiest and fastest way.

---

## 🎉 Success!

Once setup is complete, you'll have:
- ✅ A working multi-barangay system
- ✅ Super admin account
- ✅ Default barangay configured
- ✅ Ready to add residents and process documents

**Next:** Start adding residents, creating document requests, and managing your barangay! 🚀
