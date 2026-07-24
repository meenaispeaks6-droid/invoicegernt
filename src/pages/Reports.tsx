import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { TrendingUp, AlertTriangle, Users } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Bar, BarChart, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { DownloadReportDialog } from "@/components/dashboard/DownloadReportDialog";
import {
  useReportsStats,
  useCashFlowData,
  useProfitMarginData,
  useOverdueTrends,
  useClientRevenueDistribution,
} from "@/hooks/useReportsStats";

export default function Reports() {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const { data: stats, isLoading: statsLoading } = useReportsStats();
  const { data: cashFlowData, isLoading: cashFlowLoading } = useCashFlowData();
  const { data: profitData, isLoading: profitLoading } = useProfitMarginData();
  const { data: overdueData, isLoading: overdueLoading } = useOverdueTrends();
  const { data: clientDistribution, isLoading: clientLoading } = useClientRevenueDistribution();

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toFixed(0)}`;
  };

  const statCards = [
    {
      title: "GROSS REVENUE",
      value: statsLoading ? null : formatCurrency(stats?.grossRevenue || 0),
      change: statsLoading 
        ? null 
        : `${stats?.grossRevenueChange && stats.grossRevenueChange > 0 ? "+" : ""}${stats?.grossRevenueChange || 0}% vs last month`,
      changeType: (stats?.grossRevenueChange || 0) >= 0 ? "positive" : "negative",
      icon: TrendingUp,
    },
    {
      title: "NET PROFIT",
      value: statsLoading ? null : formatCurrency(stats?.netProfit || 0),
      change: statsLoading 
        ? null 
        : `${stats?.netProfitChange && stats.netProfitChange > 0 ? "+" : ""}${stats?.netProfitChange || 0}% vs last month`,
      changeType: (stats?.netProfitChange || 0) >= 0 ? "positive" : "negative",
      icon: TrendingUp,
    },
    {
      title: "OVERDUE",
      value: statsLoading ? null : formatCurrency(stats?.overdueAmount || 0),
      change: statsLoading ? null : `${stats?.overdueCount || 0} invoices`,
      changeType: (stats?.overdueCount || 0) > 0 ? "negative" : "positive",
      icon: AlertTriangle,
    },
    {
      title: "CLIENTS",
      value: statsLoading ? null : String(stats?.totalClients || 0),
      change: "All time",
      changeType: "neutral",
      icon: Users,
    },
  ];

  return (
    <Layout>
      {/* Header */}
      <div className="bg-primary px-4 md:px-8 py-6 md:py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="font-display text-4xl md:text-6xl text-foreground tracking-tight">
          REPORTS
        </h1>
        <button 
          onClick={() => setReportDialogOpen(true)}
          className="px-4 md:px-6 py-2.5 md:py-3 bg-foreground text-background font-medium text-xs md:text-sm tracking-wider hover:bg-foreground/90 transition-colors"
        >
          DOWNLOAD REPORT
        </button>
      </div>

      <DownloadReportDialog 
        open={reportDialogOpen} 
        onOpenChange={setReportDialogOpen} 
      />

      {/* Stats Grid - 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-border">
        {statCards.map((stat, index) => (
          <div
            key={stat.title}
            className={`bg-card p-4 md:p-6 
              ${index % 2 !== 1 ? "border-r border-border" : "md:border-r"}
              ${index < 2 ? "border-b border-border md:border-b-0" : ""}
              ${index === statCards.length - 1 ? "md:border-r-0" : ""}
            `}
          >
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <span className="text-[10px] md:text-xs text-muted-foreground tracking-widest">
                {stat.title}
              </span>
              <stat.icon className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
            </div>
            <div className="font-display text-2xl md:text-4xl text-foreground mb-2">
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
                    : stat.changeType === "negative"
                    ? "bg-destructive"
                    : "bg-muted-foreground"
                }`}
              />
              {stat.change === null ? (
                <Skeleton className="h-3 md:h-4 w-20 md:w-32" />
              ) : (
                <span className="text-[10px] md:text-xs text-muted-foreground">
                  {stat.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts - Stack on mobile, grid on desktop */}
      <div className="flex flex-col md:grid md:grid-cols-4 md:gap-0 border-b border-border">
        {/* Cash Flow Analysis */}
        <div className="md:col-span-3 bg-background p-4 md:p-6 md:border-r border-border border-b md:border-b-0">
          <h2 className="font-display text-lg md:text-xl text-foreground mb-6 md:mb-8">
            CASH FLOW ANALYSIS
          </h2>
          <div className="h-[180px] md:h-[280px]">
            {cashFlowLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowData || []}>
                  <defs>
                    <linearGradient id="cashFlowGradient" x1="0" y1="0" x2="0" y2="1">
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
                    dataKey="inflow"
                    stroke="hsl(160, 100%, 39%)"
                    strokeWidth={2}
                    fill="url(#cashFlowGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="w-3 h-px bg-primary" />
            <span className="text-[10px] md:text-xs text-primary tracking-wider">REVENUE INFLOW</span>
          </div>
        </div>

        {/* Profit Margins */}
        <div className="md:col-span-1 bg-card p-4 md:p-6">
          <h2 className="font-display text-lg md:text-xl text-foreground mb-6 md:mb-8">
            PROFIT MARGINS
          </h2>
          <div className="h-[150px] md:h-[200px]">
            {profitLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitData?.data.slice(-6) || []} barGap={2}>
                  <Bar dataKey="cost" fill="hsl(0, 0%, 30%)" radius={[2, 2, 0, 0]} stackId="a" />
                  <Bar dataKey="profit" fill="hsl(160, 100%, 39%)" radius={[2, 2, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="space-y-2 md:space-y-3 pt-4 md:pt-6 border-t border-border mt-4 md:mt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-muted-foreground">HIGHEST</span>
              {profitLoading ? (
                <Skeleton className="h-4 w-16 md:w-20" />
              ) : (
                <span className="text-xs md:text-sm font-semibold text-foreground">
                  {profitData?.highestMonth || "N/A"}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-muted-foreground">LOWEST</span>
              {profitLoading ? (
                <Skeleton className="h-4 w-16 md:w-20" />
              ) : (
                <span className="text-xs md:text-sm font-semibold text-foreground">
                  {profitData?.lowestMonth || "N/A"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 - Stack on mobile, grid on desktop */}
      <div className="flex flex-col md:grid md:grid-cols-4 md:gap-0">
        {/* Overdue Trends */}
        <div className="md:col-span-3 bg-background p-4 md:p-6 md:border-r border-border border-b md:border-b-0">
          <h2 className="font-display text-lg md:text-xl text-foreground mb-6 md:mb-8">
            OVERDUE TRENDS
          </h2>
          <div className="h-[150px] md:h-[200px]">
            {overdueLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overdueData || []}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 10 }}
                    dy={10}
                    interval="preserveStartEnd"
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 10%)",
                      border: "1px solid hsl(0, 0%, 20%)",
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "hsl(0, 0%, 80%)" }}
                  />
                  <Bar dataKey="amount" fill="hsl(0, 62%, 50%)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="w-3 h-px bg-destructive" />
            <span className="text-[10px] md:text-xs text-destructive tracking-wider">OVERDUE (6 MONTHS)</span>
          </div>
        </div>

        {/* Client Revenue Distribution */}
        <div className="md:col-span-1 bg-card p-4 md:p-6">
          <h2 className="font-display text-lg md:text-xl text-foreground mb-6 md:mb-8">
            CLIENT REVENUE
          </h2>
          {clientLoading ? (
            <div className="space-y-3 md:space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-6 md:h-8 w-full" />
              ))}
            </div>
          ) : clientDistribution && clientDistribution.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {clientDistribution.map((client, index) => (
                <div key={index} className="space-y-1.5 md:space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-foreground truncate max-w-[120px] md:max-w-[200px] uppercase">
                      {client.name}
                    </span>
                    <span className="text-[10px] md:text-sm text-muted-foreground">
                      {formatCurrency(client.revenue)} ({client.percentage}%)
                    </span>
                  </div>
                  <div className="h-1.5 md:h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${client.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[150px] md:h-[200px] text-muted-foreground text-xs md:text-sm">
              No client revenue data
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
