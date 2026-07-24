import { format } from "date-fns";
import { InvoiceFormData } from "./InvoiceForm";
import { UserSettings } from "@/hooks/useSettings";
import { PaymentDetailsDisplay } from "./PaymentDetailsDisplay";
import { BusinessSettings, formatBusinessAddress } from "@/hooks/useBusinessSettings";

interface InvoiceLivePreviewProps {
  formData: InvoiceFormData;
  userSettings: UserSettings | null | undefined;
  businessSettings?: BusinessSettings | null;
}

export function InvoiceLivePreview({
  formData,
  userSettings,
  businessSettings,
}: InvoiceLivePreviewProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd MMM yyyy").toUpperCase();
    } catch {
      return "—";
    }
  };

  const formatCurrency = (amount: number) => {
    const currency =
      formData.client?.preferred_currency ||
      businessSettings?.default_currency ||
      "AUD";
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const logoUrl = formData.logoUrl || businessSettings?.logo_url || "";
  const companyName = businessSettings?.company_name || userSettings?.company_name || "Your Company";
  const companyEmail = businessSettings?.company_email || userSettings?.email || "email@company.com";
  const addressLines = formatBusinessAddress(businessSettings);

  return (
    <div className="sticky top-8">

      {/* A4 Preview Container */}
      <div
        className="bg-white text-black shadow-2xl mx-auto overflow-hidden"
        style={{
          width: "100%",
          maxWidth: "595px", // A4 width at 72 DPI
          aspectRatio: "1 / 1.414", // A4 aspect ratio
          fontFamily: "'Geist Mono Variable', 'Geist', monospace",
        }}
      >
        <div className="p-8 h-full flex flex-col text-xs">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              {logoUrl ? (
                <img
                  src={logoUrl}
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
                {formData.invoiceNumber || "INV-XXXX-XXX"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-sm">{companyName}</p>
              <p className="text-gray-500 text-[10px]">{companyEmail}</p>
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
              {formData.client ? (
                <div className="space-y-0.5">
                  <p className="font-semibold text-sm">{formData.client.name}</p>
                  {formData.client.company && (
                    <p className="text-gray-600 text-[10px]">
                      {formData.client.company}
                    </p>
                  )}
                  {formData.client.email && (
                    <p className="text-gray-500 text-[10px]">
                      {formData.client.email}
                    </p>
                  )}
                  {formData.client.address && (
                    <p className="text-gray-500 text-[10px]">
                      {formData.client.address}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-300 italic text-[10px]">
                  Select a client...
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-gray-400 tracking-wider uppercase">
                    ISSUE DATE
                  </p>
                  <p className="font-medium text-[11px]">
                    {formatDate(formData.issueDate)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 tracking-wider uppercase">
                    DUE DATE
                  </p>
                  <p className="font-medium text-[11px]">
                    {formData.dueOnReceipt ? "UPON RECEIPT" : formatDate(formData.dueDate)}
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
                {formData.items.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100"
                  >
                    <td className="py-2 text-[11px]">
                      {item.description || (
                        <span className="text-gray-300 italic">Item {index + 1}</span>
                      )}
                    </td>
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
                {formData.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-4 text-center text-gray-300 text-[10px] uppercase tracking-wider"
                    >
                      NO ITEMS ADDED YET
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
                  <span>{formatCurrency(formData.subtotal)}</span>
                </div>
                {formData.taxRate > 0 && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">
                      Tax ({formData.taxRate}%)
                    </span>
                    <span>{formatCurrency(formData.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[11px] pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatCurrency(formData.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {formData.notes && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 tracking-wider uppercase mb-1">
                Notes
              </p>
              <p className="text-[10px] text-gray-600 whitespace-pre-wrap">
                {formData.notes}
              </p>
            </div>
          )}

          {/* Footer */}
          {formData.footerNote && (
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <p className="text-[9px] text-gray-500 whitespace-pre-wrap">
                {formData.footerNote}
              </p>
            </div>
          )}

          {/* Payment Details */}
          <PaymentDetailsDisplay
            methods={formData.paymentDetails.methods}
            introText={formData.paymentDetails.introText}
            outroText={formData.paymentDetails.outroText}
            reference={formData.paymentDetails.reference}
          />

          {businessSettings?.payment_instructions && (
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
    </div>
  );
}
