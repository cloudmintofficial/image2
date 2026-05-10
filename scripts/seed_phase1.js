const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ordersToImplement = [
    {
      "order_id": "1",
      "order_name": "X-Ray LEFT ANKLE LAT",
      "category": "RADIOLOGY",
      "entry_type": "RICH_TEXT",
      "status": "Active",
      "amount": "400",
      "components": [],
      "template": {
        "editor": "Summernote",
        "raw_template": ""
      },
      "result_schema": {
        "render_mode": "NARRATIVE",
        "entry_mode": "EDITOR"
      }
    },
    {
      "order_id": "2",
      "order_name": "ANTI CCP",
      "category": "NUMERIC",
      "entry_type": "TEXT",
      "status": "Active",
      "amount": "1500",
      "components": [],
      "result_schema": {
        "render_mode": "SINGLE_FIELD",
        "entry_mode": "INPUT"
      }
    },
    {
      "order_id": "3",
      "order_name": "125-Di HYDROXYCHOLECALCIFEROL(VITAMIN D3)",
      "category": "NUMERIC",
      "entry_type": "TEXT",
      "status": "Active",
      "amount": "3200",
      "components": [],
      "result_schema": {
        "render_mode": "SINGLE_FIELD",
        "entry_mode": "INPUT"
      }
    },
    {
      "order_id": "16",
      "order_name": "17 - HYDROXY OH PROGESTERONE",
      "category": "PATHOLOGY",
      "entry_type": "MULTI_FIELD",
      "status": "Active",
      "amount": "1400",
      "components": [],
      "result_schema": {
        "render_mode": "GRID",
        "entry_mode": "ROW_BASED"
      }
    },
    {
      "order_id": "17",
      "order_name": "17 - KETOSTEROIDS",
      "category": "PATHOLOGY",
      "entry_type": "MULTI_FIELD",
      "status": "Active",
      "amount": "4500",
      "components": [],
      "result_schema": {
        "render_mode": "GRID",
        "entry_mode": "ROW_BASED"
      }
    },
    {
      "order_id": "18",
      "order_name": "17-alphavhydroxy progesterone(17-OHP)",
      "category": "BIO CHEMISTRY",
      "entry_type": "TEXT",
      "status": "Active",
      "amount": "1400",
      "components": [],
      "result_schema": {
        "render_mode": "SINGLE_FIELD",
        "entry_mode": "INPUT"
      }
    },
    {
      "order_id": "19",
      "order_name": "17-KETOSTEROIDS, 24 HOUR URINE",
      "category": "NUMERIC",
      "entry_type": "TEXT",
      "status": "Active",
      "amount": "6000",
      "components": [],
      "result_schema": {
        "render_mode": "SINGLE_FIELD",
        "entry_mode": "INPUT"
      }
    },
    {
      "order_id": "20",
      "order_name": "24 HOURS - VANILLYL MANDELIC ACID",
      "category": "NUMERIC",
      "entry_type": "TEXT",
      "status": "Active",
      "amount": "1600",
      "components": [],
      "result_schema": {
        "render_mode": "SINGLE_FIELD",
        "entry_mode": "INPUT"
      }
    },
    {
      "order_id": "21",
      "order_name": "24 HOURS URINE 5 HIAA",
      "category": "NUMERIC",
      "entry_type": "TEXT",
      "status": "Active",
      "amount": "3000",
      "components": [],
      "result_schema": {
        "render_mode": "SINGLE_FIELD",
        "entry_mode": "INPUT"
      }
    },
    {
      "order_id": "22",
      "order_name": "24 HOURS URINE ALDOSTERONE",
      "category": "PATHOLOGY",
      "entry_type": "MULTI_FIELD",
      "status": "Active",
      "amount": "2500",
      "components": [],
      "result_schema": {
        "render_mode": "GRID",
        "entry_mode": "ROW_BASED"
      }
    }
];

function mapUiType(entryType) {
    if (entryType === 'RICH_TEXT') return 'richtext';
    if (entryType === 'MULTI_FIELD') return 'panel';
    if (entryType === 'TEXT') return 'single';
    return 'richtext'; // Default fallback
}

async function main() {
  console.log("Starting to seed extracted Phase 1 orders into TestMaster...");
  
  // Need to get a valid labId to associate the tests with.
  const lab = await prisma.lab.findFirst();
  if (!lab) {
    console.error("No Lab found in database. Please seed a lab first.");
    return;
  }

  for (const order of ordersToImplement) {
    const hasComponents = order.entry_type === 'MULTI_FIELD';
    const uiType = mapUiType(order.entry_type);
    
    // We'll upsert based on testName so we don't create duplicates
    const test = await prisma.testMaster.upsert({
      where: { testName: order.order_name },
      update: {
        price: parseFloat(order.amount) || 0,
        category: order.category,
        uiType: uiType,
        hasComponents: hasComponents,
        status: order.status,
      },
      create: {
        testName: order.order_name,
        price: parseFloat(order.amount) || 0,
        category: order.category,
        uiType: uiType,
        hasComponents: hasComponents,
        status: order.status,
        labId: lab.id
      }
    });
    console.log(`✅ Upserted: ${test.testName} (${test.uiType})`);
  }
  
  console.log("Phase 1 orders implementation completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding phase 1 orders:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
