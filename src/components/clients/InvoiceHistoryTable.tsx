import { Invoice, useUpdateInvoiceStatus, useDeleteInvoice, useCreateInvoice } from "@/hooks/useInvoices";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Eye, Send, Copy, Bell, MoreVertical, CheckCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { InvoiceStatusTimeline } from "./InvoiceStatusTimeline";
import { BillieAssistant } from "./BillieAssistant";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import { FollowUpSuggestions } from "@/components/invoices/FollowUpSuggestions";
import { deriveInvoiceStatus } from "@/lib/invoiceStatus";

interface InvoiceHistoryTableProps {
  invoices: Invoice[];
  isLoading?: boolean;
}

export function InvoiceHistoryTable({ invoices, isLoading }: InvoiceHistoryTableProps) {
  const updateStatus = useUpdateInvoiceStatus();
  const deleteInvoice = useDeleteInvoice();
  const createInvoice = useCreateInvoice();
  const [showAssistant, setShowAssistant] = useState<string | null>(null);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);
  };

  const handleMarkAsSent = (invoiceId: string) => {
    updateStatus.mutate({ id: invoiceId, status: "pending" });
    setShowAssistant(invoiceId);
  };

  const handleDuplicate = (invoice: Invoice) => {
    createInvoice.mutate({
      client_id: invoice.client_id || undefined,
      invoice_number: `${invoice.invoice_number}-COPY`,
      status: "draft",
      issue_date: new Date().toISOString().split("T")[0],
      due_date: invoice.due_date || undefined,
      subtotal: invoice.subtotal,
      tax_rate: invoice.tax_rate,
      tax_amount: invoice.tax_amount,
      total: invoice.total,
      notes: invoice.notes || undefined,
      items: invoice.invoice_items?.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
      })) || [],
    });
  };

  if (isLoading) {
    return (
      <div className="bg-background">
        <div className="px-8 py-6 border-b border-border">
          <h3 className="font-display text-xl text-foreground tracking-wide">
            INVOICE HISTORY
          </h3>
        </div>
        <div className="px-8 py-6 animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-background">
        <div className="px-8 py-6 border-b border-border">
          <h3 className="font-display text-xl text-foreground tracking-wide">
            INVOICE HISTORY
          </h3>
        </div>
        <div className="px-8 py-8 text-center">
          <p className="text-muted-foreground text-sm uppercase tracking-widest">NO INVOICES FOR THIS CLIENT YET</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="px-8 py-6 border-b border-border">
        <h3 className="font-display text-xl text-foreground tracking-wide">
          INVOICE HISTORY
        </h3>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-xs tracking-wider text-muted-foreground pl-8">
              INVOICE
            </TableHead>
            <TableHead className="text-xs tracking-wider text-muted-foreground">
              ISSUE DATE
            </TableHead>
            <TableHead className="text-xs tracking-wider text-muted-foreground">
              DUE DATE
            </TableHead>
            <TableHead className="text-xs tracking-wider text-muted-foreground text-right">
              AMOUNT
            </TableHead>
            <TableHead className="text-xs tracking-wider text-muted-foreground">
              STATUS
            </TableHead>
            <TableHead className="text-xs tracking-wider text-muted-foreground text-right pr-8">
              ACTIONS
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <>
              <TableRow
                key={invoice.id}
                className="border-border cursor-pointer"
                onClick={() =>
                  setExpandedInvoice(
                    expandedInvoice === invoice.id ? null : invoice.id
                  )
                }
              >
              <TableCell className="font-mono text-sm pl-8">
                {invoice.invoice_number}
              </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(invoice.issue_date), "dd MMM yyyy")}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {invoice.due_date
                    ? format(new Date(invoice.due_date), "dd MMM yyyy")
                    : "—"}
                </TableCell>
                <TableCell className="text-sm text-right font-mono">
                  {formatCurrency(invoice.total)}
                </TableCell>
                <TableCell>
                  <InvoiceStatusBadge invoice={invoice} />
                </TableCell>
                <TableCell className="text-right pr-8">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button className="p-2 hover:bg-muted rounded transition-colors">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem className="gap-2">
                        <Eye className="w-4 h-4" />
                        View Invoice
                      </DropdownMenuItem>
                      {invoice.status === "draft" && (
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsSent(invoice.id);
                          }}
                        >
                          <Send className="w-4 h-4" />
                          Mark as Sent
                        </DropdownMenuItem>
                      )}
                      {invoice.status === "pending" && (
                        <>
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatus.mutate({
                                id: invoice.id,
                                status: "paid",
                              });
                            }}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark as Paid
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowAssistant(invoice.id);
                            }}
                          >
                            <Bell className="w-4 h-4" />
                            Send Reminder
                          </DropdownMenuItem>
                        </>
                      )}
                      {invoice.status === "overdue" && (
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAssistant(invoice.id);
                          }}
                        >
                          <Bell className="w-4 h-4" />
                          Send Reminder
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(invoice);
                        }}
                      >
                        <Copy className="w-4 h-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="gap-2 text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteInvoice.mutate(invoice.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>

              {/* Expanded row for timeline */}
              {expandedInvoice === invoice.id && (
                <TableRow className="border-border bg-muted/30">
                  <TableCell colSpan={6} className="py-4">
                    <InvoiceStatusTimeline invoice={invoice} />
                    {deriveInvoiceStatus(invoice) === "overdue" && (
                      <FollowUpSuggestions invoice={invoice} />
                    )}
                  </TableCell>
                </TableRow>
              )}

              {/* Billie Assistant */}
              {showAssistant === invoice.id && (
                <TableRow className="border-border bg-primary/5">
                  <TableCell colSpan={6} className="py-4">
                    <BillieAssistant
                      invoice={invoice}
                      onClose={() => setShowAssistant(null)}
                    />
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
