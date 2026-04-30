import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await request.json();

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
