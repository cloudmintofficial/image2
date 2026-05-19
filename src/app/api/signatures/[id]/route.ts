import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!id) {
      return NextResponse.json({ error: 'Invalid signature ID' }, { status: 400 });
    }

    const data = await req.json();
    if (!data.name || !data.title || !data.label) {
      return NextResponse.json({ error: 'Name, Title, and Label are required' }, { status: 400 });
    }

    const signature = await prisma.doctorSignature.update({
      where: { id },
      data: {
        name: data.name,
        title: data.title,
        label: data.label,
        signText: data.signText !== undefined ? data.signText : undefined,
        imageData: data.imageData !== undefined ? data.imageData : undefined,
        status: data.status !== undefined ? data.status : undefined,
      }
    });

    return NextResponse.json(signature);
  } catch (error) {
    console.error('Failed to update signature:', error);
    return NextResponse.json({ error: 'Failed to update signature' }, { status: 500 });
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
    const id = resolvedParams.id;
    if (!id) {
      return NextResponse.json({ error: 'Invalid signature ID' }, { status: 400 });
    }

    await prisma.doctorSignature.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete signature:', error);
    return NextResponse.json({ error: 'Failed to delete signature' }, { status: 500 });
  }
}
