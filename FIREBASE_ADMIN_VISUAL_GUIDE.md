# Firebase Admin SDK - Visual Setup Guide

## ✅ Step 1: Firebase Admin SDK Installed!

You've already completed:
```bash
npm install firebase-admin ✅
```

## 📋 Step 2: Get Your Firebase Credentials

### 2.1 Open Firebase Console
Go to: **https://console.firebase.google.com/**

### 2.2 Navigate to Service Accounts
```
Firebase Console
└── Click gear icon ⚙️ (top left)
    └── Project Settings
        └── Service Accounts tab
            └── Click "Generate New Private Key"
                └── Click "Generate Key"
                    └── JSON file downloads ✅
```

### 2.3 What You'll Get
A JSON file that looks like this:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  ...
}
```

## 📝 Step 3: Create .env.local File

### 3.1 Create the File
In your project root (same folder as `package.json`), create a new file:
```
.env.local
```

### 3.2 Add These Lines
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
```

### 3.3 Copy Values from JSON
From the downloaded JSON file:
- Copy `project_id` → paste as `FIREBASE_PROJECT_ID`
- Copy `client_email` → paste as `FIREBASE_CLIENT_EMAIL`
- Copy `private_key` → paste as `FIREBASE_PRIVATE_KEY`

**IMPORTANT**: 
- Keep the quotes around the private key
- Keep the `\n` characters (they're important!)
- Don't add spaces or extra lines

### 3.4 Example .env.local
```env
FIREBASE_PROJECT_ID=ibarangay-12345
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc123@ibarangay-12345.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

## 🔄 Step 4: Restart Your Server

### 4.1 Stop Current Server
Press `Ctrl+C` in your terminal

### 4.2 Start Server Again
```bash
npm run dev
```

### 4.3 Wait for Server to Start
You should see:
```
✓ Ready in X.Xs
○ Local: http://localhost:9002
```

## 🧪 Step 5: Test It!

### 5.1 Create a Staff Member
1. Open browser: `http://localhost:9002`
2. Log in as admin
3. Go to "Staff & Users" page
4. Click "Add Staff"
5. Fill in details:
   - Name: Test Captain
   - Email: captain@test.com
   - Role: Barangay Captain
   - Password: password123
6. Click "Create Staff Account"

### 5.2 What Should Happen
✅ Success message appears
✅ NO white error screen!
✅ Page reloads automatically
✅ New staff appears in the list
✅ Admin stays logged in

### 5.3 Verify in Firebase
1. Go to Firebase Console
2. Authentication → Users
3. You should see the new user!

## ❌ Troubleshooting

### Error: "Missing environment variables"
**Solution**: 
- Check `.env.local` file exists in project root
- Verify all 3 variables are set
- Restart server

### Error: "Failed to initialize Firebase Admin"
**Solution**:
- Check private key format (must have `\n`)
- Verify quotes around private key
- Check project ID is correct
- Restart server

### Error: "Unauthorized: Only admins can create staff"
**Solution**:
- Make sure you're logged in as admin
- Check your user document has `role: "Admin"`

### Still seeing white error screen?
**Solution**:
- Check browser console for errors
- Verify API route exists: `src/app/api/admin/create-staff/route.ts`
- Check server logs for errors
- Make sure you restarted the server after adding .env.local

## 🎉 Success!

Once setup is complete, you'll have:
- ✅ No more white error screens
- ✅ Clean staff creation process
- ✅ Admin stays logged in
- ✅ Professional, reliable system

## 📚 Additional Resources

- Full documentation: `SERVER_SIDE_USER_CREATION_SETUP.md`
- Quick reference: `SETUP_FIREBASE_ADMIN.txt`
- API route code: `src/app/api/admin/create-staff/route.ts`

## 🔒 Security Notes

- ✅ `.env.local` is in `.gitignore` (won't be committed)
- ✅ Credentials only accessible on server
- ✅ Never exposed to client
- ✅ Admin verification on every request

**Keep your service account key secure!**
