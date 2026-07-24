import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { InvoiceFormData } from "@/components/invoices/InvoiceForm";
import { UserSettings } from "@/hooks/useSettings";
import { BusinessSettings, formatBusinessAddress } from "@/hooks/useBusinessSettings";

export function generateInvoicePDF(
  formData: InvoiceFormData,
  userSettings: UserSettings | null | undefined,
  businessSettings?: BusinessSettings | null
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Helper functions
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd MMM yyyy").toUpperCase();
    } catch {
      return "—";
    }
  };

  const formatCurrency = (amount: number) => {
    const currency =
      formData.client?.preferred_currency ||
      businessSettings?.default_currency ||
      "AUD";
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Header - Title or Logo
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  
  if (formData.logoUrl) {
    // Note: For logo support, we'd need to load the image first
    // For now, show "INVOICE" as fallback
    doc.text("INVOICE", margin, yPos);
  } else {
    doc.text("INVOICE", margin, yPos);
  }

  // Invoice number
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(128, 128, 128);
  doc.text(formData.invoiceNumber || "INV-XXXX-XXX", margin, yPos);

  // Company info (right aligned)
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  const headerCompanyName =
    businessSettings?.company_name || userSettings?.company_name || "Your Company";
  doc.text(headerCompanyName, pageWidth - margin, 20, { align: "right" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(128, 128, 128);
  let headerY = 26;
  doc.text(
    businessSettings?.company_email || userSettings?.email || "email@company.com",
    pageWidth - margin,
    headerY,
    { align: "right" }
  );
  if (businessSettings?.company_phone) {
    headerY += 5;
    doc.text(businessSettings.company_phone, pageWidth - margin, headerY, { align: "right" });
  }
  formatBusinessAddress(businessSettings).forEach((line) => {
    headerY += 5;
    doc.text(line, pageWidth - margin, headerY, { align: "right" });
  });
  if (businessSettings?.tax_id) {
    headerY += 5;
    doc.text(`Tax ID: ${businessSettings.tax_id}`, pageWidth - margin, headerY, { align: "right" });
  }

  // Bill To section
  yPos = 50;
  doc.setTextColor(128, 128, 128);
  doc.setFontSize(9);
  doc.text("BILL TO", margin, yPos);

  if (formData.client) {
    yPos += 6;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(formData.client.name, margin, yPos);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    
    if (formData.client.company) {
      yPos += 5;
      doc.text(formData.client.company, margin, yPos);
    }
    if (formData.client.email) {
      yPos += 5;
      doc.text(formData.client.email, margin, yPos);
    }
    if (formData.client.address) {
      yPos += 5;
      doc.text(formData.client.address, margin, yPos);
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
  doc.text(formatDate(formData.issueDate), dateX, dateY);

  dateY += 10;
  doc.setTextColor(128, 128, 128);
  doc.setFontSize(9);
  doc.text("DUE DATE", dateX, dateY);
  dateY += 5;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(formData.dueOnReceipt ? "UPON RECEIPT" : formatDate(formData.dueDate), dateX, dateY);

  // Line Items Table
  yPos = 100;

  const tableData = formData.items
    .filter((item) => item.description.trim() !== "")
    .map((item) => [
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
  doc.text(formatCurrency(formData.subtotal), pageWidth - margin, yPos, { align: "right" });

  if (formData.taxRate > 0) {
    yPos += 6;
    doc.setTextColor(128, 128, 128);
    doc.text(`Tax (${formData.taxRate}%)`, totalsX, yPos);
    doc.setTextColor(0, 0, 0);
    doc.text(formatCurrency(formData.taxAmount), pageWidth - margin, yPos, { align: "right" });
  }

  yPos += 8;
  doc.setDrawColor(200, 200, 200);
  doc.line(totalsX, yPos, pageWidth - margin, yPos);
  
  yPos += 6;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Total", totalsX, yPos);
  doc.text(formatCurrency(formData.total), pageWidth - margin, yPos, { align: "right" });

  // Notes
  if (formData.notes) {
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
    const splitNotes = doc.splitTextToSize(formData.notes, pageWidth - margin * 2);
    doc.text(splitNotes, margin, yPos);
    yPos += splitNotes.length * 5;
  }

  // Footer Note
  if (formData.footerNote) {
    yPos += 15;
    doc.setDrawColor(240, 240, 240);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const splitFooter = doc.splitTextToSize(formData.footerNote, pageWidth - margin * 2);
    doc.text(splitFooter, pageWidth / 2, yPos, { align: "center" });
    yPos += splitFooter.length * 5;
  }

  // Payment Details
  const enabledMethods = formData.paymentDetails.methods.filter(m => m.enabled);
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
    if (formData.paymentDetails.introText) {
      yPos += 5;
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(10);
      const splitIntro = doc.splitTextToSize(formData.paymentDetails.introText, pageWidth - margin * 2);
      doc.text(splitIntro, margin, yPos);
      yPos += splitIntro.length * 5;
    }
    
    // Payment methods
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
          const value = field.key === "reference" && formData.paymentDetails.reference 
            ? formData.paymentDetails.reference 
            : field.value;
          doc.text(`${field.label}: ${value}`, margin + 5, yPos);
        });
      
      // Add reference if not already in fields
      if (formData.paymentDetails.reference && !method.fields.some(f => f.key === "reference" && f.value)) {
        yPos += 4;
        doc.text(`Reference: ${formData.paymentDetails.reference}`, margin + 5, yPos);
      }
    });
    
    // Outro text
    if (formData.paymentDetails.outroText) {
      yPos += 8;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "italic");
      const splitOutro = doc.splitTextToSize(formData.paymentDetails.outroText, pageWidth - margin * 2);
      doc.text(splitOutro, margin, yPos);
    }
  }

  // Save the PDF
  doc.save(`${formData.invoiceNumber || "invoice"}.pdf`);
}
