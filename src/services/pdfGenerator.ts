import { jsPDF } from 'jspdf';
import { Invoice, UserSettings } from '../types';
import { formatCurrency } from './currency';

export function generateInvoicePDF(invoice: Invoice, settings: UserSettings): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header / Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(settings.companyName || settings.freelancerName || 'FREELANCE STUDIO', 20, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  y += 6;
  if (settings.freelancerTitle) {
    doc.text(settings.freelancerTitle, 20, y);
    y += 5;
  }
  if (settings.freelancerEmail) {
    doc.text(`Email: ${settings.freelancerEmail}`, 20, y);
    y += 5;
  }
  if (settings.phone) {
    doc.text(`Phone: ${settings.phone}`, 20, y);
    y += 5;
  }
  if (settings.businessAddress) {
    doc.text(settings.businessAddress, 20, y);
    y += 5;
  }
  if (settings.taxId) {
    doc.text(`Tax ID: ${settings.taxId}`, 20, y);
    y += 5;
  }

  // Invoice Title & Details on right side
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text('INVOICE', pageWidth - 20, 20, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, pageWidth - 20, 28, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text(`Issue Date: ${invoice.issueDate}`, pageWidth - 20, 34, { align: 'right' });
  doc.text(`Due Date: ${invoice.dueDate}`, pageWidth - 20, 40, { align: 'right' });

  // Status Badge
  const statusColors: Record<string, [number, number, number]> = {
    paid: [22, 163, 74],
    partially_paid: [217, 119, 6],
    issued: [37, 99, 235],
    draft: [100, 116, 139],
    overdue: [220, 38, 38],
    cancelled: [148, 163, 184],
  };
  const color = statusColors[invoice.status] || [100, 116, 139];
  doc.setFillColor(color[0], color[1], color[2]);
  doc.roundedRect(pageWidth - 45, 44, 25, 6, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(invoice.status.toUpperCase().replace('_', ' '), pageWidth - 32.5, 48.2, { align: 'center' });

  // Divider
  y = Math.max(y + 8, 56);
  doc.setDrawColor(226, 232, 240);
  doc.line(20, y, pageWidth - 20, y);
  y += 8;

  // Billed To Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('BILLED TO:', 20, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.clientName, 20, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  if (invoice.clientCompany) {
    doc.text(invoice.clientCompany, 20, y);
    y += 4.5;
  }
  if (invoice.clientEmail) {
    doc.text(invoice.clientEmail, 20, y);
    y += 4.5;
  }
  if (invoice.clientAddress) {
    doc.text(invoice.clientAddress, 20, y);
    y += 4.5;
  }
  if (invoice.projectName) {
    doc.text(`Project: ${invoice.projectName}`, 20, y);
    y += 4.5;
  }

  y += 6;

  // Table Header
  const tableTop = y;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(20, tableTop, pageWidth - 40, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  doc.text('DESCRIPTION', 24, tableTop + 5.5);
  doc.text('QTY / HRS', 120, tableTop + 5.5, { align: 'right' });
  doc.text('RATE', 150, tableTop + 5.5, { align: 'right' });
  doc.text('AMOUNT', pageWidth - 24, tableTop + 5.5, { align: 'right' });

  y = tableTop + 10;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  // Line Items
  invoice.lineItems.forEach((item) => {
    // Check page overflow
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    const descLines = doc.splitTextToSize(item.description, 90);
    const itemHeight = Math.max(descLines.length * 5, 7);

    doc.text(descLines, 24, y + 4);
    doc.text(item.quantity.toString(), 120, y + 4, { align: 'right' });
    doc.text(formatCurrency(item.unitPrice, invoice.currency, false), 150, y + 4, { align: 'right' });
    doc.text(formatCurrency(item.amount, invoice.currency, false), pageWidth - 24, y + 4, { align: 'right' });

    y += itemHeight + 2;
    doc.setDrawColor(241, 245, 249);
    doc.line(20, y, pageWidth - 20, y);
    y += 2;
  });

  y += 4;

  // Totals Section
  const totalsLeft = pageWidth - 90;
  doc.setFontSize(9);

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', totalsLeft, y);
  doc.setTextColor(30, 41, 59);
  doc.text(formatCurrency(invoice.subtotal, invoice.currency), pageWidth - 24, y, { align: 'right' });
  y += 5.5;

  // Discount
  if (invoice.discountAmount > 0) {
    doc.setTextColor(100, 116, 139);
    doc.text(`Discount (${invoice.discountRate}%):`, totalsLeft, y);
    doc.setTextColor(220, 38, 38);
    doc.text(`-${formatCurrency(invoice.discountAmount, invoice.currency)}`, pageWidth - 24, y, { align: 'right' });
    y += 5.5;
  }

  // Tax
  if (invoice.taxAmount > 0) {
    doc.setTextColor(100, 116, 139);
    doc.text(`Tax (${invoice.taxRate}%):`, totalsLeft, y);
    doc.setTextColor(30, 41, 59);
    doc.text(formatCurrency(invoice.taxAmount, invoice.currency), pageWidth - 24, y, { align: 'right' });
    y += 5.5;
  }

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.line(totalsLeft, y, pageWidth - 20, y);
  y += 5;

  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Total:', totalsLeft, y);
  doc.text(formatCurrency(invoice.total, invoice.currency), pageWidth - 24, y, { align: 'right' });
  y += 6;

  // Amount Paid
  if (invoice.amountPaid > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(22, 163, 74);
    doc.text('Amount Paid:', totalsLeft, y);
    doc.text(`-${formatCurrency(invoice.amountPaid, invoice.currency)}`, pageWidth - 24, y, { align: 'right' });
    y += 5.5;

    // Balance Due
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(185, 28, 28);
    doc.text('Balance Due:', totalsLeft, y);
    doc.text(formatCurrency(invoice.balanceDue, invoice.currency), pageWidth - 24, y, { align: 'right' });
    y += 8;
  }

  // Payment Instructions & Notes
  y = Math.max(y, tableTop + 65);
  if (invoice.paymentTerms || settings.paymentInstructions) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('PAYMENT INSTRUCTIONS & TERMS:', 20, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const terms = invoice.paymentTerms || settings.paymentInstructions;
    const splitTerms = doc.splitTextToSize(terms, 120);
    doc.text(splitTerms, 20, y);
    y += splitTerms.length * 4 + 4;
  }

  if (invoice.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('NOTES:', 20, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const splitNotes = doc.splitTextToSize(invoice.notes, 120);
    doc.text(splitNotes, 20, y);
  }

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Thank you for your business! Generated by FreelanceOS', pageWidth / 2, 285, { align: 'center' });

  // Save / trigger download
  doc.save(`${invoice.invoiceNumber}_${invoice.clientName.replace(/\s+/g, '_')}.pdf`);
}

export function generateReportPDF(
  title: string,
  subtitle: string,
  summaryMetrics: Array<{ label: string; value: string }>,
  tables: Array<{ title: string; headers: string[]; rows: string[][] }>
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(title, 20, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, 20, y);

  y += 10;
  // Summary Metrics Grid
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, y, pageWidth - 40, 24, 2, 2, 'F');

  const metricWidth = (pageWidth - 40) / Math.min(summaryMetrics.length, 4);
  summaryMetrics.slice(0, 4).forEach((m, idx) => {
    const x = 24 + idx * metricWidth;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, x, y + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(m.value, x, y + 17);
  });

  y += 32;

  // Tables
  tables.forEach((table) => {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(table.title, 20, y);
    y += 5;

    // Header row
    const colCount = table.headers.length;
    const colWidth = (pageWidth - 40) / colCount;

    doc.setFillColor(241, 245, 249);
    doc.rect(20, y, pageWidth - 40, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    table.headers.forEach((h, i) => {
      doc.text(h, 22 + i * colWidth, y + 4.8);
    });

    y += 8;

    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    table.rows.forEach((row) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      row.forEach((cell, i) => {
        doc.text(String(cell || '').substring(0, 30), 22 + i * colWidth, y + 4);
      });
      y += 6;
      doc.setDrawColor(241, 245, 249);
      doc.line(20, y, pageWidth - 20, y);
      y += 1;
    });

    y += 8;
  });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`FreelanceOS Executive Report · Generated ${new Date().toLocaleDateString()}`, pageWidth / 2, 287, { align: 'center' });

  doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.pdf`);
}
