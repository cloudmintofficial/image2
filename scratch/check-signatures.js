const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const depts = await prisma.department.findMany();
  console.log('--- DEPARTMENTS ---');
  console.log(depts);
  const sigs = await prisma.doctorSignature.findMany();
  console.log('--- DOCTOR SIGNATURES ---');
  console.log(sigs);
}

main().finally(() => prisma.$disconnect());
