import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ReportData {
  grossRevenue: number;
  netProfit: number;
  projectedGrowth: number;
  cashFlowData: { name: string; value: number }[];
  profitData: { name: string; profit: number; cost: number }[];
}

export interface DashboardReportData {
  totalRevenue: number;
  outstanding: number;
  activeClients: number;
  invoicesSent: number;
  revenueChange: number;
  pendingCount: number;
  paidOnTimePercentage: number;
  averagePayTime: number;
  revenueFlowData: { name: string; value: number }[];
}

export function exportToCSV(data: ReportData, filename: string = "report.csv") {
  const rows = [
    ["FINANCIAL SUMMARY REPORT"],
    ["Generated:", new Date().toLocaleDateString()],
    [],
    ["KEY METRICS"],
    ["Metric", "Value"],
    ["Gross Revenue", `$${data.grossRevenue.toLocaleString()}`],
    ["Net Profit", `$${data.netProfit.toLocaleString()}`],
    ["Projected Growth", `+${data.projectedGrowth}%`],
    [],
    ["CASH FLOW ANALYSIS"],
    ["Month", "Value"],
    ...data.cashFlowData.map((d) => [d.name, `$${d.value.toLocaleString()}`]),
    [],
    ["PROFIT MARGINS"],
    ["Period", "Profit", "Cost"],
    ...data.profitData.map((d) => [
      d.name,
      `$${d.profit.toLocaleString()}`,
      `$${d.cost.toLocaleString()}`,
    ]),
  ];

  const csvContent = rows.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export function exportToPDF(data: ReportData, filename: string = "report.pdf") {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(24);
  doc.setTextColor(0, 153, 102); // #009966
  doc.text("BILLIE", 20, 25);

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("Financial Summary Report", 20, 35);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 42);

  // Key Metrics
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("KEY METRICS", 20, 55);

  autoTable(doc, {
    startY: 60,
    head: [["Metric", "Value"]],
    body: [
      ["Gross Revenue", `$${data.grossRevenue.toLocaleString()}`],
      ["Net Profit", `$${data.netProfit.toLocaleString()}`],
      ["Projected Growth", `+${data.projectedGrowth}%`],
    ],
    theme: "grid",
    headStyles: { fillColor: [0, 153, 102] },
    margin: { left: 20, right: 20 },
  });

  // Cash Flow Analysis
  const lastY1 = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text("CASH FLOW ANALYSIS", 20, lastY1);

  autoTable(doc, {
    startY: lastY1 + 5,
    head: [["Month", "Value"]],
    body: data.cashFlowData.map((d) => [d.name, `$${d.value.toLocaleString()}`]),
    theme: "grid",
    headStyles: { fillColor: [0, 153, 102] },
    margin: { left: 20, right: 20 },
  });

  // Profit Margins
  const lastY2 = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text("PROFIT MARGINS", 20, lastY2);

  autoTable(doc, {
    startY: lastY2 + 5,
    head: [["Period", "Profit", "Cost"]],
    body: data.profitData.map((d) => [
      d.name,
      `$${d.profit.toLocaleString()}`,
      `$${d.cost.toLocaleString()}`,
    ]),
    theme: "grid",
    headStyles: { fillColor: [0, 153, 102] },
    margin: { left: 20, right: 20 },
  });

  doc.save(filename);
}

export function exportDashboardToPDF(data: DashboardReportData, filename: string = "dashboard-report.pdf") {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(24);
  doc.setTextColor(0, 153, 102);
  doc.text("BILLIE", 20, 25);

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("Dashboard Report", 20, 35);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 42);

  // Key Metrics
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("KEY METRICS", 20, 55);

  autoTable(doc, {
    startY: 60,
    head: [["Metric", "Value"]],
    body: [
      ["Total Revenue", `$${data.totalRevenue.toLocaleString()}`],
      ["Outstanding", `$${data.outstanding.toLocaleString()}`],
      ["Active Clients", data.activeClients.toString()],
      ["Invoices Sent", data.invoicesSent.toString()],
      ["Revenue Change", `${data.revenueChange >= 0 ? "+" : ""}${data.revenueChange}%`],
      ["Pending Invoices", data.pendingCount.toString()],
      ["Paid On Time", `${data.paidOnTimePercentage}%`],
      ["Avg. Pay Time", `${data.averagePayTime} days`],
    ],
    theme: "grid",
    headStyles: { fillColor: [0, 153, 102] },
    margin: { left: 20, right: 20 },
  });

  // Revenue Flow
  const lastY1 = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text("REVENUE FLOW", 20, lastY1);

  autoTable(doc, {
    startY: lastY1 + 5,
    head: [["Period", "Revenue"]],
    body: data.revenueFlowData.map((d) => [d.name, `$${d.value.toLocaleString()}`]),
    theme: "grid",
    headStyles: { fillColor: [0, 153, 102] },
    margin: { left: 20, right: 20 },
  });

  doc.save(filename);
}

export function exportDashboardToCSV(data: DashboardReportData, filename: string = "dashboard-report.csv") {
  const rows = [
    ["DASHBOARD REPORT"],
    ["Generated:", new Date().toLocaleDateString()],
    [],
    ["KEY METRICS"],
    ["Metric", "Value"],
    ["Total Revenue", `$${data.totalRevenue.toLocaleString()}`],
    ["Outstanding", `$${data.outstanding.toLocaleString()}`],
    ["Active Clients", data.activeClients.toString()],
    ["Invoices Sent", data.invoicesSent.toString()],
    ["Revenue Change", `${data.revenueChange >= 0 ? "+" : ""}${data.revenueChange}%`],
    ["Pending Invoices", data.pendingCount.toString()],
    ["Paid On Time", `${data.paidOnTimePercentage}%`],
    ["Avg. Pay Time", `${data.averagePayTime} days`],
    [],
    ["REVENUE FLOW"],
    ["Period", "Revenue"],
    ...data.revenueFlowData.map((d) => [d.name, `$${d.value.toLocaleString()}`]),
  ];

  const csvContent = rows.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
