import { Link } from "react-router-dom";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  items: {
    description: string;
    quantity: number;
    price: number;
    amount: number;
  }[];
  subtotal: number;
  total: number;
  currency?: string;
}

interface InvoiceCardProps {
  invoice: Invoice;
  className?: string;
  style?: React.CSSProperties;
}

export function InvoiceCard({ invoice, className = "", style }: InvoiceCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: invoice.currency || "AUD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Link
      to={`/invoices/${invoice.id}`}
      className={`block bg-white rounded-sm cursor-pointer relative ${className}`}
      style={{
        width: "280px",
        aspectRatio: "1 / 1.414", // A4 aspect ratio
        fontFamily: "'Geist Mono Variable', 'Geist', monospace",
        ...style,
      }}
    >
      <div className="p-5 h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2
              className="text-lg font-bold text-black tracking-tight"
              style={{ fontFamily: "'Geist', sans-serif" }}
            >
              INVOICE
            </h2>
            <p className="text-[10px] text-gray-500 tracking-wider mt-0.5">
              {invoice.invoiceNumber}
            </p>
          </div>
        </div>

        {/* Bill To & Dates */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-[8px] text-gray-400 tracking-wider uppercase mb-1">
              BILL TO
            </p>
            <p className="text-[11px] font-semibold text-black">
              {invoice.clientName}
            </p>
            {invoice.clientCompany && (
              <p className="text-[9px] text-gray-600">{invoice.clientCompany}</p>
            )}
            <p className="text-[8px] text-gray-500">{invoice.clientEmail}</p>
          </div>
          <div className="text-right">
            <div className="mb-2">
              <p className="text-[8px] text-gray-400 tracking-wider uppercase">
                ISSUE DATE
              </p>
              <p className="text-[10px] font-medium text-black">
                {invoice.invoiceDate}
              </p>
            </div>
            <div>
              <p className="text-[8px] text-gray-400 tracking-wider uppercase">
                DUE DATE
              </p>
              <p className="text-[10px] font-medium text-black">
                {invoice.dueDate}
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-2" />

        {/* Line Items Table */}
        <div className="flex-1">
          <div className="flex justify-between text-[8px] text-gray-400 border-b border-gray-100 pb-1 mb-1.5">
            <span className="tracking-wider uppercase">Description</span>
            <span className="tracking-wider uppercase">Amount</span>
          </div>
          {invoice.items.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex justify-between text-[10px] mb-1">
              <span className="text-gray-700 truncate max-w-[140px]">
                {item.description}
              </span>
              <span className="text-gray-600 font-medium">
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}
          {invoice.items.length > 3 && (
            <p className="text-[8px] text-gray-400 italic">
              +{invoice.items.length - 3} more items
            </p>
          )}
        </div>

        {/* Total */}
        <div className="mt-auto pt-2 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
              Total
            </span>
            <span className="text-[10px] text-black">
              {formatCurrency(invoice.total)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
