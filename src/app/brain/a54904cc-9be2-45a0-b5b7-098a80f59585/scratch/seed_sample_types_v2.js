const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sampleTypes = [
    'Pap Smear', 'Sweat', 'Saliva', 'Urea Breath', 'Hair', 'Fingernail Clippings', 
    'Skin scrapes', 'HPV', 'Biopsies', 'CerebroSpinal Fluid', 'Bone Marrow', 
    'Chorionic Villous Sampling', 'Amniocentesis', 'Noninvasive Prenatal Testing', 
    'Hydrogen and Methane Breath', 'ANY', 'CITRATED BLOOD', 'CITRATED PLASMA', 
    'Conducted on Patient', 'ET TUBE', 'Fixed Smears', 'Fluoride Plasma', 
    'FLUID', 'LITHIUM HEPARIN', 'Na Citrate', 'Na Fluoride', 'Na Heparin', 
    'PLASMA NaF', 'SERUM', 'WB EDTA', 'Body fluids', 'STONE', 'Synovial Fluid', 
    'TISSUE SPECIMEN', 'URINE/SERUM', 'SERUM/WB EDTA', 'sputum/body fluids',
    'Blood', 'Serum', 'Urine', 'Plasma', 'Pus', 'Sputum', 'Stool', 'Swab', 'Semen'
  ];
  
  console.log(`Seeding ${sampleTypes.length} sample types...`);

  for (const name of sampleTypes) {
    try {
      await prisma.sampleType.upsert({
        where: { name },
        update: {},
        create: { name }
      });
    } catch (e) {
      // If prisma.sampleType is not available in the client yet, use raw SQL
      const trimmedName = name.trim();
      await prisma.$executeRawUnsafe('INSERT INTO "SampleType" (name, status) VALUES ($1, \'Active\') ON CONFLICT (name) DO NOTHING', trimmedName);
    }
  }
  
  console.log('Sample types seeded successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
