import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface BusinessSettings {
  id: string;
  user_id: string;
  company_name: string | null;
  company_email: string | null;
  company_phone: string | null;
  logo_url: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  tax_id: string | null;
  default_payment_terms: string | null;
  payment_instructions: string | null;
  invoice_number_prefix: string | null;
  default_currency: string | null;
  created_at: string;
  updated_at: string;
}

export type UpdateBusinessSettings = Partial<Omit<BusinessSettings, "id" | "user_id" | "created_at" | "updated_at">>;

export function useBusinessSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["business_settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("business_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;

      if (!data) {
        const { data: created, error: insertErr } = await supabase
          .from("business_settings")
          .insert({ user_id: user.id, company_email: user.email })
          .select()
          .single();
        if (insertErr) throw insertErr;
        return created as BusinessSettings;
      }

      return data as BusinessSettings;
    },
    enabled: !!user,
  });
}

export function useUpdateBusinessSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: UpdateBusinessSettings) => {
      if (!user) throw new Error("Not authenticated");
      const { data: existing } = await supabase
        .from("business_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("business_settings")
          .update(data)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("business_settings")
          .insert({ user_id: user.id, ...data });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_settings"] });
      queryClient.invalidateQueries({ queryKey: ["next-invoice-number"] });
      toast.success("Business settings saved");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Compose a multi-line address string from a settings record
export function formatBusinessAddress(s: BusinessSettings | null | undefined): string[] {
  if (!s) return [];
  const lines: string[] = [];
  if (s.address_line1) lines.push(s.address_line1);
  if (s.address_line2) lines.push(s.address_line2);
  const cityLine = [s.city, s.state, s.postal_code].filter(Boolean).join(", ");
  if (cityLine) lines.push(cityLine);
  if (s.country) lines.push(s.country);
  return lines;
}