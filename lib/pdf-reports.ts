import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportMeta {
  title: string;
  subtitle?: string;
  startDate?: string;
  endDate?: string;
  branchName?: string;
  generatedBy?: string;
  kpis?: { label: string; value: string }[];
}

/**
 * Format currency value
 */
export const formatLKR = (amount: number | string | undefined | null) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  return `LKR ${num.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Format standard date
 */
export const formatDateStr = (dateStr: string | undefined | null) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

/**
 * Base PDF Builder with Corporate Lumen Opticals Layout
 */
function createBaseDoc(meta: ReportMeta, orientation: 'portrait' | 'landscape' = 'landscape') {
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // 1. Header Banner
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Accent Line
  doc.setFillColor(79, 70, 229); // Indigo-600
  doc.rect(0, 24, pageWidth, 1.5, 'F');

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('LUMEN OPTICALS', margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text('Optical Practice & Inventory Management Information System', margin, 18);

  // Right-aligned report header details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(meta.title.toUpperCase(), pageWidth - margin, 11, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const now = new Date();
  const genTimestamp = `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  doc.text(`Generated: ${genTimestamp}`, pageWidth - margin, 18, { align: 'right' });

  // 2. Sub-header / Meta Bar
  let currentY = 32;

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(meta.title, margin, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // Slate-500

  const periodText = meta.startDate && meta.endDate 
    ? `Reporting Period: ${formatDateStr(meta.startDate)} to ${formatDateStr(meta.endDate)}`
    : `As of ${formatDateStr(new Date().toISOString())}`;
  
  const branchText = meta.branchName ? ` | Branch: ${meta.branchName}` : '';
  doc.text(`${periodText}${branchText}`, margin, currentY);

  currentY += 5;

  // 3. KPI Highlight Cards (if any)
  if (meta.kpis && meta.kpis.length > 0) {
    const cardWidth = (pageWidth - margin * 2 - (meta.kpis.length - 1) * 4) / meta.kpis.length;
    const cardHeight = 15;

    meta.kpis.forEach((kpi, idx) => {
      const cardX = margin + idx * (cardWidth + 4);

      // Card Box
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

      // Top Accent on Card
      doc.setFillColor(79, 70, 229);
      doc.rect(cardX, currentY, cardWidth, 0.8, 'F');

      // Label
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(kpi.label.toUpperCase(), cardX + 3, currentY + 4.5);

      // Value
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(kpi.value, cardX + 3, currentY + 11.5);
    });

    currentY += cardHeight + 5;
  }

  return { doc, startY: currentY, pageWidth, pageHeight, margin };
}

/**
 * Add standard footer to all pages
 */
function applyPageFooters(doc: jsPDF, margin: number) {
  const totalPages = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    // Footer text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text('Lumen Opticals MIS - Confidential Business Report', margin, pageHeight - 6);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }
}

