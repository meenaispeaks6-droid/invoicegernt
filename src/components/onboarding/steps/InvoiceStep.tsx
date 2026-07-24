import { useState } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useCreateInvoice, useNextInvoiceNumber } from "@/hooks/useInvoices";
import { useClient } from "@/hooks/useClients";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function InvoiceStep() {
  const { data, setData, nextStep, prevStep } = useOnboarding();
  const createInvoice = useCreateInvoice();
  const { data: nextInvoiceNumber } = useNextInvoiceNumber();
  const { data: client } = useClient(data.clientId || "");

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  const invoiceNumber = nextInvoiceNumber || "INV-0001";
  const today = new Date().toISOString().split("T")[0];

  const handleCreateInvoice = async () => {
    const parsedAmount = parseFloat(amount) || 0;
    if (!description.trim() || parsedAmount <= 0) return;

    setIsCreating(true);
    try {
      const invoice = await createInvoice.mutateAsync({
        client_id: data.clientId,
        invoice_number: invoiceNumber,
        status: "pending",
        issue_date: today,
        subtotal: parsedAmount,
        tax_rate: 0,
        tax_amount: 0,
        total: parsedAmount,
        items: [
          {
            description: description.trim(),
            quantity: 1,
            unit_price: parsedAmount,
            amount: parsedAmount,
          },
        ],
      });

      setData({ invoiceId: invoice.id });
      nextStep();
    } catch {
      // Error toast is surfaced by the useCreateInvoice mutation's onError handler.
    } finally {
      setIsCreating(false);
    }
  };

  const canCreate = description.trim().length > 0 && parseFloat(amount) > 0;

  return (
    <div className="space-y-6 md:space-y-10">
      <div className="text-center">
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground tracking-tight mb-3 md:mb-4">
          CREATE YOUR FIRST INVOICE
        </h1>
        <p className="text-muted-foreground text-xs md:text-sm max-w-md mx-auto">
          Just add one item to get started. You can always edit and add more later.
        </p>
      </div>

      <div className="bg-card border border-border p-6 md:p-8 lg:p-10 space-y-4 md:space-y-6 max-w-lg mx-auto">
        {/* Pre-filled info */}
        <div className="flex items-center justify-between p-3 md:p-4 bg-muted/30 border border-border">
          <div>
            <p className="text-[10px] md:text-xs text-muted-foreground tracking-wide uppercase mb-1">
              INVOICE FOR
            </p>
            <p className="text-xs md:text-sm text-foreground font-medium uppercase">
              {client?.name || data.clientName}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] md:text-xs text-muted-foreground tracking-wide uppercase mb-1">
              INVOICE #
            </p>
            <p className="text-xs md:text-sm text-foreground font-mono">
              {invoiceNumber}
            </p>
          </div>
        </div>

        {/* Line item */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] md:text-xs text-muted-foreground tracking-wide uppercase">
              WHAT ARE YOU BILLING FOR?
            </Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Website design, Consulting fee"
              className="h-10 md:h-12 bg-background border-border text-foreground text-sm"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] md:text-xs text-muted-foreground tracking-wide uppercase">
              AMOUNT ({data.currency})
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                $
              </span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-10 md:h-12 bg-background border-border text-foreground pl-7 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          <Button
            variant="outline"
            onClick={prevStep}
            className="flex-1 h-10 md:h-12 border-border text-foreground hover:bg-muted text-xs md:text-sm tracking-wide"
          >
            BACK
          </Button>
          <Button
            onClick={handleCreateInvoice}
            disabled={!canCreate || isCreating}
            className="flex-1 h-10 md:h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs md:text-sm tracking-wide"
          >
            {isCreating ? "CREATING..." : "CREATE INVOICE"}
          </Button>
        </div>
      </div>
    </div>
  );
}
