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

  try {
    const components = await prisma.testComponent.findMany({
      where: { testId },
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
      componentName, subHeading, machineCode, specimenCode, unit, 
      normalRange, fromRange, toRange, minMale, maxMale, minFemale, 
      maxFemale, method, defaultValue, calculations, status, sortOrder, 
      fieldType, options 
    } = body;

    if (!componentName) {
      return NextResponse.json({ error: 'Component Name is required' }, { status: 400 });
    }

    const component = await prisma.testComponent.create({
      data: {
        testId,
        componentName,
        subHeading,
        machineCode,
        specimenCode,
        unit,
        normalRange,
        fromRange,
        toRange,
        minMale: minMale ? parseFloat(minMale) : null,
        maxMale: maxMale ? parseFloat(maxMale) : null,
        minFemale: minFemale ? parseFloat(minFemale) : null,
        maxFemale: maxFemale ? parseFloat(maxFemale) : null,
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
