import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Invoice } from "./useInvoices";

export interface ClientFinancialStats {
  lifetimeRevenue: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueAmount: number;
  averageInvoiceValue: number;
  averageDaysToPayment: number;
  onTimePayments: number;
  latePayments: number;
  lastPaymentDate: string | null;
}

export function useClientInvoices(clientId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-invoices", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          clients (name, email, company),
          invoice_items (*)
        `)
        .eq("client_id", clientId)
        .order("issue_date", { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!user && !!clientId,
  });
}

export function useClientFinancialStats(clientId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-financial-stats", clientId],
    queryFn: async () => {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("client_id", clientId);

      if (error) throw error;

      const stats: ClientFinancialStats = {
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

      if (!invoices || invoices.length === 0) return stats;

      let totalDaysToPayment = 0;
      let paidInvoicesCount = 0;

      invoices.forEach((invoice) => {
        const total = Number(invoice.total);
        stats.lifetimeRevenue += total;

        if (invoice.status === "paid") {
          stats.totalPaid += total;
          paidInvoicesCount++;

          // Calculate days to payment (estimate based on due date)
          if (invoice.due_date && invoice.issue_date) {
            const issueDate = new Date(invoice.issue_date);
            const dueDate = new Date(invoice.due_date);
            const daysDiff = Math.ceil(
              (dueDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            totalDaysToPayment += daysDiff;

            // Track if payment was on time (paid by due date)
            const today = new Date();
            if (today <= dueDate) {
              stats.onTimePayments++;
            } else {
              stats.latePayments++;
            }
          }

          // Track last payment date
          if (
            !stats.lastPaymentDate ||
            new Date(invoice.updated_at) > new Date(stats.lastPaymentDate)
          ) {
            stats.lastPaymentDate = invoice.updated_at;
          }
        } else if (invoice.status === "pending") {
          stats.totalOutstanding += total;
        } else if (invoice.status === "overdue") {
          stats.totalOutstanding += total;
          stats.overdueAmount += total;
          stats.latePayments++;
        }
      });

      stats.averageInvoiceValue =
        invoices.length > 0 ? stats.lifetimeRevenue / invoices.length : 0;
      stats.averageDaysToPayment =
        paidInvoicesCount > 0
          ? Math.round(totalDaysToPayment / paidInvoicesCount)
          : 0;

      return stats;
    },
    enabled: !!user && !!clientId,
  });
}
