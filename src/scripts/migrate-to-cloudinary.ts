import fs from 'fs';
import path from 'path';
import cloudinary from '../lib/cloudinary';
import { prisma } from '../lib/prisma';

async function main() {
  // 1. Verify Cloudinary Credentials
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error('❌ Error: Cloudinary credentials are not configured in your environment variables.');
    console.error('Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.');
    process.exit(1);
  }

  console.log('🔄 Starting migration to Cloudinary...');
  console.log(`Cloud Name: ${cloudName}`);

  const uploadsDir = path.join(process.cwd(), 'public/uploads');
  if (!fs.existsSync(uploadsDir)) {
    console.log('ℹ️ Local uploads directory public/uploads does not exist. Nothing to migrate.');
    return;
  }

  const files = fs.readdirSync(uploadsDir);
  if (files.length === 0) {
    console.log('ℹ️ No files found in public/uploads.');
    return;
  }

  console.log(`📂 Found ${files.length} files to migrate.`);

  let successCount = 0;
  let dbUpdatesCount = 0;

  for (const filename of files) {
    // Skip hidden files or system files
    if (filename.startsWith('.') || filename.endsWith('.txt')) {
      console.log(`⏭️ Skipping system/log file: ${filename}`);
      continue;
    }

    const filepath = path.join(uploadsDir, filename);
    const fileStats = fs.statSync(filepath);

    if (fileStats.isDirectory()) {
      continue;
    }

    console.log(`\n📤 Uploading ${filename} (${(fileStats.size / 1024).toFixed(1)} KB)...`);

    // Determine Cloudinary folder and resource type
    let folder = 'lab-management/uploads';
    const isPdf = filename.toLowerCase().endsWith('.pdf');
    const lowerName = filename.toLowerCase();

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

    try {
      // Generate custom public_id to match target naming conventions
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const sanitizedBaseName = filename.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
      const publicId = `${sanitizedBaseName}_${uniqueSuffix}`;

      // Upload file directly to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(filepath, {
        folder: folder,
        public_id: publicId,
        resource_type: isPdf ? 'raw' : 'image',
        access_mode: 'public',
      });

      const secureUrl = uploadResult.secure_url;
      const cloudinaryPublicId = uploadResult.public_id;

      console.log(`✅ Uploaded successfully: ${secureUrl}`);

      // Insert Cloudinary record into DB
      await (prisma as any).cloudinaryFile.upsert({
        where: { publicId: cloudinaryPublicId },
        update: {
          secureUrl: secureUrl,
          originalName: filename,
          uploadedBy: 'Migration Script',
        },
        create: {
          publicId: cloudinaryPublicId,
          secureUrl: secureUrl,
          originalName: filename,
          uploadedBy: 'Migration Script',
        },
      });

      successCount++;

      // Update Database Table references:
      
      // 1. Department signatureImageUrl
      const localUrlPattern1 = `/uploads/${filename}`;
      
      const deptSigUpdates = await prisma.department.updateMany({
        where: { signatureImageUrl: localUrlPattern1 },
        data: { signatureImageUrl: secureUrl },
      });
      if (deptSigUpdates.count > 0) {
        console.log(`   🔗 Updated signatureImageUrl in ${deptSigUpdates.count} departments.`);
        dbUpdatesCount += deptSigUpdates.count;
      }

      // 2. Department leftSignatureImageUrl
      const deptLeftSigUpdates = await prisma.department.updateMany({
        where: { leftSignatureImageUrl: localUrlPattern1 },
        data: { leftSignatureImageUrl: secureUrl },
      });
      if (deptLeftSigUpdates.count > 0) {
        console.log(`   🔗 Updated leftSignatureImageUrl in ${deptLeftSigUpdates.count} departments.`);
        dbUpdatesCount += deptLeftSigUpdates.count;
      }

      // 3. Lab logo
      const labUpdates = await prisma.lab.updateMany({
        where: { logo: localUrlPattern1 },
        data: { logo: secureUrl },
      });
      if (labUpdates.count > 0) {
        console.log(`   🔗 Updated logo in ${labUpdates.count} labs.`);
        dbUpdatesCount += labUpdates.count;
      }

      // 4. Patient photoUrl
      const patientUpdates = await prisma.patient.updateMany({
        where: { photoUrl: localUrlPattern1 },
        data: { photoUrl: secureUrl },
      });
      if (patientUpdates.count > 0) {
        console.log(`   🔗 Updated photoUrl in ${patientUpdates.count} patients.`);
        dbUpdatesCount += patientUpdates.count;
      }

    } catch (uploadError) {
      console.error(`❌ Failed to upload or update ${filename}:`, uploadError);
    }
  }

  console.log('\n======================================');
  console.log('🎉 Migration Completed.');
  console.log(`Files successfully migrated: ${successCount}`);
  console.log(`Database records updated: ${dbUpdatesCount}`);
  console.log('======================================');
}

main()
  .catch(e => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
