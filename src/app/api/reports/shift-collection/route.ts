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

    const payments = await prisma.payment.findMany({
      where: {
        paidAt: {
          gte: fromDate,
          lte: toDate
        }
      },
      include: {
        receivedBy: {
          select: { displayName: true }
        },
        bill: {
          select: {
            billNumber: true,
            patient: { select: { name: true } }
          }
        }
      },
      orderBy: { paidAt: 'desc' }
    });

    // Generate detailed report
    const detailed = payments.map(p => ({
      id: p.id,
      billNo: p.bill.billNumber,
      patient: p.bill.patient?.name || 'Unknown',
      amount: p.amount,
      method: p.method,
      receivedBy: p.receivedBy.displayName,
      date: p.paidAt
    }));

    // Generate summary report (grouped by user and method)
    const summaryMap: Record<string, any> = {};
    
    payments.forEach(p => {
      const user = p.receivedBy.displayName;
      if (!summaryMap[user]) {
        summaryMap[user] = {
          user,
          total: 0,
          methods: {}
        };
      }
      
      summaryMap[user].total += p.amount;
      
      if (!summaryMap[user].methods[p.method]) {
        summaryMap[user].methods[p.method] = 0;
      }
      summaryMap[user].methods[p.method] += p.amount;
    });

    const summary = Object.values(summaryMap);

    return NextResponse.json({ detailed, summary });
  } catch (error) {
    console.error('Error generating shift collection report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
