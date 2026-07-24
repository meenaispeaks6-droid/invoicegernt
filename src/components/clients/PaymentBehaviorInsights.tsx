import { ClientFinancialStats } from "@/hooks/useClientInvoices";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PaymentBehaviorInsightsProps {
  stats: ClientFinancialStats;
}

export function PaymentBehaviorInsights({ stats }: PaymentBehaviorInsightsProps) {
  const totalPayments = stats.onTimePayments + stats.latePayments;
  const onTimePercentage =
    totalPayments > 0
      ? Math.round((stats.onTimePayments / totalPayments) * 100)
      : null;

  const hasPaymentHistory = totalPayments > 0;

  return (
    <div className="grid grid-cols-2 border-b border-border">
      {/* On-time Rate */}
      <div className="bg-background pl-8 pr-6 py-6 border-r border-border">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs text-muted-foreground tracking-widest">
            ON-TIME RATE
          </span>
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="font-display text-4xl text-foreground">
          {hasPaymentHistory ? `${onTimePercentage}%` : "—"}
        </p>
        {!hasPaymentHistory && (
          <span className="text-xs text-muted-foreground">No payment history yet</span>
        )}
      </div>

      {/* Late Payments */}
      <div className="bg-background pl-6 pr-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs text-muted-foreground tracking-widest">
            LATE PAYMENTS
          </span>
          <TrendingDown className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="font-display text-4xl text-foreground">
          {hasPaymentHistory ? stats.latePayments : "—"}
        </p>
        {!hasPaymentHistory && (
          <span className="text-xs text-muted-foreground">No payment history yet</span>
        )}
      </div>
    </div>
  );
}
