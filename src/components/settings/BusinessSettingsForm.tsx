import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyCombobox } from "@/components/ui/currency-combobox";
import {
  useBusinessSettings,
  useUpdateBusinessSettings,
  type UpdateBusinessSettings,
} from "@/hooks/useBusinessSettings";
import { LogoUploadField } from "@/components/invoices/LogoUploadField";

export function BusinessSettingsForm() {
  const { data: business, isLoading } = useBusinessSettings();
  const update = useUpdateBusinessSettings();

  const [form, setForm] = useState<UpdateBusinessSettings>({});

  useEffect(() => {
    if (business) {
      setForm({
        company_name: business.company_name ?? "",
        company_email: business.company_email ?? "",
        company_phone: business.company_phone ?? "",
        logo_url: business.logo_url ?? "",
        address_line1: business.address_line1 ?? "",
        address_line2: business.address_line2 ?? "",
        city: business.city ?? "",
        state: business.state ?? "",
        postal_code: business.postal_code ?? "",
        country: business.country ?? "",
        tax_id: business.tax_id ?? "",
        default_payment_terms: business.default_payment_terms ?? "Net 30",
        payment_instructions: business.payment_instructions ?? "",
        invoice_number_prefix: business.invoice_number_prefix ?? "INV-",
        default_currency: business.default_currency ?? "USD",
      });
    }
  }, [business]);

  const set = <K extends keyof UpdateBusinessSettings>(key: K, value: UpdateBusinessSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    await update.mutateAsync(form);
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading business settings...</div>;
  }

  const inputCls = "h-10 md:h-12 bg-card border-border text-foreground text-sm";

  return (
    <div className="max-w-3xl space-y-8 md:space-y-10">
      <div>
        <h2 className="section-header mb-6 md:mb-8">COMPANY</h2>
        <div className="space-y-4 md:space-y-6">
          <div className="space-y-2">
            <Label className="form-label">COMPANY NAME</Label>
            <Input
              value={form.company_name ?? ""}
              onChange={(e) => set("company_name", e.target.value)}
              placeholder="Your business name"
              className={inputCls}
            />
          </div>

          <div className="space-y-2">
            <Label className="form-label">COMPANY LOGO</Label>
            <LogoUploadField
              logoUrl={form.logo_url ?? ""}
              onLogoChange={(url) => set("logo_url", url)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <Label className="form-label">EMAIL</Label>
              <Input
                type="email"
                value={form.company_email ?? ""}
                onChange={(e) => set("company_email", e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="space-y-2">
              <Label className="form-label">PHONE</Label>
              <Input
                value={form.company_phone ?? ""}
                onChange={(e) => set("company_phone", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="form-label">TAX ID / VAT NUMBER</Label>
            <Input
              value={form.tax_id ?? ""}
              onChange={(e) => set("tax_id", e.target.value)}
              placeholder="Optional"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="section-header mb-6 md:mb-8">ADDRESS</h2>
        <div className="space-y-4 md:space-y-6">
          <div className="space-y-2">
            <Label className="form-label">STREET ADDRESS</Label>
            <Input
              value={form.address_line1 ?? ""}
              onChange={(e) => set("address_line1", e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="space-y-2">
            <Label className="form-label">ADDRESS LINE 2</Label>
            <Input
              value={form.address_line2 ?? ""}
              onChange={(e) => set("address_line2", e.target.value)}
              placeholder="Optional"
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="space-y-2">
              <Label className="form-label">CITY</Label>
              <Input
                value={form.city ?? ""}
                onChange={(e) => set("city", e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="space-y-2">
              <Label className="form-label">STATE / PROVINCE</Label>
              <Input
                value={form.state ?? ""}
                onChange={(e) => set("state", e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="space-y-2">
              <Label className="form-label">ZIP / POSTAL</Label>
              <Input
                value={form.postal_code ?? ""}
                onChange={(e) => set("postal_code", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="form-label">COUNTRY</Label>
            <Input
              value={form.country ?? ""}
              onChange={(e) => set("country", e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="section-header mb-6 md:mb-8">INVOICING DEFAULTS</h2>
        <div className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <Label className="form-label">INVOICE NUMBER PREFIX</Label>
              <Input
                value={form.invoice_number_prefix ?? ""}
                onChange={(e) => set("invoice_number_prefix", e.target.value)}
                placeholder="INV-"
                className={inputCls}
              />
              <p className="form-helper">
                Invoices will be numbered {(form.invoice_number_prefix || "INV-")}0001, {(form.invoice_number_prefix || "INV-")}0002, etc.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="form-label">DEFAULT PAYMENT TERMS</Label>
              <Input
                value={form.default_payment_terms ?? ""}
                onChange={(e) => set("default_payment_terms", e.target.value)}
                placeholder="Net 30"
                className={inputCls}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="form-label">DEFAULT CURRENCY</Label>
            <CurrencyCombobox
              value={form.default_currency ?? "USD"}
              onValueChange={(v) => set("default_currency", v)}
            />
          </div>

          <div className="space-y-2">
            <Label className="form-label">PAYMENT INSTRUCTIONS</Label>
            <Textarea
              value={form.payment_instructions ?? ""}
              onChange={(e) => set("payment_instructions", e.target.value)}
              placeholder="Bank account, IBAN/SWIFT, PayPal, or other payment details shown at the bottom of every invoice."
              rows={5}
              className="bg-card border-border text-foreground text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 md:gap-4 pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={update.isPending}
          onClick={() => business && setForm({ ...business })}
          className="h-10 md:h-11 px-6 border-border hover:bg-muted btn-text w-full sm:w-auto"
        >
          CANCEL
        </Button>
        <Button
          onClick={handleSave}
          disabled={update.isPending}
          className="h-10 md:h-11 px-6 bg-billie-green hover:bg-billie-green/90 text-white btn-text w-full sm:w-auto"
        >
          {update.isPending ? "SAVING..." : "SAVE CHANGES"}
        </Button>
      </div>
    </div>
  );
}