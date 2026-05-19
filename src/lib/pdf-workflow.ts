import puppeteer from 'puppeteer';
import cloudinary from './cloudinary';
import { prisma } from './prisma';

interface PDFWorkflowOptions {
  htmlContent: string;
  reportId: string;
  patientId: string;
  uploadedBy?: string;
}

/**
 * Generates a PDF from HTML content, uploads it to Cloudinary,
 * saves the record in the database, and returns the public details.
 */
export async function generateAndUploadReportPDF({
  htmlContent,
  reportId,
  patientId,
  uploadedBy = 'System',
}: PDFWorkflowOptions) {
  let browser = null;
  try {
    // 1. Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    
    // Set content and wait for loaded states
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    // Generate PDF buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    // 2. Upload PDF Buffer to Cloudinary
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const publicId = `REP_${reportId}_PAT_${patientId}_${uniqueSuffix}`;
    const folder = 'lab-management/reports';

    const cloudinaryResponse: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: publicId,
          resource_type: 'raw', // PDFs must be raw
          access_mode: 'public',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(pdfBuffer);
    });

    // 3. Save to database
    const dbRecord = await (prisma as any).cloudinaryFile.create({
      data: {
        publicId: cloudinaryResponse.public_id,
        secureUrl: cloudinaryResponse.secure_url,
        originalName: `REP_${reportId}.pdf`,
        uploadedBy: uploadedBy,
      },
    });

    return {
      success: true,
      url: cloudinaryResponse.secure_url,
      publicId: cloudinaryResponse.public_id,
      record: dbRecord,
    };
  } catch (error) {
    console.error('Error generating/uploading PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
