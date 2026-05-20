const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting restore process for Department and DoctorSignature tables...");

  // 1. Double check database counts before deleting
  const initialDeptCount = await prisma.department.count();
  const initialSigCount = await prisma.doctorSignature.count();
  console.log(`Current DB State: Department = ${initialDeptCount}, DoctorSignature = ${initialSigCount}`);

  // 2. Delete existing target records
  console.log("Deleting existing Department records...");
  await prisma.department.deleteMany({});
  
  console.log("Deleting existing DoctorSignature records...");
  await prisma.doctorSignature.deleteMany({});
  
  console.log("Database cleared for Department and DoctorSignature.");

  const pgRestorePath = '/opt/homebrew/Cellar/postgresql@18/18.3/bin/pg_restore';
  const dbUrl = 'postgresql://postgres:rZrxfgOjlJbpXUPGYYwFXRbWcgHLkxdi@66.33.22.242:53508/railway';
  const backupFilePath = '/Users/surya/My Projections/image2/Image backup v3';

  // 3. Restore Department
  console.log("Running pg_restore for Department...");
  const restoreDeptCmd = `"${pgRestorePath}" --data-only --table=Department --dbname="${dbUrl}" "${backupFilePath}"`;
  try {
    execSync(restoreDeptCmd, { stdio: 'inherit' });
    console.log("Department data restore completed.");
  } catch (error) {
    console.error("Department restore failed:", error.message);
    throw error;
  }

  // 4. Restore DoctorSignature
  console.log("Running pg_restore for DoctorSignature...");
  const restoreSigCmd = `"${pgRestorePath}" --data-only --table=DoctorSignature --dbname="${dbUrl}" "${backupFilePath}"`;
  try {
    execSync(restoreSigCmd, { stdio: 'inherit' });
    console.log("DoctorSignature data restore completed.");
  } catch (error) {
    console.error("DoctorSignature restore failed:", error.message);
    throw error;
  }

  // 5. Verify counts after restore
  const finalDeptCount = await prisma.department.count();
  const finalSigCount = await prisma.doctorSignature.count();
  console.log(`Restored DB State: Department = ${finalDeptCount}, DoctorSignature = ${finalSigCount}`);
}

main()
  .catch(e => {
    console.error("Error during restore:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
