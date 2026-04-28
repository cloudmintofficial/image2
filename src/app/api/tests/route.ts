import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  try {
    let tests: any[] = [];
    if (search) {
      tests = await prisma.$queryRaw`
        SELECT * FROM TestMaster 
        WHERE status = 'Active' 
        AND testName LIKE ${'%' + search + '%'} 
        LIMIT 20
      `;
    } else {
      tests = await prisma.testMaster.findMany({
        where: { status: 'Active' },
        take: 20
      });
    }

    // Format to match the frontend expectations
    const formatted = tests.map(t => ({
      id: t.id,
      name: t.testName,
      category: t.category,
      price: t.price,
      department: t.department
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching tests:', error);
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
  }
}
