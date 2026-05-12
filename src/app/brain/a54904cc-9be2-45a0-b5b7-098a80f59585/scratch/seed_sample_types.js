const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const defaults = ['Blood', 'Serum', 'Urine', 'Plasma', 'Pus', 'Sputum', 'Stool', 'Swab', 'Semen', 'WB EDTA'];
  
  for (const name of defaults) {
    await prisma.sampleType.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }
  console.log('Default sample types seeded.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
