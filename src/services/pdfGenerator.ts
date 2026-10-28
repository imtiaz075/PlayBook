import { jsPDF } from 'jspdf';
import { Invoice, UserSettings, CompanyProfile } from '../types';
import { formatCurrency } from './currency';

export function generateInvoicePDF(
  invoice: Invoice,
  settings: UserSettings,
  companyProfile?: CompanyProfile
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Company Details
  const businessName =
    companyProfile?.businessName ||
    settings.userName ||
    'FREELANCE STUDIO';

  // Header / Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(businessName, 20, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  y += 6;

  const email = companyProfile?.email || settings.userEmail;
  if (email) {
    doc.text(`Email: ${email}`, 20, y);
    y += 4.5;
  }

  const phone = companyProfile?.phone;
  if (phone) {
    doc.text(`Phone: ${phone}`, 20, y);
    y += 4.5;
  }

  const address = companyProfile?.address;
  if (address) {
    doc.text(`Address: ${address}`, 20, y);
    y += 4.5;
  }

  const taxId = companyProfile?.taxRegistrationNumber;
  if (taxId) {
    doc.text(`Tax / VAT ID: ${taxId}`, 20, y);
    y += 4.5;
  }

  const website = companyProfile?.website;
  if (website) {
    doc.text(`Website: ${website}`, 20, y);
    y += 4.5;
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
  y = Math.max(y + 6, 56);
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
    doc.text(`Email: ${invoice.clientEmail}`, 20, y);
    y += 4.5;
  }
  if (invoice.clientAddress) {
    doc.text(invoice.clientAddress, 20, y);
    y += 4.5;
  }

  y += 6;

  // Line Items Table Header
  doc.setFillColor(248, 250, 252);
  doc.rect(20, y, pageWidth - 40, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Description', 24, y + 5.5);
  doc.text('Qty / Hrs', pageWidth - 70, y + 5.5, { align: 'right' });
  doc.text('Unit Price', pageWidth - 45, y + 5.5, { align: 'right' });
  doc.text('Amount', pageWidth - 24, y + 5.5, { align: 'right' });

  y += 10;

  // Table Body Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  invoice.lineItems.forEach((item) => {
    // Description text line wrapping
    const splitDesc = doc.splitTextToSize(item.description, 90);
    doc.text(splitDesc, 24, y);
    doc.text(String(item.quantity), pageWidth - 70, y, { align: 'right' });
    doc.text(formatCurrency(item.unitPrice, invoice.currency), pageWidth - 45, y, { align: 'right' });
    doc.text(formatCurrency(item.amount, invoice.currency), pageWidth - 24, y, { align: 'right' });

    y += Math.max(6, splitDesc.length * 4.5);
  });

  // Table Bottom Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(20, y, pageWidth - 20, y);
  y += 8;

  // Totals Summary Box
  const summaryX = pageWidth - 90;
  doc.setFontSize(9);

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', summaryX, y);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(invoice.subtotal, invoice.currency), pageWidth - 24, y, { align: 'right' });
  y += 5;

  // Discount
  if (invoice.discountAmount > 0) {
    doc.setTextColor(100, 116, 139);
    doc.text(`Discount (${invoice.discountRate}%):`, summaryX, y);
    doc.setTextColor(15, 23, 42);
    doc.text(`-${formatCurrency(invoice.discountAmount, invoice.currency)}`, pageWidth - 24, y, {
      align: 'right',
    });
    y += 5;
  }

  // Tax
  if (invoice.taxAmount > 0) {
    doc.setTextColor(100, 116, 139);
    doc.text(`Tax / VAT (${invoice.taxRate}%):`, summaryX, y);
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(invoice.taxAmount, invoice.currency), pageWidth - 24, y, {
      align: 'right',
    });
    y += 5;
  }

  // Grand Total Line
  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX, y, pageWidth - 20, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Total Amount:', summaryX, y);
  doc.text(formatCurrency(invoice.total, invoice.currency), pageWidth - 24, y, { align: 'right' });
  y += 6;

  // Amount Paid & Balance Due
  if (invoice.amountPaid > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(22, 163, 74);
    doc.text('Amount Paid:', summaryX, y);
    doc.text(`-${formatCurrency(invoice.amountPaid, invoice.currency)}`, pageWidth - 24, y, {
      align: 'right',
    });
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text('Balance Due:', summaryX, y);
    doc.text(formatCurrency(invoice.balanceDue, invoice.currency), pageWidth - 24, y, {
      align: 'right',
    });
    y += 6;
  }

  y += 8;

  // Payment Instructions & Bank Details
  const bankInfo = companyProfile?.bankDetails;
  const payInstructions = companyProfile?.paymentInstructions || invoice.paymentTerms;

  if (bankInfo || payInstructions) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(20, y, pageWidth - 40, 22, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('PAYMENT INSTRUCTIONS & BANK DETAILS:', 24, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    if (payInstructions) {
      doc.text(payInstructions, 24, y + 11);
    }
    if (bankInfo) {
      const splitBank = doc.splitTextToSize(bankInfo, pageWidth - 50);
      doc.text(splitBank, 24, y + 16);
    }

    y += 26;
  }

  // Notes & Footer
  if (invoice.notes || companyProfile?.defaultInvoiceNotes) {
    const finalNotes = invoice.notes || companyProfile?.defaultInvoiceNotes;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Notes: ${finalNotes}`, 20, y);
  }

  // Download PDF file
  doc.save(`${invoice.invoiceNumber}_${invoice.clientName.replace(/\s+/g, '_')}.pdf`);
}

export function generateReportPDF(
  title: string,
  subtitle: string,
  summary: { label: string; value: string }[],
  tables: { title: string; headers: string[]; rows: string[][] }[]
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text(title, 20, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, 20, y);

  y += 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(20, y, pageWidth - 20, y);
  y += 8;

  // Summary box
  doc.setFillColor(248, 250, 252);
  doc.rect(20, y, pageWidth - 40, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  let sumX = 24;
  summary.forEach((item) => {
    doc.text(item.label, sumX, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(item.value, sumX, y + 13);
    doc.setFont('helvetica', 'bold');
    sumX += 40;
  });

  y += 26;

  tables.forEach((table) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(table.title, 20, y);
    y += 6;

    // Header
    doc.setFillColor(241, 245, 249);
    doc.rect(20, y, pageWidth - 40, 7, 'F');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    const colWidth = (pageWidth - 44) / table.headers.length;
    table.headers.forEach((h, idx) => {
      doc.text(h, 22 + idx * colWidth, y + 4.5);
    });

    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);

    table.rows.slice(0, 15).forEach((row) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      row.forEach((cell, idx) => {
        const str = String(cell);
        const split = doc.splitTextToSize(str, colWidth - 2);
        doc.text(split[0] || '', 22 + idx * colWidth, y);
      });
      y += 6;
    });

    y += 6;
  });

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}

