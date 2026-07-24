import { supabase } from "@/integrations/supabase/client";

/**
 * Seed a realistic set of demo clients + invoices for a brand-new user.
 * Idempotent at the call-site: callers must check `sample_data_seeded`
 * on user_settings before invoking. This function also flips that flag
 * on success so subsequent calls become no-ops.
 */
export async function seedSampleData(userId: string): Promise<void> {
  // Re-check the flag inside the function to defend against double-invocation
  const { data: settings } = await supabase
    .from("user_settings")
    .select("sample_data_seeded")
    .eq("user_id", userId)
    .maybeSingle();

  if (settings?.sample_data_seeded) return;

  // ---------- Clients ----------
  const clientsPayload = [
    {
      user_id: userId,
      name: "Olivia Bennett",
      company: "Acme Corp",
      email: "olivia@acmecorp.com",
      phone: "+1 (415) 555-0142",
      address: "120 Market St, San Francisco, CA 94105",
      tax_id: "US-94-2837461",
      payment_terms: 30,
      status: "active",
    },
    {
      user_id: userId,
      name: "Marcus Hale",
      company: "Sunrise Studios",
      email: "marcus@sunrisestudios.co",
      phone: "+1 (212) 555-0177",
      address: "88 Greene St, New York, NY 10012",
      payment_terms: 14,
      status: "active",
    },
    {
      user_id: userId,
      name: "Sofia Lindqvist",
      company: "Nordic Design Co",
      email: "sofia@nordicdesign.se",
      phone: "+46 8 555 0193",
      address: "Birger Jarlsgatan 24, 114 34 Stockholm, Sweden",
      payment_terms: 30,
      status: "active",
    },
    {
      user_id: userId,
      name: "Jasmine Carter",
      company: "Bloom Agency",
      email: "jasmine@bloomagency.io",
      phone: "+44 20 7946 0321",
      address: "45 Shoreditch High St, London E1 6JJ, UK",
      payment_terms: 21,
      status: "active",
    },
  ];

  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .insert(clientsPayload)
    .select("id, company");

  if (clientsError || !clients) {
    console.error("Failed to seed clients", clientsError);
    return;
  }

  const clientByCompany: Record<string, string> = {};
  for (const c of clients) clientByCompany[c.company || ""] = c.id;

  // ---------- Invoices ----------
  const today = new Date();
  const daysAgo = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  };

  type Item = { description: string; quantity: number; unit_price: number };
  const invoiceBlueprints: Array<{
    invoice_number: string;
    internal_title: string;
    status: "paid" | "pending" | "draft" | "overdue";
    client: string;
    issue_days_ago: number;
    due_in_days: number;
    items: Item[];
    notes?: string;
  }> = [
    {
      invoice_number: "INV-0001",
      internal_title: "Acme — Q3 brand refresh",
      status: "paid",
      client: "Acme Corp",
      issue_days_ago: 78,
      due_in_days: 14,
      items: [
        { description: "Brand strategy workshop (2 days)", quantity: 2, unit_price: 1200 },
        { description: "Logo & identity system", quantity: 1, unit_price: 1800 },
        { description: "Brand guidelines document", quantity: 1, unit_price: 600 },
      ],
      notes: "Thanks for the smooth kickoff — looking forward to phase 2.",
    },
    {
      invoice_number: "INV-0002",
      internal_title: "Sunrise — landing page build",
      status: "paid",
      client: "Sunrise Studios",
      issue_days_ago: 52,
      due_in_days: 14,
      items: [
        { description: "Landing page design", quantity: 1, unit_price: 1400 },
        { description: "Front-end development", quantity: 18, unit_price: 95 },
      ],
    },
    {
      invoice_number: "INV-0003",
      internal_title: "Nordic — monthly retainer Oct",
      status: "pending",
      client: "Nordic Design Co",
      issue_days_ago: 12,
      due_in_days: 30,
      items: [
        { description: "Design retainer — October", quantity: 1, unit_price: 2800 },
        { description: "Additional art direction hours", quantity: 4, unit_price: 120 },
      ],
    },
    {
      invoice_number: "INV-0004",
      internal_title: "Bloom — campaign assets",
      status: "overdue",
      client: "Bloom Agency",
      issue_days_ago: 48,
      due_in_days: 21,
      items: [
        { description: "Social campaign creative (12 assets)", quantity: 12, unit_price: 140 },
        { description: "Motion graphics — hero spot", quantity: 1, unit_price: 950 },
      ],
      notes: "Friendly reminder: payment is now past due.",
    },
    {
      invoice_number: "INV-0005",
      internal_title: "Acme — analytics dashboard",
      status: "pending",
      client: "Acme Corp",
      issue_days_ago: 6,
      due_in_days: 30,
      items: [
        { description: "Dashboard UX research", quantity: 1, unit_price: 1100 },
        { description: "UI design — 8 screens", quantity: 8, unit_price: 220 },
      ],
    },
    {
      invoice_number: "INV-0006",
      internal_title: "Sunrise — Q4 proposal (draft)",
      status: "draft",
      client: "Sunrise Studios",
      issue_days_ago: 1,
      due_in_days: 14,
      items: [
        { description: "Discovery & scoping", quantity: 1, unit_price: 750 },
        { description: "Estimated build hours", quantity: 24, unit_price: 110 },
      ],
    },
  ];

  for (const bp of invoiceBlueprints) {
    const subtotal = bp.items.reduce(
      (sum, it) => sum + it.quantity * it.unit_price,
      0
    );
    const issueDate = daysAgo(bp.issue_days_ago);
    const dueDate = daysAgo(bp.issue_days_ago - bp.due_in_days);

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        user_id: userId,
        client_id: clientByCompany[bp.client] ?? null,
        invoice_number: bp.invoice_number,
        internal_title: bp.internal_title,
        status: bp.status,
        issue_date: issueDate,
        due_date: dueDate,
        subtotal,
        tax_rate: 0,
        tax_amount: 0,
        total: subtotal,
        notes: bp.notes ?? null,
      })
      .select("id")
      .single();

    if (invoiceError || !invoice) {
      console.error("Failed to seed invoice", bp.invoice_number, invoiceError);
      continue;
    }

    const itemsPayload = bp.items.map((it) => ({
      invoice_id: invoice.id,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unit_price,
      amount: it.quantity * it.unit_price,
    }));

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(itemsPayload);

    if (itemsError) {
      console.error("Failed to seed invoice items", bp.invoice_number, itemsError);
    }

    // Backdate paid invoices so revenue charts reflect the timeline.
    if (bp.status === "paid") {
      const paidAt = daysAgo(Math.max(0, bp.issue_days_ago - bp.due_in_days - 2));
      await supabase
        .from("invoices")
        .update({ updated_at: new Date(paidAt).toISOString() })
        .eq("id", invoice.id);
    }
  }

  // Flip the flag so we never seed again for this user
  await supabase
    .from("user_settings")
    .update({ sample_data_seeded: true })
    .eq("user_id", userId);
}