import { z } from "zod";

// Client validation schema
export const clientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(255, "Name must be less than 255 characters"),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters")
    .optional()
    .or(z.literal("")),
  company: z
    .string()
    .trim()
    .max(255, "Company name must be less than 255 characters")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .trim()
    .max(500, "Address must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?[0-9\s\-()]*$/, "Invalid phone number format")
    .max(50, "Phone must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  tax_id: z
    .string()
    .trim()
    .max(50, "Tax ID must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  preferred_currency: z
    .string()
    .max(10, "Currency code must be less than 10 characters")
    .optional(),
  payment_terms: z
    .number()
    .int()
    .min(0, "Payment terms must be positive")
    .max(365, "Payment terms must be less than 365 days")
    .optional(),
  notes: z
    .string()
    .trim()
    .max(2000, "Notes must be less than 2000 characters")
    .optional()
    .or(z.literal("")),
});

export type ClientInput = z.infer<typeof clientSchema>;

// Invoice item validation schema
export const invoiceItemSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(500, "Description must be less than 500 characters"),
  quantity: z
    .number()
    .min(0.01, "Quantity must be greater than 0")
    .max(999999, "Quantity is too large"),
  unit_price: z
    .number()
    .min(0, "Unit price must be positive")
    .max(999999999, "Unit price is too large"),
  amount: z
    .number()
    .min(0, "Amount must be positive"),
});

// Invoice validation schema
export const invoiceSchema = z.object({
  client_id: z.string().uuid("Invalid client ID").optional().or(z.literal("")),
  invoice_number: z
    .string()
    .trim()
    .min(1, "Invoice number is required")
    .max(50, "Invoice number must be less than 50 characters"),
  internal_title: z
    .string()
    .trim()
    .max(255, "Internal title must be less than 255 characters")
    .optional()
    .or(z.literal("")),
  status: z.enum(["draft", "pending", "paid", "overdue"]).optional(),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional()
    .or(z.literal("")),
  subtotal: z
    .number()
    .min(0, "Subtotal must be positive")
    .max(999999999, "Subtotal is too large"),
  tax_rate: z
    .number()
    .min(0, "Tax rate must be positive")
    .max(100, "Tax rate must be less than 100%")
    .optional(),
  tax_amount: z
    .number()
    .min(0, "Tax amount must be positive")
    .optional(),
  total: z
    .number()
    .min(0, "Total must be positive")
    .max(999999999, "Total is too large"),
  notes: z
    .string()
    .trim()
    .max(2000, "Notes must be less than 2000 characters")
    .optional()
    .or(z.literal("")),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  payment_intro_text: z
    .string()
    .trim()
    .max(1000, "Payment intro text must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
  payment_outro_text: z
    .string()
    .trim()
    .max(1000, "Payment outro text must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
  payment_reference: z
    .string()
    .trim()
    .max(100, "Payment reference must be less than 100 characters")
    .optional()
    .or(z.literal("")),
}).refine(
  (data) => {
    if (data.due_date && data.issue_date) {
      return new Date(data.due_date) >= new Date(data.issue_date);
    }
    return true;
  },
  {
    message: "Due date must be on or after the issue date",
    path: ["due_date"],
  }
);

export type InvoiceInput = z.infer<typeof invoiceSchema>;

// User settings validation schema
export const userSettingsSchema = z.object({
  first_name: z
    .string()
    .trim()
    .max(100, "First name must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  last_name: z
    .string()
    .trim()
    .max(100, "Last name must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters")
    .optional()
    .or(z.literal("")),
  company_name: z
    .string()
    .trim()
    .max(255, "Company name must be less than 255 characters")
    .optional()
    .or(z.literal("")),
  default_currency: z
    .string()
    .max(10, "Currency code must be less than 10 characters")
    .optional(),
});

export type UserSettingsInput = z.infer<typeof userSettingsSchema>;

// Payment template validation schema
export const paymentTemplateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Template name is required")
    .max(100, "Template name must be less than 100 characters"),
  intro_text: z
    .string()
    .trim()
    .max(1000, "Intro text must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
  outro_text: z
    .string()
    .trim()
    .max(1000, "Outro text must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
  is_default: z.boolean().optional(),
});

export type PaymentTemplateInput = z.infer<typeof paymentTemplateSchema>;

// Helper function to safely validate input - throws on failure
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.errors[0];
    throw new Error(firstError?.message || "Validation failed");
  }
  return result.data;
}
