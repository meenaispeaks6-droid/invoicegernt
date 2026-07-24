import { format } from "date-fns";
import { PaymentMethod } from "@/hooks/usePaymentTemplates";
import { PaymentDetailsDisplay } from "./PaymentDetailsDisplay";
import { BusinessSettings, formatBusinessAddress } from "@/hooks/useBusinessSettings";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface InvoiceClient {
  name: string;
  email: string | null;
  company: string | null;
  address: string | null;
}

interface InvoiceDocumentProps {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  client: InvoiceClient | null;
  items: InvoiceItem[];
  companyName?: string;
  companyEmail?: string;
  logoUrl?: string;
  currency?: string;
  paymentMethods?: PaymentMethod[];
  paymentIntroText?: string;
  paymentOutroText?: string;
  paymentReference?: string;
  businessSettings?: BusinessSettings | null;
}

export function InvoiceDocument({
  invoiceNumber,
  issueDate,
  dueDate,
  subtotal,
  taxRate,
  taxAmount,
  total,
  notes,
  client,
  items,
  companyName,
  companyEmail,
  logoUrl,
  currency = "AUD",
  paymentMethods,
  paymentIntroText,
  paymentOutroText,
  paymentReference,
  businessSettings,
}: InvoiceDocumentProps) {
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd MMM yyyy").toUpperCase();
    } catch {
      return "—";
    }
  };

  const resolvedCurrency = currency || businessSettings?.default_currency || "USD";
  const resolvedCompanyName = companyName || businessSettings?.company_name || "Your Company";
  const resolvedCompanyEmail = companyEmail || businessSettings?.company_email || "email@company.com";
  const resolvedLogo = logoUrl || businessSettings?.logo_url || "";
  const addressLines = formatBusinessAddress(businessSettings);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: resolvedCurrency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div
      className="bg-white text-black shadow-2xl mx-auto overflow-hidden"
      style={{
        width: "100%",
        maxWidth: "595px",
        aspectRatio: "1 / 1.414",
        fontFamily: "'Geist Mono Variable', 'Geist', monospace",
      }}
    >
      <div className="p-8 h-full flex flex-col text-xs">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            {resolvedLogo ? (
              <img
                src={resolvedLogo}
                alt="Company Logo"
                className="max-w-[200px] max-h-[60px] object-contain mb-1"
              />
            ) : (
              <h1
                className="text-2xl font-bold tracking-tight mb-1"
                style={{ fontFamily: "'Geist', sans-serif" }}
              >
                INVOICE
              </h1>
            )}
            <p className="text-gray-500 text-[10px] tracking-wider">
              {invoiceNumber}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-sm">
              {resolvedCompanyName}
            </p>
            <p className="text-gray-500 text-[10px]">{resolvedCompanyEmail}</p>
            {businessSettings?.company_phone && (
              <p className="text-gray-500 text-[10px]">{businessSettings.company_phone}</p>
            )}
            {addressLines.map((line, i) => (
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
            {client ? (
              <div className="space-y-0.5">
                <p className="font-semibold text-sm">{client.name}</p>
                {client.company && (
                  <p className="text-gray-600 text-[10px]">{client.company}</p>
                )}
                {client.email && (
                  <p className="text-gray-500 text-[10px]">{client.email}</p>
                )}
                {client.address && (
                  <p className="text-gray-500 text-[10px]">{client.address}</p>
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
                <p className="font-medium text-[11px]">{formatDate(issueDate)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 tracking-wider uppercase">
                  DUE DATE
                </p>
                <p className="font-medium text-[11px]">
                  {dueDate ? formatDate(dueDate) : "UPON RECEIPT"}
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
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-2 text-[11px]">{item.description}</td>
                  <td className="py-2 text-right text-[11px] text-gray-600">
                    {item.quantity}
                  </td>
                  <td className="py-2 text-right text-[11px] text-gray-600">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="py-2 text-right text-[11px] font-medium">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
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
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500">Tax ({taxRate}%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 tracking-wider uppercase mb-1">
              Notes
            </p>
            <p className="text-[10px] text-gray-600 whitespace-pre-wrap">
              {notes}
            </p>
          </div>
        )}

        {/* Payment Details */}
        {paymentMethods && paymentMethods.length > 0 && (
          <PaymentDetailsDisplay
            methods={paymentMethods}
            introText={paymentIntroText}
            outroText={paymentOutroText}
            reference={paymentReference}
          />
        )}

        {/* Business payment instructions fallback */}
        {(!paymentMethods || paymentMethods.length === 0) && businessSettings?.payment_instructions && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 tracking-wider uppercase mb-1">
              Payment Details
            </p>
            <p className="text-[10px] text-gray-600 whitespace-pre-wrap">
              {businessSettings.payment_instructions}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
