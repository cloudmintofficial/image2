import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid lab ID' }, { status: 400 });
    }

    const data = await req.json();
    if (!data.labName || !data.labName.trim()) {
      return NextResponse.json({ error: 'Lab name is required' }, { status: 400 });
    }

    const duplicate = await prisma.incomingLab.findFirst({
      where: {
        labName: { equals: data.labName.trim(), mode: 'insensitive' },
        id: { not: id }
      }
    });

    if (duplicate) {
      return NextResponse.json({ error: 'Another lab with this name already exists' }, { status: 409 });
    }

    const existing = await prisma.incomingLab.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Incoming lab not found' }, { status: 404 });
    }

    if (data.status !== undefined) {
      const allowedStatus = ['Active', 'InActive'];
      if (!allowedStatus.includes(data.status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }
    }

    const lab = await prisma.incomingLab.update({
      where: { id },
      data: {
        labName: data.labName.trim(),
        labAddress: data.labAddress !== undefined ? data.labAddress : undefined,
        contactPerson: data.contactPerson !== undefined ? data.contactPerson : undefined,
        primaryPhone: data.primaryPhone !== undefined ? data.primaryPhone : undefined,
        status: data.status !== undefined ? data.status : undefined,
      }
    });

    return NextResponse.json(lab);
  } catch (error) {
    console.error('Failed to update incoming lab:', error);
    return NextResponse.json({ error: 'Failed to update incoming lab' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid lab ID' }, { status: 400 });
    }

    await prisma.incomingLab.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete incoming lab:', error);
    return NextResponse.json({ error: 'Failed to delete incoming lab' }, { status: 500 });
  }
}
