import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Test classification rules
const RADIOLOGY_KEYWORDS = ['USG', 'CT ', 'CT-', 'CECT', 'MRI', 'X-RAY', 'X RAY', 'XRAY', 'DOPPLER', 'ECHO', 'SCAN', 'ANGIO', 'MAMMOGRAPHY', 'DEXA', 'FLUOROSCOPY', 'PET', 'BARIUM', 'IVP', 'MCU', 'HSG', 'FISTULOGRAM', '3D CT', '3D FACE', 'SCREENING', 'ANTENATAL', 'ANOMALY', 'NT SCAN', 'GROWTH SCAN'];
const PANEL_KEYWORDS = ['CBC', 'CBP', 'COMPLETE BLOOD', 'HAEMOGRAM', 'RFT', 'RENAL FUNCTION', 'LFT', 'LIVER FUNCTION', 'KFT', 'KIDNEY FUNCTION', 'LIPID PROFILE', 'THYROID PROFILE', 'COAGULATION', 'ELECTROLYTE', 'ANEMIA PROFILE', 'IRON PROFILE', 'TORCH', 'PANCREATIC', 'DIABETIC PROFILE', 'GTT'];
const CULTURE_KEYWORDS = ['CULTURE', 'AFB', 'SENSITIVITY', 'ANAEROBIC'];
const SINGLE_KEYWORDS = ['BLOOD SUGAR', 'FBS', 'PLBS', 'PPBS', 'RBS', 'CREATININE', 'UREA', 'URIC ACID', 'HEMOGLOBIN', 'HAEMOGLOBIN', 'ESR', 'WIDAL', 'CRP', 'HBA1C', 'TSH', 'VITAMIN', 'CALCIUM', 'SODIUM', 'POTASSIUM', 'CHOLESTEROL', 'TRIGLYCERIDE', 'BILIRUBIN', 'ALBUMIN', 'PROTEIN', 'TROPONIN', 'FERRITIN', 'PSA', 'HCG', 'PROLACTIN', 'CORTISOL', 'INSULIN', 'BLOOD GROUP', 'ECG'];

function classifyTest(name: string): string {
  const upper = name.toUpperCase();
  if (RADIOLOGY_KEYWORDS.some(k => upper.includes(k))) return 'richtext';
  if (PANEL_KEYWORDS.some(k => upper.includes(k))) return 'panel';
  if (CULTURE_KEYWORDS.some(k => upper.includes(k))) return 'microbiology';
  if (SINGLE_KEYWORDS.some(k => upper.includes(k))) return 'single';
  return 'richtext'; // default for unclassified
}

