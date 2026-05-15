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
