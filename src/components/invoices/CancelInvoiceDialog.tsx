import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface CancelInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveAsDraft: () => void;
  onDiscard: () => void;
  isSaving: boolean;
}

export function CancelInvoiceDialog({
  open,
  onOpenChange,
  onSaveAsDraft,
  onDiscard,
  isSaving,
}: CancelInvoiceDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border max-w-md">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-xl text-foreground tracking-tight uppercase">
            LEAVING INVOICE
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-sm">
            Would you like to save this invoice as a draft before leaving?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-4">
          <Button
            onClick={onDiscard}
            variant="outline"
            className="h-11 px-6 border-border hover:bg-muted font-medium text-sm tracking-wide uppercase w-full sm:w-auto"
          >
            DISCARD
          </Button>
          <Button
            onClick={onSaveAsDraft}
            disabled={isSaving}
            className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm tracking-wide uppercase w-full sm:w-auto"
          >
            {isSaving ? "SAVING..." : "SAVE AS DRAFT"}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
