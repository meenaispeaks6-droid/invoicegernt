import { useState, useCallback } from "react";
import { Invoice } from "@/hooks/useInvoices";

export function useInvoiceOverlay() {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openOverlay = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsOpen(true);
  }, []);

  const closeOverlay = useCallback(() => {
    setIsOpen(false);
    // Delay clearing selected invoice to allow exit animation
    setTimeout(() => setSelectedInvoice(null), 300);
  }, []);

  const navigateToInvoice = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
  }, []);

  return {
    selectedInvoice,
    isOpen,
    openOverlay,
    closeOverlay,
    navigateToInvoice,
  };
}
