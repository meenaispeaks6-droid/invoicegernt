import { ChevronRight, Download, Edit, Link as LinkIcon, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InvoiceOverlayMobileTopBarProps {
  canEdit: boolean;
  isPaid: boolean;
  invoicePin: string | null;
  isPinLoading: boolean;
  onEdit: () => void;
  onDownloadPdf: () => void;
  onCopyLink: () => void;
  onClose: () => void;
}

export function InvoiceOverlayMobileTopBar({
  canEdit,
  isPaid,
  invoicePin,
  isPinLoading,
  onEdit,
  onDownloadPdf,
  onCopyLink,
  onClose,
}: InvoiceOverlayMobileTopBarProps) {
  const showPin = isPinLoading || invoicePin;

  return (
    <div
      className="fixed z-50 left-3 right-3"
      style={{ top: "calc(env(safe-area-inset-top) + 8px)" }}
    >
      <div className="h-14 w-full rounded-md border border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg">
        <div className="h-full flex items-center gap-0 pl-2 pr-1">
          {/* Scrollable actions container */}
          <div className="relative flex-1 min-w-0 h-full">
            {/* Scrollable inner area - use scroll for touch, hide scrollbar */}
            <div
              className="h-full flex items-center gap-2 overflow-x-scroll pr-8"
              style={{
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <style>{`
                .mobile-top-bar-scroll::-webkit-scrollbar { display: none; }
              `}</style>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className={"text-xs gap-1.5 shrink-0 " + (!canEdit ? "opacity-50" : "")}
              >
                {isPaid ? <Lock className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
                {canEdit ? "EDIT" : "VIEW"}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onDownloadPdf}
                className="text-xs gap-1.5 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                PDF
              </Button>

              {/* Only show PIN section if we have a pin or are loading */}
              {showPin && (
                <>
                  <div className="h-6 w-px bg-border shrink-0" />
                  {isPinLoading ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-muted-foreground">PIN</span>
                      <span className="text-xs font-mono text-muted-foreground">...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-muted-foreground">PIN</span>
                      <span className="text-xs font-mono">{invoicePin}</span>
                    </div>
                  )}
                </>
              )}

              <div className="h-6 w-px bg-border shrink-0" />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onCopyLink}
                      className="text-xs gap-1.5 shrink-0"
                      aria-label="Copy invoice link"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      LINK
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px] text-center">
                    <p>Copy invoice link to send to your client. Includes PIN for secure access.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Scroll hint - positioned outside scroll area, no pointer-events block */}
            <div 
              className="absolute inset-y-0 right-0 w-8 flex items-center justify-center"
              style={{ 
                background: "linear-gradient(to left, hsl(var(--background)) 60%, transparent)",
                pointerEvents: "none"
              }}
            >
              <ChevronRight
                className="h-4 w-4 text-muted-foreground animate-pulse"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Divider before close */}
          <div className="h-6 w-px bg-border shrink-0 mx-1" />

          {/* Close button (fixed on right) */}
          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-sm hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
