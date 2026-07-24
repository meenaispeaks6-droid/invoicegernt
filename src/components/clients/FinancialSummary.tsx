import { ClientFinancialStats } from "@/hooks/useClientInvoices";
import { TrendingUp, Wallet, AlertCircle, Clock, FileText, Calendar } from "lucide-react";

interface FinancialSummaryProps {
  stats: ClientFinancialStats;
  isLoading?: boolean;
}

export function FinancialSummary({ stats, isLoading }: FinancialSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const cards = [
    {
      label: "LIFETIME REVENUE",
      value: formatCurrency(stats.lifetimeRevenue),
      icon: TrendingUp,
    },
    {
      label: "TOTAL PAID",
      value: formatCurrency(stats.totalPaid),
      icon: Wallet,
    },
    {
      label: "OUTSTANDING",
      value: formatCurrency(stats.totalOutstanding),
      icon: Clock,
    },
    {
      label: "OVERDUE",
      value: formatCurrency(stats.overdueAmount),
      icon: AlertCircle,
    },
    {
      label: "AVG INVOICE",
      value: formatCurrency(stats.averageInvoiceValue),
      icon: FileText,
    },
    {
      label: "AVG DAYS TO PAY",
      value: `${stats.averageDaysToPayment} DAYS`,
      icon: Calendar,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-6 border-b border-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`bg-card py-6 ${i === 0 ? "pl-8 pr-6" : i === 5 ? "pl-6 pr-8" : "px-6"} animate-pulse ${i < 5 ? "border-r border-border" : ""}`}>
            <div className="h-4 bg-muted rounded w-24 mb-6" />
            <div className="h-10 bg-muted rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-6 border-b border-border">
      {cards.map((card, index) => (
        <div
          key={card.label}
          className={`bg-card py-6 ${index === 0 ? "pl-8 pr-6" : index === cards.length - 1 ? "pl-6 pr-8" : "px-6"} ${index < cards.length - 1 ? "border-r border-border" : ""}`}
        >
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs text-muted-foreground tracking-widest">
              {card.label}
            </span>
            <card.icon className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="font-display text-4xl text-foreground">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
