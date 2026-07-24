import { formatDistanceToNow, isPast, parseISO } from "date-fns";

export type InvoiceStatus = "draft" | "pending" | "viewed" | "paid" | "overdue";

export interface InvoiceStatusInfo {
  status: InvoiceStatus;
  label: string;
  microcopy: string | null;
}

export interface InvoiceForStatus {
  status: string;
  due_date: string | null;
  viewed_at?: string | null;
}

/**
 * Derives the display status for an invoice, including the "viewed" state.
 * Priority: paid > overdue > viewed > pending > draft
 */
export function deriveInvoiceStatus(invoice: InvoiceForStatus): InvoiceStatus {
  // Paid is final
  if (invoice.status === "paid") {
    return "paid";
  }

  // Check if overdue (due date has passed and not paid)
  const isOverdue =
    invoice.due_date &&
    isPast(parseISO(invoice.due_date)) &&
    invoice.status !== "draft";

  if (isOverdue || invoice.status === "overdue") {
    return "overdue";
  }

  // Check if viewed (sent and viewed_at is set)
  if (
    invoice.status === "pending" &&
    invoice.viewed_at
  ) {
    return "viewed";
  }

  // Pending (sent but not viewed)
  if (invoice.status === "pending") {
    return "pending";
  }

  // Default to draft
  return "draft";
}

/**
 * Gets the display information for an invoice status, including microcopy.
 */
export function getInvoiceStatusInfo(invoice: InvoiceForStatus): InvoiceStatusInfo {
  const status = deriveInvoiceStatus(invoice);

  switch (status) {
    case "paid":
      return {
        status: "paid",
        label: "PAID",
        microcopy: null,
      };

    case "overdue":
      // If it was viewed before becoming overdue, show that
      if (invoice.viewed_at) {
        const viewedAgo = formatDistanceToNow(parseISO(invoice.viewed_at), {
          addSuffix: true,
        });
        return {
          status: "overdue",
          label: "OVERDUE",
          microcopy: `Viewed ${viewedAgo}`,
        };
      }
      return {
        status: "overdue",
        label: "OVERDUE",
        microcopy: "Not yet viewed",
      };

    case "viewed":
      const viewedAgo = formatDistanceToNow(parseISO(invoice.viewed_at!), {
        addSuffix: true,
      });
      return {
        status: "viewed",
        label: "VIEWED",
        microcopy: `Viewed online ${viewedAgo}`,
      };

    case "pending":
      return {
        status: "pending",
        label: "SENT",
        microcopy: null,
      };

    case "draft":
    default:
      return {
        status: "draft",
        label: "DRAFT",
        microcopy: null,
      };
  }
}

/**
 * Gets contextual follow-up suggestions for overdue invoices that have been viewed.
 */
export function getFollowUpSuggestions(invoice: InvoiceForStatus & { invoice_number: string; total: number }): string[] {
  const status = deriveInvoiceStatus(invoice);

  if (status !== "overdue") {
    return [];
  }

  const formattedTotal = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(invoice.total);

  // If viewed and now overdue, suggest a polite nudge
  if (invoice.viewed_at) {
    return [
      `Hi there, I wanted to follow up on invoice ${invoice.invoice_number} for ${formattedTotal}. I noticed it was viewed but hasn't been paid yet. Please let me know if you have any questions or if there's anything I can help with.`,
      `Just a friendly reminder about invoice ${invoice.invoice_number}. The payment of ${formattedTotal} is now past due. Would you like to discuss payment options?`,
      `Following up on invoice ${invoice.invoice_number} (${formattedTotal}) which is now overdue. I'd appreciate an update on when we can expect payment. Thank you!`,
    ];
  }

  // If not viewed and overdue
  return [
    `Hi, I wanted to make sure you received invoice ${invoice.invoice_number} for ${formattedTotal}. The payment is now past due. Please let me know if you need me to resend it.`,
    `Following up on invoice ${invoice.invoice_number}. It appears the invoice may not have been received. Could you confirm you have it? The amount of ${formattedTotal} is now overdue.`,
  ];
}

/**
 * Status color mapping for UI components
 */
export const statusColors: Record<InvoiceStatus, string> = {
  paid: "bg-primary/20 text-primary",
  viewed: "bg-blue-500/20 text-blue-500",
  pending: "bg-yellow-500/20 text-yellow-500",
  overdue: "bg-destructive/20 text-destructive",
  draft: "bg-muted text-muted-foreground",
};

/**
 * Status dot colors for minimal indicators
 */
export const statusDotColors: Record<InvoiceStatus, string> = {
  paid: "bg-primary",
  viewed: "bg-blue-500",
  pending: "bg-yellow-500",
  overdue: "bg-destructive",
  draft: "bg-muted-foreground",
};
