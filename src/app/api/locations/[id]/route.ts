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
      return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 });
    }

    const data = await req.json();
    if (!data.name || !data.name.trim()) {
      return NextResponse.json({ error: 'Location name is required' }, { status: 400 });
    }

    const duplicate = await prisma.location.findFirst({
      where: {
        name: { equals: data.name.trim(), mode: 'insensitive' },
        id: { not: id }
      }
    });

    if (duplicate) {
      return NextResponse.json({ error: 'Another location with this name already exists' }, { status: 409 });
    }

    const existing = await prisma.location.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    if (data.status !== undefined) {
      const allowedStatus = ['Active', 'InActive'];
      if (!allowedStatus.includes(data.status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }
    }

    const location = await prisma.location.update({
      where: { id },
      data: {
        name: data.name.trim(),
        address: data.address !== undefined ? data.address : undefined,
        phone: data.phone !== undefined ? data.phone : undefined,
        status: data.status !== undefined ? data.status : undefined,
      }
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error('Failed to update location:', error);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
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
      return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 });
    }

    // Set locationId to null for all users referencing this location
    await prisma.user.updateMany({
      where: { locationId: id },
      data: { locationId: null }
    });

    await prisma.location.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete location:', error);
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 });
  }
}
