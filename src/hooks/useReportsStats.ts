import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  parseISO, 
  isWithinInterval, 
  subMonths, 
  startOfMonth, 
  endOfMonth,
  eachMonthOfInterval,
  format,
  startOfYear,
  endOfYear
} from "date-fns";
import { deriveInvoiceStatus } from "@/lib/invoiceStatus";

export interface ReportsStats {
  grossRevenue: number;
  netProfit: number;
  grossRevenueChange: number;
  netProfitChange: number;
  overdueAmount: number;
  overdueCount: number;
  totalClients: number;
}

export interface CashFlowDataPoint {
  name: string;
  inflow: number;
  outflow: number;
}

export interface ProfitMarginDataPoint {
  name: string;
  profit: number;
  cost: number;
}

export interface OverdueTrendDataPoint {
  name: string;
  amount: number;
  count: number;
}

export interface ClientRevenueItem {
  name: string;
  revenue: number;
  percentage: number;
}

export function useReportsStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["reports-stats", user?.id],
    queryFn: async (): Promise<ReportsStats> => {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("*");

      if (error) throw error;

      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("id");

      if (clientsError) throw clientsError;

      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const thisMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));

      let grossRevenue = 0;
      let lastMonthGrossRevenue = 0;
      let overdueAmount = 0;
      let overdueCount = 0;

      invoices?.forEach((invoice) => {
        const total = Number(invoice.total);
        const updatedAt = invoice.updated_at ? parseISO(invoice.updated_at) : null;
        
        const status = deriveInvoiceStatus({
          status: invoice.status,
          due_date: invoice.due_date,
          viewed_at: invoice.viewed_at,
        });

        // Gross revenue from paid invoices
        if (invoice.status === "paid") {
          grossRevenue += total;
          
          // Calculate last month's revenue for comparison
          if (updatedAt && isWithinInterval(updatedAt, { start: lastMonthStart, end: lastMonthEnd })) {
            lastMonthGrossRevenue += total;
          }
        }

        // Overdue tracking
        if (status === "overdue") {
          overdueAmount += total;
          overdueCount++;
        }
      });

      // Calculate this month's paid revenue for comparison
      let thisMonthGrossRevenue = 0;
      invoices?.forEach((invoice) => {
        if (invoice.status === "paid") {
          const updatedAt = invoice.updated_at ? parseISO(invoice.updated_at) : null;
          if (updatedAt && isWithinInterval(updatedAt, { start: thisMonthStart, end: thisMonthEnd })) {
            thisMonthGrossRevenue += Number(invoice.total);
          }
        }
      });

      // Simplified net profit (85% of gross as estimate)
      const netProfit = grossRevenue * 0.85;
      const lastMonthNetProfit = lastMonthGrossRevenue * 0.85;

      // Calculate percentage changes
      const grossRevenueChange = lastMonthGrossRevenue > 0 
        ? ((thisMonthGrossRevenue - lastMonthGrossRevenue) / lastMonthGrossRevenue) * 100
        : 0;
      
      const netProfitChange = lastMonthNetProfit > 0
        ? (((thisMonthGrossRevenue * 0.85) - lastMonthNetProfit) / lastMonthNetProfit) * 100
        : 0;

      return {
        grossRevenue,
        netProfit,
        grossRevenueChange: Math.round(grossRevenueChange * 10) / 10,
        netProfitChange: Math.round(netProfitChange * 10) / 10,
        overdueAmount,
        overdueCount,
        totalClients: clients?.length || 0,
      };
    },
    enabled: !!user,
  });
}

export function useCashFlowData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["cash-flow-data", user?.id],
    queryFn: async (): Promise<CashFlowDataPoint[]> => {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("*");

      if (error) throw error;

      const now = new Date();
      const yearStart = startOfYear(now);
      const yearEnd = endOfYear(now);
      const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

      const cashFlowByMonth: Record<string, { inflow: number; outflow: number }> = {};
      months.forEach(month => {
        const monthName = format(month, "MMM").toUpperCase();
        cashFlowByMonth[monthName] = { inflow: 0, outflow: 0 };
      });

      invoices?.forEach((invoice) => {
        const updatedAt = invoice.updated_at ? parseISO(invoice.updated_at) : null;
        
        if (invoice.status === "paid" && updatedAt && isWithinInterval(updatedAt, { start: yearStart, end: yearEnd })) {
          const monthName = format(updatedAt, "MMM").toUpperCase();
          cashFlowByMonth[monthName].inflow += Number(invoice.total);
        }
      });

      return months.map(month => {
        const monthName = format(month, "MMM").toUpperCase();
        return {
          name: monthName,
          inflow: cashFlowByMonth[monthName].inflow,
          outflow: cashFlowByMonth[monthName].inflow * 0.15, // Estimated costs at 15%
        };
      });
    },
    enabled: !!user,
  });
}

