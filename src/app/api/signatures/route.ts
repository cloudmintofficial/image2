import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get('active') === 'true';

    const signatures = await prisma.doctorSignature.findMany({
      where: onlyActive ? { status: 'Active' } : {},
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(signatures);
  } catch (error: any) {
    console.error('Error fetching signatures:', error);
    return NextResponse.json({ error: 'Failed to fetch signatures', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, name, title, label, signText, imageData, status } = body;
    
    if (!id || !name || !title || !label) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if duplicate ID
    const existing = await prisma.doctorSignature.findUnique({
      where: { id }
    });
    if (existing) {
      return NextResponse.json({ error: 'Signature ID already exists' }, { status: 409 });
    }

    const signature = await prisma.doctorSignature.create({
      data: {
        id,
        name,
        title,
        label,
        signText: signText || null,
        imageData: imageData || null,
        status: status || 'Active'
      }
    });
    
    return NextResponse.json(signature);
  } catch (error: any) {
    console.error('Error creating signature:', error);
    return NextResponse.json({ error: 'Failed to create signature', details: error.message }, { status: 500 });
  }
}
