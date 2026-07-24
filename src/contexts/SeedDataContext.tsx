import { createContext, useContext, ReactNode, useMemo } from "react";

export type DemoStatus = "draft" | "pending" | "overdue" | "paid";

export interface DemoClient {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  payment_terms: number;
  status: "active";
}

export interface DemoInvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface DemoInvoice {
  id: string;
  invoice_number: string;
  internal_title: string;
  client_id: string;
  status: DemoStatus;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  items: DemoInvoiceItem[];
}

export interface SeedData {
  clients: DemoClient[];
  invoices: DemoInvoice[];
  currency: string;
}

const today = new Date();
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const clients: DemoClient[] = [
  {
    id: "c1",
    name: "Olivia Bennett",
    company: "Acme Corp",
    email: "olivia@acmecorp.com",
    phone: "+1 (415) 555-0142",
    address: "120 Market St, San Francisco, CA 94105",
    payment_terms: 30,
    status: "active",
  },
  {
    id: "c2",
    name: "Marcus Hale",
    company: "Sunrise Studios",
    email: "marcus@sunrisestudios.co",
    phone: "+1 (212) 555-0177",
    address: "88 Greene St, New York, NY 10012",
    payment_terms: 14,
    status: "active",
  },
  {
    id: "c3",
    name: "Sofia Lindqvist",
    company: "Nordic Design Co",
    email: "sofia@nordicdesign.se",
    phone: "+46 8 555 0193",
    address: "Birger Jarlsgatan 24, 114 34 Stockholm, Sweden",
    payment_terms: 30,
    status: "active",
  },
];

const build = (
  id: string,
  invoice_number: string,
  internal_title: string,
  client_id: string,
  status: DemoStatus,
  issue_days_ago: number,
  due_in_days: number,
  items: Omit<DemoInvoiceItem, "amount">[],
  notes: string | null = null,
): DemoInvoice => {
  const withAmounts = items.map((it) => ({ ...it, amount: it.quantity * it.unit_price }));
  const subtotal = withAmounts.reduce((s, it) => s + it.amount, 0);
  return {
    id,
    invoice_number,
    internal_title,
    client_id,
    status,
    issue_date: daysAgo(issue_days_ago),
    due_date: daysAgo(issue_days_ago - due_in_days),
    subtotal,
    tax_rate: 0,
    tax_amount: 0,
    total: subtotal,
    notes,
    items: withAmounts,
  };
};

const invoices: DemoInvoice[] = [
  build("i1", "INV-0001", "Acme — Q3 brand refresh", "c1", "paid", 78, 14, [
    { description: "Brand strategy workshop (2 days)", quantity: 2, unit_price: 1200 },
    { description: "Logo & identity system", quantity: 1, unit_price: 1800 },
    { description: "Brand guidelines document", quantity: 1, unit_price: 600 },
  ], "Thanks for the smooth kickoff — looking forward to phase 2."),
  build("i2", "INV-0002", "Sunrise — landing page build", "c2", "paid", 52, 14, [
    { description: "Landing page design", quantity: 1, unit_price: 1400 },
    { description: "Front-end development", quantity: 18, unit_price: 95 },
  ]),
  build("i3", "INV-0003", "Nordic — monthly retainer", "c3", "pending", 12, 30, [
    { description: "Design retainer — October", quantity: 1, unit_price: 2800 },
    { description: "Additional art direction hours", quantity: 4, unit_price: 120 },
  ]),
  build("i4", "INV-0004", "Acme — campaign assets", "c1", "overdue", 48, 21, [
    { description: "Social campaign creative (12 assets)", quantity: 12, unit_price: 140 },
    { description: "Motion graphics — hero spot", quantity: 1, unit_price: 950 },
  ], "Friendly reminder: payment is now past due."),
  build("i5", "INV-0005", "Acme — analytics dashboard", "c1", "pending", 6, 30, [
    { description: "Dashboard UX research", quantity: 1, unit_price: 1100 },
    { description: "UI design — 8 screens", quantity: 8, unit_price: 220 },
  ]),
  build("i6", "INV-0006", "Sunrise — Q4 proposal", "c2", "draft", 1, 14, [
    { description: "Discovery & scoping", quantity: 1, unit_price: 750 },
    { description: "Estimated build hours", quantity: 24, unit_price: 110 },
  ]),
];

const seed: SeedData = { clients, invoices, currency: "USD" };

const SeedDataContext = createContext<SeedData | null>(null);

export function SeedDataProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => seed, []);
  return <SeedDataContext.Provider value={value}>{children}</SeedDataContext.Provider>;
}

export function useSeedData(): SeedData {
  const ctx = useContext(SeedDataContext);
  if (!ctx) throw new Error("useSeedData must be used within SeedDataProvider");
  return ctx;
}

export function useSeedClient(id: string | undefined) {
  const { clients } = useSeedData();
  return clients.find((c) => c.id === id);
}