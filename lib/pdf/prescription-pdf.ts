import jsPDF from 'jspdf';

interface PrescriptionData {
  id: string;
  customerName: string;
  customerId?: string;
  age?: number;
  prescriptionDate: string;
  expiryDate: string;
  od_sph: number;
  od_cyl: number;
  od_axis: number;
  os_sph: number;
  os_cyl: number;
  os_axis: number;
  pd: number;
  prescriptionType: string;
}

export function generatePrescriptionPDF(prescription: PrescriptionData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Professional minimalist color palette
  const colors = {
    primary: [45, 85, 140], // Professional navy blue
    accent: [168, 85, 247], // Subtle purple accent only
    text: [31, 41, 55], // Dark gray-900
    textLight: [107, 114, 128], // Medium gray
    border: [229, 231, 235], // Light gray border
  };

  // Clean Header
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pageWidth, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('OPTICAL PRESCRIPTION', 20, 17);

  // Company info - minimal styling
  let currentY = 30;
  doc.setTextColor(...colors.text);
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('Lumen Optical - Management Information System', 20, currentY);

  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...colors.textLight);
  doc.text('Professional Eye Care Services', 20, currentY + 6);

  // Thin horizontal line
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.5);
  doc.line(20, currentY + 10, pageWidth - 20, currentY + 10);

  // Prescription Details - two columns
  currentY = 42;
  doc.setTextColor(...colors.text);
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');

  doc.text('Prescription ID:', 20, currentY);
  doc.setFont(undefined, 'normal');
  doc.text(prescription.id, 55, currentY);

  doc.setFont(undefined, 'bold');
  doc.text('Issued Date:', 120, currentY);
  doc.setFont(undefined, 'normal');
  doc.text(new Date(prescription.prescriptionDate).toLocaleDateString('en-IN'), 155, currentY);

  currentY += 7;
  doc.setFont(undefined, 'bold');
  doc.text('Type:', 20, currentY);
  doc.setFont(undefined, 'normal');
  doc.text(prescription.prescriptionType.charAt(0).toUpperCase() + prescription.prescriptionType.slice(1), 55, currentY);

  doc.setFont(undefined, 'bold');
  doc.text('Expiry Date:', 120, currentY);
  doc.setFont(undefined, 'normal');
  doc.text(new Date(prescription.expiryDate).toLocaleDateString('en-IN'), 155, currentY);

  // Patient Information - simple box
  currentY = 60;
  doc.setDrawColor(...colors.border);
  doc.rect(20, currentY, pageWidth - 40, 30);

  doc.setFillColor(...colors.primary);
  doc.rect(20, currentY, pageWidth - 40, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text('PATIENT INFORMATION', 23, currentY + 5);

  // Patient details
  currentY += 10;
  doc.setTextColor(...colors.text);
  doc.setFontSize(9);

  doc.setFont(undefined, 'bold');
  doc.text('Name:', 23, currentY);
  doc.setFont(undefined, 'normal');
  doc.text(prescription.customerName, 55, currentY);

  if (prescription.age !== undefined) {
    currentY += 6;
    doc.setFont(undefined, 'bold');
    doc.text('Age:', 23, currentY);
    doc.setFont(undefined, 'normal');
    doc.text(`${prescription.age} years`, 55, currentY);
  }

  if (prescription.customerId) {
    currentY += 6;
    doc.setFont(undefined, 'bold');
    doc.text('Patient ID:', 23, currentY);
    doc.setFont(undefined, 'normal');
    doc.text(prescription.customerId, 55, currentY);
  }

  // Prescription Table
  currentY = 100;
  const tableMargin = 20;
  const tableWidth = pageWidth - (2 * tableMargin);
  const colWidth = tableWidth / 4;

  // Table header
  doc.setFillColor(...colors.primary);
  doc.rect(tableMargin, currentY, tableWidth, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');

  doc.text('Parameter', tableMargin + 3, currentY + 5.5);
  doc.text('Right Eye (OD)', tableMargin + colWidth + 3, currentY + 5.5);
  doc.text('Left Eye (OS)', tableMargin + colWidth * 2 + 3, currentY + 5.5);
  doc.text('Unit', tableMargin + colWidth * 3 + 3, currentY + 5.5);

  // Table rows
  doc.setTextColor(...colors.text);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);

  currentY += 8;
  const rowHeight = 7;

  const rows = [
    {
      param: 'Sphere (SPH)',
      od: prescription.od_sph.toFixed(2),
      os: prescription.os_sph.toFixed(2),
      unit: 'D',
    },
    {
      param: 'Cylinder (CYL)',
      od: prescription.od_cyl.toFixed(2),
      os: prescription.os_cyl.toFixed(2),
      unit: 'D',
    },
    {
      param: 'Axis',
      od: prescription.od_axis.toString(),
      os: prescription.os_axis.toString(),
      unit: '°',
    },
    {
      param: 'Pupillary Distance (PD)',
      od: `${prescription.pd}mm`,
      os: 'Both',
      unit: 'mm',
    },
  ];

  rows.forEach((row, index) => {
    // Light gray alternate rows
    if (index % 2 === 0) {
      doc.setFillColor(248, 249, 250);
      doc.rect(tableMargin, currentY - 0.5, tableWidth, rowHeight, 'F');
    }

    // Border
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.rect(tableMargin, currentY - 0.5, tableWidth, rowHeight);

    // Content
    doc.setTextColor(...colors.text);
    doc.setFont(undefined, 'bold');
    doc.text(row.param, tableMargin + 3, currentY + 4);

    doc.setFont(undefined, 'normal');
    doc.text(row.od, tableMargin + colWidth + 3, currentY + 4);
    doc.text(row.os, tableMargin + colWidth * 2 + 3, currentY + 4);
    doc.text(row.unit, tableMargin + colWidth * 3 + 3, currentY + 4);

    currentY += rowHeight;
  });

  // Important Notes Section
  currentY += 8;
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.5);
  doc.line(20, currentY, pageWidth - 20, currentY);

  currentY += 8;
  doc.setTextColor(...colors.primary);
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text('IMPORTANT NOTES', 20, currentY);

  currentY += 6;
  doc.setTextColor(...colors.text);
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');

  const notes = [
    'Valid for optical glasses and contact lenses.',
    `Expires on ${new Date(prescription.expiryDate).toLocaleDateString('en-IN')}.`,
    'Consult your eye care professional if you experience any discomfort.',
    'Wear eyewear as recommended by your optometrist.',
  ];

  notes.forEach((note) => {
    doc.text(`• ${note}`, 23, currentY, { maxWidth: pageWidth - 46 });
    currentY += 5;
  });

  // Footer line
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.5);
  doc.line(20, pageHeight - 12, pageWidth - 20, pageHeight - 12);

  // Footer text
  doc.setTextColor(...colors.textLight);
  doc.setFontSize(7);
  doc.setFont(undefined, 'normal');
  doc.text(
    `Generated: ${new Date().toLocaleString('en-IN')} | Rx ID: ${prescription.id}`,
    20,
    pageHeight - 6
  );

  // Download the PDF
  const fileName = `Prescription_${prescription.customerName.replace(/\s+/g, '_')}_${prescription.prescriptionDate}.pdf`;
  doc.save(fileName);
}
