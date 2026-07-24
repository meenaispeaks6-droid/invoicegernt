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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Client, useUpdateClient } from "@/hooks/useClients";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client & {
    tax_id?: string | null;
    preferred_currency?: string | null;
    payment_terms?: number | null;
    status?: string | null;
  };
}

export function EditClientDialog({
  open,
  onOpenChange,
  client,
}: EditClientDialogProps) {
  const [formData, setFormData] = useState({
    name: client.name,
    email: client.email || "",
    company: client.company || "",
    address: client.address || "",
    phone: client.phone || "",
    tax_id: client.tax_id || "",
    preferred_currency: client.preferred_currency || "AUD",
    payment_terms: client.payment_terms || 30,
  });

  const updateClient = useUpdateClient();

  const handleCopy = (value: string, label: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied to clipboard`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateClient.mutate(
      {
        id: client.id,
        name: formData.name,
        email: formData.email || null,
        company: formData.company || null,
        address: formData.address || null,
        phone: formData.phone || null,
        tax_id: formData.tax_id || null,
        preferred_currency: formData.preferred_currency,
        payment_terms: formData.payment_terms,
      } as Partial<Client> & { id: string },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-wide">
            CLIENT INFORMATION
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs tracking-wider">
                NAME *
              </Label>
              <div className="relative">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="bg-background border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(formData.name, "Name")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company" className="text-xs tracking-wider">
                COMPANY
              </Label>
              <div className="relative">
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  className="bg-background border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(formData.company, "Company")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs tracking-wider">
                EMAIL
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="bg-background border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(formData.email, "Email")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs tracking-wider">
                PHONE
              </Label>
              <div className="relative">
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="bg-background border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(formData.phone, "Phone")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-xs tracking-wider">
              BILLING ADDRESS
            </Label>
            <div className="relative">
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="bg-background border-border min-h-[80px] pr-10"
              />
              <button
                type="button"
                onClick={() => handleCopy(formData.address, "Address")}
                className="absolute right-2 top-3 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax_id" className="text-xs tracking-wider">
                TAX ID
              </Label>
              <div className="relative">
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) =>
                    setFormData({ ...formData, tax_id: e.target.value })
                  }
                  placeholder="ABN / GST"
                  className="bg-background border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(formData.tax_id, "Tax ID")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency" className="text-xs tracking-wider">
                CURRENCY
              </Label>
              <Select
                value={formData.preferred_currency}
                onValueChange={(value) =>
                  setFormData({ ...formData, preferred_currency: value })
                }
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUD">AUD</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms" className="text-xs tracking-wider">
                PAYMENT TERMS
              </Label>
              <Select
                value={formData.payment_terms.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, payment_terms: parseInt(value) })
                }
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Net 7</SelectItem>
                  <SelectItem value="14">Net 14</SelectItem>
                  <SelectItem value="30">Net 30</SelectItem>
                  <SelectItem value="45">Net 45</SelectItem>
                  <SelectItem value="60">Net 60</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
              disabled={updateClient.isPending}
              className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm tracking-wide w-full sm:w-auto"
            >
              {updateClient.isPending ? "SAVING..." : "SAVE CHANGES"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
