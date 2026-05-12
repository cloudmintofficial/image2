import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // @ts-ignore
    const serviceGroups = await prisma.serviceGroup.findMany({
      include: {
        tests: {
          select: {
            testName: true
          }
        }
      },
      orderBy: { groupName: 'asc' }
    });

    const formatted = serviceGroups.map((g: any) => ({
      id: g.id,
      name: g.groupName,
      amount: g.amount,
      status: g.status,
      orders: g.tests.map((t: any) => t.testName).join(', ')
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching service groups:', error);
    return NextResponse.json({ error: 'Failed to fetch service groups' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { groupName, amount, status, testIds } = data;

    // Get the first lab as a default if labId isn't provided
    const firstLab = await prisma.lab.findFirst();
    if (!firstLab) {
      return NextResponse.json({ error: 'No lab found' }, { status: 400 });
    }

    // @ts-ignore
    const newGroup = await prisma.serviceGroup.create({
      data: {
        groupName,
        amount: parseFloat(amount),
        status: status || 'Active',
        labId: firstLab.id,
        tests: {
          connect: (testIds || []).map((id: number) => ({ id }))
        }
      }
    });

    return NextResponse.json(newGroup);
  } catch (error) {
    console.error('Error creating service group:', error);
    return NextResponse.json({ error: 'Failed to create service group' }, { status: 500 });
  }
}
