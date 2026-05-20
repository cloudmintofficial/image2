import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  try {
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const all = searchParams.get('all') === 'true';
    const page = searchParams.get('page');
    const limit = searchParams.get('limit') || '50';

    const where = {
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      name: { contains: search, mode: 'insensitive' as const }
    };

    if (page) {
      let pageNum = parseInt(page) || 1;
      if (pageNum < 1) pageNum = 1;

      let limitNum = parseInt(limit) || 50;
      if (limitNum < 1) limitNum = 50;
      if (limitNum > 100) limitNum = 100; // Cap limit to protect server from massive loads

      const skip = (pageNum - 1) * limitNum;

      const [doctors, totalCount] = await Promise.all([
        prisma.doctor.findMany({
          where,
          include: { department: true },
          orderBy: { name: 'asc' },
          skip,
          take: limitNum
        }),
        prisma.doctor.count({ where })
      ]);

      const formatted = doctors.map(d => ({
        ...d,
        department: d.department?.name || null
      }));

      return NextResponse.json({
        data: formatted,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / limitNum)),
        currentPage: pageNum
      });
    }

    const doctors = await prisma.doctor.findMany({
      where,
      include: { department: true },
      orderBy: { name: 'asc' },
      ...(all ? {} : { take: 50 })
    });

    const formatted = doctors.map(d => ({
      ...d,
      department: d.department?.name || null
    }));

    return NextResponse.json(formatted);
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

    let departmentId = null;
    const deptStr = department === 'NONE' ? null : department;
    if (deptStr && deptStr.trim() !== '') {
      let dept = await prisma.department.findFirst({
        where: { name: { equals: deptStr.trim(), mode: 'insensitive' } }
      });
      if (!dept) {
        dept = await prisma.department.create({
          data: {
            name: deptStr.trim().toUpperCase(),
            status: 'Active',
            labId: 1
          }
        });
      }
      departmentId = dept.id;
    }

    const doctor = await prisma.doctor.create({
      data: {
        name,
        type: type || 'Referral',
        percentage: parsedPercentage,
        address,
        phone,
        email,
        departmentId,
        specialization,
        location,
        hospital,
        salesExecutive,
        status: status || 'Active'
      },
      include: { department: true }
    });

    return NextResponse.json({
      ...doctor,
      department: doctor.department?.name || null
    });
  } catch (error) {
    console.error('Error creating doctor:', error);
    return NextResponse.json({ error: 'Failed to create doctor' }, { status: 500 });
  }
}
