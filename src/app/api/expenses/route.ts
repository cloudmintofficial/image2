import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { expenseDate: 'desc' },
      take: 50
    });
    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description, amount, category, createdBy = 1 } = body;

    const expense = await prisma.expense.create({
      data: {
        description,
        amount: parseFloat(amount),
        category,
        createdBy,
        labId: 1 // Default to main lab
      }
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
