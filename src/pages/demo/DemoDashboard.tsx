import { DollarSign, TrendingUp, Users, FileText } from "lucide-react";
import { DemoLayout, formatCurrency } from "./DemoLayout";
import { useSeedData } from "@/contexts/SeedDataContext";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

export default function DemoDashboard() {
  return (
    <DemoLayout>
      <DashboardInner />
    </DemoLayout>
  );
}

function DashboardInner() {
  const { invoices, clients } = useSeedData();
  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const outstanding = invoices.filter((i) => i.status === "pending" || i.status === "overdue").reduce((s, i) => s + i.total, 0);
  const pendingCount = invoices.filter((i) => i.status === "pending" || i.status === "overdue").length;
  const invoicesSent = invoices.filter((i) => i.status !== "draft").length;

  const cards = [
    { title: "TOTAL REVENUE", value: formatCurrency(totalRevenue), change: "+12% vs last month", tone: "positive" },
    { title: "OUTSTANDING", value: formatCurrency(outstanding), change: `${pendingCount} invoices pending`, tone: "warning" },
    { title: "ACTIVE CLIENTS", value: String(clients.length), change: "1 new this week", tone: "positive" },
    { title: "INVOICES SENT", value: String(invoicesSent), change: "80% paid on time", tone: "positive" },
  ];

  const chart = Array.from({ length: 8 }, (_, i) => ({
    name: `W${i + 1}`,
    value: 800 + Math.round(Math.sin(i) * 600 + i * 350),
  }));

  return (
    <>
      <div className="bg-primary px-4 md:px-8 py-6 md:py-10">
        <h1 className="page-title">DASHBOARD</h1>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-border">
        {cards.map((s, i) => (
          <div key={s.title} className={`bg-card p-4 md:p-6 ${i % 2 !== 1 ? "border-r border-border" : ""} ${i < 2 ? "border-b border-border md:border-b-0" : ""} ${i < 3 ? "md:border-r md:border-border" : ""}`}>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <span className="meta-text tracking-widest">{s.title}</span>
              {[DollarSign, TrendingUp, Users, FileText][i]({ className: "w-3 h-3 md:w-4 md:h-4 text-muted-foreground" } as any)}
            </div>
            <div className="stat-value mb-2">{s.value}</div>
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${s.tone === "positive" ? "bg-primary" : "bg-status-pending"}`} />
              <span className="meta-text">{s.change}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-background p-4 md:p-6 border-b border-border">
        <h2 className="card-title mb-6">REVENUE FLOW</h2>
        <div className="h-[200px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="demoRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(160, 100%, 39%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(160, 100%, 39%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 10 }} dy={10} />
              <YAxis hide />
              <Area type="monotone" dataKey="value" stroke="hsl(160, 100%, 39%)" strokeWidth={2} fill="url(#demoRevGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}