// -------------------------------------------------------------
// 1. CUSTOMER-WISE SALES REPORT PDF
// -------------------------------------------------------------
export function generateCustomerWiseSalesPDF(data: any[], summary: any, filters: { startDate?: string; endDate?: string; branchName?: string }) {
  const kpis = [
    { label: 'Total Customers', value: (summary?.totalCustomers || data.length).toString() },
    { label: 'Total Invoices', value: (summary?.totalInvoices || 0).toString() },
    { label: 'Total Sales Revenue', value: formatLKR(summary?.totalSalesAmount || 0) },
    { label: 'Total Outstanding Balance', value: formatLKR(summary?.totalBalanceAmount || 0) },
  ];

  const { doc, startY, margin } = createBaseDoc({
    title: 'Customer-Wise Sales Report',
    startDate: filters.startDate,
    endDate: filters.endDate,
    branchName: filters.branchName,
    kpis,
  }, 'landscape');

  const headers = [
    ['#', 'Cust. Code', 'Customer Name', 'Phone', 'Email', 'Invoices', 'Gross Total', 'Discounts', 'Net Sales (LKR)', 'Paid (LKR)', 'Balance (LKR)', 'Last Purchase']
  ];

  let grossSum = 0;
  let discSum = 0;
  let netSum = 0;
  let paidSum = 0;
  let balSum = 0;
  let invSum = 0;

  const rows = data.map((row, idx) => {
    const gross = parseFloat(row.gross_amount || row.total_net_amount || 0);
    const disc = parseFloat(row.total_discount || 0);
    const net = parseFloat(row.total_net_amount || 0);
    const paid = parseFloat(row.total_paid || 0);
    const bal = parseFloat(row.total_balance || 0);
    const inv = parseInt(row.total_invoices || 1);

    grossSum += gross;
    discSum += disc;
    netSum += net;
    paidSum += paid;
    balSum += bal;
    invSum += inv;

    return [
      (idx + 1).toString(),
      row.customer_code || 'N/A',
      row.customer_name || 'Walk-in',
      row.phone || 'N/A',
      row.email || 'N/A',
      inv.toString(),
      gross.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      disc.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      net.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      paid.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      bal.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      formatDateStr(row.last_purchase_date)
    ];
  });

  const foot = [
    [
      { content: 'TOTAL', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: invSum.toString(), styles: { halign: 'center', fontStyle: 'bold' } },
      { content: grossSum.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: discSum.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: netSum.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: paidSum.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: balSum.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: '', styles: { halign: 'center' } }
    ]
  ];

  autoTable(doc, {
    startY,
    head: headers,
    body: rows,
    foot: foot as any,
    theme: 'grid',
    headStyles: {
      fillColor: [49, 46, 129], // Indigo-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
      cellPadding: 2.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.5
    },
    footStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontSize: 7.5,
      cellPadding: 2.5
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'left', cellWidth: 20 },
      2: { halign: 'left', cellWidth: 38 },
      3: { halign: 'left', cellWidth: 24 },
      4: { halign: 'left', cellWidth: 34 },
      5: { halign: 'center', cellWidth: 15 },
      6: { halign: 'right', cellWidth: 22 },
      7: { halign: 'right', cellWidth: 18 },
      8: { halign: 'right', cellWidth: 24 },
      9: { halign: 'right', cellWidth: 22 },
      10: { halign: 'right', cellWidth: 22 },
      11: { halign: 'center', cellWidth: 22 },
    },
    margin: { left: margin, right: margin, bottom: 16 },
  });

  applyPageFooters(doc, margin);

  const dateTag = filters.startDate ? `${filters.startDate}_to_${filters.endDate}` : new Date().toISOString().split('T')[0];
  doc.save(`Lumen_Sales_Customer_Wise_${dateTag}.pdf`);
}

