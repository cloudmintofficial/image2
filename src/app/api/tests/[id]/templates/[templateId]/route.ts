import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/tests/[id]/templates/[templateId] - Update template
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string, templateId: string }> }
) {
  const { templateId: paramTemplateId } = await params;
  const templateId = parseInt(paramTemplateId);
  if (isNaN(templateId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const body = await request.json();
    const { templateName, status, fromAge, toAge, fromAgeDays, toAgeDays, gender } = body;

    const template = await prisma.orderDetailTemplate.update({
      where: { id: templateId },
      data: {
        templateName,
        status,
        fromAge: fromAge !== undefined ? (fromAge ? parseInt(fromAge) : null) : undefined,
        toAge: toAge !== undefined ? (toAge ? parseInt(toAge) : null) : undefined,
        fromAgeDays: fromAgeDays !== undefined ? (fromAgeDays ? parseInt(fromAgeDays) : null) : undefined,
        toAgeDays: toAgeDays !== undefined ? (toAgeDays ? parseInt(toAgeDays) : null) : undefined,
        gender
      }
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

// DELETE /api/tests/[id]/templates/[templateId] - Delete template
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string, templateId: string }> }
) {
  const { templateId: paramTemplateId } = await params;
  const templateId = parseInt(paramTemplateId);
  if (isNaN(templateId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    await prisma.orderDetailTemplate.delete({
      where: { id: templateId }
    });
    return NextResponse.json({ message: 'Template deleted' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
