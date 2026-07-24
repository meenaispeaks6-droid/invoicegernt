import { DemoLayout, formatCurrency } from "./DemoLayout";
import { useSeedData } from "@/contexts/SeedDataContext";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts";

export default function DemoReports() {
  return (
    <DemoLayout>
      <Inner />
    </DemoLayout>
  );
}

function Inner() {
  const { invoices } = useSeedData();
  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
  const paid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const notPaid = totalInvoiced - paid;

  const byStatus = [
    { name: "PAID", value: invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0) },
    { name: "PENDING", value: invoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.total, 0) },
    { name: "OVERDUE", value: invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.total, 0) },
    { name: "DRAFT", value: invoices.filter((i) => i.status === "draft").reduce((s, i) => s + i.total, 0) },
  ];

  return (
    <>
      <div className="bg-black px-4 md:px-8 py-6 md:py-10 border-b border-border">
        <h1 className="page-title">REPORTS</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border-b border-border">
        {[
          { label: "TOTAL INVOICED", value: totalInvoiced },
          { label: "INVOICED BUT NOT PAID", value: notPaid },
          { label: "PAID", value: paid },
        ].map((s, i) => (
          <div key={s.label} className={`bg-card p-6 md:p-8 ${i < 2 ? "border-b md:border-b-0 md:border-r border-border" : ""}`}>
            <div className="text-xs tracking-widest text-muted-foreground mb-4">{s.label}</div>
            <div className="stat-value">{formatCurrency(s.value)}</div>
          </div>
        ))}
      </div>
      <div className="bg-background p-4 md:p-6 border-b border-border">
        <h2 className="card-title mb-6">REVENUE BY STATUS</h2>
        <div className="h-[240px] md:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byStatus}>
              <CartesianGrid vertical={false} stroke="hsl(0, 0%, 15%)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 10 }} />
              <Bar dataKey="value" fill="hsl(160, 100%, 39%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}