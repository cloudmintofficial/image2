const { prisma } = require('./src/lib/prisma');

async function test() {
  console.log('Models available in prisma:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));
  try {
    const count = await prisma.sampleType.count();
    console.log('SampleType count:', count);
  } catch (e) {
    console.error('Error accessing sampleType:', e.message);
  }
}

test();
