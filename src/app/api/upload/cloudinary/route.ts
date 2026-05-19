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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadType = formData.get('type') as string; // 'doctor-signature', 'lab-signature', 'patient-profile', 'lab-logo', 'report-pdf', 'prescription'

    if (!file) {
      return NextResponse.json({ error: 'No file received.' }, { status: 400 });
    }

    // 2. Validate MIME Type
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file format. Only PNG, JPEG, JPG, and PDF are allowed.' }, { status: 400 });
    }

    // 3. Validate File Size
    const isPdf = file.type === 'application/pdf';
    const maxSize = isPdf ? 10 * 1024 * 1024 : 5 * 1024 * 1024; // 10MB for PDF, 5MB for images
    if (file.size > maxSize) {
      return NextResponse.json({ error: `File size exceeds the limit of ${isPdf ? '10MB' : '5MB'}.` }, { status: 400 });
    }

    // 4. Map Folder structure
    let folder = 'lab-management';
    switch (uploadType) {
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
      default:
        return NextResponse.json({ error: 'Invalid upload type specified.' }, { status: 400 });
    }

    // 5. Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedOriginalName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
    const publicId = `${sanitizedOriginalName}_${uniqueSuffix}`;

    // 6. Convert file to buffer for Cloudinary Upload Stream
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 7. Upload to Cloudinary using upload_stream
    const cloudinaryResponse: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: publicId,
          resource_type: isPdf ? 'raw' : 'image',
          access_mode: 'public',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    // 8. Save to DB
    const dbRecord = await prisma.cloudinaryFile.create({
      data: {
        publicId: cloudinaryResponse.public_id,
        secureUrl: cloudinaryResponse.secure_url,
        originalName: file.name,
        uploadedBy: session?.user?.name || 'System',
      },
    });

    // 9. Send API Response
    return NextResponse.json({
      success: true,
      file: {
        url: cloudinaryResponse.secure_url,
        public_id: cloudinaryResponse.public_id,
        format: cloudinaryResponse.format || (isPdf ? 'pdf' : 'png'),
      },
      record: dbRecord,
    });
  } catch (error: any) {
    console.error('Error uploading file to Cloudinary:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload file to Cloudinary' }, { status: 500 });
  }
}
