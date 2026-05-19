import { prisma } from '../lib/prisma';

async function main() {
  console.log('--- Departments ---');
  const depts = await prisma.department.findMany();
  depts.forEach(d => {
    if (d.signatureImageUrl || d.leftSignatureImageUrl) {
      console.log(`Dept: ${d.name}, signatureImageUrl: ${d.signatureImageUrl}, leftSignatureImageUrl: ${d.leftSignatureImageUrl}`);
    }
  });

  console.log('--- Labs ---');
  const labs = await prisma.lab.findMany();
  labs.forEach(l => {
    if (l.logo) {
      console.log(`Lab: ${l.labName}, logo: ${l.logo}`);
    }
  });

  console.log('--- Patients ---');
  const patients = await prisma.patient.findMany({
    where: {
      photoUrl: {
        not: null
      }
    }
  });
  patients.forEach(p => {
    console.log(`Patient: ${p.name}, photoUrl: ${p.photoUrl}`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
