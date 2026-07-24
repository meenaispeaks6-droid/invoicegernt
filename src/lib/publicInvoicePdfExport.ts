import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { PaymentMethod } from "@/hooks/usePaymentTemplates";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface InvoiceClient {
  name: string;
  email: string | null;
  company: string | null;
  address: string | null;
}

interface PublicInvoiceData {
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  clients: InvoiceClient | null;
  invoice_items: InvoiceItem[];
  payment_methods?: PaymentMethod[] | null;
  payment_intro_text?: string | null;
  payment_outro_text?: string | null;
  payment_reference?: string | null;
}

export function generatePublicInvoicePDF(invoice: PublicInvoiceData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd MMM yyyy").toUpperCase();
    } catch {
      return "—";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Header - Title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", margin, yPos);

  // Invoice number
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(128, 128, 128);
  doc.text(invoice.invoice_number, margin, yPos);

  // Bill To section
  yPos = 50;
  doc.setTextColor(128, 128, 128);
  doc.setFontSize(9);
  doc.text("BILL TO", margin, yPos);

  if (invoice.clients) {
    yPos += 6;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.clients.name, margin, yPos);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);

    if (invoice.clients.company) {
      yPos += 5;
      doc.text(invoice.clients.company, margin, yPos);
    }
    if (invoice.clients.email) {
      yPos += 5;
      doc.text(invoice.clients.email, margin, yPos);
    }
    if (invoice.clients.address) {
      yPos += 5;
      doc.text(invoice.clients.address, margin, yPos);
    }
  }

  // Dates (right side)
  const dateX = pageWidth - margin - 50;
  let dateY = 50;

  doc.setTextColor(128, 128, 128);
  doc.setFontSize(9);
  doc.text("ISSUE DATE", dateX, dateY);
  dateY += 5;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(formatDate(invoice.issue_date), dateX, dateY);

  dateY += 10;
  doc.setTextColor(128, 128, 128);
  doc.setFontSize(9);
  doc.text("DUE DATE", dateX, dateY);
  dateY += 5;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(invoice.due_date ? formatDate(invoice.due_date) : "UPON RECEIPT", dateX, dateY);

  // Line Items Table
  yPos = 100;

  const tableData = invoice.invoice_items.map((item) => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unit_price),
    formatCurrency(item.amount),
  ]);

  if (tableData.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [["Description", "Qty", "Price", "Amount"]],
      body: tableData,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [245, 245, 245],
        textColor: [100, 100, 100],
        fontStyle: "normal",
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 20, halign: "right" },
        2: { cellWidth: 30, halign: "right" },
        3: { cellWidth: 35, halign: "right" },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Totals
  const totalsX = pageWidth - margin - 60;

  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text("Subtotal", totalsX, yPos);
  doc.setTextColor(0, 0, 0);
  doc.text(formatCurrency(invoice.subtotal), pageWidth - margin, yPos, { align: "right" });

  if (invoice.tax_rate > 0) {
    yPos += 6;
    doc.setTextColor(128, 128, 128);
    doc.text(`Tax (${invoice.tax_rate}%)`, totalsX, yPos);
    doc.setTextColor(0, 0, 0);
    doc.text(formatCurrency(invoice.tax_amount), pageWidth - margin, yPos, { align: "right" });
  }

  yPos += 8;
  doc.setDrawColor(200, 200, 200);
  doc.line(totalsX, yPos, pageWidth - margin, yPos);

  yPos += 6;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Total", totalsX, yPos);
  doc.text(formatCurrency(invoice.total), pageWidth - margin, yPos, { align: "right" });

  // Notes
  if (invoice.notes) {
    yPos += 20;
    doc.setDrawColor(240, 240, 240);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text("NOTES", margin, yPos);

    yPos += 5;
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - margin * 2);
    doc.text(splitNotes, margin, yPos);
    yPos += splitNotes.length * 5;
  }

  // Payment Details
  const enabledMethods = (invoice.payment_methods || []).filter(m => m.enabled);
  if (enabledMethods.length > 0) {
    yPos += 15;
    doc.setDrawColor(240, 240, 240);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text("PAYMENT DETAILS", margin, yPos);
    
    // Intro text
    if (invoice.payment_intro_text) {
      yPos += 5;
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(10);
      const splitIntro = doc.splitTextToSize(invoice.payment_intro_text, pageWidth - margin * 2);
      doc.text(splitIntro, margin, yPos);
      yPos += splitIntro.length * 5;
    }
    
    // Payment methods
    const paymentReference = invoice.payment_reference || invoice.invoice_number;
    yPos += 5;
    enabledMethods.forEach((method) => {
      yPos += 5;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text(method.label.toUpperCase(), margin, yPos);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(10);
      
      method.fields
        .filter(f => f.value && f.value.trim() !== "")
        .forEach((field) => {
          yPos += 4;
          const value = field.key === "reference" && paymentReference 
            ? paymentReference 
            : field.value;
          doc.text(`${field.label}: ${value}`, margin + 5, yPos);
        });
      
      // Add reference if not already in fields
      if (paymentReference && !method.fields.some(f => f.key === "reference" && f.value)) {
        yPos += 4;
        doc.text(`Reference: ${paymentReference}`, margin + 5, yPos);
      }
    });
    
    // Outro text
    if (invoice.payment_outro_text) {
      yPos += 8;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "italic");
      const splitOutro = doc.splitTextToSize(invoice.payment_outro_text, pageWidth - margin * 2);
      doc.text(splitOutro, margin, yPos);
    }
  }

  // Save the PDF
  doc.save(`${invoice.invoice_number}.pdf`);
}
