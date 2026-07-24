import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  SlidersHorizontal,
  ChevronDown,
  LayoutGrid,
  List,
  Sparkles,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { InfiniteCanvas } from "@/components/canvas/InfiniteCanvas";
import {
  useInvoices,
  useInvoiceStats,
  Invoice,
} from "@/hooks/useInvoices";
import { useClients, useClientStats } from "@/hooks/useClients";
import { InvoiceOverlay } from "@/components/invoices/InvoiceOverlay";
import { InvoiceThumbnail } from "@/components/invoices/InvoiceThumbnail";
import { InvoiceListItem } from "@/components/invoices/InvoiceListItem";
import { useInvoiceOverlay } from "@/hooks/useInvoiceOverlay";
import { deriveInvoiceStatus } from "@/lib/invoiceStatus";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type StatusFilter = "drafts" | "pending" | "overdue" | "paid" | null;
type ViewMode = "canvas" | "grid" | "list";
type FilterType = "date" | "client" | "paid" | "viewed" | "pending" | "overdue" | "draft";

const filterLabels: Record<FilterType, string> = {
  date: "DATE",
  client: "CLIENT",
  paid: "PAID",
  viewed: "VIEWED",
  pending: "SENT",
  overdue: "OVERDUE",
  draft: "DRAFTS",
};