// -------------------------------------------------------------
// 2. ITEM-WISE SALES REPORT PDF
// -------------------------------------------------------------
export function generateItemWiseSalesPDF(data: any[], summary: any, filters: { startDate?: string; endDate?: string; branchName?: string; category?: string }) {
  const kpis = [
    { label: 'Unique Items Sold', value: (summary?.totalUniqueItems || data.length).toString() },
    { label: 'Total Units Sold', value: (summary?.totalQuantitySold || 0).toString() },
    { label: 'Total Net Revenue', value: formatLKR(summary?.totalRevenue || 0) },
    { label: 'Estimated Gross Profit', value: formatLKR(summary?.totalGrossProfit || 0) },
  ];

  const { doc, startY, margin } = createBaseDoc({
    title: 'Item-Wise Sales & Performance Report',
    startDate: filters.startDate,
    endDate: filters.endDate,
    branchName: filters.branchName,
    kpis,
  }, 'landscape');

  const headers = [
    ['#', 'Item Code', 'Product / Item Name', 'Category', 'Type', 'Qty Sold', 'Avg Unit Price', 'Total Discounts', 'Net Revenue (LKR)', 'Est. COGS (LKR)', 'Gross Profit (LKR)', 'Margin %']
  ];

  let totalQty = 0;
  let totalDiscounts = 0;
  let totalRevenue = 0;
  let totalCost = 0;
  let totalProfit = 0;

  const rows = data.map((row, idx) => {
    const qty = parseInt(row.quantity_sold || 0);
    const avgPrice = parseFloat(row.avg_unit_price || 0);
    const disc = parseFloat(row.total_discount || 0);
    const rev = parseFloat(row.total_revenue || 0);
    const cost = parseFloat(row.total_cost || 0);
    const profit = parseFloat(row.gross_profit || (rev - cost));
    const marginPct = rev > 0 ? ((profit / rev) * 100).toFixed(1) : '0.0';

    totalQty += qty;
    totalDiscounts += disc;
    totalRevenue += rev;
    totalCost += cost;
    totalProfit += profit;

    return [
      (idx + 1).toString(),
      row.product_code || 'N/A',
      row.product_name || 'Item',
      row.category || 'General',
      row.type === 'inventory' ? 'Stock' : 'Service',
      qty.toString(),
      avgPrice.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      disc.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      rev.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      cost.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      profit.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      `${marginPct}%`
    ];
  });

  const overallMarginPct = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  const foot = [
    [
      { content: 'TOTAL', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: totalQty.toString(), styles: { halign: 'center', fontStyle: 'bold' } },
      { content: '', styles: { halign: 'center' } },
      { content: totalDiscounts.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: totalRevenue.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: totalCost.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: totalProfit.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `${overallMarginPct}%`, styles: { halign: 'center', fontStyle: 'bold' } }
    ]
  ];

  autoTable(doc, {
    startY,
    head: headers,
    body: rows,
    foot: foot as any,
    theme: 'grid',
    headStyles: {
      fillColor: [49, 46, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
      cellPadding: 2.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.5
    },
    footStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontSize: 7.5,
      cellPadding: 2.5
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'left', cellWidth: 22 },
      2: { halign: 'left', cellWidth: 50 },
      3: { halign: 'left', cellWidth: 26 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'center', cellWidth: 16 },
      6: { halign: 'right', cellWidth: 22 },
      7: { halign: 'right', cellWidth: 20 },
      8: { halign: 'right', cellWidth: 24 },
      9: { halign: 'right', cellWidth: 22 },
      10: { halign: 'right', cellWidth: 22 },
      11: { halign: 'center', cellWidth: 18 },
    },
    margin: { left: margin, right: margin, bottom: 16 },
  });

  applyPageFooters(doc, margin);

  const dateTag = filters.startDate ? `${filters.startDate}_to_${filters.endDate}` : new Date().toISOString().split('T')[0];
  doc.save(`Lumen_Sales_Item_Wise_${dateTag}.pdf`);
}

