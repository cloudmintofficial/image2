import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  try {
    let orderTypes;
    // @ts-ignore
    if (prisma.orderType) {
      orderTypes = await prisma.orderType.findMany({
        where: { status: 'Active' },
        orderBy: { name: 'asc' }
      });
    } else {
      orderTypes = await prisma.$queryRawUnsafe('SELECT * FROM "OrderType" WHERE status = \'Active\' ORDER BY name ASC');
    }
    return NextResponse.json(orderTypes);
  } catch (error: any) {
    console.error('Error fetching order types:', error);
    return NextResponse.json({ error: 'Failed to fetch order types', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    let orderType;
    // @ts-ignore
    if (prisma.orderType) {
      orderType = await prisma.orderType.create({
        data: { name: name.trim() }
      });
    } else {
      const trimmedName = name.trim();
      await prisma.$executeRawUnsafe('INSERT INTO "OrderType" (name, status) VALUES ($1, \'Active\') ON CONFLICT (name) DO NOTHING', trimmedName);
      const result: any[] = await prisma.$queryRawUnsafe('SELECT * FROM "OrderType" WHERE name = $1 LIMIT 1', trimmedName);
      orderType = result[0];
    }
    return NextResponse.json(orderType);
  } catch (error: any) {
    console.error('Error creating order type:', error);
    return NextResponse.json({ error: 'Failed to create order type', details: error.message }, { status: 500 });
  }
}
