import { useRef, useState, useCallback } from "react";
import { Invoice } from "@/hooks/useInvoices";
import { format } from "date-fns";
import { deriveInvoiceStatus, getInvoiceStatusInfo } from "@/lib/invoiceStatus";

interface InvoiceThumbnailProps {
  invoice: Invoice;
  onClick?: () => void;
}

export function InvoiceThumbnail({ invoice, onClick }: InvoiceThumbnailProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [transform3D, setTransform3D] = useState({ rotateX: 0, rotateY: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rotateY = ((e.clientX - centerX) / rect.width) * 12;
    const rotateX = ((centerY - e.clientY) / rect.height) * 12;

    setTransform3D({ rotateX, rotateY });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTransform3D({ rotateX: 0, rotateY: 0 });
    setIsHovered(false);
  }, []);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    }
  }, [onClick]);

  const derivedStatus = deriveInvoiceStatus(invoice);
  const statusInfo = getInvoiceStatusInfo(invoice);

  // Map status to HSL color for inline styles
  const statusColorMap: Record<string, string> = {
    paid: "hsl(var(--primary))",
    viewed: "hsl(210, 100%, 50%)",
    pending: "hsl(var(--status-pending))",
    overdue: "hsl(var(--destructive))",
    draft: "hsl(var(--muted-foreground))",
  };
  const statusColor = statusColorMap[derivedStatus] || statusColorMap.draft;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy").toUpperCase();
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="flex flex-col gap-2 md:gap-3">
      {/* Thumbnail Card - A4 Aspect Ratio */}
      <div
        ref={cardRef}
        className="cursor-pointer select-none w-full"
        style={{
          aspectRatio: "1 / 1.414", // A4 aspect ratio
          transform: isHovered
            ? `perspective(1000px) rotateX(${transform3D.rotateX}deg) rotateY(${transform3D.rotateY}deg) scale(1.02) translateZ(10px)`
            : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1) translateZ(0px)",
          transition: isHovered
            ? "none"
            : "transform 0.3s ease-out, box-shadow 0.3s ease-out",
          transformStyle: "preserve-3d",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <div
          className="w-full h-full bg-white rounded-sm overflow-hidden flex flex-col"
          style={{
            boxShadow: isHovered
              ? "0 20px 40px -12px rgba(0, 0, 0, 0.4)"
              : "0 8px 24px -8px rgba(0, 0, 0, 0.25)",
            fontFamily: "'Geist Mono Variable', 'Geist', monospace",
          }}
        >
          <div className="p-[8%] flex-1 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start mb-[4%]">
              <div>
                <h3
                  className="font-bold text-black tracking-tight"
                  style={{ fontFamily: "'Geist', sans-serif", fontSize: "clamp(6px, 2.5cqw, 10px)" }}
                >
                  INVOICE
                </h3>
                <p className="text-gray-500 tracking-wider mt-0.5" style={{ fontSize: "clamp(4px, 1.5cqw, 6px)" }}>
                  {invoice.invoice_number}
                </p>
              </div>
            </div>

            {/* Bill To & Dates */}
            <div className="grid grid-cols-2 gap-[4%] mb-[4%]">
              <div className="min-w-0">
                <p className="text-gray-400 tracking-wider uppercase mb-0.5" style={{ fontSize: "clamp(3px, 1.2cqw, 5px)" }}>
                  BILL TO
                </p>
                <p className="font-semibold text-black truncate" style={{ fontSize: "clamp(4px, 1.8cqw, 7px)" }}>
                  {invoice.clients?.name || "Unknown"}
                </p>
                {invoice.clients?.company && (
                  <p className="text-gray-600 truncate" style={{ fontSize: "clamp(3px, 1.2cqw, 5px)" }}>
                    {invoice.clients.company}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="mb-[8%]">
                  <p className="text-gray-400 tracking-wider uppercase" style={{ fontSize: "clamp(3px, 1.2cqw, 5px)" }}>
                    ISSUE
                  </p>
                  <p className="font-medium text-black" style={{ fontSize: "clamp(4px, 1.5cqw, 6px)" }}>
                    {formatDate(invoice.issue_date)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 tracking-wider uppercase" style={{ fontSize: "clamp(3px, 1.2cqw, 5px)" }}>
                    DUE
                  </p>
                  <p className="font-medium text-black" style={{ fontSize: "clamp(4px, 1.5cqw, 6px)" }}>
                    {invoice.due_date ? formatDate(invoice.due_date) : "UPON RECEIPT"}
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-[3%]" />

            {/* Line Items Table */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <div className="flex justify-between text-gray-400 border-b border-gray-100 pb-0.5 mb-[2%]" style={{ fontSize: "clamp(3px, 1.2cqw, 5px)" }}>
                <span className="tracking-wider uppercase">Description</span>
                <span className="tracking-wider uppercase">Amount</span>
              </div>
              {invoice.invoice_items?.slice(0, 2).map((item, idx) => (
                <div key={idx} className="flex justify-between mb-[1%]" style={{ fontSize: "clamp(4px, 1.5cqw, 6px)" }}>
                  <span className="text-gray-700 truncate flex-1 mr-1">
                    {item.description || `Item ${idx + 1}`}
                  </span>
                  <span className="text-gray-600 font-medium flex-shrink-0">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
              {(!invoice.invoice_items || invoice.invoice_items.length === 0) && (
                <p className="text-gray-300 text-center py-1 uppercase tracking-wider" style={{ fontSize: "clamp(3px, 1.2cqw, 5px)" }}>
                  NO ITEMS
                </p>
              )}
              {invoice.invoice_items && invoice.invoice_items.length > 2 && (
                <p className="text-gray-400 italic" style={{ fontSize: "clamp(3px, 1cqw, 4px)" }}>
                  +{invoice.invoice_items.length - 2} more
                </p>
              )}
            </div>

            {/* Total */}
            <div className="mt-auto pt-[3%] border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 uppercase tracking-wider" style={{ fontSize: "clamp(4px, 1.5cqw, 6px)" }}>
                  Total
                </span>
                <span className="text-black font-medium" style={{ fontSize: "clamp(4px, 1.5cqw, 6px)" }}>
                  {formatCurrency(invoice.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Info Below Card */}
      <div className="flex flex-col group/info">
        <span className="text-xs text-foreground/50 hover:text-foreground tracking-wide transition-colors cursor-pointer">
          {invoice.invoice_number}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          <span
            className="text-xs font-medium tracking-wider"
            style={{ color: statusColor }}
          >
            {statusInfo.label}
          </span>
        </div>
        {statusInfo.microcopy && (
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {statusInfo.microcopy}
          </span>
        )}
      </div>
    </div>
  );
}
