import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Save, Trash2 } from "lucide-react";
import {
  usePaymentTemplates,
  useCreatePaymentTemplate,
  useDeletePaymentTemplate,
  PaymentMethod,
  DEFAULT_PAYMENT_METHODS,
} from "@/hooks/usePaymentTemplates";

export interface PaymentDetailsData {
  methods: PaymentMethod[];
  introText: string;
  outroText: string;
  reference: string;
}

interface PaymentDetailsSectionProps {
  data: PaymentDetailsData;
  onChange: (data: PaymentDetailsData) => void;
  invoiceNumber: string;
}

export function PaymentDetailsSection({
  data,
  onChange,
  invoiceNumber,
}: PaymentDetailsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  
  const { data: templates } = usePaymentTemplates();
  const createTemplate = useCreatePaymentTemplate();
  const deleteTemplate = useDeletePaymentTemplate();

  // Auto-insert invoice number as reference on mount
  useEffect(() => {
    if (invoiceNumber && !data.reference) {
      onChange({ ...data, reference: invoiceNumber });
    }
  }, [invoiceNumber]);

  // Update reference fields when the reference changes
  useEffect(() => {
    if (data.reference) {
      const updatedMethods = data.methods.map((method) => ({
        ...method,
        fields: method.fields.map((field) =>
          field.key === "reference" ? { ...field, value: data.reference } : field
        ),
      }));
      
      // Only update if there's an actual change to prevent infinite loops
      const hasChange = JSON.stringify(updatedMethods) !== JSON.stringify(data.methods);
      if (hasChange) {
        onChange({ ...data, methods: updatedMethods });
      }
    }
  }, [data.reference]);

  const toggleMethod = (type: PaymentMethod["type"]) => {
    const updatedMethods = data.methods.map((method) =>
      method.type === type ? { ...method, enabled: !method.enabled } : method
    );
    onChange({ ...data, methods: updatedMethods });
  };

  const updateMethodField = (
    methodType: PaymentMethod["type"],
    fieldKey: string,
    value: string
  ) => {
    const updatedMethods = data.methods.map((method) =>
      method.type === methodType
        ? {
            ...method,
            fields: method.fields.map((field) =>
              field.key === fieldKey ? { ...field, value } : field
            ),
          }
        : method
    );
    onChange({ ...data, methods: updatedMethods });
  };

  const loadTemplate = (templateId: string) => {
    const template = templates?.find((t) => t.id === templateId);
    if (template) {
      // Merge template methods with defaults to ensure all method types exist
      const mergedMethods = DEFAULT_PAYMENT_METHODS.map((defaultMethod) => {
        const templateMethod = template.methods.find(
          (m) => m.type === defaultMethod.type
        );
        if (templateMethod) {
          // Update reference fields with current invoice number
          return {
            ...templateMethod,
            fields: templateMethod.fields.map((field) =>
              field.key === "reference" && data.reference
                ? { ...field, value: data.reference }
                : field
            ),
          };
        }
        return defaultMethod;
      });

      onChange({
        methods: mergedMethods,
        introText: template.intro_text || "",
        outroText: template.outro_text || "",
        reference: data.reference,
      });
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    
    await createTemplate.mutateAsync({
      name: templateName,
      methods: data.methods,
      intro_text: data.introText,
      outro_text: data.outroText,
      is_default: false,
    });
    
    setTemplateName("");
    setShowSaveTemplate(false);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    await deleteTemplate.mutateAsync(templateId);
  };

  const enabledMethods = data.methods.filter((m) => m.enabled);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border border-border rounded-sm">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <Label className="text-xs text-muted-foreground tracking-wide uppercase cursor-pointer">
              PAYMENT DETAILS
            </Label>
            {enabledMethods.length > 0 && (
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {enabledMethods.length} method{enabledMethods.length > 1 ? "s" : ""} enabled
              </span>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </CollapsibleTrigger>

        <CollapsibleContent className="px-4 pb-4 space-y-4">
          {/* Template Selection */}
          {templates && templates.length > 0 && (
            <div className="flex items-center gap-2">
              <Select onValueChange={loadTemplate}>
                <SelectTrigger className="h-9 bg-background border-border text-xs flex-1">
                  <SelectValue placeholder="Load from template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{template.name}</span>
                        {template.is_default && (
                          <span className="text-[10px] text-muted-foreground ml-2">
                            (default)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {templates.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    templates[0] && handleDeleteTemplate(templates[0].id)
                  }
                  className="h-9 px-2 text-muted-foreground hover:text-destructive"
                  title="Delete first template"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}

          {/* Intro Text */}
          <div className="space-y-2">
            <Label className="text-[10px] text-muted-foreground tracking-wide uppercase">
              INTRO TEXT
            </Label>
            <Textarea
              value={data.introText}
              onChange={(e) => onChange({ ...data, introText: e.target.value })}
              placeholder="Please transfer the total amount using the details below."
              className="bg-background border-border resize-none text-xs min-h-[60px]"
              rows={2}
            />
          </div>

          {/* Payment Reference */}
          <div className="space-y-2">
            <Label className="text-[10px] text-muted-foreground tracking-wide uppercase">
              PAYMENT REFERENCE
            </Label>
            <Input
              value={data.reference}
              onChange={(e) => onChange({ ...data, reference: e.target.value })}
              placeholder="Invoice number as reference"
              className="h-9 bg-background border-border text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              Auto-filled with invoice number. Applies to all payment methods.
            </p>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <Label className="text-[10px] text-muted-foreground tracking-wide uppercase">
              PAYMENT METHODS
            </Label>

            {data.methods.map((method) => (
              <div
                key={method.type}
                className="border border-border rounded-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleMethod(method.type)}
                  className={`flex items-center justify-between w-full px-3 py-2 text-left transition-colors ${
                    method.enabled
                      ? "bg-primary/5 border-b border-border"
                      : "bg-background hover:bg-muted/50"
                  }`}
                >
                  <span className="text-xs font-medium uppercase tracking-wide">
                    {method.label}
                  </span>
                  <div
                    className={`w-8 h-4 rounded-full transition-colors ${
                      method.enabled ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-background mt-0.5 transition-transform ${
                        method.enabled ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                </button>

                {method.enabled && (
                  <div className="p-3 space-y-3 bg-background">
                    {method.fields
                      .filter((f) => f.key !== "reference")
                      .map((field) => (
                        <div key={field.key} className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground uppercase">
                            {field.label}
                          </Label>
                          {field.key === "instructions" ? (
                            <Textarea
                              value={field.value}
                              onChange={(e) =>
                                updateMethodField(
                                  method.type,
                                  field.key,
                                  e.target.value
                                )
                              }
                              className="bg-background border-border resize-none text-xs min-h-[60px]"
                              rows={2}
                            />
                          ) : (
                            <Input
                              value={field.value}
                              onChange={(e) =>
                                updateMethodField(
                                  method.type,
                                  field.key,
                                  e.target.value
                                )
                              }
                              className="h-9 bg-background border-border text-xs"
                            />
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Outro Text */}
          <div className="space-y-2">
            <Label className="text-[10px] text-muted-foreground tracking-wide uppercase">
              OUTRO TEXT
            </Label>
            <Textarea
              value={data.outroText}
              onChange={(e) => onChange({ ...data, outroText: e.target.value })}
              placeholder="Use the invoice number as the payment reference."
              className="bg-background border-border resize-none text-xs min-h-[60px]"
              rows={2}
            />
          </div>

          {/* Save as Template */}
          <div className="pt-2 border-t border-border">
            {showSaveTemplate ? (
              <div className="flex items-center gap-2">
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template name..."
                  className="h-9 bg-background border-border text-xs flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSaveTemplate(false)}
                  className="h-9 text-xs"
                >
                  CANCEL
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveTemplate}
                  disabled={!templateName.trim() || createTemplate.isPending}
                  className="h-9 text-xs"
                >
                  <Save className="w-3 h-3 mr-1" />
                  SAVE
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSaveTemplate(true)}
                className="h-8 text-xs w-full"
              >
                SAVE AS TEMPLATE
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
