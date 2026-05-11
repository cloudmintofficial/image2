import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const all = searchParams.get('all') === 'true';

  try {
    let tests: any[] = [];
    const baseWhere = all ? {} : { status: 'Active' };

    if (search) {
      tests = await prisma.testMaster.findMany({
        where: { 
          ...baseWhere,
          testName: { contains: search, mode: 'insensitive' }
        },
        orderBy: { testName: 'asc' },
        take: all ? undefined : 20
      });
    } else {
      tests = await prisma.testMaster.findMany({
        where: baseWhere,
        orderBy: { testName: 'asc' },
        take: all ? undefined : 20
      });
    }

    // Format to match the frontend expectations
    const formatted = tests.map(t => ({
      id: t.id,
      name: t.testName,
      category: t.category,
      price: t.price,
      department: t.department,
      orderType: t.orderType || 'Internal',
      status: t.status
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching tests:', error);
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      orderName, hasComponents, testCode, displayOrderName, department, amount, 
      processTime, machineName, sampleType, method, resultNotes, advice, 
      workSheet, purpose, orderType, ipBillingCategoryType, recurring, 
      serviceDoctorRequired, status, labId, uiType
    } = body;

    const test = await prisma.testMaster.create({
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
        labId: labId || 1
      }
    });

    return NextResponse.json(test);
  } catch (error) {
    console.error('Error creating order/test:', error);
    return NextResponse.json({ error: 'Failed to create order', details: String(error) }, { status: 500 });
  }
}
