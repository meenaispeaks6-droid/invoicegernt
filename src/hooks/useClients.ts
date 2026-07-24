import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { clientSchema, validateInput } from "@/lib/validations";

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  company: string | null;
  address: string | null;
  phone: string | null;
  tax_id?: string | null;
  preferred_currency?: string | null;
  payment_terms?: number | null;
  status?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateClientData {
  name: string;
  email?: string;
  company?: string;
  address?: string;
  phone?: string;
}

export function useClients() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["clients", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Client[];
    },
    enabled: !!user,
  });
}

export function useClient(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Client;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateClientData) => {
      if (!user) throw new Error("Not authenticated");

      // Ensure the database client has a valid authenticated session.
      // If the auth state is present in React but the client lost its session,
      // requests will be sent as anonymous and fail RLS.
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session) throw new Error("Session expired. Please sign in again.");

      // Re-apply session defensively (no-op if already set)
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      // Validate input
      const validatedData = validateInput(clientSchema, data);

      const { data: client, error } = await supabase
        .from("clients")
        .insert({
          user_id: user.id,
          name: validatedData.name,
          email: validatedData.email || null,
          company: validatedData.company || null,
          address: validatedData.address || null,
          phone: validatedData.phone || null,
        })
        .select()
        .single();

      if (error) throw error;
      return client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Client> & { id: string }) => {
      // Validate input - partial validation for updates
      const validatedData = validateInput(clientSchema.partial(), data);

      const { error } = await supabase
        .from("clients")
        .update(validatedData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client deleted!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useClientStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-stats", user?.id],
    queryFn: async () => {
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("id");

      if (clientsError) throw clientsError;

      return {
        totalClients: clients.length,
      };
    },
    enabled: !!user,
  });
}
