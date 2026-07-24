import { Layout } from "@/components/layout/Layout";
import { Plus, MoreVertical, Mail, Trash2, Edit2, Phone, Search, LayoutGrid, List } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { NewClientDialog } from "@/components/clients/NewClientDialog";
import { useClients, useDeleteClient } from "@/hooks/useClients";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type ClientColor = "blue" | "red" | "purple" | "green" | "orange" | "yellow";
type ViewMode = "card" | "list";

const colorConfig: Record<ClientColor, string> = {
  blue: "bg-client-blue",
  red: "bg-client-red",
  purple: "bg-client-purple",
  green: "bg-client-green",
  orange: "bg-client-orange",
  yellow: "bg-client-yellow",
};

const colorArray: ClientColor[] = ["blue", "red", "purple", "green", "orange", "yellow"];

export default function Clients() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const navigate = useNavigate();
  const { data: clients, isLoading } = useClients();
  const deleteClient = useDeleteClient();

  const getColor = (index: number): ClientColor => {
    return colorArray[index % colorArray.length];
  };

  // Filter clients based on search query
  const filteredClients = useMemo(() => {
    if (!clients) return [];
    if (!searchQuery) return clients;

    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clients, searchQuery]);

  return (
    <Layout>
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <h1 className="page-title">CLIENTS</h1>
          <div className="flex items-center gap-2 md:gap-3">
            {/* Search */}
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="SEARCH..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-72 h-11 md:h-12 pl-9 md:pl-10 pr-3 md:pr-4 bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground tracking-wider focus:outline-none focus:ring-1 focus:ring-primary rounded-sm"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center h-11 md:h-[42px] bg-card border border-border rounded-sm">
              <button
                onClick={() => setViewMode("card")}
                className={`h-full px-3 transition-colors ${
                  viewMode === "card"
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Card view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-border" />
              <button
                onClick={() => setViewMode("list")}
                className={`h-full px-3 transition-colors ${
                  viewMode === "list"
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Add Client Button */}
            <button 
              onClick={() => setDialogOpen(true)}
              className="flex items-center justify-center gap-1 md:gap-2 px-4 md:px-6 h-11 md:h-12 bg-foreground text-background btn-text hover:bg-foreground/90 transition-colors rounded-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">ADD CLIENT</span>
              <span className="sm:hidden">ADD</span>
            </button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            Loading clients...
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredClients.length === 0 && (
          <div className="text-center py-12">
            <p className="body-text-muted uppercase tracking-widest mb-4">
              {searchQuery ? "NO CLIENTS FOUND" : "NO CLIENTS YET"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setDialogOpen(true)}
                className="text-primary hover:text-primary/80 btn-text"
              >
                ADD YOUR FIRST CLIENT
              </button>
            )}
          </div>
        )}

        {/* Card View */}
        {!isLoading && filteredClients.length > 0 && viewMode === "card" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredClients.map((client, index) => (
              <div
                key={client.id}
                onClick={() => navigate(`/clients/${client.id}`)}
                className="bg-card border border-border overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
              >
                {/* Color bar */}
                <div className={`h-1 ${colorConfig[getColor(index)]}`} />

                {/* Card content */}
                <div className="p-4 md:p-6">
                  {/* Avatar and actions */}
                  <div className="flex items-start justify-between mb-4 md:mb-6">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-card border border-border flex items-center justify-center">
                      <span className="font-display text-base md:text-lg text-foreground">
                        {client.name.charAt(0)}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1"
                        >
                          <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/clients/${client.id}`);
                          }}
                          className="gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteClient.mutate(client.id);
                          }}
                          className="gap-2 text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Client info */}
                  <h3 className="card-title text-lg mb-1">{client.name.toUpperCase()}</h3>
                  {client.company && (
                    <p className="body-text-muted mb-4 md:mb-6">{client.company}</p>
                  )}
                  {!client.company && <div className="mb-4 md:mb-6" />}

                  {/* Divider */}
                  <div className="border-t border-border pt-3 md:pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1.5 md:space-y-2">
                        {client.email && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="body-text-muted truncate max-w-[180px]">{client.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-3 h-3 md:w-4 md:h-4" />
                          <span className="body-text-muted">{client.phone || "No phone"}</span>
                        </div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {!isLoading && filteredClients.length > 0 && viewMode === "list" && (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[600px] border-separate border-spacing-y-2">
              <thead>
                <tr className="meta-text uppercase tracking-wider font-normal">
                  <th className="px-4 py-2 text-left font-normal" colSpan={2}>Client</th>
                  <th className="px-4 py-2 text-left font-normal">Company</th>
                  <th className="px-4 py-2 text-left font-normal">Email</th>
                  <th className="px-4 py-2 text-left font-normal">Phone</th>
                  <th className="px-4 py-2 text-right w-12 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client, index) => (
                  <tr
                    key={client.id}
                    onClick={() => navigate(`/clients/${client.id}`)}
                    className="bg-card cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    {/* Color indicator */}
                    <td className="px-4 py-3 border-l border-t border-b border-border rounded-l-sm">
                      <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${colorConfig[getColor(index)]}`}>
                        <span className="font-display text-xs text-white">
                          {client.name.charAt(0)}
                        </span>
                      </div>
                    </td>
                    {/* Name */}
                    <td className="px-4 py-3 border-t border-b border-border font-display body-text text-foreground uppercase tracking-wide whitespace-nowrap">
                      {client.name}
                    </td>
                    {/* Company */}
                    <td className="px-4 py-3 border-t border-b border-border body-text-muted uppercase whitespace-nowrap">
                      {client.company || "—"}
                    </td>
                    {/* Email */}
                    <td className="px-4 py-3 border-t border-b border-border body-text-muted truncate max-w-[200px]">
                      {client.email || "—"}
                    </td>
                    {/* Phone */}
                    <td className="px-4 py-3 border-t border-b border-border body-text-muted font-mono whitespace-nowrap">
                      {client.phone || "—"}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3 border-r border-t border-b border-border rounded-r-sm text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground hover:text-foreground transition-colors p-2"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/clients/${client.id}`);
                            }}
                            className="gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteClient.mutate(client.id);
                            }}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NewClientDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Layout>
  );
}
