const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const content = fs.readFileSync('scratch/extracted_tests.txt', 'utf8');
  const lines = content.split('\n');
  const tests = [];

  const ignorePatterns = [
    'Orders Price List',
    'SERVICES',
    'Order Name',
    'Order Amount',
    'OrderMaintenance',
    'https://',
    '28/04/2026',
    'Automatic Zoom'
  ];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    if (ignorePatterns.some(p => line.includes(p))) continue;

    // Pattern: [Test Name] [Price]
    // Example: "X-Ray LEFT ANKLE LAT 400"
    // We split by space and assume the last part is the price if it's a number
    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;

    const priceStr = parts[parts.length - 1];
    const price = parseFloat(priceStr);

    if (!isNaN(price)) {
      const name = parts.slice(0, -1).join(' ').trim();
      if (name && name.length > 2) {
        tests.push({ name, price });
      }
    }
  }

  console.log(`Extracted ${tests.length} valid tests from PDF.`);

  if (tests.length === 0) {
    console.log('No tests found to seed.');
    return;
  }

  console.log('Cleaning up existing tests...');
  await prisma.testComponent.deleteMany({});
  await prisma.orderDetailTemplate.deleteMany({});
  await prisma.testMaster.deleteMany({});

  console.log('Seeding tests into database...');
  
  // Batch insert for performance
  const batchSize = 100;
  for (let i = 0; i < tests.length; i += batchSize) {
    const batch = tests.slice(i, i + batchSize);
    await prisma.testMaster.createMany({
      data: batch.map(t => ({
        testName: t.name,
        price: t.price,
        labId: 1,
        status: 'Active',
        category: 'General',
        testCode: t.name.substring(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, '-'),
        hasComponents: false
      })),
      skipDuplicates: true
    });
    console.log(`Seeded ${Math.min(i + batchSize, tests.length)} / ${tests.length} tests...`);
  }

  console.log('Total migration completed successfully.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
