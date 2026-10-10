import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Business, Invoice } from '../types/index.ts';

interface ReportData {
  summary: {
    totalSales: string;
    totalTax: string;
    totalDiscount: string;
    totalCollected: string;
    totalPending: string;
    totalBills: number;
    totalExpenses: string;
    estimatedNetProfit: string;
    inventoryCostValue: string;
    inventoryRetailValue: string;
  };
  gstBreakdown: Array<{
    slab: string;
    taxable: string;
    cgst: string;
    sgst: string;
    igst: string;
    totalTax: string;
  }>;
  invoices?: Array<{
    invoiceNumber: string;
    invoiceDate: string;
    customerName: string | null;
    grandTotal: string;
    paidAmount: string;
    balanceAmount: string;
    paymentMethod: string;
    status: string;
  }>;
}

export const pdfGenerator = {
  // Helper to add header to document
  addHeader(doc: jsPDF, business: Business, reportTitle: string, fromDate: string, toDate: string) {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Primary Brand Bar
    doc.setFillColor(37, 99, 235); // Blue 600
    doc.rect(0, 0, pageWidth, 5, 'F');

    // Business Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(business.name, 14, 16);

    // Business Subtext
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // Slate 500
    let subline = '';
    if (business.address) subline += business.address;
    if (business.city) subline += (subline ? ', ' : '') + business.city;
    if (business.phone) subline += ` | Ph: ${business.phone}`;
    if (subline) {
      doc.text(subline, 14, 21);
    }

    if (business.isGstRegistered && business.gstin) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text(`GSTIN: ${business.gstin}`, 14, 26);
    }

    // Report Title & Period (Right aligned)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(reportTitle.toUpperCase(), pageWidth - 14, 16, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Period: ${fromDate} to ${toDate}`, pageWidth - 14, 21, { align: 'right' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 14, 26, { align: 'right' });

    // Dividing Line
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.5);
    doc.line(14, 30, pageWidth - 14, 30);
  },

  // Helper to add footer
  addFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text('Smart Billing Pro - Confirmed System Accounting Records', 14, pageHeight - 7);
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  },

  // 1. Comprehensive Financial & Sales Summary PDF
  generateFinancialSummaryPdf(business: Business, reportData: ReportData, fromDate: string, toDate: string) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const { summary, invoices } = reportData;

    this.addHeader(doc, business, 'Financial Sales Summary', fromDate, toDate);

    // Summary KPI Box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('Executive Financial Overview', 14, 37);

    const kpiData = [
      ['Gross Sales Turnover', `Rs. ${summary.totalSales}`, 'Total Bills Issued', `${summary.totalBills}`],
      ['Collected Cash/Digital', `Rs. ${summary.totalCollected}`, 'Receivables / Khata Due', `Rs. ${summary.totalPending}`],
      ['Total Shop Expenses', `Rs. ${summary.totalExpenses}`, 'Estimated Net Profit', `Rs. ${summary.estimatedNetProfit}`],
      ['Total GST Collected', `Rs. ${summary.totalTax}`, 'Inventory Valuation', `Rs. ${summary.inventoryRetailValue}`],
    ];

    autoTable(doc, {
      startY: 40,
      head: [],
      body: kpiData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 2.5,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 50 },
        1: { fontStyle: 'bold', textColor: [37, 99, 235], cellWidth: 40 },
        2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 50 },
        3: { fontStyle: 'bold', textColor: [16, 185, 129], cellWidth: 42 },
      },
      margin: { left: 14, right: 14 },
    });

    // Invoices Table
    const lastY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 70;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('Invoices & Sales Transactions', 14, lastY);

    const invoiceRows = (invoices || []).map((inv) => [
      inv.invoiceNumber,
      inv.invoiceDate,
      inv.customerName || 'Walk-in',
      inv.paymentMethod,
      `Rs. ${inv.grandTotal}`,
      `Rs. ${inv.paidAmount}`,
      `Rs. ${inv.balanceAmount}`,
      inv.status.toUpperCase(),
    ]);

    autoTable(doc, {
      startY: lastY + 3,
      head: [['Bill #', 'Date', 'Customer', 'Mode', 'Total', 'Paid', 'Due', 'Status']],
      body: invoiceRows.length > 0 ? invoiceRows : [['No invoices recorded in this period', '', '', '', '', '', '', '']],
      theme: 'striped',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        4: { halign: 'right', fontStyle: 'bold' },
        5: { halign: 'right' },
        6: { halign: 'right', textColor: [220, 38, 38] },
        7: { halign: 'center', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });

    // Add footers on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      this.addFooter(doc, i, pageCount);
    }

    doc.save(`Financial_Summary_${business.name.replace(/\s+/g, '_')}_${fromDate}_to_${toDate}.pdf`);
  },

  // 2. GST Tax Summary PDF (GSTR-1 Ready)
  generateGstReportPdf(business: Business, reportData: ReportData, fromDate: string, toDate: string) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const { summary, gstBreakdown } = reportData;

    this.addHeader(doc, business, 'GST Slabs & GSTR-1 Tax Report', fromDate, toDate);

    // GSTIN Compliance Notice
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `This document reflects taxable values, CGST, SGST, and IGST breakdowns for the period from ${fromDate} to ${toDate}.`,
      14,
      36
    );

    // GST Slabs Table
    const slabRows = (gstBreakdown || []).map((g) => [
      g.slab,
      `Rs. ${g.taxable}`,
      `Rs. ${g.cgst}`,
      `Rs. ${g.sgst}`,
      `Rs. ${g.igst}`,
      `Rs. ${g.totalTax}`,
    ]);

    // Calculate totals
    const totalTaxable = (gstBreakdown || []).reduce((acc, g) => acc + parseFloat(g.taxable || '0'), 0);
    const totalCgst = (gstBreakdown || []).reduce((acc, g) => acc + parseFloat(g.cgst || '0'), 0);
    const totalSgst = (gstBreakdown || []).reduce((acc, g) => acc + parseFloat(g.sgst || '0'), 0);
    const totalIgst = (gstBreakdown || []).reduce((acc, g) => acc + parseFloat(g.igst || '0'), 0);
    const grandTax = (gstBreakdown || []).reduce((acc, g) => acc + parseFloat(g.totalTax || '0'), 0);

    const totalRow = [
      'TOTAL TAXABLE',
      `Rs. ${totalTaxable.toFixed(2)}`,
      `Rs. ${totalCgst.toFixed(2)}`,
      `Rs. ${totalSgst.toFixed(2)}`,
      `Rs. ${totalIgst.toFixed(2)}`,
      `Rs. ${grandTax.toFixed(2)}`,
    ];

    autoTable(doc, {
      startY: 42,
      head: [['Rate Slab', 'Taxable Value', 'CGST (Central)', 'SGST (State)', 'IGST (Integrated)', 'Total Tax Liability']],
      body: [...slabRows, totalRow],
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138], // Indigo 900
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold', textColor: [37, 99, 235] },
      },
      didParseCell: (data) => {
        // Highlight total row
        if (data.row.index === slabRows.length) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      },
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 90;

    // GST Filing & Audit Notice
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, finalY, doc.internal.pageSize.getWidth() - 28, 24, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('Tax Accountant & Audit Verification Notes:', 18, finalY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      '• Intra-state supply taxes are divided equally into Central GST (CGST) and State GST (SGST).\n' +
      '• Inter-state outward supplies are accounted under Integrated GST (IGST).\n' +
      '• Use this statement for monthly/quarterly GSTR-1 preparation and internal reconciliation.',
      18,
      finalY + 11
    );

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      this.addFooter(doc, i, pageCount);
    }

    doc.save(`GST_Tax_Report_${business.name.replace(/\s+/g, '_')}_${fromDate}_to_${toDate}.pdf`);
  },

  // 3. Stock Movement & Inventory Valuation PDF
  generateInventoryValuationPdf(business: Business, products: any[]) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const today = new Date().toISOString().split('T')[0];

    this.addHeader(doc, business, 'Inventory & Stock Valuation', today, today);

    // Summary Box
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let lowStockCount = 0;

    products.forEach((p) => {
      const stock = parseFloat(p.currentStock || '0');
      const cost = parseFloat(p.purchasePrice || '0');
      const sale = parseFloat(p.sellingPrice || '0');
      if (stock > 0) {
        totalCostValuation += stock * cost;
        totalRetailValuation += stock * sale;
      }
      if (stock <= parseFloat(p.minStockAlert || '5')) {
        lowStockCount++;
      }
    });

    const kpiData = [
      ['Total Catalog Products', `${products.length}`, 'Low Stock Alert Items', `${lowStockCount}`],
      ['Total Stock Cost Value', `Rs. ${totalCostValuation.toFixed(2)}`, 'Total Retail Value', `Rs. ${totalRetailValuation.toFixed(2)}`],
    ];

    autoTable(doc, {
      startY: 37,
      head: [],
      body: kpiData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 50 },
        1: { fontStyle: 'bold', cellWidth: 40 },
        2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 50 },
        3: { fontStyle: 'bold', textColor: [37, 99, 235], cellWidth: 42 },
      },
      margin: { left: 14, right: 14 },
    });

    const lastY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 65;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('Product-wise Stock Valuation Breakdown', 14, lastY);

    const productRows = products.map((p) => {
      const stock = parseFloat(p.currentStock || '0');
      const cost = parseFloat(p.purchasePrice || '0');
      const sale = parseFloat(p.sellingPrice || '0');
      const isLow = stock <= parseFloat(p.minStockAlert || '5');

      return [
        p.name,
        p.barcode || p.sku || '-',
        `${p.currentStock} ${p.unit}`,
        `Rs. ${cost.toFixed(2)}`,
        `Rs. ${sale.toFixed(2)}`,
        `Rs. ${(stock * cost).toFixed(2)}`,
        isLow ? 'LOW STOCK' : 'Adequate',
      ];
    });

    autoTable(doc, {
      startY: lastY + 3,
      head: [['Product Name', 'SKU/Barcode', 'In Stock', 'Unit Cost', 'Sale Price', 'Valuation (Cost)', 'Stock Status']],
      body: productRows,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' },
        6: { halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.column.index === 6 && data.cell.text[0] === 'LOW STOCK') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      margin: { left: 14, right: 14 },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      this.addFooter(doc, i, pageCount);
    }

    doc.save(`Stock_Valuation_${business.name.replace(/\s+/g, '_')}_${today}.pdf`);
  },

  // 4. Single Invoice Document PDF
  generateSingleInvoicePdf(business: Business, invoice: Invoice) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Brand Bar
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 5, 'F');

    // Business Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(business.name, 14, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    let subline = '';
    if (business.address) subline += business.address;
    if (business.city) subline += (subline ? ', ' : '') + business.city;
    if (business.phone) subline += ` | Ph: ${business.phone}`;
    if (subline) doc.text(subline, 14, 21);

    if (business.isGstRegistered && business.gstin) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text(`GSTIN: ${business.gstin}`, 14, 26);
    }

    // Invoice Header details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`INVOICE: ${invoice.invoiceNumber}`, pageWidth - 14, 16, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Date: ${invoice.invoiceDate}`, pageWidth - 14, 21, { align: 'right' });
    doc.text(`Status: ${invoice.paymentStatus.toUpperCase()}`, pageWidth - 14, 26, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 30, pageWidth - 14, 30);

    // Bill To Customer Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Bill To Customer:', 14, 36);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(invoice.customerName || 'Walk-in Customer', 14, 41);
    if (invoice.customerPhone) doc.text(`Phone: ${invoice.customerPhone}`, 14, 46);
    if (invoice.customerGstin) doc.text(`GSTIN: ${invoice.customerGstin}`, 14, 51);

    const startY = invoice.customerGstin ? 56 : invoice.customerPhone ? 51 : 46;

    // Items Table
    const itemRows = (invoice.items || []).map((it, idx) => [
      `${idx + 1}`,
      it.productName,
      it.hsnSac || '-',
      `${it.quantity} ${it.unit}`,
      `Rs. ${it.unitPrice}`,
      `${it.taxRate}%`,
      `Rs. ${it.total}`,
    ]);

    autoTable(doc, {
      startY,
      head: [['#', 'Item Description', 'HSN/SAC', 'Qty', 'Unit Price', 'GST Rate', 'Total Amount']],
      body: itemRows.length > 0 ? itemRows : [['-', 'General Counter Item', '-', '1', `Rs. ${invoice.grandTotal}`, '0%', `Rs. ${invoice.grandTotal}`]],
      theme: 'striped',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { fontStyle: 'bold' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 6 : 90;

    // Totals block on the right
    const totalsX = pageWidth - 80;
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);

    doc.text('Subtotal:', totalsX, finalY);
    doc.text(`Rs. ${invoice.subtotal}`, pageWidth - 14, finalY, { align: 'right' });

    let currentY = finalY;
    if (parseFloat(invoice.totalDiscount) > 0) {
      currentY += 5;
      doc.text('Discount:', totalsX, currentY);
      doc.text(`-Rs. ${invoice.totalDiscount}`, pageWidth - 14, currentY, { align: 'right' });
    }

    if (parseFloat(invoice.totalTax) > 0) {
      currentY += 5;
      doc.text('GST Tax:', totalsX, currentY);
      doc.text(`Rs. ${invoice.totalTax}`, pageWidth - 14, currentY, { align: 'right' });
    }

    currentY += 6;
    doc.setDrawColor(226, 232, 240);
    doc.line(totalsX, currentY, pageWidth - 14, currentY);

    currentY += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('GRAND TOTAL:', totalsX, currentY);
    doc.setTextColor(37, 99, 235);
    doc.text(`Rs. ${invoice.grandTotal}`, pageWidth - 14, currentY, { align: 'right' });

    currentY += 6;
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Paid Amount (${invoice.paymentMethod}):`, totalsX, currentY);
    doc.setTextColor(16, 185, 129);
    doc.text(`Rs. ${invoice.paidAmount}`, pageWidth - 14, currentY, { align: 'right' });

    if (parseFloat(invoice.balanceAmount) > 0) {
      currentY += 5;
      doc.setTextColor(220, 38, 38);
      doc.text('Balance Due:', totalsX, currentY);
      doc.text(`Rs. ${invoice.balanceAmount}`, pageWidth - 14, currentY, { align: 'right' });
    }

    // Terms & Footer Note on the left
    if (business.termsAndConditions) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Terms & Conditions:', 14, finalY);
      const splitTerms = doc.splitTextToSize(business.termsAndConditions, 95);
      doc.text(splitTerms, 14, finalY + 4);
    }

    this.addFooter(doc, 1, 1);
    doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
  },

  // 5. 3-Inch (80mm) Thermal Receipt PDF
  generate3InchThermalInvoicePdf(business: Business, invoice: Invoice, upiQrDataUrl?: string) {
    const items = invoice.items || [];
    
    // Dynamic height calculation so continuous 3-inch roll never clips or adds unwanted blank pages
    const addressLines = business.address ? Math.ceil(business.address.length / 28) : 1;
    const termsLines = business.termsAndConditions ? Math.ceil(business.termsAndConditions.length / 32) : 0;
    const itemsCount = Math.max(items.length, 1);
    const hasQr = !!upiQrDataUrl;
    
    // Header ~ 42mm, Meta ~ 25mm, Table header + items ~ (12 + itemsCount * 8.5)mm, Totals ~ 38mm, QR ~ 26mm, Footer & terms ~ (16 + termsLines * 4)mm + safety margin 20mm
    const totalHeight = Math.max(
      140,
      42 + (addressLines * 4.5) + 26 + 14 + (itemsCount * 8.5) + 40 + (hasQr ? 28 : 0) + (termsLines * 4) + 25
    );

    // 80mm width (exact 3.15 inch continuous POS thermal roll format)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, totalHeight],
    });

    const pageWidth = 80;

    // Header - Center Aligned
    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(business.name.toUpperCase(), pageWidth / 2, 8, { align: 'center' });

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);

    let currY = 12;
    if (business.address) {
      const splitAddress = doc.splitTextToSize(business.address, 72);
      doc.text(splitAddress, pageWidth / 2, currY, { align: 'center' });
      currY += splitAddress.length * 3.5;
    }

    if (business.phone) {
      doc.text(`Ph: ${business.phone}`, pageWidth / 2, currY, { align: 'center' });
      currY += 3.5;
    }

    if (business.email) {
      doc.text(`Email: ${business.email}`, pageWidth / 2, currY, { align: 'center' });
      currY += 3.5;
    }

    if (business.isGstRegistered && business.gstin) {
      doc.setFont('courier', 'bold');
      doc.text(`GSTIN: ${business.gstin}`, pageWidth / 2, currY, { align: 'center' });
      currY += 4;
    }

    // Dashed divider line
    doc.setFont('courier', 'normal');
    doc.text('------------------------------------------', pageWidth / 2, currY, { align: 'center' });
    currY += 3.5;

    // Receipt Meta
    doc.setFontSize(7.5);
    doc.text(`Bill No: ${invoice.invoiceNumber}`, 4, currY);
    doc.text(`Date: ${invoice.invoiceDate}`, pageWidth - 4, currY, { align: 'right' });
    currY += 3.5;

    doc.text(`Customer: ${invoice.customerName || 'Walk-in'}`, 4, currY);
    doc.text(`Pay: ${invoice.paymentMethod}`, pageWidth - 4, currY, { align: 'right' });
    currY += 3.5;

    if (invoice.customerPhone) {
      doc.text(`Cust Ph: ${invoice.customerPhone}`, 4, currY);
      currY += 3.5;
    }

    if (invoice.customerGstin) {
      doc.text(`Cust GST: ${invoice.customerGstin}`, 4, currY);
      currY += 3.5;
    }

    doc.text('------------------------------------------', pageWidth / 2, currY, { align: 'center' });
    currY += 1.5;

    // Items table in compact 3-inch thermal format
    const itemRows = items.map((it) => [
      it.productName,
      `${it.quantity} ${it.unit}`,
      `${it.unitPrice}`,
      `${it.total}`,
    ]);

    autoTable(doc, {
      startY: currY,
      head: [['Item Description', 'Qty', 'Rate', 'Total']],
      body: itemRows.length > 0 ? itemRows : [['General Item', '1', `${invoice.grandTotal}`, `${invoice.grandTotal}`]],
      theme: 'plain',
      pageBreak: 'avoid',
      headStyles: {
        font: 'courier',
        fontStyle: 'bold',
        fontSize: 7.5,
        textColor: [15, 23, 42],
        cellPadding: { top: 1, bottom: 1, left: 1, right: 1 },
      },
      styles: {
        font: 'courier',
        fontSize: 7,
        cellPadding: { top: 1, bottom: 1, left: 1, right: 1 },
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { halign: 'center', cellWidth: 14 },
        2: { halign: 'right', cellWidth: 14 },
        3: { halign: 'right', cellWidth: 16, fontStyle: 'bold' },
      },
      margin: { left: 2, right: 2 },
    });

    let totalsY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 1 : currY + 20;

    doc.setFont('courier', 'normal');
    doc.text('------------------------------------------', pageWidth / 2, totalsY, { align: 'center' });
    totalsY += 4;

    // Totals Block
    doc.setFontSize(7.5);
    doc.text('Subtotal:', 4, totalsY);
    doc.text(`Rs. ${invoice.subtotal}`, pageWidth - 4, totalsY, { align: 'right' });

    if (parseFloat(invoice.totalDiscount) > 0) {
      totalsY += 3.5;
      doc.text('Discount:', 4, totalsY);
      doc.text(`-Rs. ${invoice.totalDiscount}`, pageWidth - 4, totalsY, { align: 'right' });
    }

    if (parseFloat(invoice.totalTax) > 0) {
      totalsY += 3.5;
      doc.text('GST Tax Included:', 4, totalsY);
      doc.text(`Rs. ${invoice.totalTax}`, pageWidth - 4, totalsY, { align: 'right' });
    }

    if (parseFloat(invoice.roundOff) !== 0) {
      totalsY += 3.5;
      const ro = parseFloat(invoice.roundOff);
      doc.text('Round Off:', 4, totalsY);
      doc.text(`${ro > 0 ? '+Rs. ' : '-Rs. '}${Math.abs(ro).toFixed(2)}`, pageWidth - 4, totalsY, { align: 'right' });
    }

    totalsY += 4;
    doc.text('------------------------------------------', pageWidth / 2, totalsY, { align: 'center' });
    totalsY += 4;

    // GRAND TOTAL - Large Bold
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.text('GRAND TOTAL:', 4, totalsY);
    doc.text(`Rs. ${invoice.grandTotal}`, pageWidth - 4, totalsY, { align: 'right' });

    totalsY += 4;
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Paid (${invoice.paymentMethod}):`, 4, totalsY);
    doc.text(`Rs. ${invoice.paidAmount}`, pageWidth - 4, totalsY, { align: 'right' });

    if (parseFloat(invoice.balanceAmount) > 0) {
      totalsY += 3.5;
      doc.setFont('courier', 'bold');
      doc.text('Balance Due:', 4, totalsY);
      doc.text(`Rs. ${invoice.balanceAmount}`, pageWidth - 4, totalsY, { align: 'right' });
    }

    totalsY += 4;
    doc.setFont('courier', 'normal');
    doc.text('------------------------------------------', pageWidth / 2, totalsY, { align: 'center' });
    totalsY += 4;

    // Optional UPI QR Code
    if (upiQrDataUrl) {
      try {
        doc.addImage(upiQrDataUrl, 'PNG', (pageWidth - 24) / 2, totalsY, 24, 24);
        totalsY += 25;
        doc.setFontSize(6.5);
        doc.text('Scan with GPay / PhonePe / Paytm to Pay', pageWidth / 2, totalsY, { align: 'center' });
        totalsY += 3.5;
        if (business.upiId) {
          doc.text(`UPI: ${business.upiId}`, pageWidth / 2, totalsY, { align: 'center' });
          totalsY += 3.5;
        }
        doc.text('------------------------------------------', pageWidth / 2, totalsY, { align: 'center' });
        totalsY += 4;
      } catch (e) {
        // Fallback if image add fails
      }
    }

    // Footer message
    doc.setFontSize(7);
    doc.text(business.footerMessage || 'Thank you for shopping with us! Visit again.', pageWidth / 2, totalsY, {
      align: 'center',
    });
    totalsY += 3.5;

    if (business.termsAndConditions) {
      const splitTerms = doc.splitTextToSize(business.termsAndConditions, 72);
      doc.text(splitTerms, pageWidth / 2, totalsY, { align: 'center' });
    }

    doc.save(`Thermal_3Inch_${invoice.invoiceNumber}.pdf`);
    return doc;
  },
};
