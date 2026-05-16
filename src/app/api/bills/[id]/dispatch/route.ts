import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await context.params;
    const id = parseInt(idStr);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await request.json();

    // EDGE CASE FIX: Ensure all orders are 'Verified' before allowing the bill to be dispatched.
    const orders = await prisma.orderItem.findMany({ where: { billId: id } });
    if (orders.length === 0) {
      return NextResponse.json({ error: 'Cannot dispatch a bill with no orders.' }, { status: 400 });
    }
    const allVerified = orders.every(o => o.resultStatus === 'Verified');
    if (!allVerified) {
      return NextResponse.json({ error: 'All orders must be Verified before dispatching.' }, { status: 400 });
    }

    const updatedBill = await prisma.bill.update({
      where: { id },
      data: {
        status: 'Completed',
      }
    });

    return NextResponse.json(updatedBill);
  } catch (error) {
    console.error('Error dispatching bill:', error);
    return NextResponse.json({ error: 'Failed to dispatch bill' }, { status: 500 });
  }
}
