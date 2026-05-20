import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(id) },
      include: { department: true }
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...doctor,
      department: doctor.department?.name || null
    });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    return NextResponse.json({ error: 'Failed to fetch doctor' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const body = await request.json();
    const { 
      name, type, percentage, address, phone, email, 
      department, specialization, location, hospital, salesExecutive, status 
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Doctor name is required' }, { status: 400 });
    }

    // Check for duplicate name (excluding self)
    const existing = await prisma.doctor.findFirst({
      where: { 
        name: { equals: name, mode: 'insensitive' },
        id: { not: id }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Another doctor with this name already exists' }, { status: 400 });
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

    const doctor = await prisma.doctor.update({
      where: { id },
      data: {
        name,
        type,
        percentage: parsedPercentage,
        address,
        phone,
        email,
        departmentId,
        specialization,
        location,
        hospital,
        salesExecutive,
        status
      },
      include: { department: true }
    });

    return NextResponse.json({
      ...doctor,
      department: doctor.department?.name || null
    });
  } catch (error) {
    console.error('Error updating doctor:', error);
    return NextResponse.json({ error: 'Failed to update doctor' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    
    // Check if doctor has associated bills
    const billCount = await prisma.bill.count({
      where: { doctorId: id }
    });

    if (billCount > 0) {
      // Soft delete instead of hard delete if there are records
      await prisma.doctor.update({
        where: { id },
        data: { status: 'InActive' }
      });
      return NextResponse.json({ message: 'Doctor marked as InActive due to associated records' });
    }

    await prisma.doctor.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    return NextResponse.json({ error: 'Failed to delete doctor' }, { status: 500 });
  }
}
