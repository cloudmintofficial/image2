import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication Check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { publicId, isRaw } = await request.json();

    if (!publicId) {
      return NextResponse.json({ error: 'Missing public_id parameter.' }, { status: 400 });
    }

    // 2. Delete from Cloudinary (need to specify resource_type if it is raw, e.g. PDFs)
    const resourceType = isRaw ? 'raw' : 'image';
    const cloudinaryResponse = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (cloudinaryResponse.result !== 'ok' && cloudinaryResponse.result !== 'not_found') {
      throw new Error(`Cloudinary delete failed: ${cloudinaryResponse.result}`);
    }

    // 3. Delete from Database if exists
    try {
      await prisma.cloudinaryFile.delete({
        where: { publicId: publicId },
      });
    } catch (dbError) {
      console.warn('Database record not found or already deleted:', dbError);
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully.',
      cloudinary: cloudinaryResponse,
    });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete file.' }, { status: 500 });
  }
}
