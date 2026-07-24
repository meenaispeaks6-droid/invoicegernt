import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit2, Bell, Archive } from "lucide-react";
import { Client, useUpdateClient } from "@/hooks/useClients";
import { EditClientDialog } from "./EditClientDialog";
import { toast } from "sonner";

interface ClientQuickActionsProps {
  client: Client & { status?: string | null };
}

export function ClientQuickActions({ client }: ClientQuickActionsProps) {
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const updateClient = useUpdateClient();

  const handleArchive = () => {
    const newStatus = client.status === "archived" ? "active" : "archived";
    updateClient.mutate(
      { id: client.id, status: newStatus } as Partial<Client> & { id: string },
      {
        onSuccess: () => {
          toast.success(
            newStatus === "archived"
              ? "Client archived successfully"
              : "Client reactivated successfully"
          );
        },
      }
    );
  };

  const handleSendReminder = () => {
    toast.info("Reminder functionality - check the invoice history for Billie's suggestions");
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate(`/invoices/new?client=${client.id}`)}
          className="flex items-center gap-2 px-6 py-3 bg-foreground text-background font-medium text-sm tracking-wider hover:bg-foreground/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          NEW INVOICE
        </button>

        <button
          onClick={() => setEditDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-card border border-border text-sm tracking-wider hover:bg-muted/50 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
          EDIT CLIENT
        </button>

        <button
          onClick={handleSendReminder}
          className="flex items-center gap-2 px-4 py-3 bg-card border border-border text-sm tracking-wider hover:bg-muted/50 transition-colors"
        >
          <Bell className="w-4 h-4" />
          SEND REMINDER
        </button>

        <button
          onClick={handleArchive}
          className={`flex items-center gap-2 px-4 py-3 border text-sm tracking-wider transition-colors ${
            client.status === "archived"
              ? "bg-primary/20 border-primary text-primary hover:bg-primary/30"
              : "bg-card border-border hover:bg-muted/50"
          }`}
        >
          <Archive className="w-4 h-4" />
          {client.status === "archived" ? "REACTIVATE" : "ARCHIVE"}
        </button>
      </div>

      <EditClientDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        client={client}
      />
    </>
  );
}
