import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/tests/[id]/copy-template?sourceId=123
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const targetId = parseInt(params.id);
  const { searchParams } = new URL(request.url);
  const sourceId = parseInt(searchParams.get('sourceId') || '');

  if (isNaN(targetId) || isNaN(sourceId)) {
    return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
  }

  try {
    // 1. Get source components
    const sourceTest = await prisma.testMaster.findUnique({
      where: { id: sourceId },
      include: { components: true }
    });

    if (!sourceTest) {
      return NextResponse.json({ error: 'Source test not found' }, { status: 404 });
    }

    // 2. Delete existing components in target (optional, but usually desired for a fresh copy)
    // Or just append. In the old version, it seems to replace or append. 
    // Let's replace for now to keep it clean.
    await prisma.testComponent.deleteMany({
      where: { testId: targetId }
    });

    // 3. Copy components
    const newComponents = sourceTest.components.map(comp => ({
      testId: targetId,
      componentName: comp.componentName,
      unit: comp.unit,
      normalRange: comp.normalRange,
      minMale: comp.minMale,
      maxMale: comp.maxMale,
      minFemale: comp.minFemale,
      maxFemale: comp.maxFemale,
      method: comp.method,
      sortOrder: comp.sortOrder,
      fieldType: comp.fieldType,
      options: comp.options
    }));

    await prisma.testComponent.createMany({
      data: newComponents
    });

    // 4. Update hasComponents and uiType on target
    await prisma.testMaster.update({
      where: { id: targetId },
      data: {
        hasComponents: true,
        uiType: 'panel'
      }
    });

    return NextResponse.json({ message: 'Components copied successfully', count: newComponents.length });
  } catch (error) {
    console.error('Error copying template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
