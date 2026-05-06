const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const fileContent = fs.readFileSync('imagee_diagnostics_db.json', 'utf-8');
  const data = JSON.parse(fileContent);
  const orders = data.orders;

  let inserted = 0;
  let skipped = 0;

  console.log(`Found ${orders.length} orders in JSON file. Seeding...`);

  for (const order of orders) {
    const testName = order.order_name;
    const price = order.amount_inr || 0;
    const category = order.category || 'General';
    const reportType = order.report_type;

    let uiType = 'richtext';
    if (reportType === 'numeric') {
      uiType = 'panel';
    } else if (reportType === 'qualitative') {
      if (category === 'Microbiology') {
        uiType = 'microbiology';
      } else {
        uiType = 'immunology';
      }
    } else if (reportType === 'narrative') {
      uiType = 'richtext';
    }

    try {
      await prisma.testMaster.upsert({
        where: { testName },
        update: {
          price,
          category,
          uiType,
          status: 'Active'
        },
        create: {
          testName,
          price,
          category,
          uiType,
          status: 'Active',
          labId: 1
        }
      });
      inserted++;
      if (inserted % 100 === 0) {
        console.log(`Progress: ${inserted}/${orders.length} processed...`);
      }
    } catch (e) {
      console.error(`Failed to insert ${testName}:`, e.message);
      skipped++;
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
