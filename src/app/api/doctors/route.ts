import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  try {
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const all = searchParams.get('all') === 'true';

    const doctors = await prisma.doctor.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(type ? { type } : {}),
        name: { contains: search, mode: 'insensitive' }
      },
      orderBy: { name: 'asc' },
      ...(all ? {} : { take: 50 })
    });

    return NextResponse.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      name, type, percentage, address, phone, email, 
      department, specialization, location, hospital, salesExecutive, status 
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Doctor name is required' }, { status: 400 });
    }

    // Check for duplicate name
    const existing = await prisma.doctor.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });

    if (existing) {
      return NextResponse.json({ error: 'A doctor with this name already exists' }, { status: 400 });
    }

    let parsedPercentage = null;
    if (percentage !== '' && percentage !== null && percentage !== undefined) {
      parsedPercentage = parseFloat(percentage);
      if (isNaN(parsedPercentage) || parsedPercentage < 0 || parsedPercentage > 100) {
        return NextResponse.json({ error: 'Percentage must be between 0 and 100' }, { status: 400 });
      }
    }

    const doctor = await prisma.doctor.create({
      data: {
        name,
        type: type || 'Referral',
        percentage: parsedPercentage,
        address,
        phone,
        email,
        department,
        specialization,
        location,
        hospital,
        salesExecutive,
        status: status || 'Active'
      }
    });

    return NextResponse.json(doctor);
  } catch (error) {
    console.error('Error creating doctor:', error);
    return NextResponse.json({ error: 'Failed to create doctor' }, { status: 500 });
  }
}
