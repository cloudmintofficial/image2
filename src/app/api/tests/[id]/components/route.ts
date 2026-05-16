import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tests/[id]/components - Fetch components for a test
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const testId = parseInt(id);
  if (isNaN(testId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const templateIdParam = searchParams.get('templateId');
  const templateId = templateIdParam ? parseInt(templateIdParam) : null;

  try {
    const components = await prisma.testComponent.findMany({
      where: { 
        testId,
        templateId
      },
      orderBy: { sortOrder: 'asc' }
    });
    return NextResponse.json(components);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch components' }, { status: 500 });
  }
}

// POST /api/tests/[id]/components - Create a new component
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const testId = parseInt(id);
  if (isNaN(testId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const body = await request.json();
    const { 
      templateId, componentName, subHeading, machineCode, specimenCode, unit, 
      normalRange, fromRange, toRange, minMale, maxMale, minFemale, 
      maxFemale, method, defaultValue, calculations, status, sortOrder, 
      fieldType, options 
    } = body;

    if (!componentName) {
      return NextResponse.json({ error: 'Component Name is required' }, { status: 400 });
    }

    const safeFloat = (val: any) => {
      if (!val) return null;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    };

    const component = await prisma.testComponent.create({
      data: {
        testId,
        templateId: templateId ? parseInt(templateId) : null,
        componentName,
        subHeading,
        machineCode,
        specimenCode,
        unit,
        normalRange,
        fromRange,
        toRange,
        minMale: safeFloat(minMale),
        maxMale: safeFloat(maxMale),
        minFemale: safeFloat(minFemale),
        maxFemale: safeFloat(maxFemale),
        method,
        defaultValue,
        calculations,
        status: status || 'Active',
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
        fieldType: fieldType || 'number',
        options
      }
    });

    return NextResponse.json(component);
  } catch (error) {
    console.error('Error creating component:', error);
    return NextResponse.json({ error: 'Failed to create component' }, { status: 500 });
  }
}

// PATCH /api/tests/[id]/components - Reorder components
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const testId = parseInt(id);
  if (isNaN(testId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const { reorderedList } = await request.json();
    
    if (!Array.isArray(reorderedList)) {
      return NextResponse.json({ error: 'reorderedList must be an array' }, { status: 400 });
    }

    // Update each component's sortOrder in a transaction
    await prisma.$transaction(
      reorderedList.map((item: { id: number; sortOrder: number }) =>
        prisma.testComponent.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering components:', error);
    return NextResponse.json({ error: 'Failed to reorder components' }, { status: 500 });
  }
}
