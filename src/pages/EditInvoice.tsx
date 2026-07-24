import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { InvoiceForm, InvoiceFormData } from "@/components/invoices/InvoiceForm";
import { InvoiceLivePreview } from "@/components/invoices/InvoiceLivePreview";
import { useInvoice, useUpdateInvoiceStatus } from "@/hooks/useInvoices";
import { useSettings } from "@/hooks/useSettings";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useClients } from "@/hooks/useClients";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DEFAULT_PAYMENT_METHODS, PaymentMethod } from "@/hooks/usePaymentTemplates";
import { invoiceSchema, invoiceItemSchema, validateInput } from "@/lib/validations";

export default function EditInvoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useInvoice(id || "");
  const { data: userSettings } = useSettings();
  const { data: businessSettings } = useBusinessSettings();
  const { data: clients } = useClients();
  const updateStatus = useUpdateInvoiceStatus();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPaid = invoice?.status === "paid";
  const isEditable = invoice?.status === "draft" || invoice?.status === "pending";

  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId: "",
    client: null,
    invoiceNumber: "",
    useCustomNumber: true,
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

  // Populate form when invoice loads
  useEffect(() => {
    if (invoice && clients) {
      const client = clients.find((c) => c.id === invoice.client_id) || null;
      
      // Parse payment methods from invoice or use defaults
      let paymentMethods = [...DEFAULT_PAYMENT_METHODS];
      if (invoice.payment_methods) {
        try {
          paymentMethods = invoice.payment_methods as unknown as PaymentMethod[];
        } catch {
          // Use defaults if parsing fails
        }
      }

      setFormData({
        clientId: invoice.client_id || "",
        client,
        invoiceNumber: invoice.invoice_number,
        useCustomNumber: true,
        internalTitle: "",
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date || "",
        dueOnReceipt: !invoice.due_date,
        status: invoice.status as "draft" | "pending",
        items: invoice.invoice_items?.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
        })) || [{ description: "", quantity: 1, unit_price: 0, amount: 0 }],
        notes: invoice.notes || "",
        footerNote: "",
        logoUrl: "",
        taxRate: invoice.tax_rate || 0,
        subtotal: invoice.subtotal,
        taxAmount: invoice.tax_amount || 0,
        total: invoice.total,
        invoiceNumberError: "",
        paymentDetails: {
          methods: paymentMethods,
          introText: invoice.payment_intro_text || "",
          outroText: invoice.payment_outro_text || "",
          reference: invoice.payment_reference || invoice.invoice_number,
        },
      });
    }
  }, [invoice, clients]);

  const handleSubmit = async () => {
    if (!id || !isEditable) return;

    setIsSubmitting(true);
    try {
      // Validate invoice data using the same schema as create
      const validatedInvoice = validateInput(invoiceSchema, {
        invoice_number: formData.invoiceNumber,
        client_id: formData.clientId || "",
        issue_date: formData.issueDate,
        due_date: formData.dueOnReceipt ? "" : formData.dueDate,
        status: formData.status,
        subtotal: formData.subtotal,
        tax_rate: formData.taxRate,
        tax_amount: formData.taxAmount,
        total: formData.total,
        notes: formData.notes || "",
        items: formData.items,
        internal_title: "",
        payment_intro_text: formData.paymentDetails.introText || "",
        payment_outro_text: formData.paymentDetails.outroText || "",
        payment_reference: formData.paymentDetails.reference || "",
      });

      // Validate each invoice item
      const validatedItems = formData.items.map((item) =>
        validateInput(invoiceItemSchema, item)
      );

      // Update invoice with validated data
      const { error: invoiceError } = await supabase
        .from("invoices")
        .update({
          client_id: validatedInvoice.client_id || null,
          invoice_number: validatedInvoice.invoice_number,
          status: validatedInvoice.status,
          issue_date: validatedInvoice.issue_date,
          due_date: validatedInvoice.due_date || null,
          subtotal: validatedInvoice.subtotal,
          tax_rate: validatedInvoice.tax_rate,
          tax_amount: validatedInvoice.tax_amount,
          total: validatedInvoice.total,
          notes: validatedInvoice.notes || null,
          payment_methods: JSON.parse(JSON.stringify(formData.paymentDetails.methods)),
          payment_intro_text: validatedInvoice.payment_intro_text || null,
          payment_outro_text: validatedInvoice.payment_outro_text || null,
          payment_reference: validatedInvoice.payment_reference || null,
        })
        .eq("id", id);

      if (invoiceError) throw invoiceError;

      // Delete existing items and insert new ones
      const { error: deleteError } = await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", id);

      if (deleteError) throw deleteError;

      if (validatedItems.length > 0) {
        const { error: itemsError } = await supabase
          .from("invoice_items")
          .insert(
            validatedItems.map((item) => ({
              invoice_id: id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              amount: item.amount,
            }))
          );

        if (itemsError) throw itemsError;
      }

      toast.success("Invoice updated successfully!");
      navigate("/invoices");
    } catch (error: any) {
      toast.error(error.message || "Failed to update invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[80vh]">
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </Layout>
    );
  }

  if (!invoice) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[80vh]">
          <p className="text-muted-foreground">Invoice not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/invoices")}
              className="p-2 hover:bg-muted rounded-sm transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-4xl text-foreground tracking-tight">
                {isPaid ? "VIEW INVOICE" : "EDIT INVOICE"}
              </h1>
              <p className="text-sm text-muted-foreground tracking-wide mt-1">
                {invoice.invoice_number}
              </p>
            </div>
          </div>

        </div>

        {/* Locked Warning for Paid Invoices */}
        {isPaid && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-full">
                <Lock className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  Invoice Locked
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This invoice has been marked as <strong>Paid</strong> and cannot be modified.
                  If you need to make corrections, consider creating an <strong>Adjustment</strong> or{" "}
                  <strong>Credit Note</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Column */}
          <div className={isPaid ? "opacity-60 pointer-events-none" : ""}>
            <InvoiceForm
              formData={formData}
              onFormChange={setFormData}
              onSubmit={handleSubmit}
              onCancel={() => navigate("/invoices")}
              isSubmitting={isSubmitting}
              submitLabel="SAVE CHANGES"
            />
          </div>

          {/* Preview Column */}
          <div>
            <InvoiceLivePreview formData={formData} userSettings={userSettings} businessSettings={businessSettings} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
