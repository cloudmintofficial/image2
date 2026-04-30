import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid bill ID' }, { status: 400 });
    }

    const data = await request.json();
    const { name, age, gender, source, phone, doctorId, doctorName } = data;

    // Get the bill to find the patient ID
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: { patient: true }
    });

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // Update Patient and Bill in a transaction
    await prisma.$transaction(async (tx) => {
      // Update patient details
      await tx.patient.update({
        where: { id: bill.patientId },
        data: {
          name: name !== undefined ? name : bill.patient.name,
          age: age !== undefined ? (age ? parseInt(age) : null) : bill.patient.age,
          gender: gender !== undefined ? gender : bill.patient.gender,
          source: source !== undefined ? source : bill.patient.source,
          phone: phone !== undefined ? phone : bill.patient.phone,
        }
      });

      // Update doctor on the bill
      let finalDoctorId = doctorId ? parseInt(doctorId) : null;
      
      if (!finalDoctorId && doctorName) {
        // User typed a name but didn't click the suggestion, try to auto-resolve case-insensitively
        const allDocs = await tx.doctor.findMany();
        const matched = allDocs.find(d => d.name.toLowerCase().trim() === doctorName.toLowerCase().trim());
        if (matched) finalDoctorId = matched.id;
      }

      if (finalDoctorId !== null || doctorId === '' || doctorName === '') {
        await tx.bill.update({
          where: { id },
          data: {
            doctorId: finalDoctorId
          }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating patient details:', error);
    return NextResponse.json({ error: 'Failed to update patient details' }, { status: 500 });
  }
}
