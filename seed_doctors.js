const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const fileContent = fs.readFileSync('doctors.txt', 'utf-8');
  const lines = fileContent.trim().split('\n');
  
  let inserted = 0;
  let skipped = 0;

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length >= 4) {
      const name = parts[0].trim();
      // parts[1] is Perc.toDoc
      let phone = parts[2].trim();
      const status = parts[3].trim() === 'Active' ? 'Active' : 'InActive';
      
      if (phone === '---' || !phone) {
        phone = null;
      }
      
      if (name) {
        try {
          await prisma.doctor.create({
            data: {
              name,
              phone,
              status
            }
          });
          inserted++;
        } catch (e) {
          console.error(`Failed to insert ${name}:`, e.message);
          skipped++;
        }
      }
    }
  }
  console.log(`Finished. Inserted: ${inserted}, Skipped: ${skipped}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
