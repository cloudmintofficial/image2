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
      select: {
        id: true,
        umr: true,
        name: true,
        age: true,
        gender: true,
        phone: true,
        source: true,
        externalId: true,
        email: true,
        photoUrl: true,
        additionalDetails: true,
        createdAt: true
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

     // Duplicate phone check
    const existing = await prisma.patient.findUnique({
      where: { phone: data.phone }
    });
    if (existing) {
      return NextResponse.json({ error: 'Phone number already exists' }, { status: 409 });
    }

    // Validate age
    const ageNum = data.age ? parseInt(data.age) : null;
    if (ageNum !== null && (isNaN(ageNum) || ageNum < 0)) {
      return NextResponse.json({ error: 'Invalid age value' }, { status: 400 });
    }

    // Validate gender
    const allowedGenders = ['Male', 'Female', 'Other'];
    if (data.gender && !allowedGenders.includes(data.gender)) {
      return NextResponse.json({ error: 'Invalid gender' }, { status: 400 });
    }

    // Simple email format check
    const emailVal = data.email || data.additionalDetails?.email;
    if (emailVal && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailVal)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    let patient = await prisma.patient.create({
      data: {
        name: data.name,
        age: ageNum,
        gender: data.gender,
        phone: data.phone,
        source: data.source,
        email: emailVal,
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
