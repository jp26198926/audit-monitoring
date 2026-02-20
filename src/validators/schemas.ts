import { z } from "zod";

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// User schemas
export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role_id: z.number().int().positive("Role is required"),
  is_active: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role_id: z.number().int().positive().optional(),
  is_active: z.boolean().optional(),
});

// Vessel schemas
export const createVesselSchema = z.object({
  vessel_name: z.string().min(2, "Vessel name must be at least 2 characters"),
  vessel_code: z.string().min(2, "Vessel code must be at least 2 characters"),
  registration_number: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).optional().default("Active"),
});

export const updateVesselSchema = createVesselSchema.partial();

// Audit Type schemas
export const createAuditTypeSchema = z.object({
  type_name: z.string().min(2, "Type name must be at least 2 characters"),
  description: z.string().optional(),
  is_active: z.boolean().optional().default(true),
});

export const updateAuditTypeSchema = createAuditTypeSchema.partial();

// Audit Party schemas
export const createAuditPartySchema = z.object({
  party_name: z.string().min(2, "Party name must be at least 2 characters"),
});

export const updateAuditPartySchema = createAuditPartySchema.partial();

// Audit Company schemas
export const createAuditCompanySchema = z.object({
  company_name: z.string().min(2, "Company name must be at least 2 characters"),
  contact_person: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  is_active: z.boolean().optional().default(true),
});

export const updateAuditCompanySchema = createAuditCompanySchema.partial();

// Auditor schemas
export const createAuditorSchema = z.object({
  audit_company_id: z.number().int().positive("Audit company ID is required"),
  auditor_name: z.string().min(2, "Auditor name must be at least 2 characters"),
  certification: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  is_active: z.boolean().optional().default(true),
});

export const updateAuditorSchema = createAuditorSchema.partial();

// Audit Auditor Assignment schemas
export const assignAuditorSchema = z.object({
  audit_id: z.number().int().positive("Audit ID is required"),
  auditor_id: z.number().int().positive("Auditor ID is required"),
  role: z
    .string()
    .min(2, "Role must be at least 2 characters")
    .optional()
    .default("Auditor"),
});

export const updateAuditorRoleSchema = z.object({
  role: z.string().min(2, "Role must be at least 2 characters"),
});

// Audit Result schemas
export const createAuditResultSchema = z.object({
  result_name: z.string().min(2, "Result name must be at least 2 characters"),
  description: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export const updateAuditResultSchema = createAuditResultSchema.partial();

// Audit schemas
export const createAuditSchema = z.object({
  vessel_id: z.number().int().positive("Vessel ID is required"),
  audit_type_id: z.number().int().positive("Audit type ID is required"),
  audit_party_id: z.number().int().positive("Audit party ID is required"),
  audit_company_id: z.number().int().positive().optional().nullable(),
  audit_reference: z.string().min(2).optional(), // Auto-generated if not provided
  audit_start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  audit_end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .or(z.literal(""))
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  next_due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .or(z.literal(""))
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  location: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  status: z
    .enum(["Planned", "Ongoing", "Completed", "Closed"])
    .optional()
    .default("Planned"),
  audit_result_id: z.number().int().positive().optional().nullable(),
  remarks: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
});

export const updateAuditSchema = z.object({
  vessel_id: z.number().int().positive().optional(),
  audit_type_id: z.number().int().positive().optional(),
  audit_party_id: z.number().int().positive().optional(),
  audit_reference: z.string().min(2).optional(),
  audit_start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  audit_end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .or(z.literal(""))
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  next_due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .or(z.literal(""))
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  location: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  status: z.enum(["Planned", "Ongoing", "Completed", "Closed"]).optional(),
  audit_result_id: z.number().int().positive().optional().nullable(),
  report_file_path: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  remarks: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
});

// Finding schemas
export const createFindingSchema = z.object({
  audit_id: z.number().int().positive("Audit ID is required"),
  category: z.enum(["Major", "Minor", "Observation"], {
    required_error: "Category is required",
  }),
  description: z.string().min(10, "Description must be at least 10 characters"),
  root_cause: z.string().optional().nullable(),
  corrective_action: z.string().optional().nullable(),
  responsible_person: z.string().optional().nullable(),
  target_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  status: z
    .enum(["Open", "In Progress", "Submitted", "Closed", "Overdue"])
    .optional()
    .default("Open"),
});

export const updateFindingSchema = z.object({
  category: z.enum(["Major", "Minor", "Observation"]).optional(),
  description: z.string().min(10).optional(),
  root_cause: z.string().optional().nullable(),
  corrective_action: z.string().optional().nullable(),
  responsible_person: z.string().optional().nullable(),
  target_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  status: z
    .enum(["Open", "In Progress", "Submitted", "Closed", "Overdue"])
    .optional(),
});

// Dashboard filter schema
export const dashboardFilterSchema = z.object({
  vessel_id: z.number().int().positive().optional(),
  audit_type_id: z.number().int().positive().optional(),
  audit_party_id: z.number().int().positive().optional(),
  status: z.enum(["Planned", "Ongoing", "Completed", "Closed"]).optional(),
  date_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  date_to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

// Company Settings schemas
export const updateCompanySettingsSchema = z.object({
  company_name: z.string().min(2, "Company name must be at least 2 characters"),
  company_address: z.string().optional().nullable(),
  company_phone: z.string().optional().nullable(),
  company_email: z
    .string()
    .email("Invalid email address")
    .optional()
    .nullable()
    .or(z.literal("")),
  contact_person: z.string().optional().nullable(),
  registration_number: z.string().optional().nullable(),
  tax_id: z.string().optional().nullable(),
  website: z
    .string()
    .url("Invalid URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  logo_path: z.string().optional().nullable(),
});
