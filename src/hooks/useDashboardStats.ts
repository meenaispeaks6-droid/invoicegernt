import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, endOfWeek, format, parseISO, isWithinInterval, startOfYear, endOfYear, eachMonthOfInterval, getYear } from "date-fns";

export type TimePeriod = "weekly" | "monthly" | "yearly";

export interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  outstanding: number;
  pendingCount: number;
  activeClients: number;
  newClientsThisWeek: number;
  invoicesSent: number;
  paidOnTimePercentage: number;
}

export interface RevenueDataPoint {
  name: string;
  value: number;
}

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch all invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("*");

      if (invoicesError) throw invoicesError;

      // Fetch all clients
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("*");

      if (clientsError) throw clientsError;

      const now = new Date();
      const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Calculate stats
      let totalRevenue = 0;
      let lastMonthRevenue = 0;
      let outstanding = 0;
      let pendingCount = 0;
      let paidCount = 0;
      let invoicesSentCount = 0;

      invoices?.forEach((invoice) => {
        const total = Number(invoice.total);
        const updatedAt = invoice.updated_at ? parseISO(invoice.updated_at) : null;

        // Total revenue from paid invoices
        if (invoice.status === "paid") {
          totalRevenue += total;
          paidCount++;

          // Check if paid this month vs last month
          if (updatedAt && isWithinInterval(updatedAt, { start: lastMonthStart, end: lastMonthEnd })) {
            lastMonthRevenue += total;
          }
        }

        // Outstanding (pending + overdue)
        if (invoice.status === "pending" || invoice.status === "overdue") {
          outstanding += total;
          pendingCount++;
        }

        // Invoices sent (not drafts)
        if (invoice.status !== "draft") {
          invoicesSentCount++;
        }
      });

      // Revenue change calculation
      const thisMonthRevenue = totalRevenue - lastMonthRevenue;
      const revenueChange = lastMonthRevenue > 0 
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;

      // Active clients count
      const activeClients = clients?.filter(c => c.status === "active").length || 0;

      // New clients this week
      const newClientsThisWeek = clients?.filter(c => {
        const createdAt = parseISO(c.created_at);
        return createdAt >= thisWeekStart;
      }).length || 0;

      // Paid on time percentage
      const paidOnTimePercentage = paidCount > 0 ? Math.round((paidCount / (paidCount + pendingCount)) * 100) : 0;

      return {
        totalRevenue,
        revenueChange: Math.round(revenueChange * 10) / 10,
        outstanding,
        pendingCount,
        activeClients,
        newClientsThisWeek,
        invoicesSent: invoicesSentCount,
        paidOnTimePercentage,
      };
    },
    enabled: !!user,
  });
}

export function useRevenueFlowData(period: TimePeriod = "weekly") {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["revenue-flow", user?.id, period],
    queryFn: async (): Promise<RevenueDataPoint[]> => {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("status", "paid");

      if (error) throw error;

      const now = new Date();

      if (period === "weekly") {
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

        const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
        const revenueByDay: Record<string, number> = {};
        dayNames.forEach(day => {
          revenueByDay[day] = 0;
        });

        invoices?.forEach((invoice) => {
          const updatedAt = invoice.updated_at ? parseISO(invoice.updated_at) : null;
          if (updatedAt && isWithinInterval(updatedAt, { start: weekStart, end: weekEnd })) {
            const dayIndex = (updatedAt.getDay() + 6) % 7;
            const dayName = dayNames[dayIndex];
            revenueByDay[dayName] += Number(invoice.total);
          }
        });

        return dayNames.map(name => ({
          name,
          value: revenueByDay[name],
        }));
      }

      if (period === "monthly") {
        const yearStart = startOfYear(now);
        const yearEnd = endOfYear(now);
        const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
        
        const revenueByMonth: Record<string, number> = {};
        months.forEach(month => {
          const monthName = format(month, "MMM").toUpperCase();
          revenueByMonth[monthName] = 0;
        });

        invoices?.forEach((invoice) => {
          const updatedAt = invoice.updated_at ? parseISO(invoice.updated_at) : null;
          if (updatedAt && isWithinInterval(updatedAt, { start: yearStart, end: yearEnd })) {
            const monthName = format(updatedAt, "MMM").toUpperCase();
            revenueByMonth[monthName] += Number(invoice.total);
          }
        });

        return months.map(month => ({
          name: format(month, "MMM").toUpperCase(),
          value: revenueByMonth[format(month, "MMM").toUpperCase()],
        }));
      }

      // Yearly view - show last 5 years
      const currentYear = getYear(now);
      const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);
      
      const revenueByYear: Record<number, number> = {};
      years.forEach(year => {
        revenueByYear[year] = 0;
      });

      invoices?.forEach((invoice) => {
        const updatedAt = invoice.updated_at ? parseISO(invoice.updated_at) : null;
        if (updatedAt) {
          const year = getYear(updatedAt);
          if (years.includes(year)) {
            revenueByYear[year] += Number(invoice.total);
          }
        }
      });

      return years.map(year => ({
        name: String(year),
        value: revenueByYear[year],
      }));
    },
    enabled: !!user,
  });
}
