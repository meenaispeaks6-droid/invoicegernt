import { useOnboarding } from "@/contexts/OnboardingContext";
import { cn } from "@/lib/utils";
import { BusinessStep } from "./steps/BusinessStep";
import { ClientStep } from "./steps/ClientStep";
import { InvoiceStep } from "./steps/InvoiceStep";
import { CompleteStep } from "./steps/CompleteStep";
import { ProgressDots } from "./ProgressDots";

export function OnboardingOverlay() {
  const { isOnboarding, currentStep, skipOnboarding } = useOnboarding();

  if (!isOnboarding) return null;

  const renderStep = () => {
    switch (currentStep) {
      case "business":
        return <BusinessStep />;
      case "client":
        return <ClientStep />;
      case "invoice":
        return <InvoiceStep />;
      case "complete":
        return <CompleteStep />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col min-h-screen">
      {/* Header - centered logo */}
      <header className="flex items-center justify-center px-4 md:px-6 py-4 border-b border-border">
        <h1 className="font-display text-lg md:text-xl text-foreground tracking-tight">
          BILLIE
        </h1>
      </header>

      {/* Main content */}
      <main
        className={cn(
          "flex-1 flex flex-col items-center justify-center px-4 overflow-y-auto",
          // The final step must never clip CTAs; reduce vertical padding.
          currentStep === "complete" ? "py-4 md:py-6" : "py-6 md:py-12"
        )}
      >
        <div className="w-full max-w-2xl">
          {/* Step content */}
          {renderStep()}

          {/* Skip setup link - below form, only on non-complete steps */}
          {currentStep !== "complete" && (
            <div className="mt-6 md:mt-8 text-center">
              <button
                onClick={skipOnboarding}
                className="text-muted-foreground hover:text-foreground transition-colors text-[10px] md:text-xs tracking-wider uppercase"
              >
                SKIP SETUP
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer - minimal dots only on non-complete steps */}
      {currentStep !== "complete" && (
        <footer className="px-4 md:px-6 py-4 md:py-6">
          <ProgressDots currentStep={currentStep} />
        </footer>
      )}
    </div>
  );
}
