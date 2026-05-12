import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tests/template?orderName=CBC
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderName = searchParams.get('orderName') || '';

  if (!orderName) {
    return NextResponse.json({ error: 'orderName is required' }, { status: 400 });
  }

  try {
    // Find the test master entry matching this order name
    const test = await prisma.testMaster.findFirst({
      where: {
        OR: [
          { testName: orderName },
          { testName: { contains: orderName, mode: 'insensitive' } },
          { displayOrderName: orderName },
          { displayOrderName: { contains: orderName, mode: 'insensitive' } },
        ]
      },
      include: {
        components: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (!test) {
      // Return default richtext template for unknown tests
      return NextResponse.json({
        uiType: 'richtext',
        testName: orderName,
        components: [],
        resultTemplate: null,
        method: null,
        advice: null,
      });
    }

    return NextResponse.json({
      uiType: test.uiType,
      testName: test.testName,
      components: test.components.map(c => ({
        id: c.id,
        name: c.componentName,
        unit: c.unit,
        normalRange: c.normalRange,
        minMale: c.minMale,
        maxMale: c.maxMale,
        minFemale: c.minFemale,
        maxFemale: c.maxFemale,
        method: c.method,
        fieldType: c.fieldType,
        options: c.options,
      })),
      resultTemplate: test.resultTemplate,
      method: test.method,
      advice: test.advice,
      sampleType: test.sampleType,
      department: test.department,
    });
  } catch (error) {
    console.error('Error fetching test template:', error);
    return NextResponse.json({ error: 'Failed to fetch template', details: String(error) }, { status: 500 });
  }
}
