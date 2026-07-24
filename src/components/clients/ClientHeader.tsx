import { useState } from "react";
import { Client, useUpdateClient } from "@/hooks/useClients";
import { ClientFinancialStats } from "@/hooks/useClientInvoices";
import { CreditCard, Clock, ArrowLeft, Plus, Edit2, Bell, Archive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EditClientDialog } from "./EditClientDialog";
import { toast } from "sonner";
interface ClientHeaderProps {
  client: Client & {
    tax_id?: string | null;
    preferred_currency?: string | null;
    payment_terms?: number | null;
    status?: string | null;
  };
  stats?: ClientFinancialStats;
}
export function ClientHeader({
  client,
  stats
}: ClientHeaderProps) {
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const updateClient = useUpdateClient();
  const hasOverdueInvoices = !!(stats?.overdueAmount && stats.overdueAmount > 0);
  const handleArchive = () => {
    const newStatus = client.status === "archived" ? "active" : "archived";
    updateClient.mutate({
      id: client.id,
      status: newStatus
    } as Partial<Client> & {
      id: string;
    }, {
      onSuccess: () => {
        toast.success(newStatus === "archived" ? "Client archived successfully" : "Client reactivated successfully");
      }
    });
  };
  const handleSendReminder = () => {
    toast.info("Reminder functionality - check the invoice history for Billie's suggestions");
  };
  return <div className="border-b border-border">
      {/* Back button */}
      <button onClick={() => navigate("/clients")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors px-8 pt-6 pb-8">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm tracking-wider">BACK TO CLIENTS</span>
      </button>

      <div className="flex items-start justify-between px-8 pb-8">
        {/* Left side - Client info */}
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 bg-card border border-border flex items-center justify-center">
            <span className="font-display text-3xl text-foreground">
              {client.name.charAt(0)}
            </span>
          </div>

          <div>
            {/* Name and status */}
            <div className="flex items-center gap-4 mb-2">
              <h1 className="font-display text-4xl text-foreground tracking-tight">
                {client.name.toUpperCase()}
              </h1>
              {hasOverdueInvoices && <span className="px-4 py-1.5 text-xs tracking-wider rounded-full bg-destructive/20 text-destructive">
                  OVERDUE
                </span>}
            </div>

            {/* Company */}
            {client.company && <p className="text-muted-foreground mb-4">{client.company}</p>}

          </div>
        </div>

        {/* Right side - Payment terms and Actions */}
        <div className="flex flex-col items-end gap-6">
          {/* Currency and Payment terms - single line */}
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm">
                {client.preferred_currency || "AUD"}
              </span>
            </div>
            <span className="text-muted-foreground/50">•</span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm uppercase">
                NET {client.payment_terms || 30} DAYS
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/invoices/new?client=${client.id}`)} className="flex items-center gap-2 px-6 py-3 bg-foreground text-background font-medium text-sm tracking-wider hover:bg-foreground/90 transition-colors">
              <Plus className="w-4 h-4" />
              NEW INVOICE
            </button>

            <button onClick={() => setEditDialogOpen(true)} className="flex items-center gap-2 px-4 py-3 bg-card border border-border text-sm tracking-wider hover:bg-muted/50 transition-colors">
              <Edit2 className="w-4 h-4" />
              CLIENT INFORMATION
            </button>

            <button onClick={handleSendReminder} className="flex items-center gap-2 px-4 py-3 bg-card border border-border text-sm tracking-wider hover:bg-muted/50 transition-colors">
              <Bell className="w-4 h-4" />
              SEND REMINDER
            </button>

            <button onClick={handleArchive} className={`flex items-center gap-2 px-4 py-3 border text-sm tracking-wider transition-colors ${client.status === "archived" ? "bg-primary/20 border-primary text-primary hover:bg-primary/30" : "bg-card border-border hover:bg-muted/50"}`}>
              <Archive className="w-4 h-4" />
              {client.status === "archived" ? "REACTIVATE" : "ARCHIVE"}
            </button>
          </div>
        </div>
      </div>

      <EditClientDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} client={client} />
    </div>;
}