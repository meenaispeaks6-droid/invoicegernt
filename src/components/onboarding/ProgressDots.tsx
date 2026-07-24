import { cn } from "@/lib/utils";

type OnboardingStep = "business" | "client" | "invoice" | "complete";

const STEPS: OnboardingStep[] = ["business", "client", "invoice"];

interface ProgressDotsProps {
  currentStep: OnboardingStep;
}

export function ProgressDots({ currentStep }: ProgressDotsProps) {
  const currentIndex = STEPS.indexOf(currentStep);

  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;

        return (
          <div
            key={step}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              isActive && "bg-primary",
              isCompleted && "bg-primary/50",
              !isActive && !isCompleted && "bg-muted-foreground/30"
            )}
          />
        );
      })}
    </div>
  );
}
