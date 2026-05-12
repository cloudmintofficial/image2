const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tests = await prisma.testMaster.findMany({
    where: {
      OR: [
        { testName: { contains: 'AFB', mode: 'insensitive' } },
        { testName: { contains: 'Acid Phosphatase', mode: 'insensitive' } }
      ]
    },
    select: { id: true, testName: true }
  });
  console.log(JSON.stringify(tests, null, 2));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