// -------------------------------------------------------------
// 3. SALES SUMMARY TRANSACTIONS REPORT PDF
// -------------------------------------------------------------
export function generateSalesSummaryPDF(data: any[], summary: any, filters: { startDate?: string; endDate?: string; branchName?: string }) {
  const kpis = [
    { label: 'Total Invoices', value: (summary?.totalOrders || data.length).toString() },
    { label: 'Net Sales', value: formatLKR(summary?.totalNetSales || 0) },
    { label: 'Collected / Paid', value: formatLKR(summary?.totalCollected || 0) },
    { label: 'Balance Outstanding', value: formatLKR(summary?.totalOutstanding || 0) },
  ];

  const { doc, startY, margin } = createBaseDoc({
    title: 'Sales Transactions Summary Report',
    startDate: filters.startDate,
    endDate: filters.endDate,
    branchName: filters.branchName,
    kpis,
  }, 'landscape');

  const headers = [
    ['#', 'Invoice #', 'Date & Time', 'Customer Name', 'Phone', 'Items', 'Subtotal', 'Discount', 'Net Amount', 'Paid', 'Balance', 'Method', 'Status']
  ];

  let subSum = 0;
  let discSum = 0;
  let netSum = 0;
  let paidSum = 0;
  let balSum = 0;

  const rows = data.map((row, idx) => {
    const sub = parseFloat(row.total_amount || 0);
    const disc = parseFloat(row.discount_amount || 0);
    const net = parseFloat(row.net_amount || 0);
    const paid = parseFloat(row.advance_amount || 0);
    const bal = parseFloat(row.balance_amount || 0);

    subSum += sub;
    discSum += disc;
    netSum += net;
    paidSum += paid;
    balSum += bal;

    return [
      (idx + 1).toString(),
      row.invoice_number || 'INV',
      formatDateStr(row.sale_date),
      row.customer_name || 'Walk-in',
      row.customer_phone || 'N/A',
      (row.total_items || 1).toString(),
      sub.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      disc.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      net.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      paid.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      bal.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      (row.payment_method || 'cash').toUpperCase(),
      (row.payment_status || 'completed').toUpperCase()
    ];
  });

  const foot = [
    [
      { content: 'TOTAL', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: subSum.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: discSum.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: netSum.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: paidSum.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: balSum.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: '', colSpan: 2 }
    ]
  ];

  autoTable(doc, {
    startY,
    head: headers,
    body: rows,
    foot: foot as any,
    theme: 'grid',
    headStyles: {
      fillColor: [49, 46, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
      cellPadding: 2.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.5
    },
    footStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontSize: 7.5,
      cellPadding: 2.5
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'left', cellWidth: 20 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'left', cellWidth: 36 },
      4: { halign: 'left', cellWidth: 24 },
      5: { halign: 'center', cellWidth: 12 },
      6: { halign: 'right', cellWidth: 22 },
      7: { halign: 'right', cellWidth: 18 },
      8: { halign: 'right', cellWidth: 24 },
      9: { halign: 'right', cellWidth: 22 },
      10: { halign: 'right', cellWidth: 22 },
      11: { halign: 'center', cellWidth: 18 },
      12: { halign: 'center', cellWidth: 20 },
    },
    margin: { left: margin, right: margin, bottom: 16 },
  });

  applyPageFooters(doc, margin);

  const dateTag = filters.startDate ? `${filters.startDate}_to_${filters.endDate}` : new Date().toISOString().split('T')[0];
  doc.save(`Lumen_Sales_Summary_${dateTag}.pdf`);
}

// -------------------------------------------------------------
// 4. STOCK LEVELS & INVENTORY VALUATION REPORT PDF
// -------------------------------------------------------------
export function generateStockSummaryPDF(data: any[], summary: any, filters: { branchName?: string; category?: string }) {
  const kpis = [
    { label: 'Total Products (SKUs)', value: (summary?.totalProducts || data.length).toString() },
    { label: 'Total In-Stock Units', value: (summary?.totalUnits || 0).toString() },
    { label: 'Total Stock Cost Value', value: formatLKR(summary?.totalCostValue || 0) },
    { label: 'Total Stock Retail Value', value: formatLKR(summary?.totalRetailValue || 0) },
  ];

  const { doc, startY, margin } = createBaseDoc({
    title: 'Stock Inventory & Valuation Report',
    branchName: filters.branchName,
    kpis,
  }, 'landscape');

  const headers = [
    ['#', 'Code / SKU', 'Product / Item Name', 'Category', 'Current Qty', 'Unit', 'Min Stock', 'Unit Cost (LKR)', 'Unit Retail (LKR)', 'Total Cost (LKR)', 'Total Retail (LKR)', 'Status']
  ];

  let totalQty = 0;
  let totalCostVal = 0;
  let totalRetailVal = 0;

  const rows = data.map((row, idx) => {
    const qty = parseInt(row.current_stock || 0);
    const cost = parseFloat(row.cost_price || 0);
    const retail = parseFloat(row.selling_price || 0);
    const totCost = parseFloat(row.total_cost_value || (qty * cost));
    const totRetail = parseFloat(row.total_retail_value || (qty * retail));

    totalQty += qty;
    totalCostVal += totCost;
    totalRetailVal += totRetail;

    let statusLabel = 'In Stock';
    if (row.stock_status === 'OUT_OF_STOCK' || qty <= 0) statusLabel = 'Out of Stock';
    else if (row.stock_status === 'LOW_STOCK' || qty <= row.min_stock) statusLabel = 'Low Stock';
    else if (row.stock_status === 'OVERSTOCK') statusLabel = 'Overstock';

    return [
      (idx + 1).toString(),
      row.product_code || 'N/A',
      row.product_name || 'Product',
      row.category || 'General',
      qty.toString(),
      row.unit || 'pcs',
      (row.min_stock || 0).toString(),
      cost.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      retail.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totCost.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totRetail.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      statusLabel
    ];
  });

  const foot = [
    [
      { content: 'TOTAL', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: totalQty.toString(), styles: { halign: 'center', fontStyle: 'bold' } },
      { content: '', colSpan: 4 },
      { content: totalCostVal.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: totalRetailVal.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: '', styles: { halign: 'center' } }
    ]
  ];

  autoTable(doc, {
    startY,
    head: headers,
    body: rows,
    foot: foot as any,
    theme: 'grid',
    headStyles: {
      fillColor: [49, 46, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
      cellPadding: 2.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.5
    },
    footStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontSize: 7.5,
      cellPadding: 2.5
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'left', cellWidth: 22 },
      2: { halign: 'left', cellWidth: 50 },
      3: { halign: 'left', cellWidth: 26 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'center', cellWidth: 12 },
      6: { halign: 'center', cellWidth: 14 },
      7: { halign: 'right', cellWidth: 22 },
      8: { halign: 'right', cellWidth: 22 },
      9: { halign: 'right', cellWidth: 26 },
      10: { halign: 'right', cellWidth: 26 },
      11: { halign: 'center', cellWidth: 22 },
    },
    margin: { left: margin, right: margin, bottom: 16 },
  });

  applyPageFooters(doc, margin);

  const dateTag = new Date().toISOString().split('T')[0];
  doc.save(`Lumen_Stock_Inventory_Valuation_${dateTag}.pdf`);
}

