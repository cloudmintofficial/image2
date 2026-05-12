import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/tests/[id]/link-component
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const targetTestId = parseInt(id);

  try {
    const body = await request.json();
    const { componentId, templateId } = body;

    if (isNaN(targetTestId) || !componentId) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Fetch source component properties
    const sourceComp = await prisma.testComponent.findUnique({
      where: { id: parseInt(componentId) }
    });

    if (!sourceComp) {
      return NextResponse.json({ error: 'Source component not found' }, { status: 404 });
    }

    // Compute sortOrder to naturally append at the end of the existing list
    const lastComp = await prisma.testComponent.findFirst({
      where: { 
        testId: targetTestId,
        templateId: templateId ? parseInt(templateId) : null
      },
      orderBy: { sortOrder: 'desc' }
    });
    const nextSortOrder = (lastComp?.sortOrder || 0) + 1;

    // Create linked copy of the component mapped to the target test and template
    const newComponent = await prisma.testComponent.create({
      data: {
        testId: targetTestId,
        templateId: templateId ? parseInt(templateId) : null,
        componentName: sourceComp.componentName,
        subHeading: sourceComp.subHeading,
        machineCode: sourceComp.machineCode,
        specimenCode: sourceComp.specimenCode,
        unit: sourceComp.unit,
        normalRange: sourceComp.normalRange,
        fromRange: sourceComp.fromRange,
        toRange: sourceComp.toRange,
        minMale: sourceComp.minMale,
        maxMale: sourceComp.maxMale,
        minFemale: sourceComp.minFemale,
        maxFemale: sourceComp.maxFemale,
        method: sourceComp.method,
        defaultValue: sourceComp.defaultValue,
        calculations: sourceComp.calculations,
        status: sourceComp.status,
        sortOrder: nextSortOrder,
        fieldType: sourceComp.fieldType,
        options: sourceComp.options
      }
    });

    // Ensure master record tracks panel state
    await prisma.testMaster.update({
      where: { id: targetTestId },
      data: { hasComponents: true }
    });

    return NextResponse.json(newComponent);
  } catch (error) {
    console.error('Error linking component:', error);
    return NextResponse.json({ error: 'Failed to link component' }, { status: 500 });
  }
}
