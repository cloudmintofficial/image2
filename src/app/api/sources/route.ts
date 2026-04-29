import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  try {
    const sources = await prisma.source.findMany({
      where: search ? {
        name: { contains: search },
        status: 'Active'
      } : undefined,
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(sources);
  } catch (error) {
    console.log('Available Prisma models:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));
    return NextResponse.json({ 
      error: 'Failed to fetch sources', 
      details: error instanceof Error ? error.message : String(error),
      availableModels: Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'))
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, status } = data;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const source = await prisma.source.create({
      data: { name, status: status || 'Active' }
    });

    return NextResponse.json(source);
  } catch (error: any) {
    console.error('Error creating source:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Source with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create source' }, { status: 500 });
  }
}
