import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const test = await prisma.testMaster.create({
      data: {
        testName: "Test Auto",
        hasComponents: false,
        testCode: "TC1",
        displayOrderName: "",
        department: "HEMATOLOGY",
        price: 100,
        processTime: "",
        machineName: "",
        sampleType: null,
        method: "",
        resultNotes: "",
        advice: "",
        workSheet: "",
        purpose: "",
        category: 'General',
        orderType: 'Internal',
        ipBillingCategoryType: null,
        recurring: false,
        serviceDoctorRequired: false,
        status: 'Active',
        labId: 1
      }
    });
    console.log("Success:", test);
  } catch (e) {
    console.error("Prisma Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
