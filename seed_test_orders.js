const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cbpTest = await prisma.testMaster.findFirst({ where: { testName: { contains: "COMPLETE BLOOD PICTURE" } } });
  if (!cbpTest) return console.log("CBP test not found");

  const lab = await prisma.lab.findFirst();
  const user = await prisma.user.findFirst();

  // Create Male Patient Bill
  const patientM = await prisma.patient.create({
    data: { name: "Test Male Reference", gender: "M", age: 30, phone: "1111111111" }
  });
  
  const lastBillM = await prisma.bill.findFirst({ orderBy: { billNumber: 'desc' } });
  const newBillNoM = (lastBillM?.billNumber || 1000) + 1;

  await prisma.bill.create({
    data: {
      billNumber: newBillNoM,
      patientId: patientM.id,
      labId: lab.id,
      createdBy: user.id,
      totalBill: cbpTest.price,
      balance: 0,
      paidAmount: cbpTest.price,
      orders: {
        create: [{ orderName: cbpTest.testName, amount: cbpTest.price, resultStatus: "Pending" }]
      }
    }
  });

  // Create Female Patient Bill
  const patientF = await prisma.patient.create({
    data: { name: "Test Female Reference", gender: "F", age: 30, phone: "2222222222" }
  });

  const lastBillF = await prisma.bill.findFirst({ orderBy: { billNumber: 'desc' } });
  const newBillNoF = (lastBillF?.billNumber || 1000) + 1;

  await prisma.bill.create({
    data: {
      billNumber: newBillNoF,
      patientId: patientF.id,
      labId: lab.id,
      createdBy: user.id,
      totalBill: cbpTest.price,
      balance: 0,
      paidAmount: cbpTest.price,
      orders: {
        create: [{ orderName: cbpTest.testName, amount: cbpTest.price, resultStatus: "Pending" }]
      }
    }
  });

  console.log("Created test orders for Male and Female!");
}
main().catch(console.error).finally(() => prisma.$disconnect());
