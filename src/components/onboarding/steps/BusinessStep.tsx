import { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CurrencyCombobox } from "@/components/ui/currency-combobox";

export function BusinessStep() {
  const { data, setData, nextStep } = useOnboarding();
  const [businessName, setBusinessName] = useState(data.businessName);
  const [currency, setCurrency] = useState(data.currency || "USD");

  // Sync with context when geo-detected currency arrives
  useEffect(() => {
    if (data.currency && data.currency !== currency) {
      setCurrency(data.currency);
    }
  }, [data.currency]);

  const handleContinue = () => {
    setData({ businessName, currency });
    nextStep();
  };

  const canContinue = businessName.trim().length > 0;

  return (
    <div className="space-y-6 md:space-y-10">
      <div className="text-center">
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground tracking-tight mb-3 md:mb-4">
          LET'S GET STARTED
        </h1>
        <p className="text-muted-foreground text-xs md:text-sm max-w-md mx-auto">
          First, tell us a bit about your business so we can personalise your invoices.
        </p>
      </div>

      <div className="bg-card border border-border p-6 md:p-8 lg:p-10 space-y-4 md:space-y-6 max-w-md mx-auto">
        <div className="space-y-2">
          <Label className="text-[10px] md:text-xs text-muted-foreground tracking-wide uppercase">
            BUSINESS NAME
          </Label>
          <Input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Your business or your name"
            className="h-10 md:h-12 bg-background border-border text-foreground text-sm"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] md:text-xs text-muted-foreground tracking-wide uppercase">
            DEFAULT CURRENCY
          </Label>
          <CurrencyCombobox
            value={currency}
            onValueChange={setCurrency}
            className="z-[200]"
          />
        </div>

        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          className="w-full h-10 md:h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs md:text-sm tracking-wide mt-2"
        >
          CONTINUE
        </Button>
      </div>
    </div>
  );
}
