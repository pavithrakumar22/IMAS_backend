import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const COLORS = {
  primary: '#0f172a',
  secondary: '#2563eb',
  accent: '#3b82f6',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  text: '#1f2937',
  textLight: '#6b7280',
  textMuted: '#9ca3af',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  background: '#f9fafb',
  white: '#ffffff'
};

const FONTS = {
  regular: 'Helvetica',
  bold: 'Helvetica-Bold'
};

const MARGINS = {
  page: { top: 60, bottom: 80, left: 60, right: 60 },
  section: 24,
  subsection: 36
};

export async function generateMedicalReport(diagnosisData, fileNameOrPath) {
  return new Promise((resolve, reject) => {
    try {
      const reportsDir = path.join(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = fileNameOrPath.endsWith('.pdf') 
        ? fileNameOrPath 
        : `${fileNameOrPath}-${timestamp}.pdf`;
      const outputPath = path.join(reportsDir, fileName);

      const doc = new PDFDocument({
        size: 'A4',
        margins: MARGINS.page,
        bufferPages: true
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      renderDocument(doc, diagnosisData);

      addFootersToAllPages(doc);
      
      doc.end();

      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

function addFootersToAllPages(doc) {
  const range = doc.bufferedPageRange();
  const totalPages = range.count;
  
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    
    const footerY = 750;
    
    doc.rect(60, footerY - 8, 475, 1)
       .fill(COLORS.border);

    doc.fontSize(8)
       .font(FONTS.bold)
       .fillColor(COLORS.text)
       .text('IMPORTANT MEDICAL DISCLAIMER', 60, footerY + 4, { 
         align: 'center',
         width: 475
       });

    doc.fontSize(7)
       .font(FONTS.regular)
       .fillColor(COLORS.textLight)
       .text(
         'This report is generated based on patient-reported symptoms and is for informational purposes only. ' +
         'It does not constitute professional medical advice, diagnosis, or treatment. ' +
         'Always seek the advice of your physician or other qualified health provider with any questions regarding a medical condition.',
         60, footerY + 18, {
           align: 'center',
           width: 475,
           lineGap: 2
         }
       );
  }
}

function renderDocument(doc, data) {
  addHeader(doc, data);
  
  const complexity = data.complexity?.complexity || 'UNKNOWN';
  
  if (complexity === 'LOW') {
    renderLowComplexity(doc, data);
  } else if (complexity === 'MEDIUM') {
    renderMediumComplexity(doc, data);
  } else {
    renderGeneric(doc, data);
  }
}

function addHeader(doc, data) {
  doc.rect(0, 0, doc.page.width, 140)
     .fill('#f8fafc');

  doc.fontSize(11)
     .font(FONTS.bold)
     .fillColor(COLORS.secondary)
     .text('IMAS HEALTH', 475, 70, { align: 'right' });

  doc.fontSize(28)
     .font(FONTS.bold)
     .fillColor(COLORS.primary)
     .text('Medical Diagnosis Report', 60, 65);

  doc.fontSize(10)
     .font(FONTS.regular)
     .fillColor(COLORS.textMuted)
     .text(`Report Generated: ${formatTimestamp(data.timestamp)}`, 60, 102);

  doc.rect(60, 125, 475, 3)
     .fill(COLORS.secondary);

  doc.y = 160;
}

function renderLowComplexity(doc, data) {
  const { diagnosis, complexity, original, translated } = data;
  const rec = diagnosis.recommendations;

  addCard(doc, 'Patient Information', () => {
    addCardRow(doc, 'Original Statement', original);
    addCardRow(doc, 'Translated Statement', translated, true);
  });

  doc.moveDown(1.5);

  addCard(doc, 'Complexity Assessment', () => {
    addCardRow(doc, 'Complexity Level', complexity.complexity);
    addCardRow(doc, 'Assessment Reason', complexity.reason, true);
  });

  doc.moveDown(2);

  addSectionHeader(doc, 'Diagnosed Condition');
  doc.moveDown(0.5);
  
  doc.rect(60, doc.y, 475, 45)
     .fill('#eff6ff');
  
  doc.fontSize(14)
     .font(FONTS.bold)
     .fillColor(COLORS.secondary)
     .text(rec.condition, 75, doc.y + 15, { width: 445 });
  
  doc.y += 55;
  doc.moveDown(1.5);

  addSectionHeader(doc, 'Precautions & Safety Measures');
  doc.moveDown(0.8);
  renderBulletList(doc, rec.precautions, COLORS.secondary);

  doc.moveDown(1.5);

  addSectionHeader(doc, 'Dietary Recommendations');
  doc.moveDown(0.8);
  renderDiet(doc, rec.diet);

  doc.moveDown(1.5);

  addSectionHeader(doc, 'Recommended Medications');
  doc.moveDown(0.8);
  renderBulletList(doc, rec.medications, COLORS.text);

  doc.moveDown(1.5);

  addSectionHeader(doc, 'Natural Remedies & Home Care');
  doc.moveDown(0.8);
  renderBulletList(doc, rec.natural_remedies, COLORS.success);

  doc.moveDown(1.5);

  addSectionHeader(doc, 'Activity & Lifestyle');
  doc.moveDown(0.8);
  renderParagraphBox(doc, rec.activity, '#f0fdf4');

  doc.moveDown(1.5);

  addSectionHeader(doc, 'Follow-Up Guidance');
  doc.moveDown(0.8);
  renderFollowUp(doc, rec.follow_up);

  doc.moveDown(1.5);

  addSectionHeader(doc, 'General Health Advice');
  doc.moveDown(0.8);
  renderBulletList(doc, rec.advice, COLORS.success);
}

function renderMediumComplexity(doc, data) {
  const { diagnosis, complexity, original } = data;

  addCard(doc, 'Patient Information', () => {
    addCardRow(doc, 'Chief Complaint', original);
    addCardRow(doc, 'Reported Symptoms', diagnosis.symptoms.join(', '), true);
  });

  doc.moveDown(1.5);

  addCard(doc, 'Complexity Assessment', () => {
    addCardRow(doc, 'Complexity Level', complexity.complexity);
    addCardRow(doc, 'Clinical Reasoning', complexity.reason, true);
  });

  doc.moveDown(2);

  addSectionHeader(doc, 'Specialist Consultation Required');
  doc.moveDown(0.8);
  
  diagnosis.doctors.forEach((doctor, index) => {
    const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
    
    doc.rect(60, doc.y, 475, 35)
       .fill(bgColor);
    
    doc.fontSize(11)
       .font(FONTS.bold)
       .fillColor(COLORS.primary)
       .text(`${index + 1}. ${formatSpecialistName(doctor.id)}`, 75, doc.y + 10);
    
    const confidence = (doctor.confidence * 100).toFixed(0);
    const confidenceColor = confidence >= 80 ? COLORS.success : confidence >= 60 ? COLORS.warning : COLORS.textLight;
    
    doc.fontSize(10)
       .font(FONTS.regular)
       .fillColor(confidenceColor)
       .text(`${confidence}% Match Confidence`, 400, doc.y - 15, { width: 120 });
    
    doc.y += 35;
  });

  doc.moveDown(1);

  const specialists = diagnosis.specialistResponses;
  Object.keys(specialists).forEach((specialistKey) => {
    const response = parseJSON(specialists[specialistKey]);
    if (response) {
      renderSpecialistAssessment(doc, specialistKey, response);
    }
  });
}

function renderGeneric(doc, data) {
  addCard(doc, 'Diagnostic Information', () => {
    addCardRow(doc, 'Patient Statement', data.original);
    addCardRow(doc, 'Processed Input', data.translated || data.original, true);
  });

  doc.moveDown(2);
  renderParagraphBox(doc, 'Unable to generate detailed diagnostic report. Please consult a healthcare professional for proper evaluation.', '#fef2f2');
}

function renderSpecialistAssessment(doc, specialistKey, response) {
  doc.addPage();

  doc.rect(0, 0, doc.page.width, 120)
     .fill('#f8fafc');

  doc.fontSize(11)
     .font(FONTS.bold)
     .fillColor(COLORS.secondary)
     .text('IMAS HEALTH', 475, 70, { align: 'right' });

  doc.fontSize(24)
     .font(FONTS.bold)
     .fillColor(COLORS.primary)
     .text(`${formatSpecialistName(specialistKey)} Assessment`, 60, 65);

  doc.rect(60, 105, 475, 3)
     .fill(COLORS.secondary);

  doc.y = 140;

  addSubSectionHeader(doc, 'Clinical Explanation');
  doc.moveDown(0.5);
  renderParagraphBox(doc, response.for_patient.condition_explanation, '#eff6ff');

  doc.moveDown(1.5);

  addSubSectionHeader(doc, 'Home Care Instructions');
  doc.moveDown(0.8);
  renderBulletList(doc, response.for_patient.home_care, COLORS.secondary);

  doc.moveDown(1.5);

  addSubSectionHeader(doc, 'Critical Warning Signs');
  doc.moveDown(0.8);
  renderWarningList(doc, response.for_patient.warning_signs);

  doc.moveDown(1.5);

  addSubSectionHeader(doc, 'When to Seek Medical Help');
  doc.moveDown(0.5);
  renderParagraphBox(doc, response.for_patient.when_to_seek_help, '#fef2f2');

  doc.moveDown(2);

  doc.rect(60, doc.y, 475, 1)
     .fill(COLORS.border);
  doc.moveDown(1.5);

  addSectionHeader(doc, 'Professional Clinical Notes');
  doc.moveDown(1);

  addSubSectionHeader(doc, 'Differential Diagnosis');
  doc.moveDown(0.8);
  renderNumberedList(doc, response.for_professional.possible_causes, 9);

  doc.moveDown(1.5);

  addSubSectionHeader(doc, 'Pharmacological Recommendations');
  doc.moveDown(0.8);
  renderMedications(doc, response.for_professional.possible_medications);

  if (response.for_professional.tests_if_needed?.length > 0) {
    doc.moveDown(1.5);

    addSubSectionHeader(doc, 'Recommended Diagnostic Tests');
    doc.moveDown(0.8);
    renderNumberedList(doc, response.for_professional.tests_if_needed, 9);
  }

  doc.moveDown(1.5);

  addSubSectionHeader(doc, 'Referral Criteria & Indications');
  doc.moveDown(0.8);
  renderNumberedList(doc, response.for_professional.referral_criteria, 9);
}

function addSectionHeader(doc, title) {
  checkPageBreak(doc, 70);
  
  doc.fontSize(16)
     .font(FONTS.bold)
     .fillColor(COLORS.primary)
     .text(title, 60, doc.y);
  
  doc.moveDown(0.3);
  
  doc.rect(60, doc.y, 120, 2)
     .fill(COLORS.secondary);
  
  doc.moveDown(0.5);
}

function addSubSectionHeader(doc, title) {
  checkPageBreak(doc, 60);
  
  doc.fontSize(13)
     .font(FONTS.bold)
     .fillColor(COLORS.secondary)
     .text(title, 60, doc.y);
  
  doc.moveDown(0.3);
}

function addCard(doc, title, contentRenderer) {
  checkPageBreak(doc, 100);
  
  doc.fontSize(13)
     .font(FONTS.bold)
     .fillColor(COLORS.primary)
     .text(title, 60, doc.y);
  
  doc.moveDown(0.5);
  
  const startY = doc.y;
  const contentStartY = startY + 15;
  
  doc.y = contentStartY;
  contentRenderer();
  
  const height = doc.y - startY;
  
  doc.rect(60, startY, 475, height)
     .strokeColor(COLORS.border)
     .lineWidth(1)
     .stroke();
  
  doc.rect(60, startY, 475, height)
     .fillOpacity(0.3)
     .fill(COLORS.background)
     .fillOpacity(1);
  
  doc.y = startY + height;
  doc.moveDown(0.5);
}

function addCardRow(doc, label, value, isLast = false) {
  const currentY = doc.y;
  
  doc.fontSize(9)
     .font(FONTS.bold)
     .fillColor(COLORS.textLight)
     .text(label.toUpperCase(), 75, currentY);
  
  doc.fontSize(10)
     .font(FONTS.regular)
     .fillColor(COLORS.text)
     .text(value, 75, currentY + 14, { width: 445, lineGap: 3 });
  
  const textHeight = doc.heightOfString(value, { width: 445, lineGap: 3 });
  doc.y = currentY + 14 + textHeight + (isLast ? 10 : 18);
}

function renderBulletList(doc, items, color) {
  items.forEach((item) => {
    checkPageBreak(doc, 35);
    
    const itemY = doc.y;
    
    doc.fontSize(10)
       .font(FONTS.regular)
       .fillColor(color)
       .text('-', 65, itemY);
    
    doc.fontSize(10)
       .font(FONTS.regular)
       .fillColor(COLORS.text)
       .text(item, 90, itemY, { width: 445, lineGap: 4 });
    
    const itemHeight = doc.heightOfString(item, { width: 445, lineGap: 4 });
    doc.y = itemY + Math.max(itemHeight, 20) + 8;
  });
}

function renderNumberedList(doc, items, fontSize = 10) {
  items.forEach((item, index) => {
    checkPageBreak(doc, 35);
    
    const itemY = doc.y;
    
    doc.fontSize(fontSize)
       .font(FONTS.bold)
       .fillColor(COLORS.secondary)
       .text(`${index + 1}.`, 65, itemY);
    
    doc.fontSize(fontSize)
       .font(FONTS.regular)
       .fillColor(COLORS.text)
       .text(item, 90, itemY, { width: 445, lineGap: 3 });
    
    const itemHeight = doc.heightOfString(item, { width: 445, lineGap: 3 });
    doc.y = itemY + Math.max(itemHeight, 16) + 6;
  });
}

function renderWarningList(doc, items) {
  items.forEach((item) => {
    checkPageBreak(doc, 40);
    
    const itemY = doc.y;
    
    const itemHeight = doc.heightOfString(item, { width: 430, lineGap: 4 });
    
    doc.rect(60, itemY, 475, itemHeight + 16)
       .fillOpacity(0.1)
       .fill(COLORS.danger)
       .fillOpacity(1);
    
    doc.fontSize(11)
       .font(FONTS.bold)
       .fillColor(COLORS.danger)
       .text('!', 70, itemY + 8);
    
    doc.fontSize(10)
       .font(FONTS.regular)
       .fillColor(COLORS.text)
       .text(item, 95, itemY + 8, { width: 430, lineGap: 4 });
    
    doc.y = itemY + itemHeight + 24;
  });
}

function renderParagraphBox(doc, text, bgColor) {
  checkPageBreak(doc, 60);
  
  const textHeight = doc.heightOfString(text, { width: 445, lineGap: 4 });
  
  doc.rect(60, doc.y, 475, textHeight + 24)
     .fill(bgColor);
  
  doc.fontSize(10)
     .font(FONTS.regular)
     .fillColor(COLORS.text)
     .text(text, 75, doc.y + 12, { width: 445, align: 'justify', lineGap: 4 });
  
  doc.y += textHeight + 24;
}

function renderDiet(doc, diet) {
  checkPageBreak(doc, 140);
  
  const startY = doc.y;
  const leftX = 60;
  const rightX = 300;
  const columnWidth = 235;
  
  doc.rect(leftX, startY, columnWidth, 10)
     .fill('#ecfdf5');
  
  doc.fontSize(11)
     .font(FONTS.bold)
     .fillColor(COLORS.success)
     .text('Foods to Include', leftX + 10, startY + 2);
  
  let leftY = startY + 18;
  
  diet.recommended.forEach(item => {
    doc.fontSize(9)
       .font(FONTS.regular)
       .fillColor(COLORS.text)
       .text(`- ${item}`, leftX + 15, leftY, { width: columnWidth - 30, lineGap: 3 });
    
    const itemHeight = doc.heightOfString(`- ${item}`, { width: columnWidth - 30, lineGap: 3 });
    leftY += itemHeight + 5;
  });
  
  doc.rect(rightX, startY, columnWidth, 10)
     .fill('#fef2f2');
  
  doc.fontSize(11)
     .font(FONTS.bold)
     .fillColor(COLORS.danger)
     .text('Foods to Avoid', rightX + 10, startY + 2);
  
  let rightY = startY + 18;
  
  diet.avoid.forEach(item => {
    doc.fontSize(9)
       .font(FONTS.regular)
       .fillColor(COLORS.text)
       .text(`- ${item}`, rightX + 15, rightY, { width: columnWidth - 30, lineGap: 3 });
    
    const itemHeight = doc.heightOfString(`- ${item}`, { width: columnWidth - 30, lineGap: 3 });
    rightY += itemHeight + 5;
  });
  
  doc.y = Math.max(leftY, rightY) + 5;
}

function renderFollowUp(doc, followUp) {
  checkPageBreak(doc, 120);
  
  const startY = doc.y;
  
  doc.rect(60, startY, 475, 35)
     .fill('#eff6ff');
  
  doc.fontSize(10)
     .font(FONTS.bold)
     .fillColor(COLORS.secondary)
     .text('Follow-up Timeline:', 75, startY + 10);
  
  doc.fontSize(10)
     .font(FONTS.regular)
     .fillColor(COLORS.text)
     .text(followUp.when, 200, startY + 10, { width: 325 });
  
  doc.y = startY + 45;
  
  doc.fontSize(11)
     .font(FONTS.bold)
     .fillColor(COLORS.danger)
     .text('Seek Immediate Medical Attention If:', 65, doc.y);
  
  doc.moveDown(0.8);
  
  followUp.criteria.forEach((criterion, index) => {
    checkPageBreak(doc, 30);
    
    doc.fontSize(9)
       .font(FONTS.regular)
       .fillColor(COLORS.text)
       .text(`${index + 1}. ${criterion}`, 75, doc.y, { width: 450, lineGap: 3 });
    
    const itemHeight = doc.heightOfString(`${index + 1}. ${criterion}`, { width: 450, lineGap: 3 });
    doc.y += itemHeight + 8;
  });
}

function renderMedications(doc, medications) {
  medications.forEach((med, index) => {
    checkPageBreak(doc, 120);
    
    const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
    const startY = doc.y;
    
    doc.fontSize(11)
       .font(FONTS.bold)
       .fillColor(COLORS.primary)
       .text(`${index + 1}. ${med.name}`, 70, startY + 12);
    
    doc.fontSize(9)
       .font(FONTS.bold)
       .fillColor(COLORS.text)
       .text('Dosage:', 90, doc.y + 6, { continued: true })
       .font(FONTS.regular)
       .text(` ${med.dose}`);
    
    doc.font(FONTS.bold)
       .text('Duration:', 90, doc.y + 4, { continued: true })
       .font(FONTS.regular)
       .text(` ${med.duration}`);
    
    doc.moveDown(0.3);
    
    doc.font(FONTS.bold)
       .fillColor(COLORS.warning)
       .text('Cautions:', 90, doc.y);
    
    doc.moveDown(0.2);
    
    med.cautions.forEach(caution => {
      doc.fontSize(8)
         .font(FONTS.regular)
         .fillColor(COLORS.text)
         .text(`- ${caution}`, 100, doc.y, { width: 425, lineGap: 2 });
      
      const cautionHeight = doc.heightOfString(`- ${caution}`, { width: 425, lineGap: 2 });
      doc.y += cautionHeight + 4;
    });
    
    const boxHeight = doc.y - startY + 8;
    
    doc.rect(60, startY, 475, boxHeight)
       .fill(bgColor);
    
    doc.y = startY + boxHeight + 8;
  });
}

function checkPageBreak(doc, requiredSpace) {
  if (doc.y + requiredSpace > 670) {
    doc.addPage();
    doc.y = 60;
  }
}

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function formatSpecialistName(specialistId) {
  return specialistId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function parseJSON(str) {
  try {
    const cleaned = str.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export default generateMedicalReport;