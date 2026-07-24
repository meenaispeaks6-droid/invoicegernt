import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { X, ChevronLeft, ChevronRight, Download, Edit, Lock, AlertTriangle, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Invoice } from "@/hooks/useInvoices";
import { DEFAULT_PAYMENT_METHODS, PaymentMethod } from "@/hooks/usePaymentTemplates";
import { useSettings } from "@/hooks/useSettings";
import { useBusinessSettings, formatBusinessAddress } from "@/hooks/useBusinessSettings";
import { generateInvoicePDF } from "@/lib/invoicePdfExport";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { deriveInvoiceStatus } from "@/lib/invoiceStatus";
import { toast } from "sonner";
import { InvoiceOverlayMobileTopBar } from "@/components/invoices/InvoiceOverlayMobileTopBar";
interface InvoiceOverlayProps {
  invoice: Invoice | null;
  invoices: Invoice[];
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (invoice: Invoice) => void;
}

export function InvoiceOverlay({
  invoice,
  invoices,
  isOpen,
  onClose,
  onNavigate,
}: InvoiceOverlayProps) {
  const navigate = useNavigate();
  const { data: userSettings } = useSettings();
  const { data: businessSettings } = useBusinessSettings();
  const isMobile = useIsMobile();
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform3D, setTransform3D] = useState({ rotateX: 0, rotateY: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [showLockedWarning, setShowLockedWarning] = useState(false);

  const currentIndex = invoice ? invoices.findIndex((i) => i.id === invoice.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < invoices.length - 1;

  const isEditable = invoice?.status === "draft" || invoice?.status === "pending";
  const isPaid = invoice?.status === "paid";
  
  // PIN is directly available on the invoice object (already fetched with invoice data)
  const invoicePin = invoice?.pin_code ?? null;

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      onNavigate(invoices[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex, invoices, onNavigate]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      onNavigate(invoices[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, invoices, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  // 3D hover effect
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rotateY = ((e.clientX - centerX) / rect.width) * 8;
    const rotateX = ((centerY - e.clientY) / rect.height) * 8;
    setTransform3D({ rotateX, rotateY });
  }, []);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setTransform3D({ rotateX: 0, rotateY: 0 });
    setIsHovered(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "dd MMM yyyy").toUpperCase();
    } catch {
      return "—";
    }
  };

  const formatCurrency = (amount: number) => {
    const currency = businessSettings?.default_currency || "AUD";
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleDownloadPDF = () => {
    if (!invoice) return;

    const formData = {
      clientId: invoice.client_id || "",
      client: invoice.clients
        ? {
            id: invoice.client_id || "",
            user_id: invoice.user_id,
            name: invoice.clients.name,
            email: invoice.clients.email,
            company: invoice.clients.company,
            address: null,
            phone: null,
            created_at: "",
            updated_at: "",
            tax_id: null,
            preferred_currency: "AUD",
            payment_terms: 30,
            status: "active",
            notes: null,
          }
        : null,
      invoiceNumber: invoice.invoice_number,
      useCustomNumber: true,
      internalTitle: "",
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date || "",
      dueOnReceipt: !invoice.due_date,
      status: invoice.status as "draft" | "pending",
      items: invoice.invoice_items || [],
      notes: invoice.notes || "",
      footerNote: "",
      logoUrl: "",
      taxRate: invoice.tax_rate || 0,
      subtotal: invoice.subtotal,
      taxAmount: invoice.tax_amount || 0,
      total: invoice.total,
      invoiceNumberError: "",
      paymentDetails: {
        methods: (invoice.payment_methods as unknown as PaymentMethod[]) || [...DEFAULT_PAYMENT_METHODS],
        introText: invoice.payment_intro_text || "",
        outroText: invoice.payment_outro_text || "",
        reference: invoice.payment_reference || invoice.invoice_number,
      },
    };

    generateInvoicePDF(formData, userSettings, businessSettings);
  };

  const handleEdit = () => {
    if (isPaid) {
      setShowLockedWarning(true);
      return;
    }
    if (invoice) {
      navigate(`/invoices/${invoice.id}/edit`);
    }
  };

  if (!invoice) return null;

  const _derivedStatus = deriveInvoiceStatus(invoice);

  const handleCopyLink = () => {
    if (!invoice.share_token) {
      toast.error("Share token not available");
      return;
    }
    const publicUrl = `${window.location.origin}/invoice/${invoice.id}?token=${invoice.share_token}`;
    navigator.clipboard.writeText(publicUrl);
    
    // Show PIN in toast so user can share it with client
    if (invoicePin) {
      toast.success(
        <div className="space-y-1">
          <p>Invoice link copied!</p>
          <p className="text-xs text-muted-foreground">
            PIN: <span className="font-mono font-semibold">{invoicePin}</span>
          </p>
        </div>
      );
    } else {
      toast.success("Invoice link copied to clipboard");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        hideCloseButton
        className={`p-0 bg-transparent border-none shadow-none ${
          isMobile ? "w-full h-full max-w-full max-h-full rounded-none" : "max-w-4xl"
        }`}
        style={{ background: "transparent" }}
      >
        <VisuallyHidden>
          <DialogTitle>Invoice {invoice.invoice_number}</DialogTitle>
        </VisuallyHidden>
        
        {/* Top Navigation Bar */}
        {isMobile ? (
          <InvoiceOverlayMobileTopBar
            canEdit={isEditable}
            isPaid={isPaid}
            invoicePin={invoicePin}
            isPinLoading={false}
            onEdit={handleEdit}
            onDownloadPdf={handleDownloadPDF}
            onCopyLink={handleCopyLink}
            onClose={onClose}
          />
        ) : (
          <div className="fixed z-50 flex items-center bg-background border border-border top-0 left-1/2 -translate-x-1/2 px-6 py-3 gap-4">
            {/* Navigation Arrows */}
            <button
              onClick={handlePrev}
              disabled={!hasPrev}
              className={`p-2 transition-colors ${
                hasPrev ? "hover:bg-muted text-foreground" : "text-muted-foreground/30 cursor-not-allowed"
              }`}
              aria-label="Previous invoice"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-xs text-muted-foreground tracking-wider min-w-[80px] text-center">
              {currentIndex + 1} / {invoices.length}
            </span>

            <button
              onClick={handleNext}
              disabled={!hasNext}
              className={`p-2 transition-colors ${
                hasNext ? "hover:bg-muted text-foreground" : "text-muted-foreground/30 cursor-not-allowed"
              }`}
              aria-label="Next invoice"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-border mx-2" />

            {/* Action Buttons */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className={`text-xs gap-1.5 ${!isEditable ? "opacity-50" : ""}`}
            >
              {isPaid ? <Lock className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
              {isEditable ? "EDIT" : "VIEW"}
            </Button>

            <Button variant="ghost" size="sm" onClick={handleDownloadPDF} className="text-xs gap-1.5">
              <Download className="w-3.5 h-3.5" />
              PDF
            </Button>

            <div className="w-px h-6 bg-border" />

            {/* PIN Display */}
            {invoicePin && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">PIN</span>
                <span className="text-xs font-mono">{invoicePin}</span>
              </div>
            )}

            <div className="w-px h-6 bg-border" />

            {/* Copy Link Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleCopyLink} className="text-xs gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5" />
                    LINK
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px] text-center">
                  <p>Copy invoice link to send to your client. Includes PIN for secure access.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Locked Warning Modal */}
        {showLockedWarning && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
            <div className="bg-background border border-border rounded-lg p-6 max-w-md mx-4 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-destructive/10 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <h3 className="font-semibold text-foreground">Invoice Locked</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                This invoice has been marked as <strong>Paid</strong> and cannot be modified. 
                Paid invoices are locked to maintain accurate financial records.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                If you need to make corrections, consider creating an <strong>Adjustment</strong> or <strong>Credit Note</strong> instead.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLockedWarning(false)}
                >
                  CLOSE
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setShowLockedWarning(false);
                    // Could navigate to credit note creation in future
                  }}
                >
                  CREATE CREDIT NOTE
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Card with 3D Effect */}
        <div className={`flex items-center justify-center h-[90vh] p-4 pb-8 ${isMobile ? "pt-28" : "pt-24"}`}>
          <div
            ref={cardRef}
            className="cursor-default select-none h-full"
            style={{
              height: "100%",
              width: "auto",
              aspectRatio: "1 / 1.414",
              maxWidth: isMobile ? "100%" : "calc(90vh / 1.414)",
              transform: isHovered
                ? `perspective(1500px) rotateX(${transform3D.rotateX}deg) rotateY(${transform3D.rotateY}deg) scale(1.01)`
                : "perspective(1500px) rotateX(0deg) rotateY(0deg) scale(1)",
              transition: isHovered
                ? "none"
                : "transform 0.4s ease-out, box-shadow 0.4s ease-out",
              transformStyle: "preserve-3d",
            }}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className="w-full h-full bg-white rounded-sm overflow-hidden flex flex-col"
              style={{
                boxShadow: isHovered
                  ? "0 40px 80px -20px rgba(0, 0, 0, 0.5)"
                  : "0 25px 60px -15px rgba(0, 0, 0, 0.4)",
                fontFamily: "'Geist Mono Variable', 'Geist', monospace",
              }}
            >
              <div className="p-8 flex-1 flex flex-col text-xs">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h1
                      className="text-2xl font-bold text-black tracking-tight mb-1"
                      style={{ fontFamily: "'Geist', sans-serif" }}
                    >
                      INVOICE
                    </h1>
                    <p className="text-gray-500 text-[10px] tracking-wider">
                      {invoice.invoice_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-black">
                      {businessSettings?.company_name || userSettings?.company_name || "Your Company"}
                    </p>
                    <p className="text-gray-500 text-[10px]">
                      {businessSettings?.company_email || userSettings?.email || "email@company.com"}
                    </p>
                    {businessSettings?.company_phone && (
                      <p className="text-gray-500 text-[10px]">{businessSettings.company_phone}</p>
                    )}
                    {formatBusinessAddress(businessSettings).map((line, i) => (
                      <p key={i} className="text-gray-500 text-[10px]">{line}</p>
                    ))}
                    {businessSettings?.tax_id && (
                      <p className="text-gray-500 text-[10px]">Tax ID: {businessSettings.tax_id}</p>
                    )}
                  </div>
                </div>

                {/* Bill To & Invoice Details */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <p className="text-[10px] text-gray-400 tracking-wider mb-2 uppercase">
                      BILL TO
                    </p>
                    {invoice.clients ? (
                      <div className="space-y-0.5">
                        <p className="font-semibold text-sm text-black">
                          {invoice.clients.name}
                        </p>
                        {invoice.clients.company && (
                          <p className="text-gray-600 text-[10px]">
                            {invoice.clients.company}
                          </p>
                        )}
                        {invoice.clients.email && (
                          <p className="text-gray-500 text-[10px]">
                            {invoice.clients.email}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-300 italic text-[10px]">No client</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="space-y-2">
                      <div>
                        <p className="text-[10px] text-gray-400 tracking-wider uppercase">
                          ISSUE DATE
                        </p>
                        <p className="font-medium text-[11px] text-black">
                          {formatDate(invoice.issue_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 tracking-wider uppercase">
                          DUE DATE
                        </p>
                        <p className="font-medium text-[11px] text-black">
                          {invoice.due_date ? formatDate(invoice.due_date) : "UPON RECEIPT"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="flex-1">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-[10px] text-gray-400 tracking-wider uppercase font-normal">
                          Description
                        </th>
                        <th className="text-right py-2 text-[10px] text-gray-400 tracking-wider uppercase font-normal w-16">
                          Qty
                        </th>
                        <th className="text-right py-2 text-[10px] text-gray-400 tracking-wider uppercase font-normal w-20">
                          Price
                        </th>
                        <th className="text-right py-2 text-[10px] text-gray-400 tracking-wider uppercase font-normal w-24">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.invoice_items?.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 text-[11px] text-black">
                            {item.description}
                          </td>
                          <td className="py-2 text-right text-[11px] text-gray-600">
                            {item.quantity}
                          </td>
                          <td className="py-2 text-right text-[11px] text-gray-600">
                            {formatCurrency(item.unit_price)}
                          </td>
                          <td className="py-2 text-right text-[11px] font-medium text-black">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                      {(!invoice.invoice_items || invoice.invoice_items.length === 0) && (
                        <tr>
                          <td
                            colSpan={4}
                            className="py-4 text-center text-gray-300 text-[10px] uppercase tracking-wider"
                          >
                            NO ITEMS
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="mt-auto pt-4 border-t border-gray-200">
                  <div className="flex justify-end">
                    <div className="w-48 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="text-black">{formatCurrency(invoice.subtotal)}</span>
                      </div>
                      {invoice.tax_rate && invoice.tax_rate > 0 && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-500">Tax ({invoice.tax_rate}%)</span>
                          <span className="text-black">
                            {formatCurrency(invoice.tax_amount || 0)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-[11px] pt-2 border-t border-gray-200">
                        <span className="text-black">Total</span>
                        <span className="text-black">{formatCurrency(invoice.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 tracking-wider uppercase mb-1">
                      Notes
                    </p>
                    <p className="text-[10px] text-gray-600 whitespace-pre-wrap">
                      {invoice.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
