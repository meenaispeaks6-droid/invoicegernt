import { useState } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useCreateClient } from "@/hooks/useClients";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ClientStep() {
  const { data, setData, nextStep, prevStep } = useOnboarding();
  const createClient = useCreateClient();
  
  const [clientName, setClientName] = useState(data.clientName);
  const [clientEmail, setClientEmail] = useState(data.clientEmail);
  const [isCreating, setIsCreating] = useState(false);

  const handleContinue = async () => {
    if (!clientName.trim()) return;

    setIsCreating(true);
    try {
      const client = await createClient.mutateAsync({
        name: clientName.trim(),
        email: clientEmail.trim() || undefined,
      });
      
      setData({ 
        clientName, 
        clientEmail, 
        clientId: client.id 
      });
      
      nextStep();
    } catch {
      // Error toast is surfaced by the useCreateClient mutation's onError handler.
    } finally {
      setIsCreating(false);
    }
  };

  const canContinue = clientName.trim().length > 0;

  return (
    <div className="space-y-6 md:space-y-10">
      <div className="text-center">
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground tracking-tight mb-3 md:mb-4">
          ADD YOUR FIRST CLIENT
        </h1>
        <p className="text-muted-foreground text-xs md:text-sm max-w-md mx-auto">
          Who are you invoicing? You can add more details later.
        </p>
      </div>

      <div className="bg-card border border-border p-6 md:p-8 lg:p-10 space-y-4 md:space-y-6 max-w-md mx-auto">
        <div className="space-y-2">
          <Label className="text-[10px] md:text-xs text-muted-foreground tracking-wide uppercase">
            CLIENT NAME
          </Label>
          <Input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Company or person's name"
            className="h-10 md:h-12 bg-background border-border text-foreground text-sm"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] md:text-xs text-muted-foreground tracking-wide uppercase">
            EMAIL ADDRESS <span className="text-muted-foreground/60">(OPTIONAL)</span>
          </Label>
          <Input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="client@example.com"
            className="h-10 md:h-12 bg-background border-border text-foreground text-sm"
          />
        </div>

        <div className="flex gap-3 mt-2">
          <Button
            variant="outline"
            onClick={prevStep}
            className="flex-1 h-10 md:h-12 border-border text-foreground hover:bg-muted text-xs md:text-sm tracking-wide"
          >
            BACK
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!canContinue || isCreating}
            className="flex-1 h-10 md:h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs md:text-sm tracking-wide"
          >
            {isCreating ? "CREATING..." : "CONTINUE"}
          </Button>
        </div>
      </div>
    </div>
  );
}