export function useProfitMarginData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profit-margin-data", user?.id],
    queryFn: async (): Promise<{ data: ProfitMarginDataPoint[]; highestMonth: string; lowestMonth: string }> => {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("*");

      if (error) throw error;

      const now = new Date();
      const yearStart = startOfYear(now);
      const yearEnd = endOfYear(now);
      const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

      const profitByMonth: Record<string, number> = {};
      months.forEach(month => {
        const monthName = format(month, "MMM").toUpperCase();
        profitByMonth[monthName] = 0;
      });

      invoices?.forEach((invoice) => {
        const updatedAt = invoice.updated_at ? parseISO(invoice.updated_at) : null;
        
        if (invoice.status === "paid" && updatedAt && isWithinInterval(updatedAt, { start: yearStart, end: yearEnd })) {
          const monthName = format(updatedAt, "MMM").toUpperCase();
          profitByMonth[monthName] += Number(invoice.total);
        }
      });

      const data = months.map(month => {
        const monthName = format(month, "MMM").toUpperCase();
        const revenue = profitByMonth[monthName];
        return {
          name: monthName,
          profit: revenue * 0.85,
          cost: revenue * 0.15,
        };
      });

      // Find highest and lowest months with actual data
      const monthsWithData = data.filter(d => d.profit > 0);
      let highestMonth = "N/A";
      let lowestMonth = "N/A";

      if (monthsWithData.length > 0) {
        const highest = monthsWithData.reduce((prev, curr) => prev.profit > curr.profit ? prev : curr);
        const lowest = monthsWithData.reduce((prev, curr) => prev.profit < curr.profit ? prev : curr);
        highestMonth = `${highest.name} ($${(highest.profit / 1000).toFixed(1)}k)`;
        lowestMonth = `${lowest.name} ($${(lowest.profit / 1000).toFixed(1)}k)`;
      }

      return { data, highestMonth, lowestMonth };
    },
    enabled: !!user,
  });
}

export function useOverdueTrends() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["overdue-trends", user?.id],
    queryFn: async (): Promise<OverdueTrendDataPoint[]> => {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("*");

      if (error) throw error;

      const now = new Date();
      const months: OverdueTrendDataPoint[] = [];

      // Get last 6 months of data
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const monthName = format(monthDate, "MMM").toUpperCase();

        let overdueAmount = 0;
        let overdueCount = 0;

        invoices?.forEach((invoice) => {
          const dueDate = invoice.due_date ? parseISO(invoice.due_date) : null;
          
          // Check if invoice was overdue during this month
          if (dueDate && isWithinInterval(dueDate, { start: monthStart, end: monthEnd })) {
            const status = deriveInvoiceStatus({
              status: invoice.status,
              due_date: invoice.due_date,
              viewed_at: invoice.viewed_at,
            });
            
            if (status === "overdue" || (invoice.status !== "paid" && dueDate < now)) {
              overdueAmount += Number(invoice.total);
              overdueCount++;
            }
          }
        });

        months.push({
          name: monthName,
          amount: overdueAmount,
          count: overdueCount,
        });
      }

      return months;
    },
    enabled: !!user,
  });
}

export function useClientRevenueDistribution() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-revenue-distribution", user?.id],
    queryFn: async (): Promise<ClientRevenueItem[]> => {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("*, clients(name, company)");

      if (error) throw error;

      const clientRevenue: Record<string, { name: string; revenue: number }> = {};
      let totalRevenue = 0;

      invoices?.forEach((invoice) => {
        if (invoice.status === "paid" && invoice.client_id) {
          const clientName = invoice.clients?.name || invoice.clients?.company || "Unknown";
          const total = Number(invoice.total);
          
          if (!clientRevenue[invoice.client_id]) {
            clientRevenue[invoice.client_id] = { name: clientName, revenue: 0 };
          }
          clientRevenue[invoice.client_id].revenue += total;
          totalRevenue += total;
        }
      });

      // Convert to array and sort by revenue
      const distribution = Object.values(clientRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5) // Top 5 clients
        .map(client => ({
          name: client.name,
          revenue: client.revenue,
          percentage: totalRevenue > 0 ? Math.round((client.revenue / totalRevenue) * 100) : 0,
        }));

      return distribution;
    },
    enabled: !!user,
  });
}
