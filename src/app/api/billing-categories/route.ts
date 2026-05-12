import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  try {
    let categories;
    // @ts-ignore
    if (prisma.iPBillingCategory) {
      categories = await prisma.iPBillingCategory.findMany({
        where: { status: 'Active' },
        orderBy: { name: 'asc' }
      });
    } else {
      categories = await prisma.$queryRawUnsafe('SELECT * FROM "IPBillingCategory" WHERE status = \'Active\' ORDER BY name ASC');
    }
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('Error fetching billing categories:', error);
    return NextResponse.json({ error: 'Failed to fetch billing categories', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    let category;
    // @ts-ignore
    if (prisma.iPBillingCategory) {
      category = await prisma.iPBillingCategory.create({
        data: { name: name.trim() }
      });
    } else {
      const trimmedName = name.trim();
      await prisma.$executeRawUnsafe('INSERT INTO "IPBillingCategory" (name, status) VALUES ($1, \'Active\') ON CONFLICT (name) DO NOTHING', trimmedName);
      const result: any[] = await prisma.$queryRawUnsafe('SELECT * FROM "IPBillingCategory" WHERE name = $1 LIMIT 1', trimmedName);
      category = result[0];
    }
    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Error creating billing category:', error);
    return NextResponse.json({ error: 'Failed to create billing category', details: error.message }, { status: 500 });
  }
}
