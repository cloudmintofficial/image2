const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const signatures = [
  { id: 'default', label: 'Default System Signature', name: 'DR. AUTHORIZED SIGNATORY', title: 'CONSULTANT RADIOLOGIST', signText: 'Signature' },
  { id: 'praveen', label: 'DR.M.Praveen Kumar. DMRD,DNB.', name: 'DR.M.Praveen Kumar. DMRD,DNB.', title: 'CONSULTANT RADIOLOGIST', signText: 'M.Praveen Kumar' },
  { id: 'venkateshwar', label: 'DR. VENKATESHWAR REDDY Consultant Radiologist', name: 'Dr. Venkateshwar Reddy', title: 'CONSULTANT RADIOLOGIST', signText: 'Venkateshwar' },
  { id: 'surabi', label: 'DR SURABI KARTHIK M.D Radiodianosis', name: 'DR SURABI KARTHIK', title: 'M.D Radiodianosis\nConsultant Radiologist', signText: 'S.Karthik' },
  { id: 'dilip', label: 'DR.K.Dilip Reddy. MBBS, MDRD', name: 'DR.K.Dilip Reddy. MBBS, MDRD', title: 'CONSULTANT RADIOLOGIST', signText: 'K.Dilip' },
  { id: 'aruna', label: 'DR ARUNA JYOTHI', name: 'DR ARUNA JYOTHI', title: 'CONSULTANT RADIOLOGIST', signText: 'Aruna Jyothi' }
];

async function main() {
  console.log('Seeding signatures...');
  for (const sig of signatures) {
    await prisma.doctorSignature.upsert({
      where: { id: sig.id },
      update: sig,
      create: sig
    });
  }
  console.log('Signatures seeded.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
