import { useState, useEffect } from "react";

// Map of country codes to currencies
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  // Australia & Oceania
  AU: "AUD",
  NZ: "NZD",
  
  // North America
  US: "USD",
  CA: "CAD",
  
  // Europe
  GB: "GBP",
  IE: "EUR",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  BE: "EUR",
  AT: "EUR",
  PT: "EUR",
  FI: "EUR",
  GR: "EUR",
  LU: "EUR",
  CH: "CHF",
  
  // Asia
  JP: "JPY",
  SG: "SGD",
  HK: "HKD",
  CN: "USD", // Default to USD for China
  IN: "USD", // Default to USD for India (INR not in our list)
  KR: "USD", // Default to USD for Korea (KRW not in our list)
};

const DEFAULT_CURRENCY = "USD";

export function useGeoCurrency() {
  const [currency, setCurrency] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectCurrency = async () => {
      try {
        // Use a free IP geolocation API
        const response = await fetch("https://ipapi.co/json/", {
          signal: AbortSignal.timeout(3000), // 3s timeout
        });
        
        if (!response.ok) throw new Error("Geo lookup failed");
        
        const data = await response.json();
        const countryCode = data.country_code;
        
        if (countryCode && COUNTRY_CURRENCY_MAP[countryCode]) {
          setCurrency(COUNTRY_CURRENCY_MAP[countryCode]);
        } else {
          setCurrency(DEFAULT_CURRENCY);
        }
      } catch {
        // Fallback to USD on error
        setCurrency(DEFAULT_CURRENCY);
      } finally {
        setIsLoading(false);
      }
    };

    detectCurrency();
  }, []);

  return { currency, isLoading };
}
