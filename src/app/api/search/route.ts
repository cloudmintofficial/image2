import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const billNo = searchParams.get('billNo');
  const patientName = searchParams.get('patientName');
  const umr = searchParams.get('umr');
  const phone = searchParams.get('phone');

  try {
    const where: any = {};

    if (patientName) {
      where.name = { contains: patientName, mode: 'insensitive' };
    }
    if (umr) {
      where.umr = { contains: umr, mode: 'insensitive' };
    }
    if (phone) {
      where.phone = { contains: phone, mode: 'insensitive' };
    }

    if (billNo) {
      where.bills = {
        some: {
          billNumber: parseInt(billNo)
        }
      };
    }

    const patients = await prisma.patient.findMany({
      where,
      take: 20,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
