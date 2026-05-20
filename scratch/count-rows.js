const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const testMasterCount = await prisma.testMaster.count();
  const testComponentCount = await prisma.testComponent.count();
  const orderDetailTemplateCount = await prisma.orderDetailTemplate.count();
  const orderFontCount = await prisma.orderFont.count();

  console.log({
    testMasterCount,
    testComponentCount,
    orderDetailTemplateCount,
    orderFontCount
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
