import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Group bills by status
    const billsByStatus = await prisma.bill.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const totalBills = await prisma.bill.count();

    const formattedStats = {
      total: totalBills,
      pending: billsByStatus.find(b => b.status === 'InProcess')?._count.id || 0,
      saved: billsByStatus.find(b => b.status === 'Saved')?._count.id || 0,
      completed: billsByStatus.find(b => b.status === 'Completed')?._count.id || 0,
      dispatched: billsByStatus.find(b => b.status === 'Dispatched')?._count.id || 0,
      cancelled: billsByStatus.find(b => b.status === 'Cancelled')?._count.id || 0,
    };

    return NextResponse.json(formattedStats);
  } catch (error) {
    console.error('Error fetching bills status stats:', error);
    return NextResponse.json({ error: 'Failed to fetch bills status stats' }, { status: 500 });
  }
}
