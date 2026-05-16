import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await context.params;
    const id = parseInt(idStr);
    const body = await request.json();
    const { authorizedBy } = body;

    // EDGE CASE FIX: Ensure the order is 'Completed' before it can be authorized.
    const order = await prisma.orderItem.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.resultStatus !== 'Completed' && order.resultStatus !== 'Verified') {
      return NextResponse.json({ error: 'Order must be Completed before it can be authorized.' }, { status: 400 });
    }

    const updatedOrder = await prisma.orderItem.update({
      where: { id },
      data: {
        resultStatus: 'Verified',
        verifiedBy: authorizedBy || 'System',
        verifiedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, updatedOrder });
  } catch (error) {
    console.error('Error authorizing order:', error);
    return NextResponse.json({ error: 'Failed to authorize order' }, { status: 500 });
  }
}
