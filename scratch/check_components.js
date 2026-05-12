const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const query = 'AFB';
  const components = await prisma.testComponent.findMany({
    where: {
      componentName: { contains: query, mode: 'insensitive' }
    },
    include: {
      test: { select: { testName: true } }
    }
  });
  console.log(JSON.stringify(components, null, 2));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
