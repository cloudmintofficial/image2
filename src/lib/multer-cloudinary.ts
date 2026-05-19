import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary';

// Dynamic storage configuration based on file type / upload type
export const getCloudinaryStorage = (folderType: string) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req: any, file: any) => {
      let folder = 'lab-management';
      
      // Map folderType to structured Cloudinary folders
      switch (folderType) {
        case 'doctor-signature':
          folder = 'lab-management/signatures/doctor';
          break;
        case 'lab-signature':
          folder = 'lab-management/signatures/lab';
          break;
        case 'patient-profile':
          folder = 'lab-management/patients';
          break;
        case 'lab-logo':
          folder = 'lab-management/logos';
          break;
        case 'report-pdf':
          folder = 'lab-management/reports';
          break;
        case 'prescription':
          folder = 'lab-management/prescriptions';
          break;
      }

      // Generate unique name
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const originalName = file.originalname.split('.')[0].replace(/\s+/g, '_');
      
      // Determine format and resource type
      const isPdf = file.mimetype === 'application/pdf';
      const format = isPdf ? 'pdf' : undefined; // Let Cloudinary auto-detect for images, specify 'pdf' for raw
      const resourceType = isPdf ? 'raw' : 'image';

      return {
        folder: folder,
        public_id: `${originalName}_${uniqueSuffix}`,
        format: format,
        resource_type: resourceType,
      };
    },
  });
};

// Create multer upload instance with file validation
export const createCloudinaryUpload = (folderType: string, maxSizeMB: number = 5) => {
  const storage = getCloudinaryStorage(folderType);

  return multer({
    storage: storage,
    limits: {
      fileSize: maxSizeMB * 1024 * 1024, // max file size
    },
    fileFilter: (req: any, file: any, cb: any) => {
      const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error('Unsupported file format. Only PNG, JPEG, JPG, and PDF are allowed.'));
      }
      
      cb(null, true);
    },
  });
};
