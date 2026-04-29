import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
    }

    const data = await request.json();

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.age !== undefined) updateData.age = data.age ? parseInt(data.age) : null;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.additionalDetails !== undefined) updateData.additionalDetails = data.additionalDetails;

    const patient = await prisma.patient.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 });
  }
}
