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

    const safeFloat = (val: any) => {
      if (!val) return null;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    };

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
    console.error('Error updating component:', error);
    return NextResponse.json({ error: 'Failed to update component' }, { status: 500 });
  }
}

// DELETE /api/tests/[id]/components/[compId] - Delete a component
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string, compId: string }> }
) {
  try {
    const { id: paramId, compId: paramCompId } = await params;
    const testId = parseInt(paramId);
    const compId = parseInt(paramCompId);

    console.log(`[API DELETE] Attempting to delete component ${compId} from test ${testId}`);

    if (isNaN(compId)) {
      return NextResponse.json({ error: 'Invalid Component ID' }, { status: 400 });
    }

    // First check if the component exists and belongs to the test
    const component = await prisma.testComponent.findFirst({
      where: { id: compId, testId: testId }
    });

    if (!component) {
      console.warn(`[API DELETE] Component ${compId} not found for test ${testId}`);
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }

    // Perform the deletion
    await prisma.testComponent.delete({
      where: { id: compId }
    });

    console.log(`[API DELETE] Successfully deleted component ${compId}`);

    // Check remaining components for this test
    const remaining = await prisma.testComponent.count({
      where: { testId: testId }
    });

    // Update the TestMaster flag if no components left
    if (remaining === 0) {
      await prisma.testMaster.update({
        where: { id: testId },
        data: { hasComponents: false }
      });
      console.log(`[API DELETE] Test ${testId} now has 0 components. Flag updated.`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Component deleted successfully',
      remainingCount: remaining
    });
  } catch (error: any) {
    console.error('[API DELETE] Error deleting component:', error);
    return NextResponse.json({ 
      error: 'Failed to delete component', 
      details: error.message 
    }, { status: 500 });
  }
}
