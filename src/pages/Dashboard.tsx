import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { DollarSign, TrendingUp, Users, FileText } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useDashboardStats, useRevenueFlowData, type TimePeriod } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/hooks/useSettings";
import { seedSampleData } from "@/lib/seedSampleData";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("weekly");
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: revenueData, isLoading: revenueLoading } = useRevenueFlowData(timePeriod);
  const { user } = useAuth();
  const { data: settings } = useSettings();
  const queryClient = useQueryClient();
  const seedingRef = useRef(false);

  useEffect(() => {
    if (!user || !settings) return;
    if (!settings.onboarding_completed) return;
    if (settings.sample_data_seeded) return;
    if (seedingRef.current) return;

    seedingRef.current = true;
    seedSampleData(user.id)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["settings"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        queryClient.invalidateQueries({ queryKey: ["revenue-flow"] });
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
        queryClient.invalidateQueries({ queryKey: ["clients"] });
      })
      .catch((err) => {
        console.error("Sample data seeding failed", err);
        seedingRef.current = false;
      });
  }, [user, settings, queryClient]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toFixed(0)}`;
  };

  const statCards = [
    {
      title: "TOTAL REVENUE",
      value: statsLoading ? null : formatCurrency(stats?.totalRevenue || 0),
      change: statsLoading 
        ? null 
        : `${stats?.revenueChange && stats.revenueChange > 0 ? "+" : ""}${stats?.revenueChange || 0}% vs last month`,
      changeType: (stats?.revenueChange || 0) >= 0 ? "positive" : "negative",
      icon: DollarSign,
    },
    {
      title: "OUTSTANDING",
      value: statsLoading ? null : formatCurrency(stats?.outstanding || 0),
      change: statsLoading ? null : `${stats?.pendingCount || 0} invoices pending`,
      changeType: "warning",
      icon: TrendingUp,
    },
    {
      title: "ACTIVE CLIENTS",
      value: statsLoading ? null : String(stats?.activeClients || 0),
      change: statsLoading ? null : `${stats?.newClientsThisWeek || 0} new this week`,
      changeType: "positive",
      icon: Users,
    },
    {
      title: "INVOICES SENT",
      value: statsLoading ? null : String(stats?.invoicesSent || 0),
      change: statsLoading ? null : `${stats?.paidOnTimePercentage || 0}% paid on time`,
      changeType: "positive",
      icon: FileText,
    },
  ];

  return (
    <Layout>
      {/* Hero section */}
      <div className="bg-primary px-4 md:px-8 py-6 md:py-10 flex items-center justify-between">
        <h1 className="page-title">DASHBOARD</h1>
      </div>

      {/* Stats grid - 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-border">
        {statCards.map((stat, index) => (
          <div
            key={stat.title}
            className={`bg-card p-4 md:p-6 
              ${index % 2 !== 1 ? "border-r border-border md:border-r" : "md:border-r md:border-border"}
              ${index < 2 ? "border-b border-border md:border-b-0" : ""}
              ${index === statCards.length - 1 ? "md:border-r-0" : ""}
            `}
          >
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <span className="meta-text tracking-widest">{stat.title}</span>
              <stat.icon className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
            </div>
            <div className="stat-value mb-2">
              {stat.value === null ? (
                <Skeleton className="h-8 md:h-10 w-16 md:w-24" />
              ) : (
                stat.value
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${
                  stat.changeType === "positive"
                    ? "bg-primary"
                    : stat.changeType === "warning"
                    ? "bg-status-pending"
                    : "bg-muted-foreground"
                }`}
              />
              {stat.change === null ? (
                <Skeleton className="h-3 md:h-4 w-20 md:w-32" />
              ) : (
                <span className="meta-text">{stat.change}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Flow Chart - Full Width */}
      <div className="bg-background p-4 md:p-6 border-b border-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <h2 className="card-title">REVENUE FLOW</h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setTimePeriod("weekly")}
              className={`nav-item transition-colors ${timePeriod === "weekly" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              WEEKLY
            </button>
            <button 
              onClick={() => setTimePeriod("monthly")}
              className={`nav-item transition-colors ${timePeriod === "monthly" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              MONTHLY
            </button>
            <button 
              onClick={() => setTimePeriod("yearly")}
              className={`nav-item transition-colors ${timePeriod === "yearly" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              YEARLY
            </button>
          </div>
        </div>
        <div className="h-[200px] md:h-[300px]">
          {revenueLoading ? (
            <div className="flex items-center justify-center h-full">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData || []}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160, 100%, 39%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(160, 100%, 39%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 10 }}
                  dy={10}
                  interval="preserveStartEnd"
                />
                <YAxis hide />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(160, 100%, 39%)"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Layout>
  );
}
