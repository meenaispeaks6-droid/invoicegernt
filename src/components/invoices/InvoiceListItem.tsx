import { format } from "date-fns";
import { Invoice } from "@/hooks/useInvoices";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";

interface InvoiceListItemProps {
  invoice: Invoice;
  onClick: () => void;
}

export function InvoiceListItem({ invoice, onClick }: InvoiceListItemProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd MMM yyyy").toUpperCase();
    } catch {
      return "—";
    }
  };

  return (
    <tr
      onClick={onClick}
      className="bg-card border border-border hover:bg-muted/50 transition-colors cursor-pointer group"
    >
      {/* Invoice Number */}
      <td className="px-4 py-3 w-24 whitespace-nowrap">
        <span className="font-mono text-muted-foreground group-hover:text-foreground transition-colors uppercase text-sm">
          {invoice.invoice_number}
        </span>
      </td>

      {/* Client Name */}
      <td className="px-4 py-3 w-40">
        <span className="text-sm text-foreground truncate block uppercase max-w-[160px]">
          {invoice.clients?.name || "No client"}
        </span>
      </td>

      {/* Issue Date */}
      <td className="px-4 py-3 w-28 text-right">
        <span className="text-xs text-muted-foreground">
          {formatDate(invoice.issue_date)}
        </span>
      </td>

      {/* Due Date */}
      <td className="px-4 py-3 w-28 text-right">
        <span className="text-xs text-muted-foreground uppercase">
          {invoice.due_date ? formatDate(invoice.due_date) : "UPON RECEIPT"}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3 w-24 text-center">
        <InvoiceStatusBadge invoice={invoice} showMicrocopy={false} />
      </td>

      {/* Total */}
      <td className="px-4 py-3 w-28 text-right">
        <span className="text-sm font-mono text-foreground">
          {formatCurrency(invoice.total)}
        </span>
      </td>
    </tr>
  );
}
