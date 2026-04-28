const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const fileContent = fs.readFileSync('orders.txt', 'utf-8');
  const lines = fileContent.trim().split('\n');
  
  let inserted = 0;
  let skipped = 0;

  for (const line of lines) {
    if (!line.trim()) continue;
    
    const parts = line.split('\t');
    if (parts.length >= 4) {
      const testName = parts[0].trim();
      const priceStr = parts[1].trim();
      const category = parts[2].trim() || 'Internal';
      const status = parts[3].trim() === 'Active' ? 'Active' : 'InActive';
      const price = parseFloat(priceStr) || 0;
      
      if (testName) {
        try {
          await prisma.testMaster.upsert({
            where: { testName },
            update: {
              price,
              category,
              status
            },
            create: {
              testName,
              price,
              category,
              status,
              labId: 1
            }
          });
          inserted++;
        } catch (e) {
          console.error(`Failed to insert ${testName}:`, e.message);
          skipped++;
        }
      }
    }
  }
  console.log(`Finished. Inserted/Updated: ${inserted}, Skipped: ${skipped}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
