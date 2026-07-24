import { getInvoiceStatusInfo, statusColors, InvoiceForStatus } from "@/lib/invoiceStatus";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface InvoiceStatusBadgeProps {
  invoice: InvoiceForStatus;
  showMicrocopy?: boolean;
}

export function InvoiceStatusBadge({ invoice, showMicrocopy = true }: InvoiceStatusBadgeProps) {
  const statusInfo = getInvoiceStatusInfo(invoice);

  const badge = (
    <span
      className={`px-3 py-1 text-xs tracking-wider rounded-full ${statusColors[statusInfo.status]}`}
    >
      {statusInfo.label}
    </span>
  );

  if (showMicrocopy && statusInfo.microcopy) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{statusInfo.microcopy}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}
