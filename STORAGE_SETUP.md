# Firebase Storage Setup Guide

## Overview
The barangay management system now supports image uploads for barangay seals/logos using Firebase Storage.

## What Was Added

### 1. Image Upload Feature
- Replace URL input with file upload
- Image preview before submission
- Drag-and-drop support
- File validation (type and size)
- Maximum file size: 5MB
- Supported formats: All image types (PNG, JPG, JPEG, GIF, etc.)

### 2. Storage Integration
- Automatic upload to Firebase Storage
- Unique file naming with timestamp
- Download URL generation
- Logo display in barangay list

## Deployment Steps

### Deploy Storage Rules

To enable image uploads in production, you need to deploy the storage rules:

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not done already)
firebase init

# Deploy storage rules only
firebase deploy --only storage
```

### Verify Storage Rules

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Navigate to Storage
4. Click on "Rules" tab
5. Verify the rules are deployed

## Storage Rules Explanation

The `storage.rules` file contains:

- **Read Access**: Anyone can view barangay logos (public)
- **Write Access**: Only authenticated super admins can upload
- **File Size Limit**: Maximum 5MB per file
- **File Type**: Only image files allowed

## Usage

### For Super Admins

1. Go to Barangay Management page
2. Click "Add Barangay" or edit existing barangay
3. In the form, you'll see "Barangay Seal/Logo" section
4. Click "Upload Logo Image" to select a file
5. Preview the image before submitting
6. Click "Create Barangay" - the logo will be uploaded automatically
7. The logo will appear in the barangay list

### Features

- **Preview**: See the image before uploading
- **Change**: Replace the selected image before submission
- **Remove**: Clear the selected image
- **Display**: Logos appear as circular thumbnails in the barangay list

## File Storage Structure

Images are stored in Firebase Storage with this structure:
```
barangay-logos/
  ├── {barangayId}_{timestamp}_{originalFileName}
  └── ...
```

## Troubleshooting

### Upload Fails
- Check if storage rules are deployed
- Verify user has super admin privileges
- Ensure file is under 5MB
- Confirm file is an image type

### Image Not Displaying
- Check browser console for errors
- Verify the download URL is valid
- Ensure storage rules allow public read access

## Security Notes

- Only super admins can upload logos
- File size is limited to prevent abuse
- Only image files are accepted
- Each file has a unique name to prevent conflicts
