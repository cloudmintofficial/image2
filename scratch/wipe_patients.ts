import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database wipe for patient data...');

  try {
    // 1. Delete Payments
    const payments = await prisma.payment.deleteMany({});
    console.log(`Deleted ${payments.count} payments.`);

    // 2. Delete OrderItems
    const orderItems = await prisma.orderItem.deleteMany({});
    console.log(`Deleted ${orderItems.count} order items.`);

    // 3. Delete Bills
    const bills = await prisma.bill.deleteMany({});
    console.log(`Deleted ${bills.count} bills.`);

    // 4. Delete Patients
    const patients = await prisma.patient.deleteMany({});
    console.log(`Deleted ${patients.count} patients.`);

    console.log('Database wipe completed successfully.');
  } catch (error) {
    console.error('Error wiping database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
