import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUserRole = (session.user as any)?.role;
    if (currentUserRole !== 'Owner') {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const data = await req.json();
    if (!data.username || !data.username.trim() || !data.displayName || !data.displayName.trim() || !data.role) {
      return NextResponse.json({ error: 'Username, display name, and role are required' }, { status: 400 });
    }

    const uName = data.username.trim();
    const uRole = data.role;
    const uStatus = data.status;

    // Validate role
    const allowedRoles = ['Owner', 'Reception', 'LabEntry'];
    if (!allowedRoles.includes(uRole)) {
      return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
    }

    // Validate status if provided
    if (uStatus !== undefined) {
      const allowedStatus = ['Active', 'InActive'];
      if (!allowedStatus.includes(uStatus)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
    }

    // Owner self-demotion or deactivation protection
    const currentUserId = (session.user as any)?.id;
    if (currentUserId && id.toString() === currentUserId.toString()) {
      if (uRole !== 'Owner') {
        return NextResponse.json({ error: 'You cannot demote yourself from Owner role' }, { status: 400 });
      }
      if (uStatus === 'InActive') {
        return NextResponse.json({ error: 'You cannot deactivate yourself' }, { status: 400 });
      }
    }

    // Validate location existence if locationId is provided
    let parsedLocationId = null;
    if (data.locationId) {
      parsedLocationId = parseInt(data.locationId);
      if (isNaN(parsedLocationId)) {
        return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 });
      }
      const locExists = await prisma.location.findUnique({ where: { id: parsedLocationId } });
      if (!locExists) {
        return NextResponse.json({ error: 'Referenced location not found' }, { status: 404 });
      }
    }

    // Case-insensitive username check
    const duplicate = await prisma.user.findFirst({
      where: {
        username: { equals: uName, mode: 'insensitive' },
        id: { not: id }
      }
    });

    if (duplicate) {
      return NextResponse.json({ error: 'Another user with this username already exists' }, { status: 409 });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: any = {
      username: uName,
      displayName: data.displayName.trim(),
      role: uRole,
      status: uStatus !== undefined ? uStatus : undefined,
      locationId: parsedLocationId,
      defaultScreen: data.defaultScreen !== undefined ? data.defaultScreen : undefined,
    };

    if (data.password && data.password.trim() !== '') {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        locationId: true,
        defaultScreen: true,
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUserRole = (session.user as any)?.role;
    const currentUserId = (session.user as any)?.id;
    if (currentUserRole !== 'Owner') {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    if (currentUserId && id.toString() === currentUserId.toString()) {
      return NextResponse.json({ error: 'You cannot delete yourself' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
