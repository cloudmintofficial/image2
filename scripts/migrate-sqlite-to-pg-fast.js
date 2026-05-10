/**
 * migrate-sqlite-to-pg-fast.js
 * Fast bulk migration: SQLite (prisma/dev.db) → Railway PostgreSQL
 * Uses createMany + skipDuplicates for high-speed inserts
 * Run: node scripts/migrate-sqlite-to-pg-fast.js
 */

const Database = require("better-sqlite3");
const { PrismaClient } = require("@prisma/client");
const path = require("path");

const sqlite = new Database(path.join(__dirname, "../prisma/dev.db"), { readonly: true });
const pg = new PrismaClient();

function all(table) {
  return sqlite.prepare(`SELECT * FROM "${table}"`).all();
}

function bool(v) {
  return v === 1 || v === true;
}

function safeJson(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "object") return val;
  try { return JSON.parse(val); } catch { return null; }
}

function dt(v) {
  return v ? new Date(v) : new Date();
}

async function fixSeq(table, col = "id") {
  await pg.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"${table}"', '${col}'), COALESCE(MAX("${col}"), 1)) FROM "${table}"`
  );
}

async function migrate() {
  console.log("🚀 Fast migration: SQLite → Railway PostgreSQL\n");

  // ── Lab ──────────────────────────────────────────────────
  const labs = all("Lab");
  console.log(`📦 Labs: ${labs.length}`);
  await pg.lab.createMany({
    data: labs.map(r => ({
      id: r.id, labName: r.labName, labAddress: r.labAddress,
      contactPerson: r.contactPerson, primaryPhone: r.primaryPhone,
      email: r.email, logo: r.logo, status: r.status,
      createdAt: dt(r.createdAt),
    })),
    skipDuplicates: true,
  });
  await fixSeq("Lab");
  console.log("  ✅ Done");

  // ── User ─────────────────────────────────────────────────
  const users = all("User");
  console.log(`📦 Users: ${users.length}`);
  await pg.user.createMany({
    data: users.map(r => ({
      id: r.id, username: r.username, passwordHash: r.passwordHash,
      displayName: r.displayName, role: r.role, status: r.status,
      labId: r.labId, createdAt: dt(r.createdAt),
    })),
    skipDuplicates: true,
  });
  await fixSeq("User");
  console.log("  ✅ Done");

  // ── Patient ──────────────────────────────────────────────
  const patients = all("Patient");
  console.log(`📦 Patients: ${patients.length}`);
  await pg.patient.createMany({
    data: patients.map(r => ({
      id: r.id, umr: r.umr, name: r.name, age: r.age,
      gender: r.gender, phone: r.phone, source: r.source,
      externalId: r.externalId, email: r.email, photoUrl: r.photoUrl,
      additionalDetails: safeJson(r.additionalDetails),
      createdAt: dt(r.createdAt),
    })),
    skipDuplicates: true,
  });
  await fixSeq("Patient");
  console.log("  ✅ Done");

  // ── Doctor (bulk, 500/batch) ──────────────────────────────
  const doctors = all("Doctor");
  console.log(`📦 Doctors: ${doctors.length}`);
  const DBATCH = 500;
  for (let i = 0; i < doctors.length; i += DBATCH) {
    const batch = doctors.slice(i, i + DBATCH);
    await pg.doctor.createMany({
      data: batch.map(r => ({
        id: r.id, name: r.name, type: r.type,
        percentage: r.percentage, address: r.address,
        phone: r.phone, email: r.email, department: r.department,
        specialization: r.specialization, location: r.location,
        hospital: r.hospital, salesExecutive: r.salesExecutive,
        status: r.status, createdAt: dt(r.createdAt),
      })),
      skipDuplicates: true,
    });
    process.stdout.write(`  ⏳ ${Math.min(i + DBATCH, doctors.length)}/${doctors.length}\r`);
  }
  await fixSeq("Doctor");
  console.log("\n  ✅ Done");

  // ── TestMaster (bulk, 500/batch) ──────────────────────────
  const tests = all("TestMaster");
  console.log(`📦 TestMasters: ${tests.length}`);
  for (let i = 0; i < tests.length; i += DBATCH) {
    const batch = tests.slice(i, i + DBATCH);
    await pg.testMaster.createMany({
      data: batch.map(r => ({
        id: r.id, testName: r.testName,
        hasComponents: bool(r.hasComponents),
        testCode: r.testCode, displayOrderName: r.displayOrderName,
        category: r.category, price: r.price,
        department: r.department, processTime: r.processTime,
        machineName: r.machineName, sampleType: r.sampleType,
        method: r.method, resultNotes: r.resultNotes,
        advice: r.advice, workSheet: r.workSheet,
        purpose: r.purpose, orderType: r.orderType,
        ipBillingCategoryType: r.ipBillingCategoryType,
        recurring: bool(r.recurring),
        serviceDoctorRequired: bool(r.serviceDoctorRequired),
        resultTemplate: r.resultTemplate, uiType: r.uiType,
        status: r.status, labId: r.labId,
      })),
      skipDuplicates: true,
    });
    process.stdout.write(`  ⏳ ${Math.min(i + DBATCH, tests.length)}/${tests.length}\r`);
  }
  await fixSeq("TestMaster");
  console.log("\n  ✅ Done");

  // ── TestComponent ─────────────────────────────────────────
  const components = all("TestComponent");
  console.log(`📦 TestComponents: ${components.length}`);
  await pg.testComponent.createMany({
    data: components.map(r => ({
      id: r.id, testId: r.testId, componentName: r.componentName,
      unit: r.unit, normalRange: r.normalRange,
      minMale: r.minMale, maxMale: r.maxMale,
      minFemale: r.minFemale, maxFemale: r.maxFemale,
      method: r.method, sortOrder: r.sortOrder ?? 0,
      fieldType: r.fieldType ?? "number", options: r.options,
    })),
    skipDuplicates: true,
  });
  await fixSeq("TestComponent");
  console.log("  ✅ Done");

  // ── Bill ─────────────────────────────────────────────────
  const bills = all("Bill");
  console.log(`📦 Bills: ${bills.length}`);
  await pg.bill.createMany({
    data: bills.map(r => ({
      id: r.id, billNumber: r.billNumber,
      billDate: dt(r.billDate), patientId: r.patientId,
      doctorId: r.doctorId, totalBill: r.totalBill,
      discount: r.discount, discountReason: r.discountReason,
      paidAmount: r.paidAmount, balance: r.balance,
      status: r.status, createdBy: r.createdBy,
      labId: r.labId, createdAt: dt(r.createdAt),
      updatedAt: dt(r.updatedAt),
    })),
    skipDuplicates: true,
  });
  await fixSeq("Bill");
  console.log("  ✅ Done");

  // ── OrderItem ─────────────────────────────────────────────
  const orders = all("OrderItem");
  console.log(`📦 OrderItems: ${orders.length}`);
  await pg.orderItem.createMany({
    data: orders.map(r => ({
      id: r.id, billId: r.billId, orderName: r.orderName,
      orderDate: dt(r.orderDate), amount: r.amount,
      resultStatus: r.resultStatus, resultData: r.resultData,
      resultMethod: r.resultMethod, resultDoctor: r.resultDoctor,
      resultAdvice: r.resultAdvice, signatureId: r.signatureId,
      verifiedBy: r.verifiedBy,
      verifiedAt: r.verifiedAt ? new Date(r.verifiedAt) : null,
      createdAt: dt(r.createdAt),
    })),
    skipDuplicates: true,
  });
  await fixSeq("OrderItem");
  console.log("  ✅ Done");

  // ── Payment ───────────────────────────────────────────────
  const payments = all("Payment");
  console.log(`📦 Payments: ${payments.length}`);
  await pg.payment.createMany({
    data: payments.map(r => ({
      id: r.id, billId: r.billId, amount: r.amount,
      method: r.method, reference: r.reference,
      userId: r.userId, paidAt: dt(r.paidAt),
    })),
    skipDuplicates: true,
  });
  await fixSeq("Payment");
  console.log("  ✅ Done");

  // ── Expense ───────────────────────────────────────────────
  const expenses = all("Expense");
  console.log(`📦 Expenses: ${expenses.length}`);
  if (expenses.length > 0) {
    await pg.expense.createMany({
      data: expenses.map(r => ({
        id: r.id, description: r.description, amount: r.amount,
        category: r.category, expenseDate: dt(r.expenseDate),
        createdBy: r.createdBy, labId: r.labId, createdAt: dt(r.createdAt),
      })),
      skipDuplicates: true,
    });
    await fixSeq("Expense");
  }
  console.log("  ✅ Done");

  // ── Source (bulk, 500/batch) ──────────────────────────────
  const sources = all("Source");
  console.log(`📦 Sources: ${sources.length}`);
  for (let i = 0; i < sources.length; i += DBATCH) {
    const batch = sources.slice(i, i + DBATCH);
    await pg.source.createMany({
      data: batch.map(r => ({
        id: r.id, name: r.name, status: r.status, createdAt: dt(r.createdAt),
      })),
      skipDuplicates: true,
    });
    process.stdout.write(`  ⏳ ${Math.min(i + DBATCH, sources.length)}/${sources.length}\r`);
  }
  await fixSeq("Source");
  console.log("\n  ✅ Done");

  // ── DoctorSignature ───────────────────────────────────────
  const sigs = all("DoctorSignature");
  console.log(`📦 DoctorSignatures: ${sigs.length}`);
  await pg.doctorSignature.createMany({
    data: sigs.map(r => ({
      id: r.id, label: r.label, name: r.name, title: r.title,
      signText: r.signText, imageData: r.imageData,
      status: r.status, createdAt: dt(r.createdAt),
    })),
    skipDuplicates: true,
  });
  console.log("  ✅ Done");

  console.log("\n🎉 Migration complete! All data is now on Railway PostgreSQL.");
}

migrate()
  .catch((e) => {
    console.error("\n❌ Migration failed:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await pg.$disconnect();
    sqlite.close();
  });
