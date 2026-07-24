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
import { useCreateClient } from "@/hooks/useClients";

interface NewClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewClientDialog({ open, onOpenChange }: NewClientDialogProps) {
  const createClient = useCreateClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createClient.mutateAsync({
        name,
        email: email || undefined,
        company: company || undefined,
        address: address || undefined,
        phone: phone || undefined,
      });

      onOpenChange(false);
      resetForm();
    } catch {
      // Errors are surfaced via the mutation's onError/toast.
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setCompany("");
    setAddress("");
    setPhone("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-foreground tracking-tight">
            ADD CLIENT
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground tracking-wide">
              CLIENT NAME *
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-12 bg-background border-border text-foreground"
              placeholder="Enter client name"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground tracking-wide">
              EMAIL ADDRESS
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-background border-border text-foreground"
              placeholder="client@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground tracking-wide">
              COMPANY
            </Label>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="h-12 bg-background border-border text-foreground"
              placeholder="Company name"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground tracking-wide">
              ADDRESS
            </Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-12 bg-background border-border text-foreground"
              placeholder="Street address, city, country"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground tracking-wide">
              PHONE
            </Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-12 bg-background border-border text-foreground"
              placeholder="+1 234 567 890"
            />
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
              disabled={createClient.isPending || !name.trim()}
              className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm tracking-wide w-full sm:w-auto"
            >
              {createClient.isPending ? "ADDING..." : "ADD CLIENT"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
