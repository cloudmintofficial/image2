import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const fromDateStr = searchParams.get('fromDate');
    const toDateStr = searchParams.get('toDate');
    const locationId = searchParams.get('locationId');
    const paymentType = searchParams.get('paymentType');
    const userId = searchParams.get('userId');
    const orderType = searchParams.get('orderType');
    const discountReason = searchParams.get('discountReason');
    const includeCancelled = searchParams.get('includeCancelled') === 'true';
    const reportType = searchParams.get('reportType'); // 'get-report' | 'non-financial' | 'financial' | 'cancelled' | 'refunded' | 'summary' | 'discount'

    // Timezone-neutral UTC date boundaries parser
    const parseDateUTC = (dStr: string | null, isEndOfDay: boolean) => {
      if (!dStr) return null;
      let date: Date;
      if (dStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = new Date(dStr + 'T00:00:00Z');
      } else {
        const parts = dStr.split('-');
        if (parts.length === 3) {
          const months: Record<string, number> = {
            'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
            'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
          };
          const day = parseInt(parts[0]);
          const month = months[parts[1]];
          const year = parseInt(parts[2]);
          if (month !== undefined && !isNaN(day) && !isNaN(year)) {
            const mm = month.toString().padStart(2, '0');
            const dd = day.toString().padStart(2, '0');
            date = new Date(`${year}-${mm}-${dd}T00:00:00Z`);
          } else {
            date = new Date(dStr);
          }
        } else {
          date = new Date(dStr);
        }
      }

      if (isNaN(date.getTime())) return null;

      if (isEndOfDay) {
        date.setUTCHours(23, 59, 59, 999);
      } else {
        date.setUTCHours(0, 0, 0, 0);
      }
      return date;
    };

    const fDate = parseDateUTC(fromDateStr, false);
    const tDate = parseDateUTC(toDateStr, true);

    // Build the query where clause
    let whereClause: any = {};

    if (fDate || tDate) {
      whereClause.billDate = {};
      if (fDate) {
        whereClause.billDate.gte = fDate;
      }
      if (tDate) {
        whereClause.billDate.lte = tDate;
      }
    }

    // Status filter
    if (reportType === 'cancelled') {
      whereClause.status = 'Cancelled';
    } else if (reportType === 'refunded') {
      whereClause.status = { in: ['Refunded', 'Cancelled'] };
    } else {
      if (!includeCancelled) {
        whereClause.status = { not: 'Cancelled' };
      }
    }

    // Discount filter
    if (reportType === 'discount') {
      whereClause.discount = { gt: 0 };
    }

    // User filter
    if (userId) {
      whereClause.createdBy = parseInt(userId);
    }

    // Location filter
    if (locationId) {
      whereClause.createdByUser = {
        locationId: parseInt(locationId)
      };
    }

    // Payment method filter
    if (paymentType) {
      whereClause.payments = {
        some: {
          method: paymentType
        }
      };
    }

    // Discount reason filter
    if (discountReason) {
      whereClause.discountReason = {
        contains: discountReason.trim(),
        mode: 'insensitive'
      };
    }

    // Query bills with patient, orders, payments, createdByUser, and doctor
    const bills = await prisma.bill.findMany({
      where: whereClause,
      include: {
        patient: true,
        orders: true,
        payments: true,
        createdByUser: {
          include: { location: true }
        },
        doctor: true
      },
      orderBy: { billNumber: 'asc' }
    });

    // In-memory filter for orderType if provided
    let filteredBills = bills;
    if (orderType) {
      const targetType = orderType.toLowerCase().trim();
      if (targetType === 'internal') {
        const nonInternalTests = await prisma.testMaster.findMany({
          where: {
            NOT: {
              orderType: {
                equals: 'Internal',
                mode: 'insensitive'
              }
            }
          },
          select: { testName: true }
        });
        const nonInternalNames = new Set(
          nonInternalTests.map(t => t.testName.toLowerCase().trim())
        );
        filteredBills = bills.filter(b =>
          b.orders.some(o => !nonInternalNames.has(o.orderName.toLowerCase().trim()))
        );
      } else {
        const matchingTests = await prisma.testMaster.findMany({
          where: {
            orderType: {
              equals: orderType.trim(),
              mode: 'insensitive'
            }
          },
          select: { testName: true }
        });
        const validTestNames = new Set(
          matchingTests.map(t => t.testName.toLowerCase().trim())
        );
        filteredBills = bills.filter(b =>
          b.orders.some(o => validTestNames.has(o.orderName.toLowerCase().trim()))
        );
      }
    }

    // Fetch expenses in the same date range
    let expenseWhere: any = {};
    if (fDate || tDate) {
      expenseWhere.expenseDate = {};
      if (fDate) expenseWhere.expenseDate.gte = fDate;
      if (tDate) expenseWhere.expenseDate.lte = tDate;
    }
    const expensesAgg = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: expenseWhere
    });
    const totalExpenses = expensesAgg._sum.amount || 0;

    return NextResponse.json({
      bills: filteredBills,
      totalExpenses
    });
  } catch (error: any) {
    console.error('Failed to generate bill report:', error);
    return NextResponse.json({ error: 'Failed to generate report', details: error.message }, { status: 500 });
  }
}
