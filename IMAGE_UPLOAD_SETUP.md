# Image Upload System Setup Guide

This document describes the image upload system implementation using Supabase Storage and Neon PostgreSQL.

## Overview

The system allows users to upload project images to Supabase Storage, with metadata stored in Neon PostgreSQL database. Images are served via public URLs from Supabase.

## Architecture

- **Storage**: Supabase Storage (bucket: `user-uploads`)
- **Database**: Neon PostgreSQL (metadata storage)
- **Backend**: TypeScript/Express with Multer for file handling
- **Frontend**: React with file upload UI

## Backend Setup

### 1. Environment Variables

Add these to your `.env` file:

```env
SUPABASE_URL=https://szumcggjxalkjymlqofy.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
DATABASE_URL=YOUR_NEON_CONNECTION_STRING
```

### 2. Dependencies

Already installed:
- `multer` - File upload middleware
- `@supabase/supabase-js` - Supabase client
- `pg` - PostgreSQL client (already present)
- `@types/multer` - TypeScript types for Multer

### 3. Supabase Storage Setup

1. Go to your Supabase project dashboard
2. Navigate to Storage
3. Create a bucket named `user-uploads`
4. Make sure the bucket is **public** (for public URLs)
5. Set appropriate policies for upload/read access

### 4. API Endpoints

#### POST `/api/upload/image`
Upload an image file and get the public URL.

**Request:**
- Method: POST
- Headers: `Authorization: Bearer <token>`
- Body: `multipart/form-data` with field `image` (file)

**Response:**
```json
{
  "success": true,
  "data": {
    "imageUrl": "https://...",
    "fileName": "..."
  },
  "message": "Image uploaded successfully"
}
```

#### POST `/api/upload/project-image`
Upload an image and create a project entry in the database.

**Request:**
- Method: POST
- Headers: `Authorization: Bearer <token>`
- Body: `multipart/form-data` with:
  - `image` (file)
  - `projectName` (string)
  - `description` (string)
  - `category` (string)
  - `studentId` (string, optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "project": { ... },
    "imageUrl": "https://..."
  },
  "message": "Image uploaded and project created successfully"
}
```

## Frontend Usage

### Upload Image

```typescript
import { apiService } from '@/services/api';

// Upload single image
const handleFileUpload = async (file: File) => {
  try {
    const response = await apiService.uploadImage(file);
    const imageUrl = response.data.imageUrl;
    // Use imageUrl in your form
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### File Input Component

The `CreateProject` component now supports both:
1. **File Upload**: Select and upload image files directly
2. **URL Input**: Paste image URLs manually

Both options are available in the image input fields.

## Database Schema

Images are stored in the existing `projects` table:

```sql
projects (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,  -- Supabase Storage URL
  banner_image TEXT,  -- Supabase Storage URL
  creator_id INTEGER NOT NULL,
  goal_amount DECIMAL(15, 2),
  current_amount DECIMAL(15, 2),
  status TEXT DEFAULT 'DRAFT',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## File Upload Limits

- **Maximum file size**: 5MB
- **Allowed file types**: Images only (`image/*`)
- **Storage**: Supabase Storage bucket `user-uploads`

## Error Handling

The system handles:
- File size validation
- File type validation
- Upload errors from Supabase
- Database errors
- Authentication errors

## Testing

1. **Test image upload**:
   ```bash
   curl -X POST http://localhost:8000/api/upload/image \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "image=@/path/to/image.jpg"
   ```

2. **Test project creation with image**:
   ```bash
   curl -X POST http://localhost:8000/api/upload/project-image \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "image=@/path/to/image.jpg" \
     -F "projectName=Test Project" \
     -F "description=Test Description" \
     -F "category=TECHNOLOGY"
   ```

## Troubleshooting

### Upload fails with 400 error
- Check file size (must be < 5MB)
- Check file type (must be an image)
- Verify Supabase credentials are correct

### Upload fails with 500 error
- Check Supabase bucket exists and is public
- Verify bucket policies allow uploads
- Check database connection string

### Images not displaying
- Ensure Supabase bucket is set to **public**
- Verify the public URL is correct
- Check CORS settings if needed

## Security Considerations

1. **File Validation**: Only image files are accepted
2. **Size Limits**: 5MB maximum file size
3. **Authentication**: All upload endpoints require authentication
4. **File Naming**: Files are renamed to prevent conflicts and security issues
5. **Storage Access**: Use bucket policies to control access

## Next Steps

- Add image compression before upload
- Add support for multiple image uploads
- Implement image deletion functionality
- Add image optimization/cropping features