// -------------------------------------------------------------
// 5. LOW STOCK & REORDER ALERTS REPORT PDF
// -------------------------------------------------------------
export function generateLowStockPDF(data: any[], summary: any, filters: { branchName?: string }) {
  const kpis = [
    { label: 'Low Stock SKUs', value: (summary?.totalLowStockSkus || data.length).toString() },
    { label: 'Critical Out-of-Stock', value: (summary?.criticalCount || 0).toString() },
    { label: 'Units to Reorder', value: (summary?.totalUnitsToReorder || 0).toString() },
    { label: 'Estimated Restock Cost', value: formatLKR(summary?.totalEstimatedReorderCost || 0) },
  ];

  const { doc, startY, margin } = createBaseDoc({
    title: 'Low Stock & Reorder Alert Report',
    branchName: filters.branchName,
    kpis,
  }, 'landscape');

  const headers = [
    ['#', 'Item Code', 'Product / Item Name', 'Category', 'Current Qty', 'Min Level', 'Max Level', 'Reorder Needed', 'Unit Cost (LKR)', 'Estimated Cost (LKR)', 'Priority']
  ];

  let totalReorderQty = 0;
  let totalEstimatedCost = 0;

  const rows = data.map((row, idx) => {
    const qty = parseInt(row.current_stock || 0);
    const reorder = parseInt(row.reorder_needed || 0);
    const cost = parseFloat(row.cost_price || 0);
    const estCost = parseFloat(row.estimated_reorder_cost || (reorder * cost));

    totalReorderQty += reorder;
    totalEstimatedCost += estCost;

    return [
      (idx + 1).toString(),
      row.product_code || 'N/A',
      row.product_name || 'Product',
      row.category || 'General',
      qty.toString(),
      (row.min_stock || 0).toString(),
      (row.max_stock || 0).toString(),
      reorder.toString(),
      cost.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      estCost.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      row.urgency || (qty <= 0 ? 'Critical' : 'Low Stock')
    ];
  });

  const foot = [
    [
      { content: 'TOTAL', colSpan: 7, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: totalReorderQty.toString(), styles: { halign: 'center', fontStyle: 'bold' } },
      { content: '', styles: { halign: 'center' } },
      { content: totalEstimatedCost.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: '', styles: { halign: 'center' } }
    ]
  ];

  autoTable(doc, {
    startY,
    head: headers,
    body: rows,
    foot: foot as any,
    theme: 'grid',
    headStyles: {
      fillColor: [185, 28, 28], // Red-700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
      cellPadding: 2.5
    },
    alternateRowStyles: {
      fillColor: [254, 242, 242] // Red-50
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.5
    },
    footStyles: {
      fillColor: [254, 226, 226],
      textColor: [153, 27, 27],
      fontSize: 7.5,
      cellPadding: 2.5
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'left', cellWidth: 24 },
      2: { halign: 'left', cellWidth: 54 },
      3: { halign: 'left', cellWidth: 28 },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'center', cellWidth: 16 },
      6: { halign: 'center', cellWidth: 16 },
      7: { halign: 'center', cellWidth: 22 },
      8: { halign: 'right', cellWidth: 24 },
      9: { halign: 'right', cellWidth: 28 },
      10: { halign: 'center', cellWidth: 28 },
    },
    margin: { left: margin, right: margin, bottom: 16 },
  });

  applyPageFooters(doc, margin);

  const dateTag = new Date().toISOString().split('T')[0];
  doc.save(`Lumen_Low_Stock_Reorder_Report_${dateTag}.pdf`);
}

