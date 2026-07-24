import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from "date-fns";

export type ReportPeriod = "monthly" | "yearly";

export interface InvoiceReportItem {
  invoice_number: string;
  client_name: string;
  issue_date: string;
  due_date: string | null;
  status: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  amount_outstanding: number;
}

export interface ClientSummaryItem {
  name: string;
  invoice_count: number;
  total_billed: number;
  total_paid: number;
  outstanding: number;
}

export interface ComprehensiveReportData {
  businessName: string;
  period: ReportPeriod;
  dateRange: { start: Date; end: Date };
  generatedAt: Date;
  summary: {
    totalInvoicesIssued: number;
    totalPaid: number;
    totalOutstanding: number;
    overdueAmount: number;
    grossRevenue: number;
    netProfit: number;
  };
  invoices: InvoiceReportItem[];
  clientSummary: ClientSummaryItem[];
}

// Brand color
const BILLIE_GREEN: [number, number, number] = [0, 153, 102];
const DARK_BG: [number, number, number] = [10, 10, 10];
const LIGHT_TEXT: [number, number, number] = [255, 255, 255];
const MUTED_TEXT: [number, number, number] = [140, 140, 140];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    draft: "DRAFT",
    pending: "SENT",
    viewed: "VIEWED",
    paid: "PAID",
    overdue: "OVERDUE",
  };
  return statusMap[status] || status.toUpperCase();
}

