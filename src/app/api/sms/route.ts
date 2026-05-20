import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const logs = await prisma.sMSLog.findMany({
      orderBy: { sentAt: 'desc' }
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Failed to fetch SMS logs:', error);
    return NextResponse.json({ error: 'Failed to fetch SMS logs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    if (!data.phone || !data.message || !data.phone.trim() || !data.message.trim()) {
      return NextResponse.json({ error: 'Phone number and message are required' }, { status: 400 });
    }

    const log = await prisma.sMSLog.create({
      data: {
        phone: data.phone.trim(),
        message: data.message.trim(),
        status: data.status || 'Sent'
      }
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error('Failed to create SMS log:', error);
    return NextResponse.json({ error: 'Failed to create SMS log' }, { status: 500 });
  }
}
