const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const comps = await prisma.testComponent.findMany({
    where: { componentName: { contains: "Hemoglobin" } }
  });
  for (const c of comps) {
    await prisma.testComponent.update({
      where: { id: c.id },
      data: {
        minMale: 13.0, maxMale: 17.0,
        minFemale: 12.0, maxFemale: 15.0,
        normalRange: null
      }
    });
  }
  
  const wbc = await prisma.testComponent.findMany({
    where: { componentName: { contains: "WBC" } }
  });
  for (const c of wbc) {
    await prisma.testComponent.update({
      where: { id: c.id },
      data: {
        minMale: 4000, maxMale: 10000,
        minFemale: 4000, maxFemale: 10000,
        normalRange: null
      }
    });
  }
  console.log("Fixed ranges for Hb and WBC");
}
main().catch(console.error).finally(() => prisma.$disconnect());
