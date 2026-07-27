import jsPDF from 'jspdf';
import { DEFAULT_LOGO } from './logo-base64';

export interface PrescriptionItem {
  type?: string; // e.g. 'R', 'L', 'O'
  code?: string;
  description: string;
  rate: number;
  qty: number;
  discountPercent?: number;
  discountAmount?: number;
  amount: number;
}

export interface PrescriptionData {
  id: string | number;
  customerName: string;
  customerId?: string | number;
  age?: number;
  prescriptionDate: string;
  expiryDate?: string;

  // Right Eye (OD)
  od_sph: number;
  od_cyl: number;
  od_axis: number;
  od_va?: string;
  od_add?: number;

  // Left Eye (OS)
  os_sph: number;
  os_cyl: number;
  os_axis: number;
  os_va?: string;
  os_add?: number;

  // Reading parameters
  reading_od_sph?: number;
  reading_od_cyl?: number;
  reading_od_axis?: number;
  reading_od_va?: string;
  reading_os_sph?: number;
  reading_os_cyl?: number;
  reading_os_axis?: number;
  reading_os_va?: string;

  // Pupillary Distance (PD)
  pd: number;
  pd_right?: number;
  pd_left?: number;
  pd_near?: number;
  pd_near_right?: number;
  pd_near_left?: number;

  // Fitting Heights
  fittingHeight?: number;
  segmentHeight?: number;
  sh_right?: number;
  sh_left?: number;
  fh_right?: number;
  fh_left?: number;

  // Frame Metrics
  a_val?: number | string;
  b_val?: number | string;
  dbl_val?: number | string;
  dia_right?: number | string;
  dia_left?: number | string;
  base_curve_right?: string | number;
  base_curve_left?: string | number;
  panto_angle?: string | number;
  wrap_angle?: string | number;
  prism?: string;
  prescriptionType?: string;

  // Order & Customer Metadata
  orderNo?: string | number;
  orderDate?: string;
  orderTime?: string;
  orderLocation?: string;
  deliveryMethod?: string;
  contactNo?: string;
  address?: string;
  collectionDate?: string;
  clinicianName?: string;
  printedOn?: string;
  duplicateText?: string;

  // Items & Total
  items?: PrescriptionItem[];
  totalAmount?: number;
}