// Panel component definitions
const PANEL_COMPONENTS: Record<string, Array<{ componentName: string; unit: string; normalRange: string; method?: string }>> = {
  'CBC': [
    { componentName: 'Hemoglobin (Hb)', unit: 'g/dL', normalRange: 'M: 13.0-17.0 | F: 12.0-15.0', method: 'Automated' },
    { componentName: 'Total WBC Count', unit: 'cells/cumm', normalRange: '4000 - 11000', method: 'Automated' },
    { componentName: 'RBC Count', unit: 'mill/cumm', normalRange: 'M: 4.5-5.5 | F: 3.8-4.8', method: 'Automated' },
    { componentName: 'Platelet Count', unit: 'lakhs/cumm', normalRange: '1.5 - 4.0', method: 'Automated' },
    { componentName: 'PCV / Hematocrit', unit: '%', normalRange: 'M: 40-50 | F: 36-44', method: 'Automated' },
    { componentName: 'MCV', unit: 'fL', normalRange: '83 - 101', method: 'Automated' },
    { componentName: 'MCH', unit: 'pg', normalRange: '27 - 32', method: 'Automated' },
    { componentName: 'MCHC', unit: 'g/dL', normalRange: '31.5 - 34.5', method: 'Automated' },
    { componentName: 'RDW', unit: '%', normalRange: '11.6 - 14.0', method: 'Automated' },
    { componentName: 'Neutrophils', unit: '%', normalRange: '40 - 80', method: 'Automated' },
    { componentName: 'Lymphocytes', unit: '%', normalRange: '20 - 40', method: 'Automated' },
    { componentName: 'Eosinophils', unit: '%', normalRange: '1 - 6', method: 'Automated' },
    { componentName: 'Monocytes', unit: '%', normalRange: '2 - 10', method: 'Automated' },
    { componentName: 'Basophils', unit: '%', normalRange: '0 - 2', method: 'Automated' },
    { componentName: 'ESR', unit: 'mm/hr', normalRange: 'M: 0-10 | F: 0-20', method: 'Westergren' },
  ],
  'LFT': [
    { componentName: 'Total Bilirubin', unit: 'mg/dL', normalRange: '0.1 - 1.2' },
    { componentName: 'Direct Bilirubin', unit: 'mg/dL', normalRange: '0.0 - 0.3' },
    { componentName: 'Indirect Bilirubin', unit: 'mg/dL', normalRange: '0.1 - 0.9' },
    { componentName: 'SGOT (AST)', unit: 'U/L', normalRange: '0 - 40' },
    { componentName: 'SGPT (ALT)', unit: 'U/L', normalRange: '0 - 41' },
    { componentName: 'Alkaline Phosphatase', unit: 'U/L', normalRange: '44 - 147' },
    { componentName: 'Total Protein', unit: 'g/dL', normalRange: '6.0 - 8.3' },
    { componentName: 'Albumin', unit: 'g/dL', normalRange: '3.5 - 5.2' },
    { componentName: 'Globulin', unit: 'g/dL', normalRange: '2.0 - 3.5' },
    { componentName: 'A/G Ratio', unit: '', normalRange: '1.0 - 2.2' },
    { componentName: 'GGT', unit: 'U/L', normalRange: 'M: 8-61 | F: 5-36' },
  ],
  'RFT': [
    { componentName: 'Blood Urea', unit: 'mg/dL', normalRange: '15 - 40' },
    { componentName: 'Serum Creatinine', unit: 'mg/dL', normalRange: '0.7 - 1.3' },
    { componentName: 'Uric Acid', unit: 'mg/dL', normalRange: 'M: 3.4-7.0 | F: 2.4-5.7' },
    { componentName: 'BUN', unit: 'mg/dL', normalRange: '7 - 20' },
    { componentName: 'BUN/Creatinine Ratio', unit: '', normalRange: '10 - 20' },
  ],
  'LIPID': [
    { componentName: 'Total Cholesterol', unit: 'mg/dL', normalRange: 'Desirable: < 200' },
    { componentName: 'Triglycerides', unit: 'mg/dL', normalRange: 'Normal: < 150' },
    { componentName: 'HDL Cholesterol', unit: 'mg/dL', normalRange: 'M: 40-60 | F: 50-60' },
    { componentName: 'LDL Cholesterol', unit: 'mg/dL', normalRange: 'Optimal: < 100' },
    { componentName: 'VLDL Cholesterol', unit: 'mg/dL', normalRange: '5 - 40' },
    { componentName: 'Total Cholesterol / HDL Ratio', unit: '', normalRange: '< 5.0' },
    { componentName: 'LDL / HDL Ratio', unit: '', normalRange: '< 3.5' },
  ],
  'THYROID': [
    { componentName: 'T3 (Triiodothyronine)', unit: 'ng/dL', normalRange: '80 - 200' },
    { componentName: 'T4 (Thyroxine)', unit: 'µg/dL', normalRange: '5.1 - 14.1' },
    { componentName: 'TSH', unit: 'µIU/mL', normalRange: '0.27 - 4.20' },
  ],
  'COAGULATION': [
    { componentName: 'PT (Prothrombin Time)', unit: 'seconds', normalRange: '11 - 16' },
    { componentName: 'INR', unit: '', normalRange: '0.8 - 1.2' },
    { componentName: 'APTT', unit: 'seconds', normalRange: '25 - 35' },
    { componentName: 'Bleeding Time', unit: 'minutes', normalRange: '1 - 6' },
    { componentName: 'Clotting Time', unit: 'minutes', normalRange: '4 - 9' },
  ],
  'ELECTROLYTE': [
    { componentName: 'Sodium (Na+)', unit: 'mEq/L', normalRange: '136 - 146' },
    { componentName: 'Potassium (K+)', unit: 'mEq/L', normalRange: '3.5 - 5.1' },
    { componentName: 'Chloride (Cl-)', unit: 'mEq/L', normalRange: '98 - 106' },
    { componentName: 'Bicarbonate', unit: 'mEq/L', normalRange: '22 - 29' },
  ],
  'ANEMIA': [
    { componentName: 'Hemoglobin', unit: 'g/dL', normalRange: 'M: 13.0-17.0 | F: 12.0-15.0' },
    { componentName: 'Serum Iron', unit: 'µg/dL', normalRange: '60 - 170' },
    { componentName: 'TIBC', unit: 'µg/dL', normalRange: '250 - 370' },
    { componentName: 'Transferrin Saturation', unit: '%', normalRange: '20 - 50' },
    { componentName: 'Serum Ferritin', unit: 'ng/mL', normalRange: 'M: 12-300 | F: 12-150' },
    { componentName: 'Vitamin B12', unit: 'pg/mL', normalRange: '211 - 946' },
    { componentName: 'Folic Acid', unit: 'ng/mL', normalRange: '3.89 - 26.8' },
    { componentName: 'Reticulocyte Count', unit: '%', normalRange: '0.5 - 2.5' },
    { componentName: 'Peripheral Smear', unit: '', normalRange: 'Normocytic Normochromic', method: 'Microscopy' },
  ],
};

