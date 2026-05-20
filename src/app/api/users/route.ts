import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        locationId: true,
        defaultScreen: true,
        location: {
          select: {
            id: true,
            name: true
          }
        },
        createdAt: true
      },
      orderBy: { username: 'asc' }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Restrict creating users to Owner
    const currentUserRole = (session.user as any)?.role;
    if (currentUserRole !== 'Owner') {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const data = await req.json();
    if (!data.username || !data.username.trim() || !data.password || !data.password.trim() || !data.displayName || !data.displayName.trim() || !data.role) {
      return NextResponse.json({ error: 'Username, password, display name, and role are required' }, { status: 400 });
    }

    const uName = data.username.trim();
    const uRole = data.role;
    const uStatus = data.status ?? 'Active';

    // Validate role
    const allowedRoles = ['Owner', 'Reception', 'LabEntry'];
    if (!allowedRoles.includes(uRole)) {
      return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
    }

    // Validate status
    const allowedStatus = ['Active', 'InActive'];
    if (!allowedStatus.includes(uStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
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
    const existing = await prisma.user.findFirst({
      where: { username: { equals: uName, mode: 'insensitive' } }
    });

    if (existing) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
    }

    // Default lab ID to the first lab in the database
    let labId = data.labId;
    if (!labId) {
      const firstLab = await prisma.lab.findFirst();
      if (firstLab) {
        labId = firstLab.id;
      } else {
        return NextResponse.json({ error: 'No active Lab configuration found' }, { status: 500 });
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        username: uName,
        displayName: data.displayName.trim(),
        role: uRole,
        status: uStatus,
        passwordHash,
        labId,
        locationId: parsedLocationId,
        defaultScreen: data.defaultScreen || 'Order Entry'
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        locationId: true,
        defaultScreen: true,
        createdAt: true
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
