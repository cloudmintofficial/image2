/**
 * migrate-sqlite-to-pg.js
 * Migrates all data from local SQLite (prisma/dev.db) → Railway PostgreSQL
 * Run: node scripts/migrate-sqlite-to-pg.js
 */

const Database = require("better-sqlite3");
const { PrismaClient } = require("@prisma/client");
const path = require("path");

const sqlite = new Database(path.join(__dirname, "../prisma/dev.db"), {
  readonly: true,
});
const pg = new PrismaClient();

function all(table) {
  return sqlite.prepare(`SELECT * FROM "${table}"`).all();
}

function safeJson(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return val; // fallback: return as-is
  }
}

async function migrate() {
  console.log("🚀 Starting migration: SQLite → Railway PostgreSQL\n");

  // ── 1. Lab ────────────────────────────────────────────────
  const labs = all("Lab");
  console.log(`📦 Migrating ${labs.length} Labs...`);
  for (const r of labs) {
    await pg.lab.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        labName: r.labName,
        labAddress: r.labAddress,
        contactPerson: r.contactPerson,
        primaryPhone: r.primaryPhone,
        email: r.email,
        logo: r.logo,
        status: r.status,
        createdAt: new Date(r.createdAt),
      },
    });
  }
  console.log("  ✅ Labs done");

  // ── 2. User ───────────────────────────────────────────────
  const users = all("User");
  console.log(`📦 Migrating ${users.length} Users...`);
  for (const r of users) {
    await pg.user.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        username: r.username,
        passwordHash: r.passwordHash,
        displayName: r.displayName,
        role: r.role,
        status: r.status,
        labId: r.labId,
        createdAt: new Date(r.createdAt),
      },
    });
  }
  console.log("  ✅ Users done");

  // ── 3. Patient ────────────────────────────────────────────
  const patients = all("Patient");
  console.log(`📦 Migrating ${patients.length} Patients...`);
  for (const r of patients) {
    await pg.patient.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        umr: r.umr,
        name: r.name,
        age: r.age,
        gender: r.gender,
        phone: r.phone,
        source: r.source,
        externalId: r.externalId,
        email: r.email,
        photoUrl: r.photoUrl,
        additionalDetails: safeJson(r.additionalDetails),
        createdAt: new Date(r.createdAt),
      },
    });
  }
  console.log("  ✅ Patients done");

  // ── 4. Doctor ─────────────────────────────────────────────
  const doctors = all("Doctor");
  console.log(`📦 Migrating ${doctors.length} Doctors...`);
  const BATCH = 100;
  for (let i = 0; i < doctors.length; i += BATCH) {
    const batch = doctors.slice(i, i + BATCH);
    await pg.$transaction(
      batch.map((r) =>
        pg.doctor.upsert({
          where: { id: r.id },
          update: {},
          create: {
            id: r.id,
            name: r.name,
            type: r.type,
            percentage: r.percentage,
            address: r.address,
            phone: r.phone,
            email: r.email,
            department: r.department,
            specialization: r.specialization,
            location: r.location,
            hospital: r.hospital,
            salesExecutive: r.salesExecutive,
            status: r.status,
            createdAt: new Date(r.createdAt),
          },
        })
      )
    );
    process.stdout.write(`  ⏳ Doctors: ${Math.min(i + BATCH, doctors.length)}/${doctors.length}\r`);
  }
  console.log("\n  ✅ Doctors done");

  // ── 5. TestMaster ─────────────────────────────────────────
  const tests = all("TestMaster");
  console.log(`📦 Migrating ${tests.length} TestMasters...`);
  for (let i = 0; i < tests.length; i += BATCH) {
    const batch = tests.slice(i, i + BATCH);
    await pg.$transaction(
      batch.map((r) =>
        pg.testMaster.upsert({
          where: { id: r.id },
          update: {},
          create: {
            id: r.id,
            testName: r.testName,
            hasComponents: r.hasComponents === 1 || r.hasComponents === true,
            testCode: r.testCode,
            displayOrderName: r.displayOrderName,
            category: r.category,
            price: r.price,
            department: r.department,
            processTime: r.processTime,
            machineName: r.machineName,
            sampleType: r.sampleType,
            method: r.method,
            resultNotes: r.resultNotes,
            advice: r.advice,
            workSheet: r.workSheet,
            purpose: r.purpose,
            orderType: r.orderType,
            ipBillingCategoryType: r.ipBillingCategoryType,
            recurring: r.recurring === 1 || r.recurring === true,
            serviceDoctorRequired: r.serviceDoctorRequired === 1 || r.serviceDoctorRequired === true,
            resultTemplate: r.resultTemplate,
            uiType: r.uiType,
            status: r.status,
            labId: r.labId,
          },
        })
      )
    );
    process.stdout.write(`  ⏳ TestMasters: ${Math.min(i + BATCH, tests.length)}/${tests.length}\r`);
  }
  console.log("\n  ✅ TestMasters done");

  // ── 6. TestComponent ──────────────────────────────────────
  const components = all("TestComponent");
  console.log(`📦 Migrating ${components.length} TestComponents...`);
  for (const r of components) {
    await pg.testComponent.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        testId: r.testId,
        componentName: r.componentName,
        unit: r.unit,
        normalRange: r.normalRange,
        minMale: r.minMale,
        maxMale: r.maxMale,
        minFemale: r.minFemale,
        maxFemale: r.maxFemale,
        method: r.method,
        sortOrder: r.sortOrder,
        fieldType: r.fieldType,
        options: r.options,
      },
    });
  }
  console.log("  ✅ TestComponents done");

  // ── 7. Bill ───────────────────────────────────────────────
  const bills = all("Bill");
  console.log(`📦 Migrating ${bills.length} Bills...`);
  for (const r of bills) {
    await pg.bill.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        billNumber: r.billNumber,
        billDate: new Date(r.billDate),
        patientId: r.patientId,
        doctorId: r.doctorId,
        totalBill: r.totalBill,
        discount: r.discount,
        discountReason: r.discountReason,
        paidAmount: r.paidAmount,
        balance: r.balance,
        status: r.status,
        createdBy: r.createdBy,
        labId: r.labId,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      },
    });
  }
  console.log("  ✅ Bills done");

  // ── 8. OrderItem ──────────────────────────────────────────
  const orders = all("OrderItem");
  console.log(`📦 Migrating ${orders.length} OrderItems...`);
  for (const r of orders) {
    await pg.orderItem.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        billId: r.billId,
        orderName: r.orderName,
        orderDate: new Date(r.orderDate),
        amount: r.amount,
        resultStatus: r.resultStatus,
        resultData: r.resultData,
        resultMethod: r.resultMethod,
        resultDoctor: r.resultDoctor,
        resultAdvice: r.resultAdvice,
        signatureId: r.signatureId,
        verifiedBy: r.verifiedBy,
        verifiedAt: r.verifiedAt ? new Date(r.verifiedAt) : null,
        createdAt: new Date(r.createdAt),
      },
    });
  }
  console.log("  ✅ OrderItems done");

  // ── 9. Payment ────────────────────────────────────────────
  const payments = all("Payment");
  console.log(`📦 Migrating ${payments.length} Payments...`);
  for (const r of payments) {
    await pg.payment.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        billId: r.billId,
        amount: r.amount,
        method: r.method,
        reference: r.reference,
        userId: r.userId,
        paidAt: new Date(r.paidAt),
      },
    });
  }
  console.log("  ✅ Payments done");

  // ── 10. Source ────────────────────────────────────────────
  const sources = all("Source");
  console.log(`📦 Migrating ${sources.length} Sources...`);
  for (let i = 0; i < sources.length; i += BATCH) {
    const batch = sources.slice(i, i + BATCH);
    await pg.$transaction(
      batch.map((r) =>
        pg.source.upsert({
          where: { id: r.id },
          update: {},
          create: {
            id: r.id,
            name: r.name,
            status: r.status,
            createdAt: new Date(r.createdAt),
          },
        })
      )
    );
    process.stdout.write(`  ⏳ Sources: ${Math.min(i + BATCH, sources.length)}/${sources.length}\r`);
  }
  console.log("\n  ✅ Sources done");

  // ── 11. DoctorSignature ───────────────────────────────────
  const sigs = all("DoctorSignature");
  console.log(`📦 Migrating ${sigs.length} DoctorSignatures...`);
  for (const r of sigs) {
    await pg.doctorSignature.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        label: r.label,
        name: r.name,
        title: r.title,
        signText: r.signText,
        imageData: r.imageData,
        status: r.status,
        createdAt: new Date(r.createdAt),
      },
    });
  }
  console.log("  ✅ DoctorSignatures done");

  // ── Fix PostgreSQL sequences ──────────────────────────────
  console.log("\n🔧 Resetting PostgreSQL auto-increment sequences...");
  const tables = [
    "Lab", "User", "Patient", "Doctor", "Bill",
    "OrderItem", "Payment", "TestMaster", "TestComponent",
    "Expense", "Source", "AuditLog",
  ];
  for (const t of tables) {
    await pg.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${t}"', 'id'), COALESCE(MAX(id), 1)) FROM "${t}"`
    );
  }
  console.log("  ✅ Sequences reset\n");

  console.log("🎉 Migration complete! All data is now on Railway PostgreSQL.");
}

migrate()
  .catch((e) => {
    console.error("\n❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pg.$disconnect();
    sqlite.close();
  });
