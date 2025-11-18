# Resident Registration Guide

## Updated Registration Form

The resident registration form now includes **municipality selection** for better organization and easier barangay selection.

## New Registration Flow

### Step 1: Personal Information
- First Name *
- Last Name *
- Middle Name (optional)

### Step 2: Account Credentials
- Email Address *
- Password * (minimum 6 characters)

### Step 3: Location Selection (NEW!)
1. **Select Municipality/City** *
   - Choose from 15 municipalities in Oriental Mindoro
   - Dropdown shows all available municipalities
   
2. **Select Barangay** *
   - Automatically filtered based on selected municipality
   - Shows count of available barangays
   - Only shows barangays in the selected municipality

### Step 4: Additional Details
- Purok/Street *
- Birthdate *
- Contact Number *

### Step 5: Confirmation
- Shows complete address before submission
- Format: `[Purok], [Barangay], [Municipality], Oriental Mindoro`

## Key Features

### 🎯 Municipality Filter
- **Before**: All 426 barangays in one long dropdown
- **After**: Select municipality first, then see only relevant barangays

**Benefits**:
- Easier to find your barangay
- Prevents selecting wrong barangay from different municipality
- Better user experience
- Faster selection

### 📊 Visual Feedback
- Shows barangay count for selected municipality
- Displays complete address before submission
- Clear instructions at each step
- Helpful error messages

### 🔒 Data Validation
- Municipality required before barangay selection
- Barangay dropdown disabled until municipality selected
- All required fields validated
- Email format validation
- Password strength validation

## Example Registration

### Scenario: Resident from Poblacion, Calapan City

1. **Personal Info**:
   - First Name: Juan
   - Last Name: Dela Cruz
   - Middle Name: Santos

2. **Account**:
   - Email: juan.delacruz@email.com
   - Password: SecurePass123

3. **Location**:
   - Municipality: **Calapan City** (selected first)
   - Barangay: **Poblacion** (filtered list shows 62 barangays)

4. **Details**:
   - Purok: Purok 1
   - Birthdate: 1990-01-15
   - Contact: 09123456789

5. **Confirmation**:
   - Address shown: "Purok 1, Poblacion, Calapan City, Oriental Mindoro"

6. **Submit** → Account created!

## Data Stored

When a resident registers, the system stores:

### Resident Document (Firestore)
```javascript
{
  userId: "firebase-auth-uid",
  firstName: "Juan",
  lastName: "Dela Cruz",
  middleName: "Santos",
  email: "juan.delacruz@email.com",
  barangayId: "firestore-doc-id",
  barangayName: "Poblacion",
  municipality: "Calapan City",
  province: "Oriental Mindoro",
  region: "MIMAROPA",
  purok: "Purok 1",
  address: "Purok 1, Poblacion, Calapan City, Oriental Mindoro",
  birthdate: "1990-01-15",
  contactNumber: "09123456789",
  householdNumber: "",
  avatarUrl: "",
  createdAt: "2025-11-15T..."
}
```

### User Document (Firestore)
```javascript
{
  id: "firebase-auth-uid",
  name: "Juan Dela Cruz",
  email: "juan.delacruz@email.com",
  role: "Resident",
  barangayId: "firestore-doc-id",
  residentId: "firebase-auth-uid",
  avatarUrl: "",
  isSuperAdmin: false
}
```

### Firebase Authentication
- Email/Password account created
- User can immediately login

## Municipality List

All 15 municipalities available for selection:

1. **Baco** (27 barangays)
2. **Bansud** (13 barangays)
3. **Bongabong** (36 barangays)
4. **Bulalacao** (15 barangays)
5. **Calapan City** (62 barangays) - Provincial capital
6. **Gloria** (27 barangays)
7. **Mansalay** (17 barangays)
8. **Naujan** (70 barangays) - Most barangays
9. **Pinamalayan** (37 barangays)
10. **Pola** (23 barangays)
11. **Puerto Galera** (13 barangays)
12. **Roxas** (20 barangays)
13. **San Teodoro** (8 barangays) - Smallest
14. **Socorro** (26 barangays)
15. **Victoria** (32 barangays)

**Total**: 426 barangays

## User Experience Improvements

### Before (Old Form)
❌ Single dropdown with 426 barangays
❌ Hard to find specific barangay
❌ Easy to select wrong barangay
❌ No location context
❌ Long scrolling required

### After (New Form)
✅ Two-step selection (municipality → barangay)
✅ Filtered list (max 70 barangays per municipality)
✅ Clear location hierarchy
✅ Shows barangay count
✅ Displays complete address
✅ Better mobile experience

## Mobile Responsiveness

The form is fully responsive:
- **Desktop**: Two-column layout for efficiency
- **Mobile**: Single-column layout for readability
- **Tablet**: Adaptive layout based on screen size

## Error Handling

### Common Errors

1. **"Email already in use"**
   - Email is already registered
   - Use different email or login

2. **"Password too weak"**
   - Password must be at least 6 characters
   - Use stronger password

3. **"Failed to load barangays"**
   - Network issue or Firestore error
   - Refresh page and try again

4. **"No barangays available"**
   - Selected municipality has no active barangays
   - Contact support or try different municipality

## Security Features

- ✅ Password minimum length (6 characters)
- ✅ Email format validation
- ✅ Required field validation
- ✅ Firebase Authentication integration
- ✅ Secure password storage (hashed)
- ✅ HTTPS connection required

## Post-Registration

After successful registration:

1. **Confirmation Screen**
   - Success message displayed
   - "Go to Login" button shown

2. **Login**
   - Use registered email and password
   - Access resident dashboard

3. **Profile**
   - View and update personal information
   - Upload profile picture
   - Update contact details

4. **Services**
   - Access barangay services
   - Submit requests
   - View announcements
   - Contact barangay officials

## Admin View

Barangay admins can see registered residents:
- Filter by municipality
- Filter by barangay
- View resident details
- Verify resident information
- Manage resident accounts

## Future Enhancements

Possible improvements:
- **Address autocomplete**: Suggest addresses based on input
- **Map integration**: Show barangay location on map
- **ID verification**: Upload valid ID during registration
- **SMS verification**: Verify phone number with OTP
- **Email verification**: Confirm email before activation
- **Household registration**: Register entire household at once

## Testing

To test the registration:

1. **Open**: http://localhost:9002/register
2. **Fill form**: Use test data
3. **Select**: Choose any municipality and barangay
4. **Submit**: Create account
5. **Login**: Test with created credentials

## Support

If residents encounter issues:
1. Check internet connection
2. Verify all required fields filled
3. Ensure valid email format
4. Use strong password (6+ characters)
5. Contact barangay admin if problems persist

## Summary

The updated registration form with municipality selection provides:
- ✅ Better user experience
- ✅ Easier barangay selection
- ✅ Complete address information
- ✅ Proper data structure
- ✅ Mobile-friendly interface
- ✅ Clear visual feedback

This makes it easier for residents across all 15 municipalities and 426 barangays in Oriental Mindoro to register for barangay services.
