import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with laboratory default data...');

  // Create default Lab
  const lab = await prisma.lab.upsert({
    where: { id: 1 },
    update: {},
    create: {
      labName: 'Medfile Main Lab',
      labAddress: '123 Health Ave, Hyderabad',
      contactPerson: 'Admin',
      primaryPhone: '9999999999',
    },
  });

  // Hashing user passwords securely using bcrypt to match NextAuth expectation
  const users = [
    { username: 'Imagee owner', displayName: 'IMAGEE OWNER', role: 'Owner', passwordHash: await bcrypt.hash('gagan1112', 10), labId: lab.id },
    { username: 'IMAGEERAJANI', displayName: 'IMAGEERAJANI', role: 'Reception', passwordHash: await bcrypt.hash('123456', 10), labId: lab.id },
    { username: 'Imageemallesh', displayName: 'imageemallesh', role: 'LabEntry', passwordHash: await bcrypt.hash('2016143', 10), labId: lab.id },
  ];

  let seededUser: any = null;
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: {
        passwordHash: u.passwordHash,
        displayName: u.displayName,
        role: u.role
      },
      create: u,
    });
    if (u.username === 'Imagee owner') {
      seededUser = user;
    }
  }

  // Seed default departments
  const defaultDepts = [
    { name: 'BIO CHEMISTRY', status: 'Active', signatureLabel: 'LAB INCHARGE', leftSignatureLabel: 'Verified By', printIndividualPages: true, labId: lab.id },
    { 
      name: 'IMMUNOLOGY', 
      status: 'Active', 
      labId: lab.id,
      signatureLabel: 'LAB INCHARGE',
      leftSignatureLabel: 'Verified By',
      signatureImageUrl: 'https://res.cloudinary.com/dci6zeb1n/image/upload/v1779181187/lab-management/signatures/lab/sig_immunology_1779181186870-901189275.png',
      printIndividualPages: true
    },
    { 
      name: 'SEROLOGY', 
      status: 'Active', 
      labId: lab.id,
      signatureLabel: 'LAB INCHARGE',
      leftSignatureLabel: null,
      signatureImageUrl: 'https://res.cloudinary.com/dci6zeb1n/image/upload/v1779181187/lab-management/signatures/lab/sig_immunology_1779181186870-901189275.png',
      printIndividualPages: true
    },
    { 
      name: 'CLINICAL PATHOLOGY', 
      status: 'Active', 
      labId: lab.id,
      signatureLabel: 'LAB INCHARGE',
      leftSignatureLabel: 'Verified By',
      signatureImageUrl: 'https://res.cloudinary.com/dci6zeb1n/image/upload/v1779181187/lab-management/signatures/lab/sig_immunology_1779181186870-901189275.png',
      printIndividualPages: true
    },
    { 
      name: 'HEMATOLOGY', 
      status: 'Active', 
      labId: lab.id,
      signatureLabel: 'LAB INCHARGE',
      leftSignatureLabel: 'Verified By',
      signatureImageUrl: 'https://res.cloudinary.com/dci6zeb1n/image/upload/v1779181187/lab-management/signatures/lab/sig_immunology_1779181186870-901189275.png',
      printIndividualPages: true
    },
    { 
      name: 'MICRO BIOLOGY', 
      status: 'Active', 
      labId: lab.id,
      signatureLabel: 'LAB INCHARGE',
      leftSignatureLabel: 'Verified By',
      signatureImageUrl: 'https://res.cloudinary.com/dci6zeb1n/image/upload/v1779181187/lab-management/signatures/lab/sig_immunology_1779181186870-901189275.png',
      printIndividualPages: true
    },
    { name: 'PATHOLOGY', status: 'Active', labId: lab.id },
    { 
      name: 'CYTOLOGY', 
      status: 'Active', 
      labId: lab.id,
      signatureLabel: 'LAB INCHARGE',
      leftSignatureLabel: 'Verified By',
      signatureImageUrl: 'https://res.cloudinary.com/dci6zeb1n/image/upload/v1779181187/lab-management/signatures/lab/sig_immunology_1779181186870-901189275.png',
      printIndividualPages: true
    },
    { name: 'X-RAY', status: 'Active', labId: lab.id },
    { name: 'HISTOPATHOLOGY', status: 'Active', labId: lab.id },
    { name: 'ECG', status: 'Active', labId: lab.id },
    { name: 'HORMONES', status: 'Active', labId: lab.id },
    { name: 'RADIOLOGY', status: 'Active', labId: lab.id },
    { name: '2 D ECHOCARDIOGRAM', status: 'Active', labId: lab.id },
    { name: 'PACKAGE INCLUSION', status: 'Active', labId: lab.id },
  ];

  for (const d of defaultDepts) {
    const existing = await prisma.department.findFirst({
      where: { name: d.name }
    });
    if (!existing) {
      await prisma.department.create({
        data: d
      });
    } else {
      await prisma.department.update({
        where: { id: existing.id },
        data: d
      });
    }
  }

  // Add tests to catalog
  const tests = [
    { testName: 'USG ABDOMEN AND PELVIS', category: 'Ultrasound', price: 800, departmentName: 'Radiology', labId: lab.id },
    { testName: 'CT KUB', category: 'Radiology', price: 2500, departmentName: 'Radiology', labId: lab.id },
    { testName: 'CBP', category: 'Pathology', price: 200, departmentName: 'Pathology', labId: lab.id },
  ];

  for (const t of tests) {
    const existing = await prisma.testMaster.findFirst({
      where: { testName: t.testName }
    });
    if (!existing) {
      const dept = await prisma.department.findFirst({
        where: { name: { equals: t.departmentName, mode: 'insensitive' } }
      });
      await prisma.testMaster.create({
        data: {
          testName: t.testName,
          category: t.category,
          price: t.price,
          departmentId: dept?.id || null,
          labId: t.labId
        }
      });
    }
  }

  console.log('Seeding 31 historical bills for May 25, 2026 reports matching screenshots...');

  // Clean existing bills in range to avoid duplicates during resets
  await prisma.payment.deleteMany({
    where: { bill: { billNumber: { gte: 2007, lte: 2037 } } }
  });
  await prisma.orderItem.deleteMany({
    where: { bill: { billNumber: { gte: 2007, lte: 2037 } } }
  });
  await prisma.bill.deleteMany({
    where: { billNumber: { gte: 2007, lte: 2037 } }
  });

  const doctorNames = [
    'DR SATHYANARAYANA', 'VANASTHALI HOSPITAL', 'DR RAVI CLINIC', 'DRA S NAIDU',
    'OZONE HOSPITAL', 'SRI SAI HOSPITAL', 'DR VENKATESHWARLU', 'SHREYAS HOSPITAL',
    'DR SRINIVASA CHARY', 'DR DASHARATH', 'DR ANUSHA REDDY', 'TANVI HOSPITAL',
    'DR SELF', 'SHADOW HOSPITAL(hyt)', 'HRC HOSPITAL', 'DR SINDUJA', 'PRASIDH HOSPITAL',
    'LEGEND HOSPITAL', 'DR RAJU BANJARA COLONY', 'J S HOSPITAL', 'DR HARISH RACHURI',
    'ABHAYA HOSPITAL', 'SUNRAYS HOSPITAL(BANDLAGUDA)', 'CHETHANA HOSPITAL', 'DR MANJUNATH'
  ];

  const doctorsMap: Record<string, number> = {};
  for (const name of doctorNames) {
    let doc = await prisma.doctor.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });
    if (!doc) {
      doc = await prisma.doctor.create({
        data: { name, type: 'Referral', status: 'Active' }
      });
    }
    doctorsMap[name] = doc.id;
  }

  const billsData = [
    { billNumber: 2007, patient: { name: 'MRS PADMA', age: 36, gender: 'Female' }, doctor: 'DR SATHYANARAYANA', tests: [{ name: 'ENDOSCOPY', amount: 2500 }], discount: 500, discountReason: 'RAMANA', initialPaid: 2000, preferredMethod: 'UPI' },
    { billNumber: 2008, patient: { name: 'MR K BEERAPPA', age: 71, gender: 'Male' }, doctor: 'VANASTHALI HOSPITAL', tests: [{ name: 'USG ABDOMEN AND PELVIS', amount: 1200 }], discount: 500, discountReason: 'KISHORE', initialPaid: 700, preferredMethod: 'Cash' },
    { billNumber: 2009, patient: { name: 'MRS MOUNIKA', age: 26, gender: 'Female' }, doctor: 'VANASTHALI HOSPITAL', tests: [{ name: 'USG NT SCAN', amount: 1500 }], discount: 500, discountReason: 'KISHORE', initialPaid: 1000, preferredMethod: 'UPI' },
    { billNumber: 2010, patient: { name: 'MR BABU', age: 47, gender: 'Male' }, doctor: 'DR RAVI CLINIC', tests: [{ name: 'USG ABDOMEN AND PELVIS', amount: 1200 }], discount: 0, discountReason: null, initialPaid: 1200, preferredMethod: 'Cash' },
    { billNumber: 2011, patient: { name: 'MRS DEEPA', age: 31, gender: 'Female' }, doctor: 'DRA S NAIDU', tests: [{ name: 'USG PELVIS SCAN', amount: 1200 }], discount: 0, discountReason: null, initialPaid: 0, preferredMethod: 'UPI' },
    { billNumber: 2012, patient: { name: 'MRS RADHAMANI', age: 43, gender: 'Female' }, doctor: 'OZONE HOSPITAL', tests: [{ name: 'USG ABDOMEN AND PELVIS', amount: 1200 }], discount: 500, discountReason: 'C/O RAMANA', initialPaid: 700, preferredMethod: 'UPI' },
    { billNumber: 2013, patient: { name: 'MRS RADHARANI', age: 43, gender: 'Female' }, doctor: 'OZONE HOSPITAL', tests: [
      { name: 'COMPLETE BLOOD PICTURE(CBP)', amount: 300 },
      { name: 'C REACTIVE PROTEINS (CRP)', amount: 450 },
      { name: 'RFT(Renal function test)', amount: 600 },
      { name: 'CUE(COMPLETE URINE EXAMINATION)', amount: 200 }
    ], discount: 750, discountReason: 'C/O RAMANA', initialPaid: 800, preferredMethod: 'UPI' },
    { billNumber: 2014, patient: { name: 'MR RAKESH', age: 25, gender: 'Male' }, doctor: 'SRI SAI HOSPITAL', tests: [{ name: 'USG ABDOMEN AND PELVIS', amount: 1200 }], discount: 0, discountReason: null, initialPaid: 1200, preferredMethod: 'Cash' },
    { billNumber: 2015, patient: { name: 'MRS PRASHANTHI', age: 36, gender: 'Female' }, doctor: 'DR VENKATESHWARLU', tests: [{ name: 'USG ABDOMEN AND PELVIS', amount: 1200 }], discount: 400, discountReason: 'RAMANA', initialPaid: 800, preferredMethod: 'UPI' },
    { billNumber: 2016, patient: { name: 'MRS RAMYA', age: 23, gender: 'Female' }, doctor: 'SHREYAS HOSPITAL', tests: [{ name: 'USG ABDOMEN AND PELVIS', amount: 1200 }], discount: 500, discountReason: 'C/O RAMANA', initialPaid: 0, preferredMethod: 'UPI' },
    { billNumber: 2017, patient: { name: 'MRS SHAILAJA', age: 49, gender: 'Female' }, doctor: 'DR SRINIVASA CHARY', tests: [
      { name: 'DOPPLER STUDY OF LEFT LOWER LIMB VENOUS SYSTEM', amount: 1500 },
      { name: 'USG DOPPLER STUDY OF RIGHT LOWER LIMB VENOUS SYSTEM', amount: 1500 }
    ], discount: 500, discountReason: 'RAMANA', initialPaid: 2500, preferredMethod: 'UPI' },
    { billNumber: 2018, patient: { name: 'MR NAVEEN', age: 45, gender: 'Male' }, doctor: 'DR DASHARATH', tests: [{ name: 'USG ABDOMEN AND PELVIS', amount: 1200 }], discount: 0, discountReason: null, initialPaid: 1200, preferredMethod: 'Cash' },
    { billNumber: 2019, patient: { name: 'MRS MANASA', age: 27, gender: 'Female' }, doctor: 'DR ANUSHA REDDY', tests: [{ name: 'X-RAY HSG', amount: 2500 }], discount: 0, discountReason: null, initialPaid: 2500, preferredMethod: 'UPI' },
    { billNumber: 2020, patient: { name: 'MRS K MADHURI', age: 26, gender: 'Female' }, doctor: 'TANVI HOSPITAL', tests: [{ name: 'USG NT SCAN', amount: 1500 }], discount: 0, discountReason: null, initialPaid: 1500, preferredMethod: 'Cash' },
    { billNumber: 2021, patient: { name: 'MRS M LALI', age: 28, gender: 'Female' }, doctor: 'DR SELF', tests: [{ name: 'USG PELVIS SCAN', amount: 1200 }], discount: 400, discountReason: 'C/O RAMANA', initialPaid: 800, preferredMethod: 'UPI' },
    { billNumber: 2022, patient: { name: 'MR SRIKANTH', age: 38, gender: 'Male' }, doctor: 'SHADOW HOSPITAL(hyt)', tests: [{ name: 'USG ABDOMEN AND PELVIS', amount: 1200 }], discount: 0, discountReason: null, initialPaid: 1200, preferredMethod: 'Cash' },
    { billNumber: 2023, patient: { name: 'MR SAKETH REDDY', age: 23, gender: 'Male' }, doctor: 'HRC HOSPITAL', tests: [{ name: 'CT BRAIN (PLAIN)', amount: 2400 }], discount: 1300, discountReason: 'C/O RAMANA', initialPaid: 1100, preferredMethod: 'UPI' },
    { billNumber: 2024, patient: { name: 'MRS UDAYA BHANU', age: 28, gender: 'Female' }, doctor: 'DR SINDUJA', tests: [{ name: 'USG ANTENATAL SCAN', amount: 1200 }], discount: 0, discountReason: null, initialPaid: 1200, preferredMethod: 'Cash' },
    { billNumber: 2025, patient: { name: 'MRS T CHANDRIKA', age: 22, gender: 'Female' }, doctor: 'PRASIDH HOSPITAL', tests: [{ name: 'USG ABDOMEN AND PELVIS', amount: 1200 }], discount: 0, discountReason: null, initialPaid: 0, preferredMethod: 'UPI' },
    { billNumber: 2026, patient: { name: 'MRS MANJULA', age: 28, gender: 'Female' }, doctor: 'VANASTHALI HOSPITAL', tests: [{ name: 'USG PELVIS SCAN', amount: 1200 }], discount: 500, discountReason: 'KISHORE', initialPaid: 700, preferredMethod: 'UPI' },
    { billNumber: 2027, patient: { name: 'MR T VIJAY SAI', age: 24, gender: 'Male' }, doctor: 'LEGEND HOSPITAL', tests: [{ name: 'X-RAY RIGHT FOOT AP/OBLIQUE', amount: 600 }], discount: 0, discountReason: null, initialPaid: 600, preferredMethod: 'UPI' },
    { billNumber: 2028, patient: { name: 'MRS RENUKA', age: 27, gender: 'Female' }, doctor: 'DR RAJU BANJARA COLONY', tests: [{ name: 'USG ABDOMEN AND PELVIS', amount: 1200 }], discount: 0, discountReason: null, initialPaid: 1200, preferredMethod: 'Cash' },
    { billNumber: 2029, patient: { name: 'MRS SHAHEEN', age: 34, gender: 'Female' }, doctor: 'J S HOSPITAL', tests: [{ name: 'USG ABDOMEN AND PELVIS', amount: 1200 }], discount: 0, discountReason: null, initialPaid: 1200, preferredMethod: 'Cash' },
    { billNumber: 2030, patient: { name: 'MASTER HEMANTH SAI', age: 8, gender: 'Male' }, doctor: 'DR HARISH RACHURI', tests: [{ name: 'USG ABDOMEN AND PELVIS', amount: 1200 }], discount: 0, discountReason: null, initialPaid: 1200, preferredMethod: 'UPI' },
    { billNumber: 2031, patient: { name: 'MR SRIDHAR REDDY', age: 40, gender: 'Male' }, doctor: 'ABHAYA HOSPITAL', tests: [{ name: 'USG ABDOMEN AND PELVIS', amount: 1200 }], discount: 0, discountReason: null, initialPaid: 1200, preferredMethod: 'Cash' },
    { billNumber: 2032, patient: { name: 'MRS DURGA', age: 30, gender: 'Female' }, doctor: 'VANASTHALI HOSPITAL', tests: [{ name: 'CT BRAIN (PLAIN)', amount: 2400 }], discount: 0, discountReason: null, initialPaid: 2400, preferredMethod: 'UPI' },
    { billNumber: 2033, patient: { name: 'MR NARSIMHA', age: 47, gender: 'Male' }, doctor: 'SUNRAYS HOSPITAL(BANDLAGUDA)', tests: [
      { name: 'USG ABDOMEN AND PELVIS', amount: 1200 },
      { name: 'USG SCROTUM', amount: 1500 }
    ], discount: 1000, discountReason: 'RAMANA', initialPaid: 0, preferredMethod: 'UPI' },
    { billNumber: 2034, patient: { name: 'MRS RADHA RANI', age: 43, gender: 'Female' }, doctor: 'CHETHANA HOSPITAL', tests: [{ name: 'CT KUB', amount: 4500 }], discount: 2000, discountReason: 'RAMANA', initialPaid: 2500, preferredMethod: 'UPI' },
    { billNumber: 2035, patient: { name: 'MR BUSAIAH SWAMY', age: 65, gender: 'Male' }, doctor: 'DR MANJUNATH', tests: [{ name: 'HRCT CHEST', amount: 4500 }], discount: 2000, discountReason: 'C/O RAMANA', initialPaid: 2500, preferredMethod: 'UPI' },
    { billNumber: 2036, patient: { name: 'MR MANJUNATH', age: 35, gender: 'Male' }, doctor: 'DR MANJUNATH', tests: [{ name: 'CT PNS (AXIAL & CORONAL)', amount: 2800 }], discount: 1400, discountReason: 'C/O RAMANA', initialPaid: 1400, preferredMethod: 'UPI' },
    { billNumber: 2037, patient: { name: 'MR R SRAVAN KUMAR', age: 28, gender: 'Male' }, doctor: 'DR SELF', tests: [
      { name: 'USG ABDOMEN AND PELVIS', amount: 1200 },
      { name: 'COMPLETE BLOOD PICTURE(CBP)', amount: 300 },
      { name: 'RFT(Renal function test)', amount: 600 }
    ], discount: 800, discountReason: 'RAMANA', initialPaid: 1300, preferredMethod: 'UPI' }
  ];

  const billDate = new Date("2026-05-25T10:00:00.000Z");
  const cashBillNumbers = [2007, 2008, 2010, 2014, 2018, 2022, 2024, 2028, 2029, 2031];
  const defaultCreatedBy = seededUser?.id || 1;

  for (const item of billsData) {
    // Create patient
    const patient = await prisma.patient.create({
      data: {
        name: item.patient.name,
        age: item.patient.age,
        gender: item.patient.gender === 'Female' ? 'F' : 'M',
        phone: '9999999999',
        source: item.doctor,
        createdAt: billDate
      }
    });

    const totalBill = item.tests.reduce((sum, t) => sum + t.amount, 0);
    const balance = Math.max(0, totalBill - item.discount - item.initialPaid);
    const status = balance === 0 ? 'Completed' : 'InProcess';

    // Create bill
    const bill = await prisma.bill.create({
      data: {
        billNumber: item.billNumber,
        billDate: billDate,
        patientId: patient.id,
        doctorId: doctorsMap[item.doctor] || null,
        totalBill: totalBill,
        discount: item.discount,
        discountReason: item.discountReason,
        paidAmount: item.initialPaid,
        balance: balance,
        status: status,
        createdBy: defaultCreatedBy,
        labId: lab.id,
        createdAt: billDate,
        updatedAt: billDate
      }
    });

    // Create order items
    for (const test of item.tests) {
      await prisma.orderItem.create({
        data: {
          billId: bill.id,
          orderName: test.name,
          amount: test.amount,
          resultStatus: 'Pending',
          createdAt: billDate
        }
      });
    }

    // Create initial payment if paid > 0
    if (item.initialPaid > 0) {
      const isCash = cashBillNumbers.includes(item.billNumber);
      const method = isCash ? 'Cash' : 'UPI';
      await prisma.payment.create({
        data: {
          billId: bill.id,
          amount: item.initialPaid,
          method: method,
          userId: defaultCreatedBy,
          paidAt: billDate
        }
      });
    }

    // Special: Add Previous Due Cash of 2,500
    if (item.billNumber === 2007) {
      const prevDuePaidAt = new Date(billDate.getTime() + 5 * 60 * 1000); // 5 mins later
      await prisma.payment.create({
        data: {
          billId: bill.id,
          amount: 2500.0,
          method: 'Cash',
          userId: defaultCreatedBy,
          paidAt: prevDuePaidAt
        }
      });
    }
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
