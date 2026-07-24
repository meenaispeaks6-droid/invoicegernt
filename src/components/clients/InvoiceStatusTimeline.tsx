import { Invoice } from "@/hooks/useInvoices";
import { CheckCircle, Send, FileText, AlertCircle, Eye } from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { deriveInvoiceStatus } from "@/lib/invoiceStatus";

interface InvoiceStatusTimelineProps {
  invoice: Invoice;
}

interface TimelineEvent {
  label: string;
  icon: React.ElementType;
  date: string | null;
  isActive: boolean;
  isPast: boolean;
  color: string;
  microcopy?: string;
}

export function InvoiceStatusTimeline({ invoice }: InvoiceStatusTimelineProps) {
  const derivedStatus = deriveInvoiceStatus(invoice);
  
  const getTimelineEvents = (): TimelineEvent[] => {
    const createdDate = invoice.created_at;
    const wasSent = ["pending", "paid", "overdue"].includes(invoice.status) || !!invoice.viewed_at;
    const wasViewed = invoice.viewed_at !== null;
    const isPaid = invoice.status === "paid";
    const isOverdue = derivedStatus === "overdue";

    const events: TimelineEvent[] = [
      {
        label: "CREATED",
        icon: FileText,
        date: createdDate,
        isActive: invoice.status === "draft",
        isPast: true,
        color: "text-primary",
        microcopy: format(new Date(createdDate), "dd MMM"),
      },
      {
        label: "SENT",
        icon: Send,
        date: wasSent ? invoice.updated_at : null,
        isActive: invoice.status === "pending" && !wasViewed,
        isPast: wasSent,
        color: wasSent ? "text-primary" : "text-muted-foreground",
        microcopy: wasSent ? format(new Date(invoice.updated_at), "dd MMM") : undefined,
      },
      {
        label: "VIEWED",
        icon: Eye,
        date: invoice.viewed_at,
        isActive: derivedStatus === "viewed",
        isPast: wasViewed,
        color: wasViewed ? "text-blue-500" : "text-muted-foreground",
        microcopy: wasViewed 
          ? `${formatDistanceToNow(parseISO(invoice.viewed_at!), { addSuffix: true })}`
          : undefined,
      },
      {
        label: "PAID",
        icon: CheckCircle,
        date: isPaid ? invoice.updated_at : null,
        isActive: isPaid,
        isPast: isPaid,
        color: isPaid ? "text-primary" : "text-muted-foreground",
        microcopy: isPaid ? format(new Date(invoice.updated_at), "dd MMM") : undefined,
      },
    ];

    // Add overdue event if applicable
    if (isOverdue) {
      // Insert before PAID
      events.splice(events.length - 1, 0, {
        label: "OVERDUE",
        icon: AlertCircle,
        date: invoice.due_date,
        isActive: true,
        isPast: true,
        color: "text-destructive",
        microcopy: invoice.due_date 
          ? `Since ${format(new Date(invoice.due_date), "dd MMM")}`
          : undefined,
      });
    }

    return events;
  };

  const events = getTimelineEvents();

  return (
    <div className="flex items-center gap-4 px-4 overflow-x-auto">
      {events.map((event, index) => (
        <div key={event.label} className="flex items-center">
          <div className="flex flex-col items-center min-w-[80px]">
            <div
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                event.isPast
                  ? `border-current ${event.color}`
                  : "border-muted-foreground/30"
              } ${event.isActive ? "ring-2 ring-offset-2 ring-offset-background ring-current" : ""}`}
            >
              <event.icon
                className={`w-5 h-5 ${
                  event.isPast ? event.color : "text-muted-foreground/30"
                }`}
              />
            </div>
            <span
              className={`text-xs mt-2 tracking-wider font-medium ${
                event.isPast ? "text-foreground" : "text-muted-foreground/50"
              }`}
            >
              {event.label}
            </span>
            {event.microcopy && (
              <span className="text-xs text-muted-foreground text-center">
                {event.microcopy}
              </span>
            )}
          </div>

          {/* Connector line */}
          {index < events.length - 1 && (
            <div
              className={`w-12 h-0.5 mx-2 transition-colors ${
                events[index + 1].isPast ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
