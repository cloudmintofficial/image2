import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  try {
    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    // Search distinct/matching components from TestComponent table
    const components = await prisma.testComponent.findMany({
      where: {
        componentName: { contains: q, mode: 'insensitive' }
      },
      include: {
        test: {
          select: { testName: true, department: true }
        }
      },
      take: 40
    });

    // Format for client consumption
    const formatted = components.map(c => ({
      id: c.id,
      componentName: c.componentName,
      subHeading: c.subHeading,
      unit: c.unit,
      normalRange: c.normalRange,
      method: c.method,
      testName: c.test?.testName || 'Unknown Test',
      department: c.test?.department || 'General'
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error searching components:', error);
    return NextResponse.json({ error: 'Failed to search components' }, { status: 500 });
  }
}
