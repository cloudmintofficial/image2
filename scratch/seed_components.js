const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const data = [
    {
      testName: "A.F.B STAIN FLUID",
      testCode: "AFB-FLUID",
      department: "BIO-CHEMISTRY",
      sampleType: "FLUID",
      hasComponents: true,
      components: [
        { name: "AFB - FLUID", normalRange: "--", unit: "--" }
      ]
    },
    {
      testName: "A.F.B STAIN PUS",
      testCode: "AFB-PUS",
      department: "BIO-CHEMISTRY",
      sampleType: "PUS",
      hasComponents: true,
      components: [
        { name: "AFB - PUS", normalRange: "--", unit: "--" }
      ]
    },
    {
      testName: "Acid Phosphatase- Total",
      testCode: "ACID-PHOS-TOT",
      department: "BIO-CHEMISTRY",
      sampleType: "SERUM",
      hasComponents: true,
      components: [
        { name: "Acid Phosphatase", normalRange: "--", unit: "--" }
      ]
    }
  ];

  for (const item of data) {
    console.log(`Processing ${item.testName}...`);
    
    // Upsert the test
    const test = await prisma.testMaster.upsert({
      where: { testName: item.testName },
      update: {
        testCode: item.testCode,
        department: item.department,
        sampleType: item.sampleType,
        hasComponents: item.hasComponents,
        labId: 1,
        status: 'Active',
        uiType: 'panel' // Ensure it uses the panel UI for components
      },
      create: {
        testName: item.testName,
        testCode: item.testCode,
        department: item.department,
        sampleType: item.sampleType,
        hasComponents: item.hasComponents,
        category: 'General',
        price: 0,
        labId: 1,
        status: 'Active',
        uiType: 'panel'
      }
    });

    // Handle components - delete existing to prevent duplicates without unique index
    await prisma.testComponent.deleteMany({ where: { testId: test.id } });

    for (const comp of item.components) {
      await prisma.testComponent.create({
        data: {
          testId: test.id,
          componentName: comp.name,
          normalRange: comp.normalRange,
          unit: comp.unit,
          status: 'Active'
        }
      });
    }
  }

  console.log('Seeding completed successfully.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
