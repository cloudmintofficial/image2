import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const labs = await prisma.incomingLab.findMany({
      orderBy: { labName: 'asc' }
    });
    return NextResponse.json(labs);
  } catch (error) {
    console.error('Failed to fetch incoming labs:', error);
    return NextResponse.json({ error: 'Failed to fetch incoming labs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    if (!data.labName || !data.labName.trim()) {
      return NextResponse.json({ error: 'Lab name is required' }, { status: 400 });
    }

    const existing = await prisma.incomingLab.findFirst({
      where: { labName: { equals: data.labName.trim(), mode: 'insensitive' } }
    });

    if (existing) {
      return NextResponse.json({ error: 'Lab with this name already exists' }, { status: 409 });
    }

    const status = data.status || 'Active';
    const allowedStatus = ['Active', 'InActive'];
    if (!allowedStatus.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const lab = await prisma.incomingLab.create({
      data: {
        labName: data.labName.trim(),
        labAddress: data.labAddress || null,
        contactPerson: data.contactPerson || null,
        primaryPhone: data.primaryPhone || null,
        status: status
      }
    });

    return NextResponse.json(lab);
  } catch (error) {
    console.error('Failed to create incoming lab:', error);
    return NextResponse.json({ error: 'Failed to create incoming lab' }, { status: 500 });
  }
}
