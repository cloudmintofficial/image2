import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const signatures = await prisma.doctorSignature.findMany({
      where: { status: 'Active' }
    });
    return NextResponse.json(signatures);
  } catch (error: any) {
    console.error('Error fetching signatures:', error);
    return NextResponse.json({ error: 'Failed to fetch signatures', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, imageData } = body;
    
    if (!id || !imageData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updated = await prisma.doctorSignature.update({
      where: { id },
      data: { imageData }
    });
    
    return NextResponse.json({ success: true, signature: updated });
  } catch (error) {
    console.error('Error updating signature:', error);
    return NextResponse.json({ error: 'Failed to update signature' }, { status: 500 });
  }
}
