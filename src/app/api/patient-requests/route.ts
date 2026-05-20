import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const requests = await prisma.patientRequest.findMany({
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            umr: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Failed to fetch patient requests:', error);
    return NextResponse.json({ error: 'Failed to fetch patient requests' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    if (!data.patientId || !data.requestType) {
      return NextResponse.json({ error: 'Patient ID and Request Type are required' }, { status: 400 });
    }

    const patientId = parseInt(data.patientId);
    if (isNaN(patientId)) {
      return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
    }

    const patientExists = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patientExists) {
      return NextResponse.json({ error: 'Referenced patient not found' }, { status: 404 });
    }

    const status = data.status || 'Pending';
    const allowedStatuses = ['Pending', 'Completed', 'Cancelled'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const request = await prisma.patientRequest.create({
      data: {
        patientId,
        requestType: data.requestType,
        status: status
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
    console.error('Failed to create patient request:', error);
    return NextResponse.json({ error: 'Failed to create patient request' }, { status: 500 });
  }
}
