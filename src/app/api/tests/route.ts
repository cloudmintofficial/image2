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
          OR: [
            { testName: { contains: search, mode: 'insensitive' } },
            { testCode: { contains: search, mode: 'insensitive' } },
            { displayOrderName: { contains: search, mode: 'insensitive' } }
          ]
        },
        include: { department: true },
        orderBy: { testName: 'asc' },
        take: all ? undefined : 20
      });
    } else {
      tests = await prisma.testMaster.findMany({
        where: baseWhere,
        include: { department: true },
        orderBy: { testName: 'asc' },
        take: all ? undefined : 20
      });
    }

    // Format to match the frontend expectations
    const formatted = tests.map(t => ({
      id: t.id,
      name: t.testName,
      hasComponents: t.hasComponents,
      displayOrderName: t.displayOrderName,
      category: t.category,
      price: t.price,
      department: t.department?.name || null,
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

    if (!orderName) {
      return NextResponse.json({ error: 'Order Name is required' }, { status: 400 });
    }

    let departmentId = null;
    const deptStr = department === 'NONE' ? null : department;
    if (deptStr && deptStr.trim() !== '') {
      let dept = await prisma.department.findFirst({
        where: { name: { equals: deptStr.trim(), mode: 'insensitive' } }
      });
      if (!dept) {
        dept = await prisma.department.create({
          data: {
            name: deptStr.trim().toUpperCase(),
            status: 'Active',
            labId: 1
          }
        });
      }
      departmentId = dept.id;
    }

    const test = await prisma.testMaster.create({
      data: {
        testName: orderName,
        hasComponents: hasComponents || false,
        testCode,
        displayOrderName,
        departmentId,
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
        labId: labId || 1,
        uiType: hasComponents ? 'panel' : (uiType || 'richtext')
      },
      include: { department: true }
    });

    return NextResponse.json({
      ...test,
      department: test.department?.name || null
    });
  } catch (error: any) {
    console.error('Error creating order/test:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Order name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create order', details: String(error) }, { status: 500 });
  }
}
