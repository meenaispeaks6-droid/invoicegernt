import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { SeedDataProvider } from "@/contexts/SeedDataContext";

const navItems = [
  { name: "DASHBOARD", path: "/demo/dashboard" },
  { name: "INVOICES", path: "/demo" },
  { name: "CLIENTS", path: "/demo/clients" },
];
const rightNavItems = [{ name: "REPORTS", path: "/demo/reports" }];

export function DemoLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isHome = location.pathname === "/demo" || location.pathname === "/demo/";

  return (
    <SeedDataProvider>
      <div className="min-h-screen bg-background">
        <div className="bg-primary/20 border-b border-white/10 px-4 md:px-8 py-2 text-center">
          <span className="text-xs tracking-widest text-white/70">
            DEMO MODE — SAMPLE DATA, NO SIGN-IN REQUIRED ·{" "}
            <Link to="/auth" className="underline hover:text-white">SIGN UP TO USE YOUR OWN</Link>
          </span>
        </div>
        <header className={`flex items-center justify-between px-4 md:px-8 py-4 border-b border-white/10 ${isHome ? "bg-[#009966]" : "bg-black"}`}>
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} className={`text-sm font-medium tracking-widest transition-colors ${active ? "text-white" : "text-white/50 hover:text-white"}`}>
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <Link to="/demo" className="font-display text-xl md:text-2xl tracking-tight text-white">BILLIE</Link>
          <nav className="hidden md:flex items-center gap-8">
            {rightNavItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} className={`text-sm font-medium tracking-widest transition-colors ${active ? "text-white" : "text-white/50 hover:text-white"}`}>
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="md:hidden" />
        </header>
        <main>{children}</main>
      </div>
    </SeedDataProvider>
  );
}

export const statusColor: Record<string, string> = {
  paid: "bg-primary text-black",
  pending: "bg-status-pending/20 text-status-pending",
  overdue: "bg-destructive/20 text-destructive",
  draft: "bg-white/10 text-white/60",
};

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);