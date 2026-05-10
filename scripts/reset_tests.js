const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetTests() {
  console.log("🚀 Starting reset of all test templates and components...");

  try {
    // 1. Delete all components
    const deletedComponents = await prisma.testComponent.deleteMany({});
    console.log(`✅ Deleted ${deletedComponents.count} test components.`);

    // 2. Reset TestMaster fields to defaults
    const updatedTests = await prisma.testMaster.updateMany({
      data: {
        hasComponents: false,
        resultTemplate: null,
        uiType: 'richtext',
      }
    });
    console.log(`✅ Reset templates and uiType for ${updatedTests.count} tests.`);

    console.log("🎉 All tests are now clean and ready to be populated from scratch!");
  } catch (error) {
    console.error("❌ Error resetting data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetTests();
