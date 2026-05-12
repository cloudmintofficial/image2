import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let sampleTypes;
    // @ts-ignore - dynamic check for model existence to bypass stale client
    if (prisma.sampleType) {
      sampleTypes = await prisma.sampleType.findMany({
        where: { status: 'Active' },
        orderBy: { name: 'asc' }
      });
    } else {
      // Fallback to raw SQL if the client hasn't been restarted/regenerated in the current process
      sampleTypes = await prisma.$queryRawUnsafe('SELECT * FROM "SampleType" WHERE status = \'Active\' ORDER BY name ASC');
    }
    return NextResponse.json(sampleTypes);
  } catch (error: any) {
    console.error('Error fetching sample types:', error);
    return NextResponse.json({ error: 'Failed to fetch sample types', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    let sampleType;
    // @ts-ignore
    if (prisma.sampleType) {
      sampleType = await prisma.sampleType.create({
        data: { name: name.trim() }
      });
    } else {
      const trimmedName = name.trim();
      await prisma.$executeRawUnsafe('INSERT INTO "SampleType" (name, status) VALUES ($1, \'Active\')', trimmedName);
      // Fetch it back to return the full object
      const result: any[] = await prisma.$queryRawUnsafe('SELECT * FROM "SampleType" WHERE name = $1 LIMIT 1', trimmedName);
      sampleType = result[0];
    }
    return NextResponse.json(sampleType);
  } catch (error: any) {
    console.error('Error creating sample type:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Sample type already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create sample type', details: error.message }, { status: 500 });
  }
}
