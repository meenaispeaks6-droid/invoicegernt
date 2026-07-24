import { PaymentMethod } from "@/hooks/usePaymentTemplates";

interface PaymentDetailsDisplayProps {
  methods: PaymentMethod[];
  introText?: string;
  outroText?: string;
  reference?: string;
}

export function PaymentDetailsDisplay({
  methods,
  introText,
  outroText,
  reference,
}: PaymentDetailsDisplayProps) {
  const enabledMethods = methods.filter((m) => m.enabled);

  if (enabledMethods.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 pt-4 border-t border-gray-200">
      <p className="text-[10px] text-gray-400 tracking-wider uppercase mb-2">
        Payment Details
      </p>

      {introText && (
        <p className="text-[10px] text-gray-600 mb-3">{introText}</p>
      )}

      <div className="space-y-3">
        {enabledMethods.map((method) => (
          <div key={method.type} className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
              {method.label}
            </p>
            <div className="text-[10px] text-gray-600 space-y-0.5">
              {method.fields
                .filter((f) => f.value && f.value.trim() !== "")
                .map((field) => (
                  <div key={field.key} className="flex">
                    <span className="text-gray-400 w-24 flex-shrink-0">
                      {field.label}:
                    </span>
                    <span className="font-mono">
                      {field.key === "reference" && reference
                        ? reference
                        : field.value}
                    </span>
                  </div>
                ))}
              {reference &&
                !method.fields.some(
                  (f) => f.key === "reference" && f.value
                ) && (
                  <div className="flex">
                    <span className="text-gray-400 w-24 flex-shrink-0">
                      Reference:
                    </span>
                    <span className="font-mono">{reference}</span>
                  </div>
                )}
            </div>
          </div>
        ))}
      </div>

      {outroText && (
        <p className="text-[10px] text-gray-500 mt-3 italic">{outroText}</p>
      )}
    </div>
  );
}
