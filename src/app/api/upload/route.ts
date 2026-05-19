import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file received.' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const uploadedBy = session?.user?.name || 'System';

    // 1. Determine Cloudinary folder based on file characteristics
    let folder = 'lab-management/uploads';
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const lowerName = file.name.toLowerCase();

    if (lowerName.includes('signature') || lowerName.includes('sig_')) {
      if (lowerName.includes('doctor')) {
        folder = 'lab-management/signatures/doctor';
      } else {
        folder = 'lab-management/signatures/lab';
      }
    } else if (lowerName.includes('prescription')) {
      folder = 'lab-management/prescriptions';
    } else if (lowerName.includes('logo')) {
      folder = 'lab-management/logos';
    } else if (lowerName.includes('patient') || lowerName.includes('profile')) {
      folder = 'lab-management/patients';
    } else if (isPdf) {
      folder = 'lab-management/reports';
    }

    // 2. Validate format and size
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file format. Only PNG, JPEG, JPG, and PDF are allowed.' }, { status: 400 });
    }

    const maxSize = isPdf ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: `File size exceeds the limit of ${isPdf ? '10MB' : '5MB'}.` }, { status: 400 });
    }

    // 3. Upload file buffer to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
    const publicId = `${sanitizedName}_${uniqueSuffix}`;

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

    const secureUrl = cloudinaryResponse.secure_url;

    // 4. Save to Database
    await (prisma as any).cloudinaryFile.create({
      data: {
        publicId: cloudinaryResponse.public_id,
        secureUrl: secureUrl,
        originalName: file.name,
        uploadedBy: uploadedBy,
      },
    });

    // 5. Return URL matching the legacy local path format
    return NextResponse.json({ url: secureUrl });
  } catch (error: any) {
    console.error('Error uploading file to Cloudinary:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 });
  }
}
