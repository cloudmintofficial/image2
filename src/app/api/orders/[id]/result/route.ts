import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await context.params;
    const id = parseInt(idStr);
    const body = await request.json();
    const { resultData, resultStatus = 'Entered', resultMethod, resultDoctor, resultNotes, resultAdvice, signatureId } = body;

    // Update the specific order item
    const updatedOrder = await prisma.orderItem.update({
      where: { id },
      data: {
        resultData,
        resultStatus,
        resultMethod,
        resultDoctor,
        resultNotes,
        resultAdvice,
        signatureId
      }
    });

    // Check if all orders for this bill are completed
    const allOrders = await prisma.orderItem.findMany({
      where: { billId: updatedOrder.billId }
    });

    const allCompleted = allOrders.length > 0 && allOrders.every(o => o.resultStatus === 'Completed' || o.resultStatus === 'Verified');

    // Determine if all orders are completed for UI purposes, but DO NOT auto-update the Bill status.
    // The Bill must stay in 'InProcess' so the lab tech can Authorize and Dispatch it manually.
    if (allCompleted) {
      // Do nothing to the Bill status. It remains 'InProcess'.
    }

    return NextResponse.json({ success: true, allCompleted, updatedOrder });
  } catch (error) {
    console.error('Error saving result:', error);
    return NextResponse.json({ error: 'Failed to save result' }, { status: 500 });
  }
}
