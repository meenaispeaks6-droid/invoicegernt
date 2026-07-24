import { DemoLayout, statusColor, formatCurrency } from "./DemoLayout";
import { useSeedData } from "@/contexts/SeedDataContext";
import { format } from "date-fns";

export default function DemoInvoices() {
  return (
    <DemoLayout>
      <Inner />
    </DemoLayout>
  );
}

function Inner() {
  const { invoices, clients } = useSeedData();
  const clientById = Object.fromEntries(clients.map((c) => [c.id, c]));
  return (
    <>
      <div className="bg-[#009966] px-4 md:px-8 py-6 md:py-10">
        <h1 className="page-title">INVOICES</h1>
      </div>
      <div className="border-b border-border">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs tracking-widest text-muted-foreground border-b border-border">
              <th className="p-4 md:p-6">INVOICE</th>
              <th className="p-4 md:p-6 hidden md:table-cell">CLIENT</th>
              <th className="p-4 md:p-6 hidden md:table-cell">ISSUED</th>
              <th className="p-4 md:p-6">STATUS</th>
              <th className="p-4 md:p-6 text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-border hover:bg-card/50 transition-colors">
                <td className="p-4 md:p-6">
                  <div className="font-mono text-sm text-foreground">{inv.invoice_number}</div>
                  <div className="text-xs text-muted-foreground">{inv.internal_title}</div>
                </td>
                <td className="p-4 md:p-6 hidden md:table-cell text-sm">{clientById[inv.client_id]?.company}</td>
                <td className="p-4 md:p-6 hidden md:table-cell text-sm text-muted-foreground">
                  {format(new Date(inv.issue_date), "dd MMM yyyy").toUpperCase()}
                </td>
                <td className="p-4 md:p-6">
                  <span className={`px-3 py-1 text-xs tracking-widest ${statusColor[inv.status]}`}>{inv.status.toUpperCase()}</span>
                </td>
                <td className="p-4 md:p-6 text-right font-mono">{formatCurrency(inv.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}