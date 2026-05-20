const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting restore process from backup file in correct sequence...");

  // 1. Double check database counts before deleting
  const initialCompCount = await prisma.testComponent.count();
  const initialMasterCount = await prisma.testMaster.count();
  console.log(`Current DB State: TestMaster = ${initialMasterCount}, TestComponent = ${initialCompCount}`);

  // 2. Delete existing target records
  console.log("Deleting existing TestComponent records...");
  await prisma.testComponent.deleteMany({});
  
  console.log("Deleting existing TestMaster records...");
  await prisma.testMaster.deleteMany({});
  
  console.log("Database cleared for target tables.");

  // 3. Construct pg_restore parameters
  const pgRestorePath = '/opt/homebrew/Cellar/postgresql@18/18.3/bin/pg_restore';
  const dbUrl = 'postgresql://postgres:rZrxfgOjlJbpXUPGYYwFXRbWcgHLkxdi@66.33.22.242:53508/railway';
  const backupFilePath = '/Users/surya/My Projections/image2/Image backup v3';

  // 4. Restore TestMaster (parent) first
  console.log("Running pg_restore for TestMaster (parent table)...");
  const restoreMasterCmd = `"${pgRestorePath}" --data-only --table=TestMaster --dbname="${dbUrl}" "${backupFilePath}"`;
  try {
    execSync(restoreMasterCmd, { stdio: 'inherit' });
    console.log("TestMaster data restore completed.");
  } catch (error) {
    console.error("TestMaster restore failed:", error.message);
    throw error;
  }

  // 5. Restore TestComponent (child) second
  console.log("Running pg_restore for TestComponent (child table)...");
  const restoreComponentCmd = `"${pgRestorePath}" --data-only --table=TestComponent --dbname="${dbUrl}" "${backupFilePath}"`;
  try {
    execSync(restoreComponentCmd, { stdio: 'inherit' });
    console.log("TestComponent data restore completed.");
  } catch (error) {
    console.error("TestComponent restore failed:", error.message);
    throw error;
  }

  // 6. Verify counts after restore
  const finalCompCount = await prisma.testComponent.count();
  const finalMasterCount = await prisma.testMaster.count();
  console.log(`Restored DB State: TestMaster = ${finalMasterCount}, TestComponent = ${finalCompCount}`);

  // 7. Verify one of the records
  const sample = await prisma.testMaster.findFirst({
    where: { testName: { contains: 'urine Urea', mode: 'insensitive' } }
  });
  console.log("Sample check (urine Urea):", sample);
}

main()
  .catch(e => {
    console.error("Error during restore:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
