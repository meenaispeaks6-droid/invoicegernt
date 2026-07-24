import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Trash2 } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useCreateInvoice, InvoiceItem } from "@/hooks/useInvoices";

interface NewInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedClientId?: string;
}

export function NewInvoiceDialog({ open, onOpenChange, preselectedClientId }: NewInvoiceDialogProps) {
  const { data: clients } = useClients();
  const createInvoice = useCreateInvoice();

  const [clientId, setClientId] = useState(preselectedClientId || "");
  const [invoiceNumber, setInvoiceNumber] = useState(() => {
    const year = new Date().getFullYear();
    const num = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `INV-${year}-${num}`;
  });
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<"draft" | "pending">("draft");
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState(0);

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unit_price: 0, amount: 0 },
  ]);

  const addItem = () => {
    setItems([
      ...items,
      { description: "", quantity: 1, unit_price: 0, amount: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;

    // Recalculate amount
    if (field === "quantity" || field === "unit_price") {
      updated[index].amount = updated[index].quantity * updated[index].unit_price;
    }

    setItems(updated);
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createInvoice.mutateAsync({
      client_id: clientId || undefined,
      invoice_number: invoiceNumber,
      status,
      issue_date: issueDate,
      due_date: dueDate || undefined,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      notes: notes || undefined,
      items: items.filter((item) => item.description.trim() !== ""),
    });

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setClientId("");
    setInvoiceNumber(() => {
      const year = new Date().getFullYear();
      const num = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
      return `INV-${year}-${num}`;
    });
    setIssueDate(new Date().toISOString().split("T")[0]);
    setDueDate("");
    setStatus("draft");
    setNotes("");
    setTaxRate(0);
    setItems([{ description: "", quantity: 1, unit_price: 0, amount: 0 }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-foreground tracking-tight">
            NEW INVOICE
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Top row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground tracking-wide">
                CLIENT
              </Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="h-11 bg-background border-border">
                  <SelectValue placeholder="Select client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground tracking-wide">
                INVOICE NUMBER
              </Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="h-11 bg-background border-border"
              />
            </div>
          </div>

          {/* Dates and status */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground tracking-wide">
                ISSUE DATE
              </Label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="h-11 bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground tracking-wide">
                DUE DATE
              </Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-11 bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground tracking-wide">
                STATUS
              </Label>
              <Select
                value={status}
                onValueChange={(value: "draft" | "pending") => setStatus(value)}
              >
                <SelectTrigger className="h-11 bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground tracking-wide">
                LINE ITEMS
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="h-8 text-xs border-border"
              >
                <Plus className="w-3 h-3 mr-1" />
                ADD ITEM
              </Button>
            </div>

            {/* Items header */}
            <div className="grid grid-cols-[1fr,100px,120px,120px,40px] gap-2 text-xs text-muted-foreground tracking-wide">
              <span>DESCRIPTION</span>
              <span>QTY</span>
              <span>UNIT PRICE</span>
              <span>AMOUNT</span>
              <span></span>
            </div>

            {/* Items list */}
            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr,100px,120px,120px,40px] gap-2 items-center"
              >
                <Input
                  value={item.description}
                  onChange={(e) =>
                    updateItem(index, "description", e.target.value)
                  }
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
                  disabled={items.length === 1}
                  className="h-10 w-10 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Tax Rate (%)</span>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="h-8 w-20 bg-background border-border text-sm"
                />
              </div>
              <span className="text-foreground">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t border-border pt-2">
              <span className="text-foreground">Total</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground tracking-wide">
              NOTES
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes..."
              className="bg-background border-border resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 px-6 border-border hover:bg-muted font-medium text-sm tracking-wide w-full sm:w-auto"
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              disabled={createInvoice.isPending}
              className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm tracking-wide w-full sm:w-auto"
            >
              {createInvoice.isPending ? "CREATING..." : "CREATE INVOICE"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