export default function Home() {
  const navigate = useNavigate();
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: invoiceStats } = useInvoiceStats();
  const { data: clientStats } = useClientStats();
  const { data: clients } = useClients();
  const { selectedInvoice, isOpen, openOverlay, closeOverlay, navigateToInvoice } = useInvoiceOverlay();

  const [viewMode, setViewMode] = useState<ViewMode>("canvas");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(null);

  // Grid/list state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("date");
  const [activeYear, setActiveYear] = useState<string>("all");
  const [selectedClientId, setSelectedClientId] = useState<string>("all");

  const stats = [
    { label: "DRAFTS", value: String(invoiceStats?.drafts ?? 0), filterKey: "drafts" as StatusFilter },
    { label: "PENDING", value: String(invoiceStats?.pending ?? 0), filterKey: "pending" as StatusFilter },
    { label: "OVERDUE", value: String(invoiceStats?.overdue ?? 0), filterKey: "overdue" as StatusFilter },
    { label: "PAID", value: String(invoiceStats?.paid ?? 0), filterKey: "paid" as StatusFilter },
    { label: "CLIENTS", value: String(clientStats?.totalClients ?? 0), filterKey: null },
    { 
      label: "YTD", 
      value: `$${((invoiceStats?.ytd ?? 0) / 1000).toFixed(1)}k`, 
      isHighlight: true,
      filterKey: null,
    },
  ];

  const handleStatClick = (filterKey: StatusFilter) => {
    if (filterKey) {
      setStatusFilter(filterKey);
    }
  };

  const clearFilter = () => {
    setStatusFilter(null);
  };

  // Map filter key to invoice status
  const getStatusFromFilter = (filter: StatusFilter): string | null => {
    if (!filter) return null;
    const statusMap: Record<string, string> = {
      drafts: "draft",
      pending: "pending",
      overdue: "overdue",
      paid: "paid",
    };
    return statusMap[filter] || null;
  };

  const activeStatus = getStatusFromFilter(statusFilter);

  // ---- Grid/list derived data ----
  const yearStats = useMemo(() => {
    const counts: Record<string, number> = {};
    invoices.forEach((inv) => {
      const year = new Date(inv.issue_date).getFullYear().toString();
      counts[year] = (counts[year] || 0) + 1;
    });
    const years = Object.keys(counts).sort((a, b) => Number(b) - Number(a));
    return { years, counts };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    let filtered = invoices;
    if (searchQuery) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          invoice.clients?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (["paid", "pending", "overdue", "draft", "viewed"].includes(activeFilter)) {
      filtered = filtered.filter(
        (invoice) => deriveInvoiceStatus(invoice) === activeFilter
      );
    }
    if (activeFilter === "client" && selectedClientId !== "all") {
      filtered = filtered.filter((invoice) => invoice.client_id === selectedClientId);
    }
    if (activeYear !== "all") {
      filtered = filtered.filter(
        (invoice) => new Date(invoice.issue_date).getFullYear().toString() === activeYear
      );
    }
    return filtered;
  }, [invoices, searchQuery, activeFilter, activeYear, selectedClientId]);

  const groupedInvoices = useMemo(() => {
    const groups: Record<string, Invoice[]> = {};
    filteredInvoices.forEach((invoice) => {
      const year = new Date(invoice.issue_date).getFullYear().toString();
      if (!groups[year]) groups[year] = [];
      groups[year].push(invoice);
    });
    const sortedYears = Object.keys(groups).sort((a, b) => Number(b) - Number(a));
    return { groups, sortedYears };
  }, [filteredInvoices]);

  const totalCount = invoices.length;

  const overlayInvoiceList = viewMode === "canvas" ? invoices : filteredInvoices;

  // Compact view toggle reused in both layouts
  const ViewToggle = ({ tone }: { tone: "light" | "dark" }) => {
    const base =
      tone === "light"
        ? "border-white/20 bg-white/5"
        : "border-border bg-card";
    const inactive =
      tone === "light"
        ? "text-white/50 hover:text-white"
        : "text-muted-foreground hover:text-foreground";
    const active =
      tone === "light" ? "text-white bg-white/15" : "text-foreground bg-muted";
    const divider = tone === "light" ? "bg-white/15" : "bg-border";
    const modes: { id: ViewMode; icon: typeof Sparkles; title: string }[] = [
      { id: "canvas", icon: Sparkles, title: "Canvas view" },
      { id: "grid", icon: LayoutGrid, title: "Grid view" },
      { id: "list", icon: List, title: "List view" },
    ];
    return (
      <div className={`flex items-center h-11 md:h-[42px] border ${base} rounded-sm`}>
        {modes.map((m, idx) => {
          const Icon = m.icon;
          const isActive = viewMode === m.id;
          return (
            <div key={m.id} className="flex items-center h-full">
              {idx > 0 && <div className={`w-px h-6 ${divider}`} />}
              <button
                onClick={() => setViewMode(m.id)}
                title={m.title}
                className={`h-full px-3 transition-colors ${isActive ? active : inactive}`}
              >
                <Icon className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Layout>
      {viewMode === "canvas" ? (
        <div className="relative flex flex-col min-h-[calc(100vh-57px)] md:min-h-[calc(100vh-65px)]">
        {/* Green hero area with infinite canvas */}
        <div className="flex-1 bg-primary relative overflow-hidden">
          {/* Vertical divider lines - adapted for mobile and desktop */}
          <div className="absolute inset-0 flex flex-row justify-evenly pointer-events-none z-0">
            {/* Mobile: 3 lines, Desktop: 5 lines */}
            <div className="hidden md:contents">
              {[...Array(5)].map((_, i) => (
                <div key={`desktop-${i}`} className="h-full w-px bg-white/10" />
              ))}
            </div>
            <div className="contents md:hidden">
              {[...Array(3)].map((_, i) => (
                <div key={`mobile-${i}`} className="h-full w-px bg-white/10" />
              ))}
            </div>
          </div>

          {/* Infinite Canvas */}
          <div className="absolute inset-0 z-10">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-white/50 text-sm">Loading invoices...</div>
              </div>
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-white/50 text-sm uppercase tracking-widest">NO INVOICES YET</p>
                
                {/* Mobile-only CTA */}
                <Link 
                  to="/invoices/new" 
                  className="md:hidden fixed bottom-6 left-6 right-6 bg-white text-black text-center py-3 px-6 text-sm font-medium tracking-widest uppercase flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add invoice
                </Link>
              </div>
            ) : (
              <InfiniteCanvas 
                invoices={invoices} 
                onInvoiceClick={openOverlay} 
                statusFilter={activeStatus}
                onResetFilter={clearFilter}
              />
            )}
          </div>

          {/* Floating view toggle (canvas) */}
          <div className="absolute top-4 right-4 z-30 hidden md:block">
            <ViewToggle tone="light" />
          </div>

        </div>

        {/* Stats bar - responsive grid */}
        <div className="hidden md:block bg-primary border-t border-white/10 relative z-30">
          {/* Mobile: 3 columns, 2 rows */}
          {/* Desktop: 6 columns, 1 row */}
          <div className="grid grid-cols-3 md:grid-cols-6">
            {stats.map((stat, index) => {
              const isClickable = stat.filterKey !== null;
              const isActive = statusFilter !== null && statusFilter === stat.filterKey;
              
              // Calculate border classes for mobile (3-col grid)
              const showRightBorderMobile = (index % 3) !== 2;
              const showBottomBorderMobile = index < 3;
              
              // Desktop border (6-col grid)
              const showRightBorderDesktop = index < stats.length - 1;
              
              return (
                <div
                  key={stat.label}
                  className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 text-white py-3 md:py-4 px-2
                    ${showRightBorderMobile ? "border-r border-white/20 md:border-r-0" : ""}
                    ${showBottomBorderMobile ? "border-b border-white/20 md:border-b-0" : ""}
                    ${showRightBorderDesktop ? "md:border-r md:border-white/20" : ""}
                    ${isClickable ? "cursor-pointer hover:bg-white/10 transition-colors duration-200" : ""} 
                    ${isActive ? "bg-white/15" : ""}
                  `}
                  onClick={() => isClickable && handleStatClick(stat.filterKey)}
                >
                  <span className={`text-[10px] md:text-sm tracking-widest transition-opacity duration-200 ${
                    isActive ? "text-white" : "text-white/70"
                  }`}>
                    {stat.label}
                  </span>
                  <span className="text-sm md:text-sm font-semibold text-white">
                    {stat.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invoice Overlay */}
        <InvoiceOverlay
          invoice={selectedInvoice}
          invoices={overlayInvoiceList}
          isOpen={isOpen}
          onClose={closeOverlay}
          onNavigate={navigateToInvoice}
        />
        </div>
      ) : (
        <div className="p-4 md:p-8 overflow-x-hidden">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
            <h1 className="page-title">INVOICES</h1>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[140px] md:flex-none">
                <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="SEARCH..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-48 lg:w-72 h-11 md:h-12 pl-9 md:pl-10 pr-3 md:pr-4 bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground tracking-wider focus:outline-none focus:ring-1 focus:ring-primary rounded-sm"
                />
              </div>

              {/* Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 md:gap-2 px-3 md:px-4 h-11 md:h-12 bg-card border border-border text-sm tracking-wider hover:bg-muted/50 transition-colors rounded-sm">
                    <SlidersHorizontal className="w-3 h-3 md:w-4 md:h-4 opacity-50" />
                    <span className="hidden sm:inline opacity-50">FILTER</span>
                    <span className="font-semibold text-foreground">
                      {filterLabels[activeFilter]}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {(Object.keys(filterLabels) as FilterType[]).map((filter) => (
                    <DropdownMenuItem
                      key={filter}
                      onClick={() => {
                        setActiveFilter(filter);
                        if (filter !== "client") setSelectedClientId("all");
                      }}
                      className={activeFilter === filter ? "bg-muted" : ""}
                    >
                      {filterLabels[filter]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {activeFilter === "client" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 md:gap-2 px-3 md:px-4 h-11 md:h-12 bg-card border border-border text-sm tracking-wider hover:bg-muted/50 transition-colors rounded-sm">
                      <span className="text-foreground truncate max-w-[100px]">
                        {selectedClientId === "all"
                          ? "ALL"
                          : clients?.find((c) => c.id === selectedClientId)?.name?.toUpperCase() || "SELECT"}
                      </span>
                      <ChevronDown className="w-3 h-3 md:w-4 md:h-4 opacity-50" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => setSelectedClientId("all")}
                      className={selectedClientId === "all" ? "bg-muted" : ""}
                    >
                      ALL CLIENTS
                    </DropdownMenuItem>
                    {clients?.map((client) => (
                      <DropdownMenuItem
                        key={client.id}
                        onClick={() => setSelectedClientId(client.id)}
                        className={selectedClientId === client.id ? "bg-muted" : ""}
                      >
                        {client.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <ViewToggle tone="dark" />

              <button
                onClick={() => navigate("/invoices/new")}
                className="flex items-center justify-center gap-1 md:gap-2 px-4 md:px-6 h-11 md:h-12 bg-foreground text-background btn-text hover:bg-foreground/90 transition-colors rounded-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">NEW INVOICE</span>
                <span className="sm:hidden">NEW</span>
              </button>
            </div>
          </div>

          {/* Year Filter Tabs */}
          <div className="flex items-center justify-between mb-6 md:mb-8 border-b border-border pb-4 overflow-x-auto">
            <div className="flex items-center gap-4 md:gap-8">
              <button
                onClick={() => setActiveYear("all")}
                className={`nav-item transition-colors whitespace-nowrap ${
                  activeYear === "all"
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ALL ({totalCount})
              </button>
              {yearStats.years.map((year) => (
                <button
                  key={year}
                  onClick={() => setActiveYear(year)}
                  className={`nav-item transition-colors whitespace-nowrap ${
                    activeYear === year
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {year} ({yearStats.counts[year]})
                </button>
              ))}
            </div>
          </div>

          {isLoading && (
            <div className="py-12 text-center text-muted-foreground">
              Loading invoices...
            </div>
          )}

          {!isLoading && filteredInvoices.length === 0 && (
            <div className="py-12 text-center">
              <p className="body-text-muted uppercase tracking-widest mb-4">NO INVOICES FOUND</p>
              <button
                onClick={() => navigate("/invoices/new")}
                className="text-primary hover:text-primary/80 btn-text"
              >
                CREATE YOUR FIRST INVOICE
              </button>
            </div>
          )}

          {!isLoading &&
            groupedInvoices.sortedYears.map((year) => (
              <div key={year} className="mb-8 md:mb-10">
                <h2 className="meta-text text-foreground/50 mb-4 md:mb-6 tracking-wide font-mono">
                  {year}
                </h2>

                {viewMode === "grid" && (
                  <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2 md:gap-6 w-full">
                    {groupedInvoices.groups[year].map((invoice) => (
                      <InvoiceThumbnail
                        key={invoice.id}
                        invoice={invoice}
                        onClick={() => openOverlay(invoice)}
                      />
                    ))}
                  </div>
                )}

                {viewMode === "list" && (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[750px]">
                      <thead>
                        <tr className="text-xs text-muted-foreground uppercase tracking-wider font-normal">
                          <th className="px-4 py-2 text-left w-24 font-normal">Invoice</th>
                          <th className="px-4 py-2 text-left w-40 font-normal">Client</th>
                          <th className="px-4 py-2 text-right w-28 font-normal">Issued</th>
                          <th className="px-4 py-2 text-right w-28 font-normal">Due</th>
                          <th className="px-4 py-2 text-center w-24 font-normal">Status</th>
                          <th className="px-4 py-2 text-right w-28 font-normal">Total</th>
                        </tr>
                      </thead>
                      <tbody className="space-y-2">
                        {groupedInvoices.groups[year].map((invoice) => (
                          <InvoiceListItem
                            key={invoice.id}
                            invoice={invoice}
                            onClick={() => openOverlay(invoice)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}

          <InvoiceOverlay
            invoice={selectedInvoice}
            invoices={overlayInvoiceList}
            isOpen={isOpen}
            onClose={closeOverlay}
            onNavigate={navigateToInvoice}
          />
        </div>
      )}
    </Layout>
  );
}
