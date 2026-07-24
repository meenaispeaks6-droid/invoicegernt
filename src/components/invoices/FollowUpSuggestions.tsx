import { useState } from "react";
import { getFollowUpSuggestions, deriveInvoiceStatus, InvoiceForStatus } from "@/lib/invoiceStatus";
import { Copy, Check, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface FollowUpSuggestionsProps {
  invoice: InvoiceForStatus & { invoice_number: string; total: number };
}

export function FollowUpSuggestions({ invoice }: FollowUpSuggestionsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const status = deriveInvoiceStatus(invoice);
  const suggestions = getFollowUpSuggestions(invoice);

  if (status !== "overdue" || suggestions.length === 0) {
    return null;
  }

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-card border border-border p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <h4 className="text-xs uppercase tracking-wider text-muted-foreground">
          SUGGESTED FOLLOW-UP MESSAGES
        </h4>
      </div>
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="group relative bg-muted/30 p-3 rounded text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <p className="pr-10">{suggestion}</p>
            <button
              onClick={() => handleCopy(suggestion, index)}
              className="absolute top-3 right-3 p-1.5 rounded hover:bg-muted transition-colors"
              title="Copy to clipboard"
            >
              {copiedIndex === index ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
              )}
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground/50 mt-3 uppercase tracking-wider">
        {invoice.viewed_at 
          ? "CLIENT VIEWED THIS INVOICE BEFORE IT BECAME OVERDUE" 
          : "CLIENT HAS NOT YET VIEWED THIS INVOICE"}
      </p>
    </div>
  );
}
