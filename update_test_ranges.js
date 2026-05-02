const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cbpTest = await prisma.testMaster.findFirst({
    where: { testName: { contains: "COMPLETE BLOOD PICTURE" } },
    include: { components: true }
  });

  if (cbpTest && cbpTest.components.length > 0) {
    const hbComp = cbpTest.components.find(c => c.componentName.toLowerCase().includes("haemoglobin"));
    if (hbComp) {
      await prisma.testComponent.update({
        where: { id: hbComp.id },
        data: {
          minMale: 13.0,
          maxMale: 17.0,
          minFemale: 12.0,
          maxFemale: 15.0,
          normalRange: null // clear legacy string to prove it uses the floats
        }
      });
      console.log("Updated Haemoglobin ranges!");
    }
    
    const wbcComp = cbpTest.components.find(c => c.componentName.toLowerCase().includes("wbc"));
    if (wbcComp) {
      await prisma.testComponent.update({
        where: { id: wbcComp.id },
        data: {
          minMale: 4000,
          maxMale: 10000,
          minFemale: 4000,
          maxFemale: 10000,
          normalRange: null
        }
      });
      console.log("Updated WBC ranges!");
    }
  } else {
    // If not found, create a dummy test for testing
    const test = await prisma.testMaster.create({
      data: {
        testName: "GENDER SPECIFIC TEST",
        uiType: "panel",
        price: 100,
        labId: 1,
        components: {
          create: [
            { componentName: "Hemoglobin Specific", unit: "g/dL", fieldType: "number", minMale: 13, maxMale: 17, minFemale: 12, maxFemale: 15 }
          ]
        }
      }
    });
    console.log("Created dummy test GENDER SPECIFIC TEST");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
