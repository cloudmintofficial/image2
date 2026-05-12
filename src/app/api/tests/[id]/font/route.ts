import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tests/[id]/font - Fetch order font settings
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const testId = parseInt(id);
  if (isNaN(testId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const orderFont = await prisma.orderFont.findUnique({
      where: { testId }
    });
    return NextResponse.json(orderFont || {});
  } catch (error) {
    console.error('Error fetching order font:', error);
    return NextResponse.json({ error: 'Failed to fetch order font' }, { status: 500 });
  }
}

// PUT /api/tests/[id]/font - Update or create order font settings
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const testId = parseInt(id);
  if (isNaN(testId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const body = await request.json();
    const { 
      fontFamily, patientDetailsFont, departmentNameFont, orderNameFont, 
      resultHeadingFont, subHeadingFont, componentNameFont, methodFont, 
      resultNotesFont, leftSignatureFont, rightSignatureFont, 
      spaceBeforeLineFont, spaceAfterLineFont 
    } = body;

    const data = {
      fontFamily, patientDetailsFont, departmentNameFont, orderNameFont,
      resultHeadingFont, subHeadingFont, componentNameFont, methodFont,
      resultNotesFont, leftSignatureFont, rightSignatureFont,
      spaceBeforeLineFont, spaceAfterLineFont
    };

    const orderFont = await prisma.orderFont.upsert({
      where: { testId },
      update: data,
      create: {
        testId,
        ...data
      }
    });

    return NextResponse.json(orderFont);
  } catch (error) {
    console.error('Error updating order font:', error);
    return NextResponse.json({ error: 'Failed to update order font' }, { status: 500 });
  }
}
