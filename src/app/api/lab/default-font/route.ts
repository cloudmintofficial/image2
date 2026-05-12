import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to retrieve or create the global singleton test container used to anchor Lab Default Font settings
async function getGlobalTestContainer() {
  const testName = "__GLOBAL_LAB_DEFAULT_FONT__";
  let master = await prisma.testMaster.findUnique({
    where: { testName }
  });

  if (!master) {
    // Anchor to the primary lab instance
    const firstLab = await prisma.lab.findFirst();
    const labId = firstLab?.id || 1;

    master = await prisma.testMaster.create({
      data: {
        testName,
        category: "System",
        price: 0,
        orderType: "System",
        status: "System",
        labId
      }
    });
  }
  return master;
}

export async function GET() {
  try {
    const master = await getGlobalTestContainer();
    const orderFont = await prisma.orderFont.findUnique({
      where: { testId: master.id }
    });
    return NextResponse.json(orderFont || {});
  } catch (error) {
    console.error('Error fetching global lab default font:', error);
    return NextResponse.json({ error: 'Failed to fetch global lab default font' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const master = await getGlobalTestContainer();
    const body = await request.json();
    const { 
      fontFamily, patientDetailsFont, departmentNameFont, orderNameFont, 
      resultHeadingFont, subHeadingFont, componentNameFont, methodFont, 
      resultNotesFont, leftSignatureFont, rightSignatureFont, 
      spaceBeforeLineFont, spaceAfterLineFont 
    } = body;

    const data = {
      fontFamily: fontFamily || null, 
      patientDetailsFont: patientDetailsFont || null, 
      departmentNameFont: departmentNameFont || null, 
      orderNameFont: orderNameFont || null,
      resultHeadingFont: resultHeadingFont || null, 
      subHeadingFont: subHeadingFont || null, 
      componentNameFont: componentNameFont || null, 
      methodFont: methodFont || null,
      resultNotesFont: resultNotesFont || null, 
      leftSignatureFont: leftSignatureFont || null, 
      rightSignatureFont: rightSignatureFont || null,
      spaceBeforeLineFont: spaceBeforeLineFont || null, 
      spaceAfterLineFont: spaceAfterLineFont || null
    };

    const orderFont = await prisma.orderFont.upsert({
      where: { testId: master.id },
      update: data,
      create: {
        testId: master.id,
        ...data
      }
    });

    return NextResponse.json(orderFont);
  } catch (error) {
    console.error('Error saving global lab default font:', error);
    return NextResponse.json({ error: 'Failed to save global lab default font' }, { status: 500 });
  }
}
