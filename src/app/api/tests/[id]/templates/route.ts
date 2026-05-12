import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tests/[id]/templates - Fetch templates for a test
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const testId = parseInt(id);
  if (isNaN(testId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const templates = await prisma.orderDetailTemplate.findMany({
      where: { testId },
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST /api/tests/[id]/templates - Create a new template
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const testId = parseInt(id);
  if (isNaN(testId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const body = await request.json();
    const { templateName, status, fromAge, toAge, fromAgeDays, toAgeDays, gender } = body;

    if (!templateName) {
      return NextResponse.json({ error: 'Template Name is required' }, { status: 400 });
    }

    const safeInt = (val: any) => {
      if (!val) return null;
      const parsed = parseInt(val);
      return isNaN(parsed) ? null : parsed;
    };

    const template = await prisma.orderDetailTemplate.create({
      data: {
        testId,
        templateName,
        status: status || 'Active',
        fromAge: safeInt(fromAge),
        toAge: safeInt(toAge),
        fromAgeDays: safeInt(fromAgeDays),
        toAgeDays: safeInt(toAgeDays),
        gender: gender || 'Both'
      }
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
