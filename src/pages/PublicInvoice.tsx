import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceDocument } from "@/components/invoices/InvoiceDocument";
import { generatePublicInvoicePDF } from "@/lib/publicInvoicePdfExport";
import { PinGate } from "@/components/invoices/PinGate";
import { PaymentMethod } from "@/hooks/usePaymentTemplates";
import type { BusinessSettings } from "@/hooks/useBusinessSettings";
import { toast } from "sonner";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface PublicInvoiceData {
  id: string;
  invoice_number: string;
  status: string;
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  payment_methods: PaymentMethod[] | null;
  payment_intro_text: string | null;
  payment_outro_text: string | null;
  payment_reference: string | null;
  business_settings?: BusinessSettings | null;
  clients: {
    name: string;
    email: string | null;
    company: string | null;
    address: string | null;
  } | null;
  invoice_items: InvoiceItem[];
}

type ViewState = "loading" | "pin-required" | "error" | "success";

export default function PublicInvoice() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [invoice, setInvoice] = useState<PublicInvoiceData | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Initial check - determine if PIN is required
  useEffect(() => {
    async function checkAccess() {
      if (!id || !token) {
        setError("Invalid invoice link");
        setViewState("error");
        return;
      }

      try {
        const { data, error: invokeError } = await supabase.functions.invoke(
          "mark-invoice-viewed",
          {
            body: { invoiceId: id, shareToken: token },
          }
        );

        if (invokeError) {
          setError("Invoice not found or link is invalid");
          setViewState("error");
          return;
        }

        if (data?.requiresPin) {
          setInvoiceNumber(data.invoiceNumber || "");
          setViewState("pin-required");
        } else if (data?.success && data?.invoice) {
          setInvoice(data.invoice as PublicInvoiceData);
          setViewState("success");
        } else {
          setError("Invoice not found or link is invalid");
          setViewState("error");
        }
      } catch (err) {
        console.error("Error checking invoice access:", err);
        setError("Failed to load invoice");
        setViewState("error");
      }
    }

    checkAccess();
  }, [id, token]);

  const handlePinSubmit = async (pin: string) => {
    if (!id || !token) return;
    
    setIsVerifying(true);
    setPinError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "mark-invoice-viewed",
        {
          body: { invoiceId: id, shareToken: token, pinCode: pin },
        }
      );

      if (invokeError || data?.error) {
        setPinError(data?.error || "Failed to verify PIN");
        setIsVerifying(false);
        return;
      }

      if (data?.success && data?.invoice) {
        setInvoice(data.invoice as PublicInvoiceData);
        setViewState("success");
      } else {
        setPinError("Incorrect PIN");
      }
    } catch (err) {
      console.error("Error verifying PIN:", err);
      setPinError("Failed to verify PIN");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownload = () => {
    if (!invoice) return;
    try {
      generatePublicInvoicePDF(invoice);
    } catch (err) {
      console.error("PDF download failed:", err);
      toast.error("Failed to download PDF. Please try again.");
    }
  };

  // Loading state
  if (viewState === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // PIN required state
  if (viewState === "pin-required") {
    return (
      <PinGate
        invoiceNumber={invoiceNumber}
        onSubmit={handlePinSubmit}
        error={pinError}
        isLoading={isVerifying}
      />
    );
  }

  // Error state
  if (viewState === "error" || !invoice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display tracking-wider text-foreground mb-2">
            {error || "INVOICE NOT FOUND"}
          </h1>
          <p className="text-muted-foreground text-sm uppercase tracking-wider">
            THIS INVOICE LINK MAY BE INVALID OR EXPIRED
          </p>
        </div>
      </div>
    );
  }

  // Success state - show invoice
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Invoice
            </p>
            <p className="font-mono text-sm text-foreground">
              {invoice.invoice_number}
            </p>
          </div>
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice Document */}
      <div className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <InvoiceDocument
            invoiceNumber={invoice.invoice_number}
            issueDate={invoice.issue_date}
            dueDate={invoice.due_date}
            subtotal={invoice.subtotal}
            taxRate={invoice.tax_rate}
            taxAmount={invoice.tax_amount}
            total={invoice.total}
            notes={invoice.notes}
            client={invoice.clients}
            items={invoice.invoice_items}
            paymentMethods={invoice.payment_methods || undefined}
            paymentIntroText={invoice.payment_intro_text || undefined}
            paymentOutroText={invoice.payment_outro_text || undefined}
            paymentReference={invoice.payment_reference || invoice.invoice_number}
            businessSettings={invoice.business_settings || null}
            companyName={invoice.business_settings?.company_name || undefined}
            companyEmail={invoice.business_settings?.company_email || undefined}
            logoUrl={invoice.business_settings?.logo_url || undefined}
            currency={invoice.business_settings?.default_currency || undefined}
          />

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              THANK YOU FOR YOUR BUSINESS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
