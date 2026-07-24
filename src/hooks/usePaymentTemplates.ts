import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PaymentMethodField {
  key: string;
  label: string;
  value: string;
}

export interface PaymentMethod {
  type: "bank_transfer" | "international_transfer" | "payid" | "wise" | "paypal" | "cash" | "other";
  label: string;
  enabled: boolean;
  fields: PaymentMethodField[];
}

export interface PaymentTemplate {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  methods: PaymentMethod[];
  intro_text: string | null;
  outro_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentTemplateData {
  name: string;
  is_default?: boolean;
  methods: PaymentMethod[];
  intro_text?: string;
  outro_text?: string;
}

// Default payment method configurations
export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    type: "bank_transfer",
    label: "Bank Transfer (Domestic)",
    enabled: false,
    fields: [
      { key: "account_name", label: "Account Name", value: "" },
      { key: "bsb", label: "BSB", value: "" },
      { key: "account_number", label: "Account Number", value: "" },
      { key: "bank_name", label: "Bank Name", value: "" },
      { key: "reference", label: "Reference", value: "" },
    ],
  },
  {
    type: "international_transfer",
    label: "International Bank Transfer",
    enabled: false,
    fields: [
      { key: "account_name", label: "Account Name", value: "" },
      { key: "bank_name", label: "Bank Name", value: "" },
      { key: "swift_bic", label: "SWIFT/BIC Code", value: "" },
      { key: "iban", label: "IBAN", value: "" },
      { key: "account_number", label: "Account Number", value: "" },
      { key: "bank_address", label: "Bank Address", value: "" },
      { key: "currency", label: "Currency", value: "" },
      { key: "reference", label: "Reference", value: "" },
    ],
  },
  {
    type: "payid",
    label: "PayID",
    enabled: false,
    fields: [
      { key: "payid", label: "PayID", value: "" },
      { key: "payid_name", label: "Name", value: "" },
      { key: "reference", label: "Reference", value: "" },
    ],
  },
  {
    type: "wise",
    label: "Wise",
    enabled: false,
    fields: [
      { key: "email", label: "Email", value: "" },
      { key: "account_holder", label: "Account Holder", value: "" },
      { key: "currency", label: "Currency", value: "" },
      { key: "reference", label: "Reference", value: "" },
    ],
  },
  {
    type: "paypal",
    label: "PayPal",
    enabled: false,
    fields: [
      { key: "email", label: "PayPal Email", value: "" },
      { key: "currency", label: "Currency", value: "" },
      { key: "reference", label: "Reference", value: "" },
    ],
  },
  {
    type: "cash",
    label: "Cash",
    enabled: false,
    fields: [
      { key: "instructions", label: "Instructions", value: "" },
    ],
  },
  {
    type: "other",
    label: "Other",
    enabled: false,
    fields: [
      { key: "method_name", label: "Payment Method", value: "" },
      { key: "instructions", label: "Instructions", value: "" },
      { key: "reference", label: "Reference", value: "" },
    ],
  },
];

export function usePaymentTemplates() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["payment-templates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_instruction_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map((template) => ({
        ...template,
        methods: (template.methods as unknown as PaymentMethod[]) || [],
      })) as PaymentTemplate[];
    },
    enabled: !!user,
  });
}

export function useDefaultPaymentTemplate() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["default-payment-template", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_instruction_templates")
        .select("*")
        .eq("is_default", true)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;
      
      return {
        ...data,
        methods: (data.methods as unknown as PaymentMethod[]) || [],
      } as PaymentTemplate;
    },
    enabled: !!user,
  });
}

export function useCreatePaymentTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreatePaymentTemplateData) => {
      if (!user) throw new Error("Not authenticated");

      // If this is set as default, unset other defaults first
      if (data.is_default) {
        await supabase
          .from("payment_instruction_templates")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }

      const { data: template, error } = await supabase
        .from("payment_instruction_templates")
        .insert([{
          user_id: user.id,
          name: data.name,
          is_default: data.is_default || false,
          methods: JSON.parse(JSON.stringify(data.methods)),
          intro_text: data.intro_text || null,
          outro_text: data.outro_text || null,
        }])
        .select()
        .single();

      if (error) throw error;
      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-templates"] });
      queryClient.invalidateQueries({ queryKey: ["default-payment-template"] });
      toast.success("Payment template saved!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdatePaymentTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...data }: CreatePaymentTemplateData & { id: string }) => {
      if (!user) throw new Error("Not authenticated");

      // If this is set as default, unset other defaults first
      if (data.is_default) {
        await supabase
          .from("payment_instruction_templates")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .neq("id", id);
      }

      const { error } = await supabase
        .from("payment_instruction_templates")
        .update({
          name: data.name,
          is_default: data.is_default || false,
          methods: JSON.parse(JSON.stringify(data.methods)),
          intro_text: data.intro_text || null,
          outro_text: data.outro_text || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-templates"] });
      queryClient.invalidateQueries({ queryKey: ["default-payment-template"] });
      toast.success("Payment template updated!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeletePaymentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payment_instruction_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-templates"] });
      queryClient.invalidateQueries({ queryKey: ["default-payment-template"] });
      toast.success("Payment template deleted!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
