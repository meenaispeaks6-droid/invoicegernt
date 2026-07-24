import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useInvoice } from "@/hooks/useInvoices";
import { useClient } from "@/hooks/useClients";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { InvoiceDocument } from "@/components/invoices/InvoiceDocument";
import { Skeleton } from "@/components/ui/skeleton";
import confetti from "canvas-confetti";

export function CompleteStep() {
  const navigate = useNavigate();
  const { data, completeOnboarding } = useOnboarding();
  const confettiTriggered = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [transform3D, setTransform3D] = useState({ rotateX: 0, rotateY: 0 });
  
  // Fetch the created invoice
  const { data: invoice, isLoading: invoiceLoading } = useInvoice(data.invoiceId || "");
  const { data: client } = useClient(data.clientId || "");
  const { data: settings } = useSettings();

  useEffect(() => {
    if (!confettiTriggered.current) {
      confettiTriggered.current = true;
      
      // Light confetti celebration
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: ["#22c55e", "#16a34a", "#15803d", "#4ade80", "#86efac"],
      });
    }
  }, []);

  // Match the same cursor-reactive 3D behavior used elsewhere in Billie
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rotateY = ((e.clientX - centerX) / rect.width) * 8;
    const rotateX = ((centerY - e.clientY) / rect.height) * 8;
    setTransform3D({ rotateX, rotateY });
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => {
    setTransform3D({ rotateX: 0, rotateY: 0 });
    setIsHovered(false);
  }, []);

  const handleSendNow = async () => {
    await completeOnboarding();
    navigate("/invoices");
  };

  const handleContinueExploring = async () => {
    await completeOnboarding();
    navigate("/");
  };

  // Build invoice data for preview
  const invoiceData = invoice ? {
    invoiceNumber: invoice.invoice_number,
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date,
    items: invoice.invoice_items?.map(item => ({
      id: item.id || crypto.randomUUID(),
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.amount,
    })) || [],
    subtotal: invoice.subtotal,
    taxRate: invoice.tax_rate || 0,
    taxAmount: invoice.tax_amount || 0,
    total: invoice.total,
    notes: invoice.notes,
    client: {
      name: client?.name || data.clientName,
      email: client?.email || null,
      company: client?.company || null,
      address: client?.address || null,
    },
    companyName: settings?.company_name || data.businessName,
  } : null;

  return (
    <div className="h-full min-h-0 flex flex-col items-center justify-center gap-4 md:gap-6 py-2 md:py-4 px-4">
      {/* Invoice Preview - matching the overlay style */}
      <div className="flex-1 flex items-center justify-center min-h-0 w-full">
        <div
          ref={cardRef}
          className="cursor-default select-none h-full max-h-[50vh] md:max-h-[62vh] w-auto"
          style={{
            aspectRatio: "1 / 1.414",
            maxWidth: "min(92vw, calc(50vh / 1.414))",
            transform: isHovered
              ? `perspective(1500px) rotateX(${transform3D.rotateX}deg) rotateY(${transform3D.rotateY}deg) scale(1.01)`
              : "perspective(1500px) rotateX(0deg) rotateY(0deg) scale(1)",
            transition: isHovered ? "none" : "transform 0.4s ease-out",
            transformStyle: "preserve-3d",
            boxShadow: isHovered
              ? "0 40px 80px -20px rgba(0, 0, 0, 0.5)"
              : "0 25px 60px -15px rgba(0, 0, 0, 0.4)",
          }}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {invoiceLoading || !invoiceData ? (
            <div className="h-full w-full bg-white p-4 md:p-6 space-y-3 md:space-y-4 overflow-hidden">
              <Skeleton className="h-6 md:h-8 w-24 md:w-32 bg-muted" />
              <Skeleton className="h-3 md:h-4 w-36 md:w-48 bg-muted" />
              <Skeleton className="h-3 md:h-4 w-32 md:w-40 bg-muted" />
              <div className="mt-6 md:mt-8 space-y-2">
                <Skeleton className="h-2 md:h-3 w-full bg-muted" />
                <Skeleton className="h-2 md:h-3 w-3/4 bg-muted" />
              </div>
            </div>
          ) : (
            <div className="h-full w-full overflow-hidden">
              <div
                className="origin-top-left"
                style={{ transform: "scale(0.5)", width: "200%", height: "200%" }}
              >
                <InvoiceDocument {...invoiceData} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-3 w-full max-w-xs flex-shrink-0 pb-[calc(env(safe-area-inset-bottom)+8px)]">
        <Button
          onClick={handleSendNow}
          className="w-full h-10 md:h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs md:text-sm tracking-wide"
        >
          SEND INVOICE NOW
        </Button>
        <button
          onClick={handleContinueExploring}
          className="text-muted-foreground hover:text-foreground transition-colors text-[10px] md:text-xs tracking-wider uppercase"
        >
          SAVE & CONTINUE TO APP
        </button>
      </div>
    </div>
  );
}
