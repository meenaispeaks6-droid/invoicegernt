import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { InvoiceForm, InvoiceFormData } from "@/components/invoices/InvoiceForm";
import { InvoiceLivePreview } from "@/components/invoices/InvoiceLivePreview";
import { CancelInvoiceDialog } from "@/components/invoices/CancelInvoiceDialog";
import { useCreateInvoice, useNextInvoiceNumber, useCheckInvoiceNumberExists } from "@/hooks/useInvoices";
import { useSettings } from "@/hooks/useSettings";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { ArrowLeft } from "lucide-react";
import { DEFAULT_PAYMENT_METHODS } from "@/hooks/usePaymentTemplates";

export default function NewInvoice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedClientId = searchParams.get("client") || undefined;

  const createInvoice = useCreateInvoice();
  const { data: userSettings } = useSettings();
  const { data: businessSettings } = useBusinessSettings();
  const { data: nextInvoiceNumber, isLoading: isLoadingNumber } = useNextInvoiceNumber();
  const checkInvoiceNumberExists = useCheckInvoiceNumberExists();

  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId: "",
    client: null,
    invoiceNumber: "",
    useCustomNumber: false,
    internalTitle: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    dueOnReceipt: false,
    status: "draft",
    items: [{ description: "", quantity: 1, unit_price: 0, amount: 0 }],
    notes: "",
    footerNote: "",
    logoUrl: "",
    taxRate: 0,
    subtotal: 0,
    taxAmount: 0,
    total: 0,
    invoiceNumberError: "",
    paymentDetails: {
      methods: [...DEFAULT_PAYMENT_METHODS],
      introText: "",
      outroText: "",
      reference: "",
    },
  });

  // Update invoice number when the auto-generated number is loaded
  useEffect(() => {
    if (nextInvoiceNumber && !formData.useCustomNumber) {
      setFormData((prev) => ({ ...prev, invoiceNumber: nextInvoiceNumber }));
    }
  }, [nextInvoiceNumber, formData.useCustomNumber]);

  const handleSaveAsDraft = async () => {
    // Check for duplicate invoice number
    const exists = await checkInvoiceNumberExists(formData.invoiceNumber);
    if (exists) {
      setFormData((prev) => ({
        ...prev,
        invoiceNumberError: "This invoice number already exists",
      }));
      setShowCancelDialog(false);
      return;
    }

    await createInvoice.mutateAsync({
      client_id: formData.clientId || undefined,
      invoice_number: formData.invoiceNumber,
      internal_title: formData.internalTitle || undefined,
      status: "draft",
      issue_date: formData.issueDate,
      due_date: formData.dueOnReceipt ? undefined : formData.dueDate || undefined,
      subtotal: formData.subtotal,
      tax_rate: formData.taxRate,
      tax_amount: formData.taxAmount,
      total: formData.total,
      notes: formData.notes || undefined,
      items: formData.items.filter((item) => item.description.trim() !== ""),
      payment_methods: formData.paymentDetails.methods,
      payment_intro_text: formData.paymentDetails.introText || undefined,
      payment_outro_text: formData.paymentDetails.outroText || undefined,
      payment_reference: formData.paymentDetails.reference || undefined,
    });

    navigate("/invoices");
  };

  const handleDiscard = () => {
    setShowCancelDialog(false);
    navigate("/invoices");
  };

  const handleSubmit = async () => {
    // Check for duplicate invoice number
    const exists = await checkInvoiceNumberExists(formData.invoiceNumber);
    if (exists) {
      setFormData((prev) => ({
        ...prev,
        invoiceNumberError: "This invoice number already exists",
      }));
      return;
    }

    await createInvoice.mutateAsync({
      client_id: formData.clientId || undefined,
      invoice_number: formData.invoiceNumber,
      internal_title: formData.internalTitle || undefined,
      status: formData.status,
      issue_date: formData.issueDate,
      due_date: formData.dueOnReceipt ? undefined : formData.dueDate || undefined,
      subtotal: formData.subtotal,
      tax_rate: formData.taxRate,
      tax_amount: formData.taxAmount,
      total: formData.total,
      notes: formData.notes || undefined,
      items: formData.items.filter((item) => item.description.trim() !== ""),
      payment_methods: formData.paymentDetails.methods,
      payment_intro_text: formData.paymentDetails.introText || undefined,
      payment_outro_text: formData.paymentDetails.outroText || undefined,
      payment_reference: formData.paymentDetails.reference || undefined,
    });

    navigate("/invoices");
  };

  return (
    <Layout>
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <button
            onClick={() => navigate("/invoices")}
            className="p-2 hover:bg-muted rounded-sm transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="page-title text-3xl md:text-5xl">NEW INVOICE</h1>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Left Column - Form */}
          <div className="bg-card border border-border rounded-sm p-4 md:p-6">
            <InvoiceForm
              formData={formData}
              onFormChange={setFormData}
              onSubmit={handleSubmit}
              onCancel={() => setShowCancelDialog(true)}
              isSubmitting={createInvoice.isPending}
              preselectedClientId={preselectedClientId}
            />
          </div>

          {/* Right Column - Live Preview */}
          <div className="hidden lg:block">
            <InvoiceLivePreview
              formData={formData}
              userSettings={userSettings}
              businessSettings={businessSettings}
            />
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <CancelInvoiceDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onSaveAsDraft={handleSaveAsDraft}
        onDiscard={handleDiscard}
        isSaving={createInvoice.isPending}
      />
    </Layout>
  );
}
