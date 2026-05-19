import cloudinary from './cloudinary';
import { prisma } from './prisma';

export async function deleteCloudinaryFileByUrl(url: string | null) {
  if (!url) return;
  
  try {
    // 1. Find the file in CloudinaryFile database table
    const fileRecord = await (prisma as any).cloudinaryFile.findFirst({
      where: { secureUrl: url }
    });
    
    if (fileRecord) {
      const publicId = fileRecord.publicId;
      const isRaw = url.includes('/raw/upload/') || url.toLowerCase().endsWith('.pdf');
      
      // 2. Delete from Cloudinary
      await cloudinary.uploader.destroy(publicId, {
        resource_type: isRaw ? 'raw' : 'image'
      });
      
      // 3. Delete from database
      await (prisma as any).cloudinaryFile.delete({
        where: { id: fileRecord.id }
      });
      
      console.log(`🧹 Cleaned up Cloudinary file: ${publicId}`);
    }
  } catch (error) {
    console.error('Error deleting Cloudinary file:', error);
  }
}
