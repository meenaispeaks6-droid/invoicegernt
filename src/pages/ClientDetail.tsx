import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useClient } from "@/hooks/useClients";
import { useClientInvoices, useClientFinancialStats } from "@/hooks/useClientInvoices";
import { ClientHeader } from "@/components/clients/ClientHeader";
import { FinancialSummary } from "@/components/clients/FinancialSummary";
import { InvoiceHistoryTable } from "@/components/clients/InvoiceHistoryTable";
import { PaymentBehaviorInsights } from "@/components/clients/PaymentBehaviorInsights";
import { ClientNotes } from "@/components/clients/ClientNotes";
import { Loader2 } from "lucide-react";

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: client, isLoading: clientLoading } = useClient(id || "");
  const { data: invoices, isLoading: invoicesLoading } = useClientInvoices(id || "");
  const { data: stats, isLoading: statsLoading } = useClientFinancialStats(id || "");

  if (!id) {
    navigate("/clients");
    return null;
  }

  if (clientLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!client) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Client not found</p>
          <button
            onClick={() => navigate("/clients")}
            className="mt-4 text-primary hover:text-primary/80"
          >
            Back to Clients
          </button>
        </div>
      </Layout>
    );
  }

  const defaultStats = {
    lifetimeRevenue: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    overdueAmount: 0,
    averageInvoiceValue: 0,
    averageDaysToPayment: 0,
    onTimePayments: 0,
    latePayments: 0,
    lastPaymentDate: null,
  };

  return (
    <Layout>
      {/* Client Header with integrated actions */}
      <ClientHeader client={client} stats={stats || defaultStats} />

      {/* Financial Summary - unified grid */}
      <FinancialSummary
        stats={stats || defaultStats}
        isLoading={statsLoading}
      />

      {/* Payment Behavior Insights - alternating background */}
      <PaymentBehaviorInsights stats={stats || defaultStats} />

      {/* Client Notes - unified section */}
      <ClientNotes client={client} />

      {/* Invoice History Table - unified section */}
      <InvoiceHistoryTable
        invoices={invoices || []}
        isLoading={invoicesLoading}
      />

      {/* Bottom spacing */}
      <div className="pb-5" />
    </Layout>
  );
}
