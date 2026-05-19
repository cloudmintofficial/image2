import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    console.log('[Upload API] POST request received');
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File) || file.size === 0) {
      console.warn('[Upload API] No valid file received');
      return NextResponse.json({ error: 'No file received.' }, { status: 400 });
    }

    console.log(`[Upload API] Processing file: ${file.name} (${file.size} bytes, type: ${file.type})`);

    // Non-blocking session lookup with a 1-second timeout to prevent hangs
    let uploadedBy = 'System';
    try {
      const sessionPromise = getServerSession(authOptions);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout')), 1000)
      );
      
      const session = await Promise.race([sessionPromise, timeoutPromise]) as any;
      if (session?.user?.name) {
        uploadedBy = session.user.name;
        console.log(`[Upload API] Authenticated user: ${uploadedBy}`);
      }
    } catch (sessionErr: any) {
      console.log(`[Upload API] Session lookup skipped or timed out: ${sessionErr.message}. Defaulting to 'System'`);
    }

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

    console.log(`[Upload API] Cloudinary target folder: ${folder}`);

    // 2. Validate format and size
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!allowedMimes.includes(file.type)) {
      console.warn(`[Upload API] Unsupported MIME type: ${file.type}`);
      return NextResponse.json({ error: 'Unsupported file format. Only PNG, JPEG, JPG, and PDF are allowed.' }, { status: 400 });
    }

    const maxSize = isPdf ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.warn(`[Upload API] File size limit exceeded: ${file.size} bytes`);
      return NextResponse.json({ error: `File size exceeds the limit of ${isPdf ? '10MB' : '5MB'}.` }, { status: 400 });
    }

    // 3. Upload file buffer to Cloudinary
    console.log('[Upload API] Reading file arrayBuffer...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
    const publicId = `${sanitizedName}_${uniqueSuffix}`;

    console.log(`[Upload API] Uploading to Cloudinary with publicId: ${publicId}...`);
    const cloudinaryResponse: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: publicId,
          resource_type: isPdf ? 'raw' : 'image',
          access_mode: 'public',
        },
        (error, result) => {
          if (error) {
            console.error('[Upload API] Cloudinary upload_stream error:', error);
            reject(error);
          } else {
            console.log('[Upload API] Cloudinary upload_stream success');
            resolve(result);
          }
        }
      );
      uploadStream.end(buffer);
    });

    const secureUrl = cloudinaryResponse.secure_url;
    console.log(`[Upload API] Cloudinary secure URL: ${secureUrl}`);

    // 4. Save to Database
    console.log('[Upload API] Saving record to database...');
    await (prisma as any).cloudinaryFile.create({
      data: {
        publicId: cloudinaryResponse.public_id,
        secureUrl: secureUrl,
        originalName: file.name,
        uploadedBy: uploadedBy,
      },
    });
    console.log('[Upload API] Database record saved successfully');

    // 5. Return URL matching the legacy local path format
    return NextResponse.json({ url: secureUrl });
  } catch (error: any) {
    console.error('[Upload API] Error uploading file to Cloudinary:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 });
  }
}
