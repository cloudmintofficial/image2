import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/tests/[id]/components/[compId] - Update a component
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string, compId: string }> }
) {
  const { compId: paramCompId } = await params;
  const compId = parseInt(paramCompId);
  if (isNaN(compId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const body = await request.json();
    const { 
      componentName, subHeading, machineCode, specimenCode, unit, 
      normalRange, fromRange, toRange, minMale, maxMale, minFemale, 
      maxFemale, method, defaultValue, calculations, status, sortOrder, 
      fieldType, options 
    } = body;

    const component = await prisma.testComponent.update({
      where: { id: compId },
      data: {
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
    console.error('Error updating component:', error);
    return NextResponse.json({ error: 'Failed to update component' }, { status: 500 });
  }
}

// DELETE /api/tests/[id]/components/[compId] - Delete a component
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string, compId: string }> }
) {
  const { compId: paramCompId } = await params;
  const compId = parseInt(paramCompId);
  if (isNaN(compId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    await prisma.testComponent.delete({
      where: { id: compId }
    });
    return NextResponse.json({ message: 'Component deleted successfully' });
  } catch (error) {
    console.error('Error deleting component:', error);
    return NextResponse.json({ error: 'Failed to delete component' }, { status: 500 });
  }
}