export function generatePrescriptionPDF(prescription: PrescriptionData, companyDetails?: any) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Helper function to safely render text (ensures string type)
  const safeText = (text: any, x: number, y: number, options?: any) => {
    const str = text === null || text === undefined ? '' : String(text);
    doc.text(str, x, y, options);
  };

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const marginX = 10;
  const contentWidth = pageWidth - marginX * 2;

  // Colors as explicit 3-tuples for jsPDF compatibility
  const colors: Record<string, [number, number, number]> = {
    text: [30, 30, 30],
    grayHeader: [200, 200, 200],
    border: [120, 120, 120],
    lightBorder: [180, 180, 180],
  };

  // Helper formatting functions
  const fmtNum = (val: number | undefined, decimals = 2): string => {
    if (val === undefined || isNaN(val)) return '0.00';
    const s = val.toFixed(decimals);
    return val > 0 ? `+${s}` : s;
  };

  const fmtAxis = (val: number | undefined): string => {
    if (val === undefined || isNaN(val)) return '0';
    return String(val);
  };

  // ----------------------------------------------------
  // 1. HEADER SECTION
  // ----------------------------------------------------
  let currentY = 10;

  // Company Logo on top left
  const logoData = companyDetails?.logo || DEFAULT_LOGO;
  if (logoData) {
    try {
      doc.addImage(logoData, 'JPEG', marginX, currentY, 12, 12);
    } catch {
      // Fallback text logo if image fails
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      safeText('Lumen Opticals', marginX, currentY + 6);
    }
  }

  // Company Details (Center/Left)
  const companyName = companyDetails?.companyName || 'Lumen Opticals';
  const companyPhone = companyDetails?.phone || '';
  const companyEmail = companyDetails?.email || '';
  const companyWeb = companyDetails?.website || '';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  safeText(companyName, marginX + 16, currentY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  safeText(`Tel: / ${companyPhone}`, marginX + 16, currentY + 9);
  safeText(`Email: ${companyEmail} | Web: ${companyWeb}`, marginX + 16, currentY + 13.5);

  // Top Right Order Box
  const orderBoxX = 138;
  const orderBoxY = currentY;
  const orderBoxW = 62;
  const orderBoxH = 24;

  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.setLineWidth(0.4);
  doc.rect(orderBoxX, orderBoxY, orderBoxW, orderBoxH);

  const rawOrderNo = prescription.orderNo !== undefined && prescription.orderNo !== null
    ? prescription.orderNo
    : (prescription.id !== undefined && prescription.id !== null ? prescription.id : '0690000565');
  const orderNo = String(rawOrderNo);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  safeText(orderNo, orderBoxX + orderBoxW / 2, orderBoxY + 6, { align: 'center' });

  // Draw simulated barcode lines
  const barcodeY = orderBoxY + 8;
  const barcodeXStart = orderBoxX + 8;
  const barPattern = [1, 0.5, 1.5, 0.5, 2, 1, 0.5, 1.5, 0.5, 1, 2, 0.5, 1, 1.5, 0.5, 2, 0.5, 1, 1.5, 1];
  let currBarX = barcodeXStart;
  doc.setFillColor(0, 0, 0);
  for (let i = 0; i < barPattern.length; i++) {
    const w = barPattern[i] * 0.4;
    doc.rect(currBarX, barcodeY, w, 5, 'F');
    currBarX += w + 0.5;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  safeText('Collection/ Delivery Date', orderBoxX + orderBoxW / 2, orderBoxY + 17, { align: 'center' });

  const collectionDate = prescription.collectionDate || prescription.prescriptionDate;
  const formattedCollDate = new Date(collectionDate).toLocaleDateString('en-GB');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  safeText(formattedCollDate, orderBoxX + orderBoxW / 2, orderBoxY + 21.5, { align: 'center' });

  currentY += 27;

  // ----------------------------------------------------
  // 2. CUSTOMER & ORDER METADATA
  // ----------------------------------------------------
  const orderDateStr = new Date(prescription.orderDate || prescription.prescriptionDate).toLocaleDateString('en-GB');
  const orderTimeStr = prescription.orderTime || '12:06:37';
  const orderLocStr = prescription.orderLocation || companyDetails?.city || 'AMBALANGODA';
  const custIdStr = String(prescription.customerId !== undefined ? prescription.customerId : prescription.id);
  const custNameStr = prescription.customerName;
  const deliveryStr = prescription.deliveryMethod || `PICK UP [${orderLocStr}]`;
  const contactStr = prescription.contactNo || '0779092370';
  const addressStr = prescription.address || ',,,';

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');

  // Line 1: Order Date & Order Time
  safeText(`Order Date   - ${orderDateStr}`, marginX, currentY);
  safeText(`Order Time  -  ${orderTimeStr}`, marginX + 55, currentY);

  // Line 2: Order Location
  currentY += 4.5;
  safeText(`Order Location  - ${orderLocStr}`, marginX, currentY);

  // Line 3: Customer
  currentY += 4.5;
  safeText(`Customer          - ${custIdStr} - ${custNameStr}`, marginX, currentY);

  // Line 4: Delivery
  currentY += 4.5;
  safeText(`Delivery            - ${deliveryStr}`, marginX, currentY);

  // Line 5: Contact #
  currentY += 4.5;
  safeText(`Contact #         - ${contactStr}`, marginX, currentY);

  // Line 6: Address
  currentY += 4.5;
  safeText(`Address            - ${addressStr}`, marginX, currentY);

  currentY += 6;

  // ----------------------------------------------------
  // 3. PRESCRIPTION TABLES (RIGHT & LEFT + PD)
  // ----------------------------------------------------
  const tableTopY = currentY;
  const boxW = 88;
  const boxLeftX = marginX;
  const boxRightX = marginX + 92;

  // Values calculation
  const odDistSph = fmtNum(prescription.od_sph);
  const odDistCyl = fmtNum(prescription.od_cyl);
  const odDistAxis = fmtAxis(prescription.od_axis);
  const odDistVA = prescription.od_va || '6/6';

  const odAdd = prescription.od_add !== undefined ? prescription.od_add : 0;
  const odReadSph = fmtNum(prescription.reading_od_sph !== undefined ? prescription.reading_od_sph : (prescription.od_sph + odAdd));
  const odReadCyl = fmtNum(prescription.reading_od_cyl !== undefined ? prescription.reading_od_cyl : prescription.od_cyl);
  const odReadAxis = fmtAxis(prescription.reading_od_axis !== undefined ? prescription.reading_od_axis : prescription.od_axis);
  const odReadVA = prescription.reading_od_va || '0';

  const osDistSph = fmtNum(prescription.os_sph);
  const osDistCyl = fmtNum(prescription.os_cyl);
  const osDistAxis = fmtAxis(prescription.os_axis);
  const osDistVA = prescription.os_va || '6/6';

  const osAdd = prescription.os_add !== undefined ? prescription.os_add : 0;
  const osReadSph = fmtNum(prescription.reading_os_sph !== undefined ? prescription.reading_os_sph : (prescription.os_sph + osAdd));
  const osReadCyl = fmtNum(prescription.reading_os_cyl !== undefined ? prescription.reading_os_cyl : prescription.os_cyl);
  const osReadAxis = fmtAxis(prescription.reading_os_axis !== undefined ? prescription.reading_os_axis : prescription.os_axis);
  const osReadVA = prescription.reading_os_va || '0';

  // --- RIGHT EYE TABLE ---
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.setLineWidth(0.3);

  // Outer Right Box (Height: 32mm)
  doc.rect(boxLeftX, tableTopY, boxW, 32);

  // Header "RIGHT"
  doc.line(boxLeftX, tableTopY + 5, boxLeftX + boxW, tableTopY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  safeText('RIGHT', boxLeftX + boxW / 2, tableTopY + 3.8, { align: 'center' });

  // Column divisions for RIGHT table
  const colX_R = [boxLeftX, boxLeftX + 20, boxLeftX + 37, boxLeftX + 54, boxLeftX + 71, boxLeftX + boxW];

  // Header row 2: SPH | CYL | AXIS | VA
  doc.line(boxLeftX, tableTopY + 10, boxLeftX + boxW, tableTopY + 10);

  // Vertical lines for RIGHT table
  for (let i = 1; i < colX_R.length - 1; i++) {
    doc.line(colX_R[i], tableTopY + 5, colX_R[i], tableTopY + 22);
  }

  doc.setFontSize(7.5);
  safeText('SPH', (colX_R[1] + colX_R[2]) / 2, tableTopY + 8.8, { align: 'center' });
  safeText('CYL', (colX_R[2] + colX_R[3]) / 2, tableTopY + 8.8, { align: 'center' });
  safeText('AXIS', (colX_R[3] + colX_R[4]) / 2, tableTopY + 8.8, { align: 'center' });
  safeText('VA', (colX_R[4] + colX_R[5]) / 2, tableTopY + 8.8, { align: 'center' });

  // Row 1: Distance
  doc.line(boxLeftX, tableTopY + 14, boxLeftX + boxW, tableTopY + 14);
  doc.setFont('helvetica', 'normal');
  safeText('Distance', boxLeftX + 2, tableTopY + 13);
  doc.setFont('helvetica', 'bold');
  safeText(odDistSph, (colX_R[1] + colX_R[2]) / 2, tableTopY + 13, { align: 'center' });
  safeText(odDistCyl, (colX_R[2] + colX_R[3]) / 2, tableTopY + 13, { align: 'center' });
  safeText(odDistAxis, (colX_R[3] + colX_R[4]) / 2, tableTopY + 13, { align: 'center' });
  safeText(odDistVA, (colX_R[4] + colX_R[5]) / 2, tableTopY + 13, { align: 'center' });

  // Row 2: Reading
  doc.line(boxLeftX, tableTopY + 18, boxLeftX + boxW, tableTopY + 18);
  doc.setFont('helvetica', 'normal');
  safeText('Reading', boxLeftX + 2, tableTopY + 17);
  doc.setFont('helvetica', 'bold');
  safeText(odReadSph, (colX_R[1] + colX_R[2]) / 2, tableTopY + 17, { align: 'center' });
  safeText(odReadCyl, (colX_R[2] + colX_R[3]) / 2, tableTopY + 17, { align: 'center' });
  safeText(odReadAxis, (colX_R[3] + colX_R[4]) / 2, tableTopY + 17, { align: 'center' });
  safeText(odReadVA, (colX_R[4] + colX_R[5]) / 2, tableTopY + 17, { align: 'center' });

  // Row 3: Add
  doc.line(boxLeftX, tableTopY + 22, boxLeftX + boxW, tableTopY + 22);
  doc.setFont('helvetica', 'normal');
  safeText('Add', boxLeftX + 2, tableTopY + 21);
  doc.setFont('helvetica', 'bold');
  safeText(odAdd, (colX_R[1] + colX_R[2]) / 2, tableTopY + 21, { align: 'center' });

  // Row 4: Prism
  doc.setFont('helvetica', 'normal');
  safeText('Prism', boxLeftX + 2, tableTopY + 28);
  safeText(prescription.prism || '- DR RX', boxLeftX + 25, tableTopY + 28);


  // --- LEFT EYE TABLE ---
  doc.rect(boxRightX, tableTopY, boxW, 22);

  // Header "LEFT"
  doc.line(boxRightX, tableTopY + 5, boxRightX + boxW, tableTopY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  safeText('LEFT', boxRightX + boxW / 2, tableTopY + 3.8, { align: 'center' });

  // Column divisions for LEFT table
  const colX_L = [boxRightX, boxRightX + 20, boxRightX + 37, boxRightX + 54, boxRightX + 71, boxRightX + boxW];

  // Header row 2
  doc.line(boxRightX, tableTopY + 10, boxRightX + boxW, tableTopY + 10);
  for (let i = 1; i < colX_L.length - 1; i++) {
    doc.line(colX_L[i], tableTopY + 5, colX_L[i], tableTopY + 22);
  }

  doc.setFontSize(7.5);
  safeText('SPH', (colX_L[1] + colX_L[2]) / 2, tableTopY + 8.8, { align: 'center' });
  safeText('CYL', (colX_L[2] + colX_L[3]) / 2, tableTopY + 8.8, { align: 'center' });
  safeText('AXIS', (colX_L[3] + colX_L[4]) / 2, tableTopY + 8.8, { align: 'center' });
  safeText('VA', (colX_L[4] + colX_L[5]) / 2, tableTopY + 8.8, { align: 'center' });

  // Row 1: Distance
  doc.line(boxRightX, tableTopY + 14, boxRightX + boxW, tableTopY + 14);
  doc.setFont('helvetica', 'normal');
  safeText('Distance', boxRightX + 2, tableTopY + 13);
  doc.setFont('helvetica', 'bold');
  safeText(osDistSph, (colX_L[1] + colX_L[2]) / 2, tableTopY + 13, { align: 'center' });
  safeText(osDistCyl, (colX_L[2] + colX_L[3]) / 2, tableTopY + 13, { align: 'center' });
  safeText(osDistAxis, (colX_L[3] + colX_L[4]) / 2, tableTopY + 13, { align: 'center' });
  safeText(osDistVA, (colX_L[4] + colX_L[5]) / 2, tableTopY + 13, { align: 'center' });

  // Row 2: Reading
  doc.line(boxRightX, tableTopY + 18, boxRightX + boxW, tableTopY + 18);
  doc.setFont('helvetica', 'normal');
  safeText('Reading', boxRightX + 2, tableTopY + 17);
  doc.setFont('helvetica', 'bold');
  safeText(osReadSph, (colX_L[1] + colX_L[2]) / 2, tableTopY + 17, { align: 'center' });
  safeText(osReadCyl, (colX_L[2] + colX_L[3]) / 2, tableTopY + 17, { align: 'center' });
  safeText(osReadAxis, (colX_L[3] + colX_L[4]) / 2, tableTopY + 17, { align: 'center' });
  safeText(osReadVA, (colX_L[4] + colX_L[5]) / 2, tableTopY + 17, { align: 'center' });

  // Row 3: Add
  doc.setFont('helvetica', 'normal');
  safeText('Add', boxRightX + 2, tableTopY + 21);
  doc.setFont('helvetica', 'bold');
  safeText(osAdd, (colX_L[1] + colX_L[2]) / 2, tableTopY + 21, { align: 'center' });

  // --- PD TABLE (Below Left Table) ---
  const pdTopY = tableTopY + 23;
  const pdH = 14;

  doc.rect(boxRightX, pdTopY, boxW, pdH);

  // PD Columns: Parameter (24mm), R (21mm), L (21mm), Total (22mm)
  const colX_PD = [boxRightX, boxRightX + 24, boxRightX + 45, boxRightX + 66, boxRightX + boxW];
  for (let i = 1; i < colX_PD.length; i++) {
    doc.line(colX_PD[i], pdTopY, colX_PD[i], pdTopY + pdH);
  }

  // Header row: R | L | Total
  doc.line(boxRightX, pdTopY + 4.5, boxRightX + boxW, pdTopY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  safeText('R', (colX_PD[1] + colX_PD[2]) / 2, pdTopY + 3.3, { align: 'center' });
  safeText('L', (colX_PD[2] + colX_PD[3]) / 2, pdTopY + 3.3, { align: 'center' });
  safeText('Total', (colX_PD[3] + colX_PD[4]) / 2, pdTopY + 3.3, { align: 'center' });

  // Calculations for PD
  const pdTotalVal = prescription.pd || 62;
  const pdRightVal = prescription.pd_right !== undefined ? prescription.pd_right : Math.round(pdTotalVal / 2);
  const pdLeftVal = prescription.pd_left !== undefined ? prescription.pd_left : (pdTotalVal - pdRightVal);

  const pdNearTotal = prescription.pd_near !== undefined ? prescription.pd_near : 0;
  const pdNearRight = prescription.pd_near_right !== undefined ? prescription.pd_near_right : 0;
  const pdNearLeft = prescription.pd_near_left !== undefined ? prescription.pd_near_left : 0;

  // Row 1: PD
  doc.line(boxRightX, pdTopY + 9.2, boxRightX + boxW, pdTopY + 9.2);
  doc.setFont('helvetica', 'normal');
  safeText('PD', boxRightX + 2, pdTopY + 7.8);
  safeText(pdRightVal, (colX_PD[1] + colX_PD[2]) / 2, pdTopY + 7.8, { align: 'center' });
  safeText(pdLeftVal, (colX_PD[2] + colX_PD[3]) / 2, pdTopY + 7.8, { align: 'center' });
  safeText(pdTotalVal.toFixed(2), (colX_PD[3] + colX_PD[4]) / 2, pdTopY + 7.8, { align: 'center' });

  // Row 2: PD Near
  doc.setFont('helvetica', 'normal');
  safeText('PD Near', boxRightX + 2, pdTopY + 12.5);
  safeText(pdNearRight, (colX_PD[1] + colX_PD[2]) / 2, pdTopY + 12.5, { align: 'center' });
  safeText(pdNearLeft, (colX_PD[2] + colX_PD[3]) / 2, pdTopY + 12.5, { align: 'center' });
  safeText(pdNearTotal.toFixed(2), (colX_PD[3] + colX_PD[4]) / 2, pdTopY + 12.5, { align: 'center' });

  currentY += 40;

  // ----------------------------------------------------
  // 4. FRAME MEASUREMENTS & HEIGHTS SECTION
  // ----------------------------------------------------
  const frameTopY = currentY;

  // Left Heights Box (SH / FH)
  doc.rect(boxLeftX, frameTopY, boxW, 14);

  // Table columns: Label (25mm), RIGHT (31.5mm), LEFT (31.5mm)
  const colX_H = [boxLeftX, boxLeftX + 25, boxLeftX + 56.5, boxLeftX + boxW];
  for (let i = 1; i < colX_H.length; i++) {
    doc.line(colX_H[i], frameTopY, colX_H[i], frameTopY + 14);
  }

  // Header: RIGHT | LEFT
  doc.line(boxLeftX, frameTopY + 4.5, boxLeftX + boxW, frameTopY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  safeText('RIGHT', (colX_H[1] + colX_H[2]) / 2, frameTopY + 3.3, { align: 'center' });
  safeText('LEFT', (colX_H[2] + colX_H[3]) / 2, frameTopY + 3.3, { align: 'center' });

  const shRight = prescription.sh_right !== undefined ? prescription.sh_right : (prescription.segmentHeight || '');
  const shLeft = prescription.sh_left !== undefined ? prescription.sh_left : (prescription.segmentHeight || '');
  const fhRight = prescription.fh_right !== undefined ? prescription.fh_right : (prescription.fittingHeight || '');
  const fhLeft = prescription.fh_left !== undefined ? prescription.fh_left : (prescription.fittingHeight || '');

  // Row 1: SH
  doc.line(boxLeftX, frameTopY + 9.2, boxLeftX + boxW, frameTopY + 9.2);
  doc.setFont('helvetica', 'normal');
  safeText('SH', boxLeftX + 2, frameTopY + 7.8);
  safeText(shRight, (colX_H[1] + colX_H[2]) / 2, frameTopY + 7.8, { align: 'center' });
  safeText(shLeft, (colX_H[2] + colX_H[3]) / 2, frameTopY + 7.8, { align: 'center' });

  // Row 2: FH
  safeText('FH', boxLeftX + 2, frameTopY + 12.5);
  safeText(fhRight, (colX_H[1] + colX_H[2]) / 2, frameTopY + 12.5, { align: 'center' });
  safeText(fhLeft, (colX_H[2] + colX_H[3]) / 2, frameTopY + 12.5, { align: 'center' });


  // Right Frame Specs Box (A, B, DBL, DIA, BASE CURVE, etc.)
  doc.rect(boxRightX, frameTopY, boxW, 40);

  let frameRowY = frameTopY;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  // Row A
  doc.line(boxRightX, frameRowY + 5, boxRightX + boxW, frameRowY + 5);
  safeText('A', boxRightX + 2, frameRowY + 3.8);
  safeText(prescription.a_val || '', boxRightX + 30, frameRowY + 3.8);

  // Row B
  frameRowY += 5;
  doc.line(boxRightX, frameRowY + 5, boxRightX + boxW, frameRowY + 5);
  safeText('B', boxRightX + 2, frameRowY + 3.8);
  safeText(prescription.b_val || '', boxRightX + 30, frameRowY + 3.8);

  // Row DBL
  frameRowY += 5;
  doc.line(boxRightX, frameRowY + 5, boxRightX + boxW, frameRowY + 5);
  safeText('DBL', boxRightX + 2, frameRowY + 3.8);
  safeText(prescription.dbl_val || '', boxRightX + 30, frameRowY + 3.8);

  // Header RIGHT | LEFT for lower frame specs
  frameRowY += 5;
  doc.line(boxRightX, frameRowY + 5, boxRightX + boxW, frameRowY + 5);

  const colX_F = [boxRightX, boxRightX + 32, boxRightX + 60, boxRightX + boxW];
  doc.line(colX_F[1], frameRowY, colX_F[1], frameTopY + 40);
  doc.line(colX_F[2], frameRowY, colX_F[2], frameTopY + 40);

  doc.setFont('helvetica', 'bold');
  safeText('RIGHT', (colX_F[1] + colX_F[2]) / 2, frameRowY + 3.8, { align: 'center' });
  safeText('LEFT', (colX_F[2] + colX_F[3]) / 2, frameRowY + 3.8, { align: 'center' });

  // Specs Rows
  const specsRows = [
    { name: 'DIA', r: prescription.dia_right || '', l: prescription.dia_left || '' },
    { name: 'BASE CURVE', r: prescription.base_curve_right || '', l: prescription.base_curve_left || '' },
    { name: 'PANTO ANGLE', r: prescription.panto_angle || '', l: '' },
    { name: 'WRAP ANGLE', r: prescription.wrap_angle || '', l: '' },
  ];

  doc.setFont('helvetica', 'normal');
  specsRows.forEach((row) => {
    frameRowY += 5;
    if (frameRowY < frameTopY + 40) {
      doc.line(boxRightX, frameRowY + 5, boxRightX + boxW, frameRowY + 5);
    }
    safeText(row.name, boxRightX + 2, frameRowY + 3.8);
    safeText(row.r, (colX_F[1] + colX_F[2]) / 2, frameRowY + 3.8, { align: 'center' });
    safeText(row.l, (colX_F[2] + colX_F[3]) / 2, frameRowY + 3.8, { align: 'center' });
  });

  currentY = frameTopY + 43;

  // ----------------------------------------------------
  // 5. PRODUCTS / ITEMS TABLE
  // ----------------------------------------------------
  const itemTableX = marginX;
  const itemTableW = contentWidth;

  // Gray Header Fill
  doc.setFillColor(colors.grayHeader[0], colors.grayHeader[1], colors.grayHeader[2]);
  doc.rect(itemTableX, currentY, itemTableW, 6, 'F');
  doc.rect(itemTableX, currentY, itemTableW, 6, 'S');

  // Columns: Code (22mm), Description (84mm), Rate (20mm), Qty (12mm), Dis.% (14mm), Dis.Amt (16mm), Amount (22mm)
  const itemCols = [
    itemTableX,
    itemTableX + 22,
    itemTableX + 106,
    itemTableX + 126,
    itemTableX + 138,
    itemTableX + 152,
    itemTableX + 168,
    itemTableX + itemTableW,
  ];

  for (let i = 1; i < itemCols.length - 1; i++) {
    doc.line(itemCols[i], currentY, itemCols[i], currentY + 6);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);

  safeText('Code', itemCols[0] + 3, currentY + 4.2);
  safeText('Description', itemCols[1] + 3, currentY + 4.2);
  safeText('Rate', itemCols[3] - 2, currentY + 4.2, { align: 'right' });
  safeText('Qty', itemCols[4] - 2, currentY + 4.2, { align: 'right' });
  safeText('Dis. %', itemCols[5] - 2, currentY + 4.2, { align: 'right' });
  safeText('Dis.Amt', itemCols[6] - 2, currentY + 4.2, { align: 'right' });
  safeText('Amount', itemCols[7] - 2, currentY + 4.2, { align: 'right' });

  currentY += 6;

  // Render items array or default standard Rx item rows
  let displayItems: PrescriptionItem[] = [];

  if (prescription.items && prescription.items.length > 0) {
    displayItems = prescription.items;
  } else {
    // Generate default item rows matching prescription
    const odDesc = `1.50 SINGLE VISION AR PG BLUE CUT ${odDistSph} ${odDistCyl}`;
    const osDesc = `1.50 SINGLE VISION AR PG BLUE CUT ${osDistSph} ${osDistCyl}`;

    displayItems = [
      { type: 'R', code: '00107087', description: odDesc, rate: 6250.0, qty: 1, discountPercent: 0, discountAmount: 0, amount: 6250.0 },
      { type: 'L', code: '00107085', description: osDesc, rate: 6250.0, qty: 1, discountPercent: 0, discountAmount: 0, amount: 6250.0 },
      { type: 'O', code: '00167459', description: 'INVU MAROON & PINK SQUARE PLASTIC NORM', rate: 4500.0, qty: 1, discountPercent: 20, discountAmount: 0, amount: 3600.0 },
    ];
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  let grandTotal = 0;

  displayItems.forEach((item) => {
    const rowH = 6;
    const typeLabel = item.type ? `${item.type}   ` : '';
    const codeStr = `${typeLabel}${item.code || ''}`;
    const disPctStr = item.discountPercent !== undefined ? item.discountPercent.toFixed(2) : '0.00';
    const disAmtStr = item.discountAmount !== undefined ? item.discountAmount.toFixed(2) : '0.00';
    const rateStr = item.rate.toFixed(2);
    const amtStr = item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    grandTotal += item.amount;

    safeText(codeStr, itemCols[0] + 2, currentY + 4.2);
    safeText(item.description, itemCols[1] + 2, currentY + 4.2, { maxWidth: 82 });
    safeText(rateStr, itemCols[3] - 2, currentY + 4.2, { align: 'right' });
    safeText(item.qty, itemCols[4] - 2, currentY + 4.2, { align: 'right' });
    safeText(disPctStr, itemCols[5] - 2, currentY + 4.2, { align: 'right' });
    safeText(disAmtStr, itemCols[6] - 2, currentY + 4.2, { align: 'right' });
    safeText(amtStr, itemCols[7] - 2, currentY + 4.2, { align: 'right' });

    currentY += rowH;
  });

  // Calculate final total
  const finalTotal = prescription.totalAmount !== undefined ? prescription.totalAmount : grandTotal;
  const formattedTotal = finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Total Line
  currentY += 2;
  const totalLineX1 = itemCols[6];
  const totalLineX2 = itemCols[7];

  doc.setLineWidth(0.4);
  doc.line(totalLineX1, currentY, totalLineX2, currentY);

  currentY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  safeText(formattedTotal, totalLineX2 - 2, currentY, { align: 'right' });

  // Double underline below total
  currentY += 1.5;
  doc.line(totalLineX1, currentY, totalLineX2, currentY);
  doc.line(totalLineX1, currentY + 0.6, totalLineX2, currentY + 0.6);

  // ----------------------------------------------------
  // 6. FOOTER SECTION
  // ----------------------------------------------------
  const footerY = pageHeight - 32;

  // Thin separator line
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.setLineWidth(0.4);
  doc.line(marginX, footerY, pageWidth - marginX, footerY);

  // Left Footer Metadata
  const clinicianStr = prescription.clinicianName || 'EKANAYAKA A G S S';
  const printedDateStr = prescription.printedOn || `${orderDateStr}   ${orderTimeStr}`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  let fLineY = footerY + 5;
  safeText(`Clinician       -   ${clinicianStr}`, marginX, fLineY);

  fLineY += 4.5;
  safeText(`Printed On   -   ${printedDateStr}`, marginX, fLineY);

  fLineY += 4.5;
  doc.setFontSize(7.5);
  safeText('This is a computer generated receipt. No signature required.', marginX, fLineY);

  fLineY += 4.5;
  doc.setFont('helvetica', 'oblique');
  safeText('Software by CodeAqua Software Solutions.', marginX, fLineY);

  // Right Footer DUPLICATE & Page number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  safeText(prescription.duplicateText || 'DUPLICATE', pageWidth - marginX - 15, footerY + 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  safeText('1', pageWidth - marginX - 2, footerY + 22, { align: 'right' });

  // Save / Download PDF file
  const sanitizeName = (prescription.customerName || 'Customer').replace(/\s+/g, '_');
  const fileName = `Prescription_${sanitizeName}_${prescription.prescriptionDate}.pdf`;
  doc.save(fileName);
}
