import { PrismaClient } from '@prisma/client';
// For demo purposes, we will not hash passwords to simplify testing exactly what is in the spec
// In production, we would use bcrypt

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

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

  // Create Users (as per spec)
  const users = [
    { username: 'Imagee owner', passwordHash: 'gagan1112', displayName: 'IMAGEE OWNER', role: 'Owner', labId: lab.id },
    { username: 'IMAGEERAJANI', passwordHash: '123456', displayName: 'IMAGEERAJANI', role: 'Reception', labId: lab.id },
    { username: 'Imageemallesh', passwordHash: '2016143', displayName: 'imageemallesh', role: 'LabEntry', labId: lab.id },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: u,
    });
  }

  // Add some demo test catalog items
  const tests = [
    { testName: 'USG ABDOMEN AND PELVIS', category: 'Ultrasound', price: 800, department: 'Radiology', labId: lab.id },
    { testName: 'CT KUB', category: 'Radiology', price: 2500, department: 'Radiology', labId: lab.id },
    { testName: 'CBP', category: 'Pathology', price: 200, department: 'Pathology', labId: lab.id },
  ];

  for (const t of tests) {
    const existing = await prisma.testMaster.findFirst({
      where: { testName: t.testName }
    });
    if (!existing) {
      await prisma.testMaster.create({
        data: t
      });
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
