import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  try {
    const doctors = await prisma.doctor.findMany({
      where: {
        status: 'Active',
        name: { contains: search }
      },
      take: 10
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

    const doctor = await prisma.doctor.create({
      data: {
        name,
        type: type || 'Referral',
        percentage: percentage !== '' && percentage !== null && percentage !== undefined ? parseFloat(percentage) : null,
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
