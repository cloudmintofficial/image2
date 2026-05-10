import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await context.params;
    const id = parseInt(idStr);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await request.json();
    const { editDate, editTime } = body;

    // Combine date and time
    let billDate = new Date();
    if (editDate && editTime) {
      // time is like '4:42pm' or '16:42'
      const datePart = new Date(editDate);
      const isPM = editTime.toLowerCase().includes('pm');
      const timeStr = editTime.replace(/am|pm/i, '').trim();
      const [hoursStr, minutesStr] = timeStr.split(':');
      let hours = parseInt(hoursStr);
      const minutes = parseInt(minutesStr || '0');

      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;

      datePart.setHours(hours, minutes, 0, 0);
      billDate = datePart;
    } else if (editDate) {
      billDate = new Date(editDate);
    }

    const updatedBill = await prisma.bill.update({
      where: { id },
      data: {
        billDate,
      }
    });

    return NextResponse.json(updatedBill);
  } catch (error) {
    console.error('Error updating bill dates:', error);
    return NextResponse.json({ error: 'Failed to update dates' }, { status: 500 });
  }
}
