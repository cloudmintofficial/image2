import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding sample patient history...");

  // 1. Create a test patient (find first to avoid upsert unique issue)
  let patient = await prisma.patient.findFirst({ where: { phone: "9876543210" } });
  if (!patient) {
    patient = await prisma.patient.create({
      data: {
        name: "John Doe",
        phone: "9876543210",
        age: 45,
        gender: "M",
        source: "Walk-in"
      }
    });
  }

  console.log(`Patient ready: ${patient.name} (ID: ${patient.id}, UMR: ${patient.umr})`);

  // 3. Create past bills & orders for this patient
  const bill1 = await prisma.bill.create({
    data: {
      billNumber: Math.floor(Math.random() * 1000000),
      patientId: patient.id,
      totalBill: 500,
      paidAmount: 500,
      balance: 0,
      status: "Completed",
      createdBy: 1,
      labId: 1,
      billDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      orders: {
        create: [
          { orderName: "Complete Blood Picture", amount: 500, resultStatus: "Verified" }
        ]
      }
    }
  });

  const bill2 = await prisma.bill.create({
    data: {
      billNumber: Math.floor(Math.random() * 1000000),
      patientId: patient.id,
      totalBill: 1200,
      paidAmount: 1000,
      balance: 200,
      status: "InProcess",
      createdBy: 1,
      labId: 1,
      billDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      orders: {
        create: [
          { orderName: "Thyroid Profile", amount: 1200, resultStatus: "Pending" }
        ]
      }
    }
  });

  console.log("Sample patient history injected perfectly!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
