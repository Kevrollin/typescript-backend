import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { supabase } from '../utils/supabase';
import { pgPool } from '../utils/pgPool';
import config from '../config';

// Configure multer for memory storage
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export class UploadController {
  /**
   * Upload project image to Supabase Storage and save metadata to Neon DB
   * POST /api/upload/project-image
   */
  static async uploadProjectImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Handle multer errors
      if (!req.file && !req.body.imageUrl) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
        return;
      }

      const file = req.file;
      const { projectName, description, category, studentId } = req.body;
      const userId = (req as any).user?.id;

      // Validate file
      if (!file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
        return;
      }

      // Check if Supabase is configured
      if (!config.supabase.url || !config.supabase.serviceRoleKey) {
        console.error('Supabase not configured');
        res.status(500).json({
          success: false,
          message: 'Image upload service not configured. Please contact administrator.',
          error: 'Supabase credentials missing'
        });
        return;
      }

      // Validate required fields
      if (!projectName || !description || !category) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: projectName, description, category'
        });
        return;
      }

      // Use authenticated user ID or provided studentId
      const uploadStudentId = userId?.toString() || studentId;
      if (!uploadStudentId) {
        res.status(400).json({
          success: false,
          message: 'Student ID is required'
        });
        return;
      }

      // Generate unique file name
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${uploadStudentId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const filePath = `user-uploads/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        res.status(500).json({
          success: false,
          message: 'Failed to upload image to storage',
          error: uploadError.message
        });
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Save metadata to Neon DB using raw PostgreSQL query
      // Note: This uses the existing 'projects' table structure
      // If you need a separate 'student_projects' table, create it first
      const query = `
        INSERT INTO projects (
          title,
          description,
          category,
          image_url,
          creator_id,
          goal_amount,
          current_amount,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `;

      const values = [
        projectName,
        description,
        category,
        publicUrl,
        parseInt(uploadStudentId),
        0, // goal_amount (default)
        0, // current_amount (default)
        'DRAFT' // status (default)
      ];

      const result = await pgPool.query(query, values);

      res.json({
        success: true,
        data: {
          project: result.rows[0],
          imageUrl: publicUrl
        },
        message: 'Image uploaded and project created successfully'
      });
    } catch (error) {
      console.error('Upload error:', error);
      next(error);
    }
  }

  /**
   * Upload image only (without creating project)
   * POST /api/upload/image
   */
  static async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      const userId = (req as any).user?.id;

      if (!file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
        return;
      }

      // Check if Supabase is configured
      if (!config.supabase.url || !config.supabase.serviceRoleKey) {
        console.error('Supabase not configured');
        res.status(500).json({
          success: false,
          message: 'Image upload service not configured. Please contact administrator.',
          error: 'Supabase credentials missing'
        });
        return;
      }

      // Generate unique file name
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${userId || 'anonymous'}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const filePath = `user-uploads/${fileName}`;

      console.log(`Uploading file: ${fileName} to Supabase Storage...`);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        console.error('Error details:', JSON.stringify(uploadError, null, 2));
        res.status(500).json({
          success: false,
          message: 'Failed to upload image to storage',
          error: uploadError.message || 'Unknown upload error',
          details: uploadError
        });
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);

      console.log(`File uploaded successfully: ${urlData.publicUrl}`);

      res.json({
        success: true,
        data: {
          imageUrl: urlData.publicUrl,
          fileName: fileName
        },
        message: 'Image uploaded successfully'
      });
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred during upload',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