// Radiology templates
const RADIOLOGY_TEMPLATES: Record<string, string> = {
  'USG ABDOMEN': `<h3>ULTRASONOGRAPHY OF ABDOMEN AND PELVIS</h3>
<p><strong>LIVER:</strong> Normal in size, shape and echotexture. No focal lesion seen. Portal vein and hepatic veins are normal.</p>
<p><strong>GALL BLADDER:</strong> Normal in size and shape. Wall thickness is normal. No calculus seen. CBD is not dilated.</p>
<p><strong>PANCREAS:</strong> Normal in size and echotexture.</p>
<p><strong>SPLEEN:</strong> Normal in size and echotexture. No focal lesion.</p>
<p><strong>KIDNEYS:</strong> Both kidneys are normal in size, shape and position. Cortical thickness and echogenicity are normal. No calculus or hydronephrosis. Both ureters are not dilated.</p>
<p><strong>URINARY BLADDER:</strong> Adequately distended. Wall is normal. No calculus seen.</p>
<p><strong>UTERUS (if applicable):</strong> Normal in size, shape and echotexture.</p>
<p><strong>FREE FLUID:</strong> No free fluid in abdomen / pelvis.</p>
<p><strong>IMPRESSION:</strong></p>
<ul><li>Normal Ultrasound study of Abdomen and Pelvis</li></ul>`,
  'CT BRAIN': `<h3>CT SCAN OF BRAIN (PLAIN)</h3>
<p><strong>FINDINGS:</strong></p>
<p>Both cerebral hemispheres are symmetrical. Grey-white matter differentiation is maintained. No intra-axial or extra-axial collection seen. Ventricles and cisterns are normal in size and configuration. Midline structures are in midline. No midline shift. Cerebellum and brain stem appear normal. Calvarium is intact. Para-nasal sinuses and mastoid air cells are well pneumatized.</p>
<p><strong>IMPRESSION:</strong></p>
<ul><li>Normal CT scan of Brain (Plain)</li></ul>`,
  'MRI': `<h3>MRI STUDY</h3>
<p><strong>CLINICAL INDICATION:</strong> </p>
<p><strong>TECHNIQUE:</strong> Multiplanar, multisequence MRI was performed.</p>
<p><strong>FINDINGS:</strong></p>
<p></p>
<p><strong>IMPRESSION:</strong></p>
<ul><li></li></ul>`,
};

// Match panel key from test name
function matchPanelKey(testName: string): string | null {
  const upper = testName.toUpperCase();
  if (upper.includes('CBC') || upper.includes('CBP') || upper.includes('COMPLETE BLOOD') || upper.includes('HAEMOGRAM')) return 'CBC';
  if (upper.includes('LFT') || upper.includes('LIVER FUNCTION')) return 'LFT';
  if (upper.includes('RFT') || upper.includes('RENAL FUNCTION') || upper.includes('KFT') || upper.includes('KIDNEY FUNCTION')) return 'RFT';
  if (upper.includes('LIPID')) return 'LIPID';
  if (upper.includes('THYROID PROFILE')) return 'THYROID';
  if (upper.includes('COAGULATION')) return 'COAGULATION';
  if (upper.includes('ELECTROLYTE')) return 'ELECTROLYTE';
  if (upper.includes('ANEMIA')) return 'ANEMIA';
  return null;
}

function matchRadiologyTemplate(testName: string): string | null {
  const upper = testName.toUpperCase();
  if (upper.includes('USG') || upper.includes('ULTRASOUND')) return RADIOLOGY_TEMPLATES['USG ABDOMEN'];
  if (upper.includes('CT') && upper.includes('BRAIN')) return RADIOLOGY_TEMPLATES['CT BRAIN'];
  if (upper.includes('MRI')) return RADIOLOGY_TEMPLATES['MRI'];
  return null;
}

async function main() {
  console.log('🔬 Classifying and seeding test templates...');

  const allTests = await prisma.testMaster.findMany();
  let panelCount = 0, singleCount = 0, radioCount = 0, microCount = 0;

  for (const test of allTests) {
    const uiType = classifyTest(test.testName);

    // Update uiType
    await prisma.testMaster.update({
      where: { id: test.id },
      data: {
        uiType,
        hasComponents: uiType === 'panel',
        resultTemplate: uiType === 'richtext' ? (matchRadiologyTemplate(test.testName) || test.resultTemplate) : test.resultTemplate,
      }
    });

    // Add panel components
    if (uiType === 'panel') {
      const panelKey = matchPanelKey(test.testName);
      if (panelKey && PANEL_COMPONENTS[panelKey]) {
        // Delete existing components first
        await prisma.testComponent.deleteMany({ where: { testId: test.id } });
        // Insert new components
        for (let i = 0; i < PANEL_COMPONENTS[panelKey].length; i++) {
          const comp = PANEL_COMPONENTS[panelKey][i];
          await prisma.testComponent.create({
            data: {
              testId: test.id,
              componentName: comp.componentName,
              unit: comp.unit,
              normalRange: comp.normalRange,
              method: comp.method || null,
              sortOrder: i,
            }
          });
        }
        panelCount++;
      }
    } else if (uiType === 'single') singleCount++;
    else if (uiType === 'richtext') radioCount++;
    else if (uiType === 'microbiology') microCount++;
  }

  console.log(`✅ Classification complete:`);
  console.log(`   Panel tests with components: ${panelCount}`);
  console.log(`   Single value tests: ${singleCount}`);
  console.log(`   Radiology/RichText tests: ${radioCount}`);
  console.log(`   Microbiology tests: ${microCount}`);
  console.log(`   Total processed: ${allTests.length}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
