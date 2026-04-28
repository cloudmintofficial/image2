import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const totalUsers = await prisma.user.count();
    const totalBills = await prisma.bill.count();
    const cancelledBills = await prisma.bill.count({ where: { status: 'Cancelled' } });
    const refundedBills = await prisma.bill.count({ where: { status: 'Refunded' } });

    const totalBilledAgg = await prisma.bill.aggregate({
      _sum: { totalBill: true }
    });
    
    const cancelledAgg = await prisma.bill.aggregate({
      _sum: { totalBill: true },
      where: { status: 'Cancelled' }
    });

    const refundedAgg = await prisma.bill.aggregate({
      _sum: { totalBill: true },
      where: { status: 'Refunded' }
    });

    return NextResponse.json({
      users: totalUsers,
      bills: totalBills,
      cancelledBills,
      refundedBills,
      totalBilled: totalBilledAgg._sum.totalBill || 0,
      totalCancelled: cancelledAgg._sum.totalBill || 0,
      totalRefunded: refundedAgg._sum.totalBill || 0,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
