import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { patientId, doctorId, totalBill, discount, discountReason, paidAmount, balance, paymentType, orders, createdBy, labId } = data;

    // In SQLite we must manually generate billNumber if not using autoincrement
    const lastBill = await prisma.bill.findFirst({
      orderBy: { billNumber: 'desc' }
    });
    const nextBillNumber = lastBill ? lastBill.billNumber + 1 : 1000;

    const bill = await prisma.bill.create({
      data: {
        billNumber: nextBillNumber,
        patientId,
        doctorId: doctorId || null,
        totalBill,
        discount,
        discountReason,
        paidAmount,
        balance,
        status: balance <= 0 ? 'Completed' : 'InProcess',
        createdBy,
        labId,
        orders: {
          create: orders.map((o: any) => ({
            orderName: o.name,
            amount: o.amount,
            resultStatus: 'Pending'
          }))
        },
        payments: {
          create: [{
            amount: paidAmount,
            method: paymentType,
            userId: createdBy
          }]
        }
      },
      include: {
        patient: true,
        orders: true
      }
    });
    
    return NextResponse.json(bill);
  } catch (error) {
    console.error('Error creating bill:', error);
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 });
  }
}
