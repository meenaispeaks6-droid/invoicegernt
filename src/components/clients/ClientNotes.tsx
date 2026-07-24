import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";
import { useUpdateClient, Client } from "@/hooks/useClients";
interface UpdateData {
  id: string;
  notes?: string | null;
}
interface ClientNotesProps {
  client: Client & {
    notes?: string | null;
  };
}
export function ClientNotes({
  client
}: ClientNotesProps) {
  const [notes, setNotes] = useState(client.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const updateClient = useUpdateClient();
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateClient.mutateAsync({
        id: client.id,
        notes
      } as UpdateData & Partial<Client>);
    } catch {
      // Error toast surfaced by useUpdateClient onError.
    } finally {
      setIsSaving(false);
    }
  };
  const hasChanges = notes !== (client.notes || "");
  return <div className="bg-card border-b border-border">
      <div className="flex items-center justify-between px-8 pt-6 pb-1">
        <h3 className="font-display text-xl text-foreground tracking-wide">
          INTERNAL NOTES
        </h3>
        {hasChanges && <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm tracking-wider hover:bg-foreground/90 transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" />
            {isSaving ? "SAVING..." : "SAVE"}
          </button>}
      </div>
      <div className="px-8 pt-[14px] pb-[24px]">
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="ADD PRIVATE NOTES ABOUT THIS CLIENT..." className="min-h-[120px] bg-background border-border resize-none" />
        
      </div>
    </div>;
}