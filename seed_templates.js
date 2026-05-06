const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const fileContent = fs.readFileSync('imagee_diagnostics_db.json', 'utf-8');
  const dbJson = JSON.parse(fileContent);

  const narrativeTemplate = dbJson.report_templates?.narrative;
  let narrativeHtml = '';
  if (narrativeTemplate) {
    narrativeHtml += `<h2><strong>SCAN TITLE</strong></h2>`;
    narrativeHtml += `<h3><strong>TECHNIQUE:</strong></h3><p><br></p>`;
    narrativeHtml += `<h3><strong>FINDINGS:</strong></h3>`;
    if (narrativeTemplate.subsections?.findings) {
      narrativeTemplate.subsections.findings.forEach(f => {
        const title = f.replace('_', ' ').toUpperCase();
        narrativeHtml += `<p><strong>${title}:</strong> </p>`;
      });
    }
    narrativeHtml += `<p><br></p>`;
    narrativeHtml += `<h3><strong>IMPRESSION:</strong></h3>`;
    if (narrativeTemplate.subsections?.impression) {
      narrativeTemplate.subsections.impression.forEach(i => {
        const title = i.replace('_', ' ').toUpperCase();
        narrativeHtml += `<p><strong>${title}:</strong> </p>`;
      });
    }
  } else {
    narrativeHtml = `<h3><strong>FINDINGS:</strong></h3><p><br></p><h3><strong>IMPRESSION:</strong></h3><p><br></p>`;
  }

  // Update all richtext/narrative tests with this template
  const updatedNarrative = await prisma.testMaster.updateMany({
    where: { uiType: 'richtext', resultTemplate: null },
    data: { resultTemplate: narrativeHtml }
  });
  console.log(`Updated ${updatedNarrative.count} narrative/richtext tests with default template.`);

  // Create default components for a few numeric/panel tests
  // Let's find "COMPLETE BLOOD PICTURE"
  const cbpTest = await prisma.testMaster.findFirst({ where: { testName: { contains: "COMPLETE BLOOD PICTURE" } } });
  if (cbpTest) {
    const comps = await prisma.testComponent.count({ where: { testId: cbpTest.id } });
    if (comps === 0) {
      await prisma.testMaster.update({
        where: { id: cbpTest.id },
        data: { hasComponents: true }
      });
      await prisma.testComponent.createMany({
        data: [
          { testId: cbpTest.id, componentName: 'Haemoglobin', unit: 'g/dL', minMale: 13, maxMale: 17, minFemale: 12, maxFemale: 15, sortOrder: 1 },
          { testId: cbpTest.id, componentName: 'Total WBC Count', unit: 'cells/cumm', minMale: 4000, maxMale: 10000, minFemale: 4000, maxFemale: 10000, sortOrder: 2 },
          { testId: cbpTest.id, componentName: 'RBC Count', unit: 'mill/cumm', minMale: 4.5, maxMale: 5.5, minFemale: 3.8, maxFemale: 4.8, sortOrder: 3 },
          { testId: cbpTest.id, componentName: 'Platelet Count', unit: 'lakhs/cumm', minMale: 1.5, maxMale: 4.5, minFemale: 1.5, maxFemale: 4.5, sortOrder: 4 }
        ]
      });
      console.log('Created components for COMPLETE BLOOD PICTURE');
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
