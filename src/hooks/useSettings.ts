import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface UserSettings {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company_name: string | null;
  avatar_url: string | null;
  email_notifications: boolean;
  invoice_reminders: boolean;
  payment_alerts: boolean;
  two_factor_enabled: boolean;
  onboarding_completed: boolean;
  default_currency: string | null;
  sample_data_seeded: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateSettingsData {
  first_name?: string;
  last_name?: string;
  email?: string;
  company_name?: string;
  avatar_url?: string;
  email_notifications?: boolean;
  invoice_reminders?: boolean;
  payment_alerts?: boolean;
  two_factor_enabled?: boolean;
  onboarding_completed?: boolean;
  default_currency?: string;
  sample_data_seeded?: boolean;
}

export function useSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["settings", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // If no settings exist, create default settings
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from("user_settings")
          .insert({
            user_id: user.id,
            email: user.email,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newSettings as UserSettings;
      }

      return data as UserSettings;
    },
    enabled: !!user,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: UpdateSettingsData) => {
      if (!user) throw new Error("Not authenticated");

      // Check if settings exist
      const { data: existing } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        // Update existing settings
        const { error } = await supabase
          .from("user_settings")
          .update(data)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from("user_settings")
          .insert({
            user_id: user.id,
            ...data,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
