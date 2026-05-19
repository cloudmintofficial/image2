import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { deleteCloudinaryFileByUrl } from '@/lib/cloudinary-delete';

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
      return NextResponse.json({ error: 'Invalid department ID' }, { status: 400 });
    }

    const data = await req.json();
    if (!data.name || !data.name.trim()) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    // Check if another department with the same name exists
    const duplicate = await prisma.department.findFirst({
      where: { 
        name: { equals: data.name.trim(), mode: 'insensitive' },
        id: { not: id }
      }
    });

    if (duplicate) {
      return NextResponse.json({ error: 'Another department with this name already exists' }, { status: 409 });
    }

    const existingDept = await prisma.department.findUnique({ where: { id } });
    if (!existingDept) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Trigger cleanup if signatures are updated/removed
    if (data.leftSignatureImageUrl !== undefined && data.leftSignatureImageUrl !== existingDept.leftSignatureImageUrl) {
      await deleteCloudinaryFileByUrl(existingDept.leftSignatureImageUrl);
    }
    if (data.signatureImageUrl !== undefined && data.signatureImageUrl !== existingDept.signatureImageUrl) {
      await deleteCloudinaryFileByUrl(existingDept.signatureImageUrl);
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        name: data.name,
        status: data.status ?? 'Active',
        leftSignatureImageUrl: data.leftSignatureImageUrl !== undefined ? data.leftSignatureImageUrl : undefined,
        leftSignatureLabel: data.leftSignatureLabel !== undefined ? data.leftSignatureLabel : undefined,
        signatureImageUrl: data.signatureImageUrl !== undefined ? data.signatureImageUrl : undefined,
        signatureLabel: data.signatureLabel !== undefined ? data.signatureLabel : undefined,
        printIndividualPages: data.printIndividualPages !== undefined ? data.printIndividualPages : undefined,
      }
    });

    // Handle Edge Case: Cascade department name changes to string-based relations
    if (existingDept.name !== data.name) {
      await prisma.testMaster.updateMany({
        where: { department: existingDept.name },
        data: { department: data.name }
      });
      await prisma.doctor.updateMany({
        where: { department: existingDept.name },
        data: { department: data.name }
      });
    }

    return NextResponse.json(department);
  } catch (error) {
    console.error('Failed to update department:', error);
    return NextResponse.json({ error: 'Failed to update department' }, { status: 500 });
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
      return NextResponse.json({ error: 'Invalid department ID' }, { status: 400 });
    }

    const existingDept = await prisma.department.findUnique({ where: { id } });
    if (existingDept) {
      // Clean up signature files from Cloudinary
      await deleteCloudinaryFileByUrl(existingDept.leftSignatureImageUrl);
      await deleteCloudinaryFileByUrl(existingDept.signatureImageUrl);

      // Cascade deletion: update referencing tests and doctors
      await prisma.testMaster.updateMany({
        where: { department: existingDept.name },
        data: { department: null }
      });
      await prisma.doctor.updateMany({
        where: { department: existingDept.name },
        data: { department: null }
      });
    }

    await prisma.department.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete department:', error);
    return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 });
  }
}
