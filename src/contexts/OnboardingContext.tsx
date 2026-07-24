import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { useGeoCurrency } from "@/hooks/useGeoCurrency";

type OnboardingStep = "business" | "client" | "invoice" | "complete";

interface OnboardingData {
  businessName: string;
  currency: string;
  clientName: string;
  clientEmail: string;
  clientId?: string;
  invoiceId?: string;
}

interface OnboardingContextType {
  isOnboarding: boolean;
  currentStep: OnboardingStep;
  data: OnboardingData;
  setData: (data: Partial<OnboardingData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  startOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STEPS: OnboardingStep[] = ["business", "client", "invoice", "complete"];

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { currency: geoCurrency, isLoading: geoLoading } = useGeoCurrency();
  
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("business");
  const [data, setDataState] = useState<OnboardingData>({
    businessName: "",
    currency: "", // Will be set by geo detection
    clientName: "",
    clientEmail: "",
  });

  // Set geo-detected currency as default when available
  useEffect(() => {
    if (geoCurrency && !geoLoading && !data.currency) {
      setDataState(prev => ({ ...prev, currency: geoCurrency }));
    }
  }, [geoCurrency, geoLoading, data.currency]);

  // Check if user needs onboarding after settings load
  useEffect(() => {
    if (user && settings && !settingsLoading) {
      // Start onboarding for new users who haven't completed it
      if (!settings.onboarding_completed) {
        setIsOnboarding(true);
        // Pre-fill business name if exists
        if (settings.company_name) {
          setDataState(prev => ({ ...prev, businessName: settings.company_name || "" }));
        }
        // Use existing currency setting if available
        if (settings.default_currency) {
          setDataState(prev => ({ ...prev, currency: settings.default_currency || "" }));
        }
      }
    }
  }, [user, settings, settingsLoading]);

  const setData = (newData: Partial<OnboardingData>) => {
    setDataState(prev => ({ ...prev, ...newData }));
  };

  const nextStep = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  const skipOnboarding = async () => {
    await updateSettings.mutateAsync({ 
      onboarding_completed: true 
    });
    setIsOnboarding(false);
    setCurrentStep("business");
  };

  const completeOnboarding = async () => {
    await updateSettings.mutateAsync({ 
      onboarding_completed: true,
      company_name: data.businessName || undefined,
      default_currency: data.currency,
    });
    setIsOnboarding(false);
    setCurrentStep("business");
  };

  const startOnboarding = () => {
    setIsOnboarding(true);
    setCurrentStep("business");
  };

  return (
    <OnboardingContext.Provider value={{
      isOnboarding,
      currentStep,
      data,
      setData,
      nextStep,
      prevStep,
      skipOnboarding,
      completeOnboarding,
      startOnboarding,
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
