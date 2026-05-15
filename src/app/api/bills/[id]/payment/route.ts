import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const billId = parseInt(id);
    if (isNaN(billId)) {
      return NextResponse.json({ error: "Invalid bill ID" }, { status: 400 });
    }

    const body = await req.json();
    const { paymentAmount, discount, discountReason, paymentMethod } = body;

    const amount = parseFloat(paymentAmount) || 0;
    const disc = parseFloat(discount) || 0;

    if (amount <= 0 && disc <= 0) {
      return NextResponse.json({ error: "Payment or discount amount required" }, { status: 400 });
    }

    // Process inside a transaction
    const updatedBill = await prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findUnique({ where: { id: billId } });
      if (!bill) throw new Error("Bill not found");

      let newPaid = bill.paidAmount;
      let newDiscount = bill.discount;
      let newBalance = bill.balance;

      if (disc > 0) {
        newDiscount += disc;
        newBalance -= disc;
      }

      if (amount > 0) {
        newPaid += amount;
        newBalance -= amount;

        // Record the payment
        await tx.payment.create({
          data: {
            billId: bill.id,
            amount: amount,
            method: paymentMethod || 'Cash',
            userId: parseInt((session.user as any).id) || bill.createdBy,
          }
        });
      }

      if (newBalance < 0) newBalance = 0;

      // Update the bill
      return await tx.bill.update({
        where: { id: billId },
        data: {
          paidAmount: newPaid,
          discount: newDiscount,
          balance: newBalance,
          ...(discountReason && { discountReason })
        }
      });
    });

    return NextResponse.json(updatedBill);
  } catch (error: any) {
    console.error("Error processing payment:", error);
    return NextResponse.json({ error: error.message || "Failed to process payment" }, { status: 500 });
  }
}
