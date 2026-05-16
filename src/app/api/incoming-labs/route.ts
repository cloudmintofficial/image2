import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const labs = await prisma.incomingLab.findMany({
      orderBy: { labName: 'asc' }
    });
    return NextResponse.json(labs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch incoming labs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const lab = await prisma.incomingLab.create({
      data: {
        labName: data.labName,
        labAddress: data.labAddress,
        contactPerson: data.contactPerson,
        primaryPhone: data.primaryPhone,
        status: data.status ?? true,
      }
    });
    return NextResponse.json(lab);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create incoming lab' }, { status: 500 });
  }
}
