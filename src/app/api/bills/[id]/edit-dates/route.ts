import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await context.params;
    const id = parseInt(idStr);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await request.json();
    const { editDate, editTime } = body;

    if (!editDate) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    let billDate = new Date(editDate);
    if (isNaN(billDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    if (editTime) {
      const isPM = editTime.toLowerCase().includes('pm');
      const isAM = editTime.toLowerCase().includes('am');
      const timeStr = editTime.replace(/am|pm/i, '').trim();
      
      const [hoursStr, minutesStr] = timeStr.split(':');
      let hours = parseInt(hoursStr);
      if (isNaN(hours)) hours = 0;
      
      const minutes = parseInt(minutesStr || '0');
      
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;

      billDate.setHours(hours, minutes, 0, 0);
    }

    const updatedBill = await prisma.bill.update({
      where: { id },
      data: {
        billDate,
        orders: {
          updateMany: {
            where: {},
            data: {
              createdAt: billDate,
              orderDate: billDate
            }
          }
        }
      }
    });

    return NextResponse.json(updatedBill);
  } catch (error) {
    console.error('Error updating bill dates:', error);
    return NextResponse.json({ error: 'Failed to update dates' }, { status: 500 });
  }
}
