const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bills = await prisma.bill.findMany({
    include: {
      patient: true,
      orders: true
    },
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(JSON.stringify(bills.map(b => ({
    billNo: b.billNumber,
    patientName: b.patient.name,
    gender: b.patient.gender,
    orders: b.orders.map(o => o.orderName).join(', ')
  })), null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