// -------------------------------------------------------------
// 6. CATEGORY-WISE STOCK VALUATION REPORT PDF
// -------------------------------------------------------------
export function generateCategoryStockValuationPDF(data: any[], summary: any, filters: { branchName?: string }) {
  const kpis = [
    { label: 'Total Categories', value: (summary?.totalCategories || data.length).toString() },
    { label: 'Total Products (SKUs)', value: (summary?.totalSkus || 0).toString() },
    { label: 'Total Inventory Cost', value: formatLKR(summary?.totalCostValue || 0) },
    { label: 'Potential Gross Profit', value: formatLKR(summary?.totalPotentialProfit || 0) },
  ];

  const { doc, startY, margin } = createBaseDoc({
    title: 'Category-Wise Stock Valuation Report',
    branchName: filters.branchName,
    kpis,
  }, 'portrait');

  const headers = [
    ['#', 'Category Name', 'Total SKUs', 'In-Stock Units', 'Total Cost Value (LKR)', 'Total Retail Value (LKR)', 'Potential Profit (LKR)', 'Margin %']
  ];

  let totalSkus = 0;
  let totalUnits = 0;
  let totalCost = 0;
  let totalRetail = 0;
  let totalProfit = 0;

  const rows = data.map((row, idx) => {
    const skus = parseInt(row.total_skus || 0);
    const units = parseInt(row.total_units || 0);
    const cost = parseFloat(row.total_cost_value || 0);
    const retail = parseFloat(row.total_retail_value || 0);
    const profit = parseFloat(row.potential_profit || (retail - cost));
    const marginPct = retail > 0 ? ((profit / retail) * 100).toFixed(1) : '0.0';

    totalSkus += skus;
    totalUnits += units;
    totalCost += cost;
    totalRetail += retail;
    totalProfit += profit;

    return [
      (idx + 1).toString(),
      row.category || 'General',
      skus.toString(),
      units.toString(),
      cost.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      retail.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      profit.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      `${marginPct}%`
    ];
  });

  const overallMargin = totalRetail > 0 ? ((totalProfit / totalRetail) * 100).toFixed(1) : '0.0';

  const foot = [
    [
      { content: 'TOTAL', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: totalSkus.toString(), styles: { halign: 'center', fontStyle: 'bold' } },
      { content: totalUnits.toString(), styles: { halign: 'center', fontStyle: 'bold' } },
      { content: totalCost.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: totalRetail.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: totalProfit.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `${overallMargin}%`, styles: { halign: 'center', fontStyle: 'bold' } }
    ]
  ];

  autoTable(doc, {
    startY,
    head: headers,
    body: rows,
    foot: foot as any,
    theme: 'grid',
    headStyles: {
      fillColor: [49, 46, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 3
    },
    footStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontSize: 8,
      cellPadding: 3
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'left', cellWidth: 36 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'right', cellWidth: 28 },
      5: { halign: 'right', cellWidth: 28 },
      6: { halign: 'right', cellWidth: 26 },
      7: { halign: 'center', cellWidth: 16 },
    },
    margin: { left: margin, right: margin, bottom: 16 },
  });

  applyPageFooters(doc, margin);

  const dateTag = new Date().toISOString().split('T')[0];
  doc.save(`Lumen_Category_Stock_Valuation_${dateTag}.pdf`);
}

