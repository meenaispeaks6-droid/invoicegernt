import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, isWithinInterval } from "date-fns";
import { useInvoices } from "@/hooks/useInvoices";
import { useClients } from "@/hooks/useClients";
import { useSettings } from "@/hooks/useSettings";
import { toast } from "sonner";
import { deriveInvoiceStatus } from "@/lib/invoiceStatus";
import {
  generateComprehensiveReport,
  type ReportPeriod,
  type InvoiceReportItem,
  type ClientSummaryItem,
  type ComprehensiveReportData,
} from "@/lib/dashboardReportExport";

interface DownloadReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MONTHS = [
  { value: "0", label: "JANUARY" },
  { value: "1", label: "FEBRUARY" },
  { value: "2", label: "MARCH" },
  { value: "3", label: "APRIL" },
  { value: "4", label: "MAY" },
  { value: "5", label: "JUNE" },
  { value: "6", label: "JULY" },
  { value: "7", label: "AUGUST" },
  { value: "8", label: "SEPTEMBER" },
  { value: "9", label: "OCTOBER" },
  { value: "10", label: "NOVEMBER" },
  { value: "11", label: "DECEMBER" },
];

export function DownloadReportDialog({ open, onOpenChange }: DownloadReportDialogProps) {
  const currentDate = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>("monthly");
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { data: invoices, isLoading: invoicesLoading } = useInvoices();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: settings, isLoading: settingsLoading } = useSettings();

  const isLoading = invoicesLoading || clientsLoading || settingsLoading;

  // Generate available years (last 5 years including current)
  const availableYears = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  const getDateRange = () => {
    if (selectedPeriod === "monthly") {
      const date = new Date(selectedYear, selectedMonth, 1);
      return { start: startOfMonth(date), end: endOfMonth(date) };
    } else {
      const date = new Date(selectedYear, 0, 1);
      return { start: startOfYear(date), end: endOfYear(date) };
    }
  };

  const handleDownload = async () => {
    if (!invoices || !clients) {
      toast.error("Data not loaded yet. Please try again.");
      return;
    }

    setIsGenerating(true);

    try {
      const dateRange = getDateRange();
      
      // Filter invoices within the date range
      const filteredInvoices = invoices.filter((inv) => {
        const issueDate = parseISO(inv.issue_date);
        return isWithinInterval(issueDate, dateRange);
      });

      // Calculate summary metrics
      let totalPaid = 0;
      let totalOutstanding = 0;
      let overdueAmount = 0;

      const invoiceItems: InvoiceReportItem[] = filteredInvoices.map((inv) => {
        const status = deriveInvoiceStatus({
          status: inv.status,
          due_date: inv.due_date,
          viewed_at: inv.viewed_at,
        });
        
        const total = Number(inv.total);
        const isPaid = status === "paid";
        const isOverdue = status === "overdue";
        
        const amountPaid = isPaid ? total : 0;
        const amountOutstanding = isPaid ? 0 : total;
        
        if (isPaid) {
          totalPaid += total;
        } else {
          totalOutstanding += total;
          if (isOverdue) {
            overdueAmount += total;
          }
        }

        return {
          invoice_number: inv.invoice_number,
          client_name: inv.clients?.name || inv.clients?.company || "Unknown",
          issue_date: inv.issue_date,
          due_date: inv.due_date,
          status: status,
          subtotal: Number(inv.subtotal),
          tax_amount: Number(inv.tax_amount || 0),
          total: total,
          amount_paid: amountPaid,
          amount_outstanding: amountOutstanding,
        };
      });

      // Build client summary from filtered invoices
      const clientMap = new Map<string, ClientSummaryItem>();
      
      filteredInvoices.forEach((inv) => {
        const clientName = inv.clients?.name || inv.clients?.company || "Unknown";
        const clientId = inv.client_id || "unknown";
        
        const status = deriveInvoiceStatus({
          status: inv.status,
          due_date: inv.due_date,
          viewed_at: inv.viewed_at,
        });
        
        const total = Number(inv.total);
        const isPaid = status === "paid";
        
        if (!clientMap.has(clientId)) {
          clientMap.set(clientId, {
            name: clientName,
            invoice_count: 0,
            total_billed: 0,
            total_paid: 0,
            outstanding: 0,
          });
        }
        
        const clientData = clientMap.get(clientId)!;
        clientData.invoice_count++;
        clientData.total_billed += total;
        if (isPaid) {
          clientData.total_paid += total;
        } else {
          clientData.outstanding += total;
        }
      });

      const clientSummary = Array.from(clientMap.values()).sort((a, b) => 
        b.total_billed - a.total_billed
      );

      const reportData: ComprehensiveReportData = {
        businessName: settings?.company_name || "Billie",
        period: selectedPeriod,
        dateRange,
        generatedAt: new Date(),
        summary: {
          totalInvoicesIssued: filteredInvoices.length,
          totalPaid,
          totalOutstanding,
          overdueAmount,
          grossRevenue: totalPaid,
          netProfit: totalPaid * 0.85, // Simplified: 85% profit margin estimate
        },
        invoices: invoiceItems,
        clientSummary,
      };

      generateComprehensiveReport(reportData);
      toast.success("Report downloaded successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const dateRange = getDateRange();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">DOWNLOAD REPORT</DialogTitle>
          <DialogDescription className="text-muted-foreground uppercase font-mono text-xs tracking-wider">
            SELECT A TIME PERIOD TO GENERATE YOUR FINANCIAL REPORT.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Period Selection */}
          <div className="space-y-3">
            <label className="text-xs text-muted-foreground tracking-widest font-mono uppercase">
              SELECT PERIOD
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedPeriod("monthly")}
                className={`p-4 border rounded transition-all ${
                  selectedPeriod === "monthly"
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                <Calendar className="w-5 h-5 mx-auto mb-2" />
                <span className="text-sm font-medium block font-mono uppercase">MONTHLY</span>
              </button>
              <button
                onClick={() => setSelectedPeriod("yearly")}
                className={`p-4 border rounded transition-all ${
                  selectedPeriod === "yearly"
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                <Calendar className="w-5 h-5 mx-auto mb-2" />
                <span className="text-sm font-medium block font-mono uppercase">YEARLY</span>
              </button>
            </div>
          </div>

          {/* Month/Year Selection */}
          <div className="space-y-3">
            <label className="text-xs text-muted-foreground tracking-widest font-mono uppercase">
              {selectedPeriod === "monthly" ? "SELECT MONTH & YEAR" : "SELECT YEAR"}
            </label>
            <div className={`grid gap-3 ${selectedPeriod === "monthly" ? "grid-cols-2" : "grid-cols-1"}`}>
              {selectedPeriod === "monthly" && (
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(value) => setSelectedMonth(parseInt(value))}
                >
                  <SelectTrigger className="font-mono uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month) => (
                      <SelectItem key={month.value} value={month.value} className="font-mono uppercase">
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="font-mono uppercase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()} className="font-mono uppercase">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Preview */}
          <div className="p-4 bg-background rounded border border-border">
            <div className="text-xs text-muted-foreground tracking-widest mb-2 font-mono uppercase">
              REPORT DATE RANGE
            </div>
            <div className="text-sm text-foreground font-mono uppercase">
              {format(dateRange.start, "dd MMM yyyy").toUpperCase()} — {format(dateRange.end, "dd MMM yyyy").toUpperCase()}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={isGenerating}
          >
            CANCEL
          </Button>
          <Button
            onClick={handleDownload}
            className="flex-1 bg-primary hover:bg-primary/90"
            disabled={isLoading || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                GENERATING...
              </>
            ) : (
              "DOWNLOAD PDF"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
