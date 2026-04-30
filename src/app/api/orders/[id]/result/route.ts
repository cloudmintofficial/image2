import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await request.json();
    const { resultData, resultStatus = 'Entered', resultMethod, resultDoctor, resultAdvice } = body;

    // Update the specific order item
    const updatedOrder = await prisma.orderItem.update({
      where: { id },
      data: {
        resultData,
        resultStatus,
        resultMethod,
        resultDoctor,
        resultAdvice
      }
    });

    // Check if all orders for this bill are completed
    const allOrders = await prisma.orderItem.findMany({
      where: { billId: updatedOrder.billId }
    });

    const allCompleted = allOrders.every(o => o.resultStatus === 'Entered' || o.resultStatus === 'Verified');

    if (allCompleted) {
      await prisma.bill.update({
        where: { id: updatedOrder.billId },
        data: { status: 'Completed' }
      });
    }

    return NextResponse.json({ success: true, allCompleted, updatedOrder });
  } catch (error) {
    console.error('Error saving result:', error);
    return NextResponse.json({ error: 'Failed to save result' }, { status: 500 });
  }
}
