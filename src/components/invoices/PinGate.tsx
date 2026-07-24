import { useState, useRef, useEffect } from "react";
import { Loader2, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PinGateProps {
  invoiceNumber: string;
  onSubmit: (pin: string) => Promise<void>;
  error: string | null;
  isLoading: boolean;
}

export function PinGate({ invoiceNumber, onSubmit, error, isLoading }: PinGateProps) {
  const [pin, setPin] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  // Clear PIN inputs when an error comes back so the user can retry cleanly.
  useEffect(() => {
    if (error && !isLoading) {
      setPin(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  }, [error, isLoading]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newPin = [...pin];
    
    for (let i = 0; i < pastedData.length; i++) {
      newPin[i] = pastedData[i];
    }
    
    setPin(newPin);
    
    // Focus the next empty input or the last one
    const nextEmptyIndex = newPin.findIndex(d => !d);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = () => {
    const fullPin = pin.join("");
    if (fullPin.length === 6) {
      onSubmit(fullPin);
    }
  };

  const isComplete = pin.every(d => d !== "");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-display tracking-wider text-foreground mb-2">
            PROTECTED INVOICE
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit PIN to view
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {invoiceNumber}
          </p>
        </div>

        {/* PIN Input */}
        <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isLoading}
              className="w-11 h-14 text-center text-xl font-mono bg-background border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
              aria-label={`PIN digit ${index + 1}`}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center justify-center gap-2 text-destructive text-sm mb-4">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!isComplete || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              VERIFYING...
            </>
          ) : (
            "VIEW INVOICE"
          )}
        </Button>

        {/* Help Text */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          The PIN was provided by the sender.
          <br />
          Contact them if you don't have it.
        </p>
      </div>
    </div>
  );
}