export function generateComprehensiveReport(data: ComprehensiveReportData): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper to add new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // ============ HEADER SECTION ============
  // Business name (Anton style - bold, uppercase)
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BILLIE_GREEN);
  doc.text(data.businessName.toUpperCase() || "BILLIE", margin, yPosition + 8);
  
  // Report title
  yPosition += 18;
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  const reportTitle = data.period === "monthly" ? "MONTHLY FINANCIAL REPORT" : "YEARLY FINANCIAL REPORT";
  doc.text(reportTitle, margin, yPosition);

  // Date range
  yPosition += 10;
  doc.setFontSize(11);
  doc.setFont("courier", "normal");
  doc.setTextColor(100, 100, 100);
  const dateRangeText = `${format(data.dateRange.start, "dd MMM yyyy")} - ${format(data.dateRange.end, "dd MMM yyyy")}`;
  doc.text(dateRangeText, margin, yPosition);

  // Generated date
  yPosition += 6;
  doc.setFontSize(9);
  doc.text(`Generated: ${format(data.generatedAt, "dd MMM yyyy 'at' HH:mm")}`, margin, yPosition);

  // Divider
  yPosition += 8;
  doc.setDrawColor(...BILLIE_GREEN);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);

  // ============ EXECUTIVE SUMMARY ============
  yPosition += 12;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("EXECUTIVE SUMMARY", margin, yPosition);

  yPosition += 8;

  // Summary grid - 2 columns, 3 rows
  const summaryData = [
    ["Total Invoices Issued", data.summary.totalInvoicesIssued.toString()],
    ["Total Paid", formatCurrency(data.summary.totalPaid)],
    ["Total Outstanding", formatCurrency(data.summary.totalOutstanding)],
    ["Overdue Amount", formatCurrency(data.summary.overdueAmount)],
    ["Gross Revenue", formatCurrency(data.summary.grossRevenue)],
    ["Net Profit", formatCurrency(data.summary.netProfit)],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [["Metric", "Value"]],
    body: summaryData,
    theme: "plain",
    headStyles: {
      fillColor: BILLIE_GREEN,
      textColor: LIGHT_TEXT,
      fontStyle: "bold",
      fontSize: 10,
      font: "courier",
    },
    bodyStyles: {
      fontSize: 10,
      font: "courier",
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: "bold" },
      1: { cellWidth: 50, halign: "right" },
    },
    margin: { left: margin, right: margin },
    tableWidth: 120,
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // ============ INVOICE DETAILS TABLE ============
  checkPageBreak(40);
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("INVOICE DETAILS", margin, yPosition);

  yPosition += 8;

  if (data.invoices.length === 0) {
    doc.setFontSize(10);
    doc.setFont("courier", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("No invoices in this period.", margin, yPosition);
    yPosition += 15;
  } else {
    const invoiceTableData = data.invoices.map((inv) => [
      inv.invoice_number,
      inv.client_name.length > 15 ? inv.client_name.substring(0, 15) + "..." : inv.client_name,
      format(parseISO(inv.issue_date), "dd/MM/yy"),
      inv.due_date ? format(parseISO(inv.due_date), "dd/MM/yy") : "-",
      getStatusLabel(inv.status),
      formatCurrency(inv.subtotal),
      formatCurrency(inv.tax_amount),
      formatCurrency(inv.total),
      formatCurrency(inv.amount_paid),
      formatCurrency(inv.amount_outstanding),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Invoice #", "Client", "Issue", "Due", "Status", "Subtotal", "Tax", "Total", "Paid", "Outstanding"]],
      body: invoiceTableData,
      theme: "grid",
      headStyles: {
        fillColor: BILLIE_GREEN,
        textColor: LIGHT_TEXT,
        fontStyle: "bold",
        fontSize: 7,
        font: "courier",
        halign: "center",
      },
      bodyStyles: {
        fontSize: 7,
        font: "courier",
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 22 },
        2: { cellWidth: 14 },
        3: { cellWidth: 14 },
        4: { cellWidth: 14 },
        5: { cellWidth: 18, halign: "right" },
        6: { cellWidth: 14, halign: "right" },
        7: { cellWidth: 18, halign: "right" },
        8: { cellWidth: 18, halign: "right" },
        9: { cellWidth: 20, halign: "right" },
      },
      margin: { left: margin, right: margin },
      didDrawPage: () => {
        // Add page number at bottom
        doc.setFontSize(8);
        doc.setFont("courier", "normal");
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${doc.getCurrentPageInfo().pageNumber}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // ============ CLIENT SUMMARY TABLE ============
  checkPageBreak(40);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("CLIENT SUMMARY", margin, yPosition);

  yPosition += 8;

  if (data.clientSummary.length === 0) {
    doc.setFontSize(10);
    doc.setFont("courier", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("No client data in this period.", margin, yPosition);
  } else {
    const clientTableData = data.clientSummary.map((client) => [
      client.name.length > 25 ? client.name.substring(0, 25) + "..." : client.name,
      client.invoice_count.toString(),
      formatCurrency(client.total_billed),
      formatCurrency(client.total_paid),
      formatCurrency(client.outstanding),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Client Name", "Invoices", "Total Billed", "Total Paid", "Outstanding"]],
      body: clientTableData,
      theme: "grid",
      headStyles: {
        fillColor: BILLIE_GREEN,
        textColor: LIGHT_TEXT,
        fontStyle: "bold",
        fontSize: 9,
        font: "courier",
      },
      bodyStyles: {
        fontSize: 9,
        font: "courier",
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 20, halign: "center" },
        2: { cellWidth: 35, halign: "right" },
        3: { cellWidth: 35, halign: "right" },
        4: { cellWidth: 30, halign: "right" },
      },
      margin: { left: margin, right: margin },
      didDrawPage: () => {
        doc.setFontSize(8);
        doc.setFont("courier", "normal");
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${doc.getCurrentPageInfo().pageNumber}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      },
    });
  }

  // ============ FOOTER ============
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("courier", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
    
    // Branding footer
    doc.setTextColor(...BILLIE_GREEN);
    doc.text("Generated by Billie", pageWidth - margin, pageHeight - 10, { align: "right" });
  }

  // Save the PDF
  const periodLabel = data.period === "monthly" 
    ? format(data.dateRange.start, "yyyy-MM")
    : format(data.dateRange.start, "yyyy");
  const filename = `${data.businessName.toLowerCase().replace(/\s+/g, "-") || "billie"}-report-${periodLabel}.pdf`;
  
  doc.save(filename);
}

export function getDateRangeForPeriod(period: ReportPeriod): { start: Date; end: Date } {
  const now = new Date();
  
  if (period === "monthly") {
    return {
      start: startOfMonth(now),
      end: endOfMonth(now),
    };
  } else {
    return {
      start: startOfYear(now),
      end: endOfYear(now),
    };
  }
}
