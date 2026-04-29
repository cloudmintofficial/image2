import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.patient.findFirst({ orderBy: { id: 'desc' } });
  console.log(`Last Patient: ID=${p?.id}, UMR=${p?.umr}, Name=${p?.name}`);
}
main().finally(() => prisma.$disconnect());
