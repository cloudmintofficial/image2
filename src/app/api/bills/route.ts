import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      patientId, 
      doctorId, 
      doctorName, 
      totalBill, 
      discount, 
      discountReason, 
      paidAmount, 
      balance, 
      paymentType, 
      referenceNumber, 
      orders, 
      createdBy, 
      labId 
    } = body;

    // Basic Validation
    if (!patientId || !orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ error: 'Patient and at least one order are required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      let finalDoctorId = doctorId ? parseInt(doctorId.toString()) : null;
      
      if (!finalDoctorId && doctorName) {
        const matched = await tx.doctor.findFirst({
          where: { name: { equals: doctorName.trim(), mode: 'insensitive' } }
        });
        if (matched) finalDoctorId = matched.id;
      }

      // Generate Bill Number atomically within transaction
      const lastBill = await tx.bill.findFirst({
        orderBy: { billNumber: 'desc' },
        select: { billNumber: true }
      });
      const nextBillNumber = lastBill ? lastBill.billNumber + 1 : 1000;

      // Create bill with related orders and payments
      return await tx.bill.create({
        data: {
          billNumber: nextBillNumber,
          patientId: parseInt(patientId.toString()),
          doctorId: finalDoctorId,
          totalBill: parseFloat(totalBill?.toString() || '0'),
          discount: parseFloat(discount?.toString() || '0'),
          discountReason,
          paidAmount: parseFloat(paidAmount?.toString() || '0'),
          balance: parseFloat(balance?.toString() || '0'),
          status: 'InProcess',
          createdBy: parseInt(createdBy?.toString() || '1'),
          labId: parseInt(labId?.toString() || '1'),
          orders: {
            create: orders.map((o: any) => ({
              orderName: o.name,
              amount: parseFloat(o.amount?.toString() || '0'),
              resultStatus: 'Pending'
            }))
          },
          payments: {
            create: [{
              amount: parseFloat(paidAmount?.toString() || '0'),
              method: paymentType || 'Cash',
              reference: referenceNumber || null,
              userId: parseInt(createdBy?.toString() || '1')
            }]
          }
        },
        include: {
          patient: true,
          orders: true
        }
      });
    });
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error creating bill:', error);
    return NextResponse.json({ 
      error: 'Failed to create bill', 
      details: error.message || 'Unknown error' 
    }, { status: 500 });
  }
}
