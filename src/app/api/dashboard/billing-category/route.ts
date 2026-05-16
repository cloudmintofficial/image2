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

    // Since Prisma doesn't natively support grouping by a relation field easily in a single query with aggregation,
    // we fetch bills with their patient source and aggregate in memory.
    // For a production system with millions of rows, we would write a raw SQL query.
    // Given this is an MVP / Phase 2, this approach is acceptable.

    const bills = await prisma.bill.findMany({
      select: {
        totalBill: true,
        paidAmount: true,
        patient: {
          select: {
            source: true
          }
        }
      }
    });

    const categoryMap: Record<string, { billed: number; paid: number }> = {};

    bills.forEach(bill => {
      const cat = bill.patient?.source || 'None';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { billed: 0, paid: 0 };
      }
      categoryMap[cat].billed += bill.totalBill;
      categoryMap[cat].paid += bill.paidAmount;
    });

    const formattedStats = Object.keys(categoryMap).map(key => ({
      category: key,
      ...categoryMap[key]
    }));

    // Sort by billed amount descending
    formattedStats.sort((a, b) => b.billed - a.billed);

    return NextResponse.json(formattedStats);
  } catch (error) {
    console.error('Error fetching billing category stats:', error);
    return NextResponse.json({ error: 'Failed to fetch billing category stats' }, { status: 500 });
  }
}
