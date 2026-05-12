import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const test = await prisma.testMaster.findUnique({
      where: { id },
      include: {
        components: true
      }
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    return NextResponse.json(test);
  } catch (error) {
    console.error('Error fetching test details:', error);
    return NextResponse.json({ error: 'Failed to fetch test details' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { 
      orderName, hasComponents, testCode, displayOrderName, department, amount, 
      processTime, machineName, sampleType, method, resultNotes, advice, 
      workSheet, purpose, orderType, ipBillingCategoryType, recurring, 
      serviceDoctorRequired, status, labId, uiType, resultTemplate
    } = body;

    if (!orderName || !testCode || !amount) {
      return NextResponse.json({ error: 'Order Name, Test Code, and Amount are required' }, { status: 400 });
    }

    const existingCode = await prisma.testMaster.findFirst({
      where: { 
        testCode: { equals: testCode, mode: 'insensitive' },
        id: { not: id }
      }
    });

    if (existingCode) {
      return NextResponse.json({ error: 'Another order with this test code already exists' }, { status: 400 });
    }

    const test = await prisma.testMaster.update({
      where: { id },
      data: {
        testName: orderName,
        hasComponents: hasComponents || false,
        testCode,
        displayOrderName,
        department: department === 'NONE' ? null : department,
        price: parseFloat(amount) || 0,
        processTime,
        machineName,
        sampleType: sampleType === 'Select Sample' ? null : sampleType,
        method,
        resultNotes,
        advice,
        workSheet,
        purpose,
        category: 'General',
        orderType: orderType || 'Internal',
        ipBillingCategoryType: ipBillingCategoryType === 'Select Category' ? null : ipBillingCategoryType,
        recurring: recurring || false,
        serviceDoctorRequired: serviceDoctorRequired || false,
        status: status || 'Active',
        uiType: uiType || 'richtext',
        resultTemplate: resultTemplate || null,
        labId: labId || 1
      }
    });

    return NextResponse.json(test);
  } catch (error: any) {
    console.error('Error updating order/test:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Order name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update order', details: String(error) }, { status: 500 });
  }
}
