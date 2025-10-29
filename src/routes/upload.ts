import { Router } from 'express';
import { UploadController, upload } from '../controllers/UploadController';
import { verifyToken } from '../middleware/auth';

const router = Router();

// Upload project image with metadata (creates project in DB)
router.post(
  '/project-image',
  verifyToken,
  upload.single('image'),
  UploadController.uploadProjectImage
);

// Upload image only (returns URL)
router.post(
  '/image',
  verifyToken,
  upload.single('image'),
  UploadController.uploadImage
);

export default router;

