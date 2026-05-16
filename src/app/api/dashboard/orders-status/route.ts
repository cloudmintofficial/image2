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

    // Group order items by resultStatus
    const ordersByStatus = await prisma.orderItem.groupBy({
      by: ['resultStatus'],
      _count: {
        id: true,
      },
    });

    const totalOrders = await prisma.orderItem.count();

    const formattedStats = {
      total: totalOrders,
      pending: ordersByStatus.find(o => o.resultStatus === 'Pending')?._count.id || 0,
      saved: ordersByStatus.find(o => o.resultStatus === 'Saved')?._count.id || 0,
      completed: ordersByStatus.find(o => o.resultStatus === 'Completed')?._count.id || 0,
      authorized: ordersByStatus.find(o => o.resultStatus === 'Authorized')?._count.id || 0,
      dispatched: ordersByStatus.find(o => o.resultStatus === 'Dispatched')?._count.id || 0,
      cancelled: ordersByStatus.find(o => o.resultStatus === 'Cancelled')?._count.id || 0,
    };

    return NextResponse.json(formattedStats);
  } catch (error) {
    console.error('Error fetching orders status stats:', error);
    return NextResponse.json({ error: 'Failed to fetch orders status stats' }, { status: 500 });
  }
}
