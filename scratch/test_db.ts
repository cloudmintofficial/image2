import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    const count = await prisma.source.count();
    console.log('Source count:', count);
    const first = await prisma.source.findFirst();
    console.log('First source:', first);
  } catch (e) {
    console.error('Test failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
