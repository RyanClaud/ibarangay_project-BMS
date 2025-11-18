# Custom Password for Staff Accounts

## New Feature: Set Custom Passwords

Admins can now set custom passwords when creating staff accounts (Secretary, Treasurer, Barangay Captain, etc.) instead of using the default "password".

## How to Use

### Creating a New Staff Account

1. **Log in as Admin**
   - Use your admin credentials

2. **Navigate to Users**
   - Go to the Users page
   - Click "Add User" button

3. **Fill in User Details**
   - **Full Name**: Enter the staff member's name
   - **Email Address**: Enter their email (used for login)
   - **Role**: Select from:
     - Admin
     - Barangay Captain
     - Secretary
     - Treasurer
   - **Password**: Enter a secure password (minimum 6 characters)

4. **Save**
   - Click "Save User"
   - The account will be created with the password you specified

5. **Share Credentials**
   - The success message will show the password
   - Share the email and password with the staff member securely
   - Advise them to change the password after first login

## Password Requirements

- **Minimum Length**: 6 characters
- **Recommended**: Use a mix of:
  - Uppercase letters (A-Z)
  - Lowercase letters (a-z)
  - Numbers (0-9)
  - Special characters (!@#$%^&*)

### Good Password Examples:
- `Secretary2024!`
- `MinaDeOro@123`
- `Treasurer#2024`
- `Captain$Strong`

### Weak Passwords (Avoid):
- `password` (too common)
- `123456` (too simple)
- `secretary` (too predictable)
- `admin` (too generic)

## Best Practices

### For Admins:

1. **Use Unique Passwords**
   - Don't use the same password for all staff
   - Each account should have a different password

2. **Make Passwords Memorable but Secure**
   - Use a pattern that's easy to remember
   - Example: `[Role][Barangay][Year]!`
   - Secretary for Mina de Oro: `SecretaryMDO2024!`

3. **Document Passwords Securely**
   - Keep a secure record of initial passwords
   - Use a password manager or encrypted document
   - Don't share passwords via unsecured channels

4. **Share Credentials Securely**
   - In person when possible
   - Via secure messaging (Signal, WhatsApp)
   - Never via public channels or email

5. **Advise Password Change**
   - Tell staff to change password after first login
   - Explain how to change password in Settings

### For Staff Members:

1. **Change Default Password**
   - Log in with the provided credentials
   - Go to Settings → Change Password
   - Set a new, secure password

2. **Don't Share Your Password**
   - Keep your password private
   - Don't write it down in plain text
   - Don't share it with other staff

3. **Use a Strong Password**
   - At least 8 characters
   - Mix of letters, numbers, symbols
   - Not related to personal information

## Password Change Process

### For Staff to Change Their Password:

1. **Log in** with current credentials
2. **Go to Settings** (or Profile)
3. **Click "Change Password"**
4. **Enter**:
   - Current password (the one admin gave you)
   - New password (your chosen password)
   - Confirm new password
5. **Save** changes
6. **Log out and log back in** with new password

## Security Tips

### Creating Secure Passwords:

**Method 1: Passphrase**
- Use a memorable phrase
- Example: "I love Mina de Oro 2024!"
- Result: `ILoveMDO2024!`

**Method 2: Pattern**
- Role + Location + Number + Symbol
- Example: Secretary + MinaDeOro + 2024 + !
- Result: `SecretaryMDO2024!`

**Method 3: Random (Most Secure)**
- Use a password generator
- Example: `Kx9#mP2$vL4@`
- Store in password manager

### What to Avoid:

❌ Personal information (birthdate, name)
❌ Common words (password, admin, secretary)
❌ Sequential numbers (123456, 111111)
❌ Keyboard patterns (qwerty, asdfgh)
❌ Reusing passwords from other accounts

## Troubleshooting

### "Password too short" error
**Solution**: Use at least 6 characters (8+ recommended)

### "Failed to create user" error
**Solution**: 
- Check if email already exists
- Verify you're logged in as admin
- Try a different email address

### Staff forgot their password
**Solution**:
1. Admin can reset via Firebase Console
2. Or delete and recreate the account
3. Or use "Forgot Password" feature (if implemented)

### Want to change staff password
**Solution**:
1. Staff should change it themselves in Settings
2. Or admin can reset via Firebase Console
3. Or delete and recreate the account with new password

## Example Workflow

### Scenario: Adding a Secretary for Mina de Oro

1. **Admin logs in**
   - Email: `admin@ibarangayminadeoro.com`
   - Password: [admin password]

2. **Click "Add User"**
   - Opens the Add User dialog

3. **Fill in details**:
   - Name: `Maria Santos`
   - Email: `secretary@ibarangayminadeoro.com`
   - Role: `Secretary`
   - Password: `SecretaryMDO2024!`

4. **Click "Save User"**
   - Success message appears
   - Shows: "Maria Santos has been added. Password: SecretaryMDO2024!"

5. **Share credentials with Maria**:
   - Email: `secretary@ibarangayminadeoro.com`
   - Password: `SecretaryMDO2024!`
   - Tell her to change password after first login

6. **Maria logs in**:
   - Uses provided credentials
   - Goes to Settings
   - Changes password to her own secure password
   - Logs out and logs back in with new password

## Password Storage

### What Gets Stored:

✅ **Firebase Authentication**:
- Email and hashed password
- Secure, encrypted storage
- Password never stored in plain text

✅ **Firestore Database**:
- User document (name, email, role, barangayId)
- NO password stored here
- Only authentication data

❌ **Never Stored**:
- Plain text passwords
- Password hints
- Security questions

## Migration from Default Password

If you have existing staff accounts with the default "password":

### Option 1: Staff Changes Password
1. Staff logs in with "password"
2. Goes to Settings
3. Changes to secure password

### Option 2: Admin Recreates Account
1. Admin deletes old account
2. Creates new account with secure password
3. Shares new credentials with staff

### Option 3: Password Reset (if available)
1. Use "Forgot Password" feature
2. Staff receives reset email
3. Sets new password

## Summary

- ✅ Admins can now set custom passwords when creating staff accounts
- ✅ Minimum 6 characters required
- ✅ Password shown in success message for sharing
- ✅ Staff should change password after first login
- ✅ Passwords stored securely in Firebase Authentication
- ✅ Never stored in plain text in Firestore
- 🔒 Use strong, unique passwords for each account
- 📝 Document initial passwords securely
- 🔄 Encourage staff to change passwords regularly

This feature improves security by allowing unique passwords for each staff member instead of using the same default password for everyone.
