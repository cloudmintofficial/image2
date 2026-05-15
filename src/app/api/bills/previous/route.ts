import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Parse query parameters
    const billNo = searchParams.get("billNo");
    const orderName = searchParams.get("orderName");
    const patientName = searchParams.get("patientName");
    const umr = searchParams.get("umr");
    const phone = searchParams.get("phone");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const cancelled = searchParams.get("cancelled") === 'true';

    // Build the where clause
    const whereClause: any = {};
    
    if (billNo) {
      whereClause.billNumber = parseInt(billNo);
    }
    
    if (cancelled) {
      whereClause.status = 'Cancelled';
    } else {
      // By default, just exclude cancelled or show all if specifically requested
      // For previous bills, we generally want to see everything
    }

    if (fromDate || toDate) {
      whereClause.createdAt = {};
      if (fromDate) {
        // Start of day
        whereClause.createdAt.gte = new Date(new Date(fromDate).setHours(0, 0, 0, 0));
      }
      if (toDate) {
        // End of day
        whereClause.createdAt.lte = new Date(new Date(toDate).setHours(23, 59, 59, 999));
      }
    }

    if (patientName || umr || phone) {
      whereClause.patient = {
        ...(patientName && { name: { contains: patientName, mode: 'insensitive' } }),
        ...(umr && { umr: { contains: umr, mode: 'insensitive' } }),
        ...(phone && { phone: { contains: phone } }),
      };
    }

    if (orderName) {
      whereClause.orders = {
        some: {
          orderName: { contains: orderName, mode: 'insensitive' }
        }
      };
    }

    // Fetch the data
    const bills = await prisma.bill.findMany({
      where: whereClause,
      include: {
        patient: true,
        orders: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to 100 for performance, ideally we add pagination
    });

    // Format the response to match the UI expectations
    const formattedBills = bills.map(bill => ({
      id: bill.id,
      billNo: bill.billNumber,
      date: bill.createdAt.toISOString(),
      patient: bill.patient?.name || 'Unknown',
      patientDetails: `${bill.patient?.age || ''} / ${bill.patient?.gender || ''} / ${bill.patient?.phone || ''}`,
      orders: bill.orders.map(item => item.orderName).join(', '),
      status: bill.status
    }));

    return NextResponse.json(formattedBills);
  } catch (error) {
    console.error("Error fetching previous bills:", error);
    return NextResponse.json({ error: "Failed to fetch previous bills" }, { status: 500 });
  }
}
