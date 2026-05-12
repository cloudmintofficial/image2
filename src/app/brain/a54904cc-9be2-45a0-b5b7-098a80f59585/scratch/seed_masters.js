const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orderTypes = [
    'Internal', 'Consulting', 'External', 'Dental', 'Xray', 'Scanning', 
    'Services', 'OPG XRay', 'ECG', 'Room', 'Hospitality'
  ];

  const billingCategories = [
    'LABORATORY', 'RADIOLOGY', 'CONSULTATION', 'PHARMACY', 'WARD'
  ];

  console.log('Seeding Master Data...');

  for (const name of orderTypes) {
    await prisma.$executeRawUnsafe('INSERT INTO "OrderType" (name, status) VALUES ($1, \'Active\') ON CONFLICT (name) DO NOTHING', name);
  }
  console.log('Order Types seeded.');

  for (const name of billingCategories) {
    await prisma.$executeRawUnsafe('INSERT INTO "IPBillingCategory" (name, status) VALUES ($1, \'Active\') ON CONFLICT (name) DO NOTHING', name);
  }
  console.log('Billing Categories seeded.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
