import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const signatures = await prisma.doctorSignature.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(signatures);
  } catch (error) {
    console.error('Failed to fetch doctor signatures:', error);
    return NextResponse.json({ error: 'Failed to fetch doctor signatures' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const { id, name, title, label, signText, imageData, status } = data;

    if (!id || !name || !title || !label) {
      return NextResponse.json({ error: 'ID, Name, Title, and Label are required' }, { status: 400 });
    }

    // Check for duplicate ID
    const duplicate = await prisma.doctorSignature.findUnique({
      where: { id: id.trim() }
    });

    if (duplicate) {
      return NextResponse.json({ error: 'A doctor signature with this ID already exists' }, { status: 409 });
    }

    const signature = await prisma.doctorSignature.create({
      data: {
        id: id.trim(),
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
    console.error('Failed to create doctor signature:', error);
    return NextResponse.json({ error: 'Failed to create doctor signature' }, { status: 500 });
  }
}
