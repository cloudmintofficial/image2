import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const locations = await prisma.location.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(locations);
  } catch (error) {
    console.error('Failed to fetch locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    if (!data.name || !data.name.trim()) {
      return NextResponse.json({ error: 'Location name is required' }, { status: 400 });
    }

    const existing = await prisma.location.findFirst({
      where: { name: { equals: data.name.trim(), mode: 'insensitive' } }
    });

    if (existing) {
      return NextResponse.json({ error: 'Location with this name already exists' }, { status: 409 });
    }

    // Default lab ID to the first lab or a generic one if not supplied
    let labId = data.labId;
    if (!labId) {
      const firstLab = await prisma.lab.findFirst();
      if (firstLab) {
        labId = firstLab.id;
      }
    }

    const status = data.status || 'Active';
    const allowedStatus = ['Active', 'InActive'];
    if (!allowedStatus.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const location = await prisma.location.create({
      data: {
        name: data.name.trim(),
        address: data.address || null,
        phone: data.phone || null,
        status: status,
        labId: labId || null
      }
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error('Failed to create location:', error);
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 });
  }
}
