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
      return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 });
    }

    const data = await req.json();
    if (!data.requestType && !data.status) {
      return NextResponse.json({ error: 'Request Type or Status is required to update' }, { status: 400 });
    }

    const existing = await prisma.patientRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (data.status !== undefined) {
      const allowedStatuses = ['Pending', 'Completed', 'Cancelled'];
      if (!allowedStatuses.includes(data.status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }
    }

    const request = await prisma.patientRequest.update({
      where: { id },
      data: {
        requestType: data.requestType !== undefined ? data.requestType : undefined,
        status: data.status !== undefined ? data.status : undefined,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            umr: true
          }
        }
      }
    });

    return NextResponse.json(request);
  } catch (error) {
    console.error('Failed to update patient request:', error);
    return NextResponse.json({ error: 'Failed to update patient request' }, { status: 500 });
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
      return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 });
    }

    await prisma.patientRequest.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete patient request:', error);
    return NextResponse.json({ error: 'Failed to delete patient request' }, { status: 500 });
  }
}
