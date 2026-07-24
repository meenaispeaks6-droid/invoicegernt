import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { invoiceSchema, validateInput } from "@/lib/validations";
import { supabase as _sb } from "@/integrations/supabase/client";

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string | null;
  invoice_number: string;
  internal_title: string | null;
  status: "paid" | "pending" | "draft" | "overdue";
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  viewed_at: string | null;
  share_token: string | null;
  pin_code: string | null;
  payment_methods: object | null;
  payment_intro_text: string | null;
  payment_outro_text: string | null;
  payment_reference: string | null;
  clients?: {
    name: string;
    email: string | null;
    company: string | null;
  } | null;
  invoice_items?: InvoiceItem[];
}

export interface CreateInvoiceData {
  client_id?: string;
  invoice_number: string;
  internal_title?: string;
  status?: "paid" | "pending" | "draft" | "overdue";
  issue_date?: string;
  due_date?: string;
  subtotal: number;
  tax_rate?: number;
  tax_amount?: number;
  total: number;
  notes?: string;
  items: InvoiceItem[];
  payment_methods?: object;
  payment_intro_text?: string;
  payment_outro_text?: string;
  payment_reference?: string;
}

// Hook to get the next sequential invoice number
export function useNextInvoiceNumber() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["next-invoice-number", user?.id],
    queryFn: async () => {
      // Pull configured prefix from business settings
      const { data: bs } = await supabase
        .from("business_settings")
        .select("invoice_number_prefix")
        .eq("user_id", user!.id)
        .maybeSingle();
      const prefix = (bs?.invoice_number_prefix ?? "INV-") || "INV-";

      const { data, error } = await supabase
        .from("invoices")
        .select("invoice_number")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Find the highest number from existing invoices
      let maxNum = 0;
      const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`^${escaped}(\\d+)$`);
      
      data?.forEach((inv) => {
        const match = inv.invoice_number.match(pattern);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });

      const nextNum = maxNum + 1;
      return `${prefix}${nextNum.toString().padStart(4, "0")}`;
    },
    enabled: !!user,
  });
}

// Hook to check if an invoice number already exists
export function useCheckInvoiceNumberExists() {
  const { user } = useAuth();

  return async (invoiceNumber: string): Promise<boolean> => {
    if (!user) return false;

    const { data, error } = await supabase
      .from("invoices")
      .select("id")
      .eq("invoice_number", invoiceNumber)
      .maybeSingle();

    if (error) {
      console.error("Error checking invoice number:", error);
      return false;
    }

    return !!data;
  };
}

export function useInvoices() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["invoices", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          clients (name, email, company),
          invoice_items (*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!user,
  });
}

export function useInvoice(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          clients (name, email, company, address, phone),
          invoice_items (*)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Invoice;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateInvoiceData) => {
      if (!user) throw new Error("Not authenticated");

      // Validate input
      const validated = validateInput(invoiceSchema, {
        ...data,
        client_id: data.client_id || "",
        issue_date: data.issue_date || new Date().toISOString().split("T")[0],
        due_date: data.due_date || "",
        status: data.status || "draft",
        tax_rate: data.tax_rate || 0,
        tax_amount: data.tax_amount || 0,
        notes: data.notes || "",
        internal_title: data.internal_title || "",
        payment_intro_text: data.payment_intro_text || "",
        payment_outro_text: data.payment_outro_text || "",
        payment_reference: data.payment_reference || "",
      });

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          user_id: user.id,
          client_id: validated.client_id || null,
          invoice_number: validated.invoice_number,
          internal_title: validated.internal_title || null,
          status: validated.status || "draft",
          issue_date: validated.issue_date || new Date().toISOString().split("T")[0],
          due_date: validated.due_date || null,
          subtotal: validated.subtotal,
          tax_rate: validated.tax_rate || 0,
          tax_amount: validated.tax_amount || 0,
          total: validated.total,
          notes: validated.notes || null,
          payment_methods: data.payment_methods ? JSON.parse(JSON.stringify(data.payment_methods)) : null,
          payment_intro_text: validated.payment_intro_text || null,
          payment_outro_text: validated.payment_outro_text || null,
          payment_reference: validated.payment_reference || null,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      if (validated.items.length > 0) {
        const { error: itemsError } = await supabase
          .from("invoice_items")
          .insert(
            validated.items.map((item) => ({
              invoice_id: invoice.id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              amount: item.amount,
            }))
          );

        if (itemsError) throw itemsError;
      }

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Invoice["status"] }) => {
      const { error } = await supabase
        .from("invoices")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice status updated!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice deleted!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useInvoiceStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["invoice-stats", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("status, total");

      if (error) throw error;

      const stats = {
        drafts: 0,
        pending: 0,
        overdue: 0,
        paid: 0,
        ytd: 0,
      };

      data.forEach((invoice) => {
        if (invoice.status === "draft") stats.drafts++;
        if (invoice.status === "pending") stats.pending++;
        if (invoice.status === "overdue") stats.overdue++;
        if (invoice.status === "paid") {
          stats.paid++;
          stats.ytd += Number(invoice.total);
        }
      });

      return stats;
    },
    enabled: !!user,
  });
}
