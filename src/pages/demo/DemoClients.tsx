import { DemoLayout, formatCurrency } from "./DemoLayout";
import { useSeedData } from "@/contexts/SeedDataContext";

export default function DemoClients() {
  return (
    <DemoLayout>
      <Inner />
    </DemoLayout>
  );
}

function Inner() {
  const { clients, invoices } = useSeedData();
  return (
    <>
      <div className="bg-black px-4 md:px-8 py-6 md:py-10 border-b border-border">
        <h1 className="page-title">CLIENTS</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border-b border-border">
        {clients.map((c, i) => {
          const clientInvoices = invoices.filter((inv) => inv.client_id === c.id);
          const total = clientInvoices.reduce((s, inv) => s + inv.total, 0);
          const outstanding = clientInvoices
            .filter((inv) => inv.status === "pending" || inv.status === "overdue")
            .reduce((s, inv) => s + inv.total, 0);
          return (
            <div key={c.id} className={`bg-card p-6 md:p-8 ${i < clients.length - 1 ? "border-b md:border-b-0 md:border-r border-border" : ""}`}>
              <div className="text-xs tracking-widest text-muted-foreground mb-2">{c.company.toUpperCase()}</div>
              <div className="text-xl font-display text-foreground mb-4">{c.name}</div>
              <div className="text-sm text-muted-foreground mb-1">{c.email}</div>
              <div className="text-sm text-muted-foreground mb-6">{c.phone}</div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <div className="text-xs tracking-widest text-muted-foreground mb-1">TOTAL BILLED</div>
                  <div className="font-mono text-lg">{formatCurrency(total)}</div>
                </div>
                <div>
                  <div className="text-xs tracking-widest text-muted-foreground mb-1">OUTSTANDING</div>
                  <div className="font-mono text-lg">{formatCurrency(outstanding)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}