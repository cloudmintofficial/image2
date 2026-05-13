import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  try {
    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { umr: { contains: search, mode: 'insensitive' } }
        ]
      },
      take: 10
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.phone || !data.phone.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    let patient = await prisma.patient.create({
      data: {
        name: data.name,
        age: data.age ? parseInt(data.age) : null,
        gender: data.gender,
        phone: data.phone,
        source: data.source,
        email: data.email || data.additionalDetails?.email,
        additionalDetails: data.additionalDetails,
      }
    });

    // Auto-generate UMR
    const umr = `UMR-${patient.id.toString().padStart(6, '0')}`;
    patient = await prisma.patient.update({
      where: { id: patient.id },
      data: { umr }
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 });
  }
}
