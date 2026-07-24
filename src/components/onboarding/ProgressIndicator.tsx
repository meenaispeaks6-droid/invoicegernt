import { cn } from "@/lib/utils";

type OnboardingStep = "business" | "client" | "invoice" | "complete";

const STEPS = [
  { id: "business", label: "BUSINESS" },
  { id: "client", label: "CLIENT" },
  { id: "invoice", label: "INVOICE" },
];

interface ProgressIndicatorProps {
  currentStep: OnboardingStep;
}

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="flex items-center justify-center gap-4">
      {STEPS.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;

        return (
          <div key={step.id} className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                  isActive && "bg-primary text-primary-foreground",
                  isCompleted && "bg-primary/20 text-primary",
                  !isActive && !isCompleted && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? "✓" : index + 1}
              </div>
              <span
                className={cn(
                  "text-xs tracking-wider transition-colors",
                  isActive && "text-foreground",
                  !isActive && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "w-12 h-px transition-colors",
                  index < currentIndex ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
