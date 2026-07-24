import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Lightbulb } from "lucide-react";
import { useClients, Client } from "@/hooks/useClients";
import { useInvoices, InvoiceItem } from "@/hooks/useInvoices";
import { LogoUploadField } from "./LogoUploadField";
import { PaymentDetailsSection, PaymentDetailsData } from "./PaymentDetailsSection";


export interface InvoiceFormData {
  clientId: string;
  client: Client | null;
  invoiceNumber: string;
  useCustomNumber: boolean;
  internalTitle: string;
  issueDate: string;
  dueDate: string;
  dueOnReceipt: boolean;
  status: "draft" | "pending";
  items: InvoiceItem[];
  notes: string;
  footerNote: string;
  logoUrl: string;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  invoiceNumberError: string;
  paymentDetails: PaymentDetailsData;
}

interface InvoiceFormProps {
  formData: InvoiceFormData;
  onFormChange: (data: InvoiceFormData) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  isSubmitting: boolean;
  preselectedClientId?: string;
  submitLabel?: string;
}

export function InvoiceForm({
  formData,
  onFormChange,
  onSubmit,
  onCancel,
  isSubmitting,
  preselectedClientId,
  submitLabel = "CREATE INVOICE",
}: InvoiceFormProps) {
  const { data: clients } = useClients();
  const { data: invoices } = useInvoices();
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Get previous invoices for the selected client
  const clientPreviousInvoices = useMemo(() => {
    if (!invoices || !formData.clientId) return [];
    return invoices.filter((inv) => inv.client_id === formData.clientId);
  }, [invoices, formData.clientId]);

  // Get unique items from previous invoices
  const suggestedItems = useMemo(() => {
    const itemMap = new Map<string, InvoiceItem>();
    clientPreviousInvoices.forEach((inv) => {
      inv.invoice_items?.forEach((item) => {
        const key = item.description.toLowerCase();
        if (!itemMap.has(key)) {
          itemMap.set(key, {
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount,
          });
        }
      });
    });
    return Array.from(itemMap.values());
  }, [clientPreviousInvoices]);

  // Handle client selection
  const handleClientChange = (clientId: string) => {
    const selectedClient = clients?.find((c) => c.id === clientId) || null;
    
    // Calculate due date based on payment terms
    let dueDate = formData.dueDate;
    if (selectedClient?.payment_terms) {
      const issueDate = new Date(formData.issueDate);
      issueDate.setDate(issueDate.getDate() + selectedClient.payment_terms);
      dueDate = issueDate.toISOString().split("T")[0];
    }

    onFormChange({
      ...formData,
      clientId,
      client: selectedClient,
      dueDate,
    });

    // Show suggestions if there are previous invoices
    if (suggestedItems.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Prefill client if provided
  useEffect(() => {
    if (preselectedClientId && clients && !formData.clientId) {
      handleClientChange(preselectedClientId);
    }
  }, [preselectedClientId, clients]);

  // Update calculations when items or tax rate change
  const recalculate = (items: InvoiceItem[], taxRate: number) => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const addItem = () => {
    const newItems = [
      ...formData.items,
      { description: "", quantity: 1, unit_price: 0, amount: 0 },
    ];
    const calc = recalculate(newItems, formData.taxRate);
    onFormChange({ ...formData, items: newItems, ...calc });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      const calc = recalculate(newItems, formData.taxRate);
      onFormChange({ ...formData, items: newItems, ...calc });
    }
  };

  const updateItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const updated = [...formData.items];
    (updated[index] as any)[field] = value;

    if (field === "quantity" || field === "unit_price") {
      updated[index].amount = updated[index].quantity * updated[index].unit_price;
    }

    const calc = recalculate(updated, formData.taxRate);
    onFormChange({ ...formData, items: updated, ...calc });
  };

  const addSuggestedItem = (item: InvoiceItem) => {
    const newItems = [...formData.items];
    // Replace empty first item or add new
    const emptyIndex = newItems.findIndex(
      (i) => !i.description && i.quantity === 1 && i.unit_price === 0
    );
    if (emptyIndex !== -1) {
      newItems[emptyIndex] = { ...item };
    } else {
      newItems.push({ ...item });
    }
    const calc = recalculate(newItems, formData.taxRate);
    onFormChange({ ...formData, items: newItems, ...calc });
  };

  const handleTaxRateChange = (rate: number) => {
    const calc = recalculate(formData.items, rate);
    onFormChange({ ...formData, taxRate: rate, ...calc });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Client Selection */}
      <div className="space-y-2">
        <Label className="form-label">CLIENT</Label>
        <Select value={formData.clientId} onValueChange={handleClientChange}>
          <SelectTrigger className="h-11 bg-background border-border text-sm">
            <SelectValue placeholder="Select client..." />
          </SelectTrigger>
          <SelectContent>
            {clients?.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name} {client.company && `(${client.company})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Client Info Display */}
      {formData.client && (
        <div className="p-4 bg-muted/30 border border-border rounded-sm space-y-1">
          <p className="text-sm text-foreground font-medium uppercase">
            {formData.client.name}
          </p>
          {formData.client.company && (
            <p className="text-xs text-muted-foreground">{formData.client.company}</p>
          )}
          {formData.client.email && (
            <p className="text-xs text-muted-foreground">{formData.client.email}</p>
          )}
          {formData.client.address && (
            <p className="text-xs text-muted-foreground">{formData.client.address}</p>
          )}
        </div>
      )}

      {/* Suggestions from Previous Invoices */}
      {showSuggestions && suggestedItems.length > 0 && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-sm">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-primary" />
            <span className="text-xs text-primary tracking-wide uppercase font-medium">
              SUGGESTIONS FROM PREVIOUS INVOICES
            </span>
            <button
              type="button"
              onClick={() => setShowSuggestions(false)}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground"
            >
              DISMISS
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedItems.slice(0, 5).map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => addSuggestedItem(item)}
                className="px-3 py-1.5 bg-background border border-border rounded-sm text-xs text-foreground hover:border-foreground/50 transition-colors"
              >
                {item.description} - ${item.unit_price.toFixed(2)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Internal Title */}
      <div className="space-y-2">
        <Label className="form-label">INTERNAL TITLE (OPTIONAL)</Label>
        <Input
          value={formData.internalTitle}
          onChange={(e) =>
            onFormChange({ ...formData, internalTitle: e.target.value })
          }
          placeholder="e.g., Website Project – Jan 2026"
          className="h-11 bg-background border-border text-sm"
        />
        <p className="form-helper">
          For your internal tracking only. Not shown on client invoices.
        </p>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="form-label">INVOICE NUMBER</Label>
          <Input
            value={formData.invoiceNumber}
            onChange={(e) =>
              onFormChange({ ...formData, invoiceNumber: e.target.value, invoiceNumberError: "" })
            }
            disabled={!formData.useCustomNumber}
            className={`h-11 bg-background border-border text-sm ${
              formData.invoiceNumberError ? "border-destructive" : ""
            } ${!formData.useCustomNumber ? "opacity-70" : ""}`}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useCustomNumber"
              checked={formData.useCustomNumber}
              onChange={(e) =>
                onFormChange({ ...formData, useCustomNumber: e.target.checked, invoiceNumberError: "" })
              }
              className="h-4 w-4 rounded border-border bg-background"
            />
            <label htmlFor="useCustomNumber" className="meta-text uppercase">
              USE CUSTOM NUMBER
            </label>
          </div>
          {formData.invoiceNumberError && (
            <p className="text-xs text-destructive uppercase">
              {formData.invoiceNumberError}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="form-label">STATUS</Label>
          <Select
            value={formData.status}
            onValueChange={(value: "draft" | "pending") =>
              onFormChange({ ...formData, status: value })
            }
          >
            <SelectTrigger className="h-11 bg-background border-border text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="form-label">
            ISSUE DATE
          </Label>
          <Input
            type="date"
            value={formData.issueDate}
            onChange={(e) =>
              onFormChange({ ...formData, issueDate: e.target.value })
            }
            className="h-11 bg-background border-border text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label className="form-label">DUE DATE</Label>
          {!formData.dueOnReceipt && (
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                onFormChange({ ...formData, dueDate: e.target.value })
              }
              className="h-11 bg-background border-border text-sm"
            />
          )}
          {formData.dueOnReceipt && (
            <div className="h-11 flex items-center px-3 bg-muted border border-border text-sm text-muted-foreground uppercase">
              Upon Receipt
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="dueOnReceipt"
              checked={formData.dueOnReceipt}
              onChange={(e) =>
                onFormChange({ ...formData, dueOnReceipt: e.target.checked, dueDate: e.target.checked ? "" : formData.dueDate })
              }
              className="h-4 w-4 rounded border-border bg-background"
            />
            <label htmlFor="dueOnReceipt" className="meta-text uppercase">
              DUE UPON RECEIPT
            </label>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="form-label">LINE ITEMS</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            className="h-8 btn-text border-border"
          >
            <Plus className="w-3 h-3 mr-1" />
            ADD ITEM
          </Button>
        </div>

        {/* Items header - hidden on mobile */}
        <div className="hidden sm:grid grid-cols-[1fr,80px,100px,100px,40px] gap-2 meta-text tracking-wide uppercase">
          <span>DESCRIPTION</span>
          <span>QTY</span>
          <span>PRICE</span>
          <span>AMOUNT</span>
          <span></span>
        </div>

        {/* Items list - stacked on mobile */}
        {formData.items.map((item, index) => (
          <div key={index} className="space-y-2 sm:space-y-0">
            {/* Mobile layout */}
            <div className="sm:hidden space-y-3 p-3 bg-muted/30 border border-border rounded-sm">
              <div className="flex items-center justify-between">
                <span className="meta-text uppercase">ITEM {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                  disabled={formData.items.length === 1}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <Input
                value={item.description}
                onChange={(e) => updateItem(index, "description", e.target.value)}
                placeholder="Item description..."
                className="h-10 bg-background border-border text-sm"
              />
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <span className="meta-text uppercase">QTY</span>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, "quantity", parseFloat(e.target.value) || 0)
                    }
                    className="h-10 bg-background border-border text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <span className="meta-text uppercase">PRICE</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) =>
                      updateItem(index, "unit_price", parseFloat(e.target.value) || 0)
                    }
                    className="h-10 bg-background border-border text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <span className="meta-text uppercase">AMOUNT</span>
                  <div className="h-10 flex items-center px-3 bg-muted border border-border text-sm text-foreground">
                    ${item.amount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Desktop layout */}
            <div className="hidden sm:grid grid-cols-[1fr,80px,100px,100px,40px] gap-2 items-center">
              <Input
                value={item.description}
                onChange={(e) => updateItem(index, "description", e.target.value)}
                placeholder="Item description..."
                className="h-10 bg-background border-border text-sm"
              />
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) =>
                  updateItem(index, "quantity", parseFloat(e.target.value) || 0)
                }
                className="h-10 bg-background border-border text-sm"
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.unit_price}
                onChange={(e) =>
                  updateItem(index, "unit_price", parseFloat(e.target.value) || 0)
                }
                className="h-10 bg-background border-border text-sm"
              />
              <div className="h-10 flex items-center px-3 bg-muted border border-border text-sm text-foreground">
                ${item.amount.toFixed(2)}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                disabled={formData.items.length === 1}
                className="h-10 w-10 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Tax Rate */}
      <div className="flex items-center gap-4">
        <Label className="form-label">TAX RATE (%)</Label>
        <Input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={formData.taxRate}
          onChange={(e) => handleTaxRateChange(parseFloat(e.target.value) || 0)}
          className="h-10 w-24 bg-background border-border text-sm"
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label className="form-label">NOTES</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => onFormChange({ ...formData, notes: e.target.value })}
          placeholder="Add any notes..."
          className="bg-background border-border resize-none text-sm"
          rows={3}
        />
      </div>

      {/* Logo Upload */}
      <LogoUploadField
        logoUrl={formData.logoUrl}
        onLogoChange={(url) => onFormChange({ ...formData, logoUrl: url })}
      />

      {/* Payment Details */}
      <PaymentDetailsSection
        data={formData.paymentDetails}
        onChange={(paymentDetails) => onFormChange({ ...formData, paymentDetails })}
        invoiceNumber={formData.invoiceNumber}
      />

      {/* Footer Note */}
      <div className="space-y-2">
        <Label className="form-label">FOOTER NOTE (OPTIONAL)</Label>
        <Textarea
          value={formData.footerNote}
          onChange={(e) => onFormChange({ ...formData, footerNote: e.target.value })}
          placeholder="Add a custom footer message..."
          className="bg-background border-border resize-none text-sm"
          rows={2}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-12 btn-text border-border text-foreground hover:bg-muted w-full sm:flex-1"
          >
            CANCEL
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || !formData.clientId}
          className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground btn-text w-full sm:flex-1"
        >
          {isSubmitting ? "SAVING..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
