import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderName = searchParams.get('orderName');
    const patientName = searchParams.get('patientName');
    const primaryPhone = searchParams.get('primaryPhone');
    const umrCard = searchParams.get('umrCard');
    const fromBillNo = searchParams.get('fromBillNo');
    const toBillNo = searchParams.get('toBillNo');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const externalId = searchParams.get('externalId');

    let whereClause: any = {
      status: 'InProcess',
    };

    if (fromBillNo || toBillNo) {
      whereClause.billNumber = {};
      if (fromBillNo && !isNaN(parseInt(fromBillNo))) whereClause.billNumber.gte = parseInt(fromBillNo);
      if (toBillNo && !isNaN(parseInt(toBillNo))) whereClause.billNumber.lte = parseInt(toBillNo);
    }

    if (fromDate || toDate) {
      whereClause.billDate = {};
      if (fromDate) whereClause.billDate.gte = new Date(fromDate);
      if (toDate) whereClause.billDate.lte = new Date(toDate + 'T23:59:59.999Z');
    }

    if (patientName || primaryPhone || umrCard || externalId) {
      whereClause.patient = {};
      if (patientName) whereClause.patient.name = { contains: patientName };
      if (primaryPhone) whereClause.patient.phone = { contains: primaryPhone };
      if (umrCard) whereClause.patient.umr = { contains: umrCard };
      if (externalId) whereClause.patient.externalId = { contains: externalId };
    }

    if (orderName) {
      whereClause.orders = {
        some: {
          orderName: { contains: orderName }
        }
      };
    }

    const bills = await prisma.bill.findMany({
      where: whereClause,
      include: {
        patient: true,
        orders: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(bills);
  } catch (error) {
    console.error('Error fetching in-process bills:', error);
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }
}
