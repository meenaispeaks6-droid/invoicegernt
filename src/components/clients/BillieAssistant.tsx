import { Invoice } from "@/hooks/useInvoices";
import { Bot, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface BillieAssistantProps {
  invoice: Invoice;
  onClose: () => void;
}

export function BillieAssistant({ invoice, onClose }: BillieAssistantProps) {
  const getEmailSuggestion = (): { subject: string; body: string } => {
    const clientName = invoice.clients?.name || "Client";
    const invoiceNumber = invoice.invoice_number;
    const amount = new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(invoice.total);
    const dueDate = invoice.due_date
      ? format(new Date(invoice.due_date), "dd MMMM yyyy")
      : "as soon as possible";

    if (invoice.status === "pending") {
      return {
        subject: `Invoice ${invoiceNumber} - Payment Reminder`,
        body: `Hi ${clientName},

I hope this message finds you well. This is a friendly reminder that invoice ${invoiceNumber} for ${amount} is due on ${dueDate}.

If you have already made the payment, please disregard this message. Otherwise, I would appreciate it if you could process the payment at your earliest convenience.

Please don't hesitate to reach out if you have any questions or need any clarification regarding the invoice.

Thank you for your business!

Best regards`,
      };
    }

    if (invoice.status === "overdue") {
      const daysPastDue = invoice.due_date
        ? Math.ceil(
            (new Date().getTime() - new Date(invoice.due_date).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;

      return {
        subject: `URGENT: Invoice ${invoiceNumber} - Payment Overdue`,
        body: `Hi ${clientName},

I'm reaching out regarding invoice ${invoiceNumber} for ${amount}, which is now ${daysPastDue} days past the due date of ${dueDate}.

I understand that things can get busy, but I would greatly appreciate it if you could prioritize this payment. If there are any issues or concerns regarding the invoice, please let me know so we can resolve them promptly.

If payment has already been made, please accept my apologies and kindly send confirmation so I can update my records.

Thank you for your immediate attention to this matter.

Best regards`,
      };
    }

    // Default for just sent
    return {
      subject: `Invoice ${invoiceNumber} - Thank You for Your Business`,
      body: `Hi ${clientName},

Thank you for your recent business. Please find attached invoice ${invoiceNumber} for ${amount}.

Payment is due by ${dueDate}. Please let me know if you have any questions about the invoice or need any additional information.

I appreciate your prompt payment!

Best regards`,
    };
  };

  const suggestion = getEmailSuggestion();

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
  };

  return (
    <div className="bg-card border border-foreground/30 rounded-lg p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="font-display text-sm text-foreground">BILLIE</span>
            <p className="text-xs text-muted-foreground">
              Suggested follow-up email
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Subject */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground tracking-wider">
            SUBJECT
          </span>
          <button
            onClick={() => copyToClipboard(suggestion.subject, "Subject")}
            className="flex items-center gap-1 text-xs text-foreground/70 hover:text-foreground transition-colors"
          >
            <Copy className="w-3 h-3" />
            COPY
          </button>
        </div>
        <p className="text-sm text-foreground bg-muted/50 p-2 rounded">
          {suggestion.subject}
        </p>
      </div>

      {/* Body */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground tracking-wider">
            MESSAGE
          </span>
          <button
            onClick={() => copyToClipboard(suggestion.body, "Message")}
            className="flex items-center gap-1 text-xs text-foreground/70 hover:text-foreground transition-colors"
          >
            <Copy className="w-3 h-3" />
            COPY
          </button>
        </div>
        <pre className="text-sm text-foreground bg-muted/50 p-3 rounded whitespace-pre-wrap font-sans">
          {suggestion.body}
        </pre>
      </div>
    </div>
  );
}
