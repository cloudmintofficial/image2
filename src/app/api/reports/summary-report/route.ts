import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fromDateStr = searchParams.get("fromDate");
    const toDateStr = searchParams.get("toDate");

    let fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);

    let toDate = new Date();
    toDate.setHours(23, 59, 59, 999);

    if (fromDateStr) {
      fromDate = new Date(fromDateStr);
      fromDate.setHours(0, 0, 0, 0);
    }
    
    if (toDateStr) {
      toDate = new Date(toDateStr);
      toDate.setHours(23, 59, 59, 999);
    }

    const bills = await prisma.bill.findMany({
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate
        },
        status: {
          not: 'Cancelled'
        }
      },
      select: {
        totalBill: true,
        discount: true,
        paidAmount: true,
        balance: true,
        createdAt: true
      }
    });

    let totalBilled = 0;
    let totalDiscount = 0;
    let totalPaid = 0;
    let totalBalance = 0;

    bills.forEach(b => {
      totalBilled += b.totalBill;
      totalDiscount += b.discount;
      totalPaid += b.paidAmount;
      totalBalance += b.balance;
    });

    return NextResponse.json({
      billCount: bills.length,
      totalBilled,
      totalDiscount,
      totalPaid,
      totalBalance,
      netAmount: totalBilled - totalDiscount
    });
  } catch (error) {
    console.error('Error generating summary report:', error);
    return NextResponse.json({ error: 'Failed to generate summary report' }, { status: 500 });
  }
}
