import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.patient.findFirst({ orderBy: { id: 'desc' } });
  console.log(JSON.stringify(p, null, 2));
}
main().finally(() => prisma.$disconnect());
