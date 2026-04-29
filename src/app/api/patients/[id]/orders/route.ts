import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const patientId = parseInt(id);
    const bills = await prisma.bill.findMany({
      where: { patientId },
      include: {
        orders: true
      },
      orderBy: { billDate: 'desc' },
      take: 20
    });

    const pastOrders: any[] = [];
    bills.forEach(bill => {
      bill.orders.forEach(order => {
        pastOrders.push({
          id: order.id,
          orderName: order.orderName,
          orderDate: bill.billDate,
          amount: order.amount,
          status: order.resultStatus
        });
      });
    });

    return NextResponse.json(pastOrders);
  } catch (error) {
    console.error('Error fetching patient orders:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
