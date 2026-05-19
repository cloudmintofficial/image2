import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { deleteCloudinaryFileByUrl } from '@/lib/cloudinary-delete';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const id = resolvedParams.id;

    const data = await req.json();
    const { name, title, label, signText, imageData, status } = data;

    if (!name || !title || !label) {
      return NextResponse.json({ error: 'Name, Title, and Label are required' }, { status: 400 });
    }

    const existingSig = await prisma.doctorSignature.findUnique({
      where: { id }
    });

    if (!existingSig) {
      return NextResponse.json({ error: 'Doctor signature not found' }, { status: 404 });
    }

    // Clean up old Cloudinary image if it was replaced or removed
    if (imageData !== undefined && imageData !== existingSig.imageData) {
      await deleteCloudinaryFileByUrl(existingSig.imageData);
    }

    const signature = await prisma.doctorSignature.update({
      where: { id },
      data: {
        name: name.trim(),
        title: title.trim(),
        label: label.trim(),
        signText: signText || null,
        imageData: imageData || null,
        status: status || 'Active'
      }
    });

    return NextResponse.json(signature);
  } catch (error) {
    console.error('Failed to update doctor signature:', error);
    return NextResponse.json({ error: 'Failed to update doctor signature' }, { status: 500 });
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

    const existingSig = await prisma.doctorSignature.findUnique({
      where: { id }
    });

    if (existingSig) {
      // Clean up Cloudinary signature image
      await deleteCloudinaryFileByUrl(existingSig.imageData);
    }

    await prisma.doctorSignature.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete doctor signature:', error);
    return NextResponse.json({ error: 'Failed to delete doctor signature' }, { status: 500 });
  }
}
