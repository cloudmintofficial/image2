import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const billId = parseInt(id);
    const body = await request.json();
    const { amount, method, reference, userId } = body;

    // Validate inputs
    if (!amount || !method) {
      return NextResponse.json(
        { error: 'Amount and payment method are required' },
        { status: 400 }
      );
    }

    // Find the bill
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        payments: true,
      },
    });

    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }

    // Calculate new totals
    const newPaidAmount = bill.paidAmount + amount;
    const newBalance = Math.max(0, bill.totalBill - newPaidAmount);

    // Update bill
    const updatedBill = await prisma.bill.update({
      where: { id: billId },
      data: {
        paidAmount: newPaidAmount,
        balance: newBalance,
        status: newBalance === 0 ? 'Completed' : bill.status,
      },
      include: {
        patient: true,
        orders: true,
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        billId,
        amount,
        method,
        reference: reference || null,
        userId,
      },
    });

    return NextResponse.json(updatedBill);
  } catch (error: any) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment', details: error.message },
      { status: 500 }
    );
  }
}