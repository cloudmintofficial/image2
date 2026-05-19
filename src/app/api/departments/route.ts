import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(departments);
  } catch (error) {
    console.error('Failed to fetch departments:', error);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    if (!data.name || !data.name.trim()) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    const existing = await prisma.department.findFirst({
      where: { name: { equals: data.name.trim(), mode: 'insensitive' } }
    });

    if (existing) {
      return NextResponse.json({ error: 'Department with this name already exists' }, { status: 409 });
    }

    const department = await prisma.department.create({
      data: {
        name: data.name,
        status: data.status ?? 'Active',
        leftSignatureImageUrl: data.leftSignatureImageUrl || null,
        leftSignatureLabel: data.leftSignatureLabel || null,
        signatureImageUrl: data.signatureImageUrl || null,
        signatureLabel: data.signatureLabel || null,
        printIndividualPages: data.printIndividualPages ?? false,
      }
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error('Failed to create department:', error);
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
  }
}