// -------------------------------------------------------------
// 7. PAYMENT TYPE WISE DAILY COLLECTIONS REPORT PDF
// -------------------------------------------------------------
export function generatePaymentCollectionsPDF(data: any[], summary: any, filters: { startDate?: string; endDate?: string; branchName?: string }) {
  const kpis = [
    { label: 'Total Collections', value: formatLKR(summary?.totalCollected || 0) },
    { label: 'Cash Collected', value: formatLKR(summary?.totalCash || 0) },
    { label: 'Card Collected', value: formatLKR(summary?.totalCard || 0) },
    { label: 'UPI / Online', value: formatLKR(summary?.totalUpi || 0) },
  ];

  const { doc, startY, margin } = createBaseDoc({
    title: 'Payment Type-Wise Daily Collections Report',
    startDate: filters.startDate,
    endDate: filters.endDate,
    branchName: filters.branchName,
    kpis,
  }, 'landscape');

  const headers = [
    ['#', 'Collection Date', 'Invoices', 'Cash (LKR)', 'Card (LKR)', 'UPI / QR (LKR)', 'Cheque (LKR)', 'Other (LKR)', 'Total Collected (LKR)', 'Net Sales (LKR)', 'Balance Due (LKR)']
  ];

  let totalInvoicesSum = 0;
  let cashSum = 0;
  let cardSum = 0;
  let upiSum = 0;
  let chequeSum = 0;
  let otherSum = 0;
  let collectedSum = 0;
  let netSalesSum = 0;
  let balanceSum = 0;

  const rows = data.map((row, idx) => {
    const invoices = parseInt(row.total_invoices || 0);
    const cash = parseFloat(row.cash_collected || 0);
    const card = parseFloat(row.card_collected || 0);
    const upi = parseFloat(row.upi_collected || 0);
    const cheque = parseFloat(row.cheque_collected || 0);
    const other = parseFloat(row.other_collected || 0);
    const collected = parseFloat(row.total_collected || 0);
    const netSales = parseFloat(row.total_net_sales || 0);
    const balance = parseFloat(row.total_balance || 0);

    totalInvoicesSum += invoices;
    cashSum += cash;
    cardSum += card;
    upiSum += upi;
    chequeSum += cheque;
    otherSum += other;
    collectedSum += collected;
    netSalesSum += netSales;
    balanceSum += balance;

    return [
      (idx + 1).toString(),
      formatDateStr(row.collection_date),
      invoices.toString(),
      cash.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      card.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      upi.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      cheque.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      other.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      collected.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      netSales.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      balance.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    ];
  });

  const foot = [
    [
      { content: 'TOTAL', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: totalInvoicesSum.toString(), styles: { halign: 'center', fontStyle: 'bold' } },
      { content: cashSum.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: cardSum.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: upiSum.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: chequeSum.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: otherSum.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: collectedSum.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: netSalesSum.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: balanceSum.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } }
    ]
  ];

  autoTable(doc, {
    startY,
    head: headers,
    body: rows,
    foot: foot as any,
    theme: 'grid',
    headStyles: {
      fillColor: [49, 46, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
      cellPadding: 2.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.5
    },
    footStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontSize: 7.5,
      cellPadding: 2.5
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 24 },
      2: { halign: 'center', cellWidth: 16 },
      3: { halign: 'right', cellWidth: 26 },
      4: { halign: 'right', cellWidth: 26 },
      5: { halign: 'right', cellWidth: 26 },
      6: { halign: 'right', cellWidth: 24 },
      7: { halign: 'right', cellWidth: 22 },
      8: { halign: 'right', cellWidth: 30 },
      9: { halign: 'right', cellWidth: 28 },
      10: { halign: 'right', cellWidth: 26 },
    },
    margin: { left: margin, right: margin, bottom: 16 },
  });

  applyPageFooters(doc, margin);

  const dateTag = filters.startDate ? `${filters.startDate}_to_${filters.endDate}` : new Date().toISOString().split('T')[0];
  doc.save(`Lumen_Payment_Collections_${dateTag}.pdf`);
}
