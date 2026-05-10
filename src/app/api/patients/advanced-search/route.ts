import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, umr, phone, ageRange, gender, doctor, source } = data;

    const whereClause: any = {};

    if (name) whereClause.name = { contains: name, mode: 'insensitive' };
    if (umr) whereClause.umr = { contains: umr, mode: 'insensitive' };
    if (phone) whereClause.phone = { contains: phone, mode: 'insensitive' };
    if (gender) whereClause.gender = gender;
    if (source) whereClause.source = { contains: source, mode: 'insensitive' };
    
    // Note: ageRange and doctor would need to be handled according to schema structure
    // Since doctor is handled as additionalDetails string or specific relation, we'll keep it simple

    const patients = await prisma.patient.findMany({
      where: whereClause,
      take: 20,
      orderBy: { id: 'desc' }
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error in advanced search:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
