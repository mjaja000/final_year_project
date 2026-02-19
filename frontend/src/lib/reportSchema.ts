import * as z from "zod";

const incidentCategories = ["Speeding", "Reckless", "Overcharging", "Harassment", "Loud Music"] as const;
const ntsaCategories = [
  "Vehicle Safety Violations",
  "Sexual Harassment & Assault",
  "Dangerous Driving & Operations",
  "Commercial Exploitation",
  "Verbal Abuse & Harassment",
  "Service Quality Issues",
] as const;
const ntsaPriorities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

const generalSchema = z.object({
  reportType: z.literal("GENERAL"),
  plateNumber: z.string().min(1, "Plate number is required"),
  rating: z.number().min(1, "Rating is required").max(5),
  details: z.string().optional(),
});

const incidentSchema = z.object({
  reportType: z.literal("INCIDENT"),
  plateNumber: z.string().min(1, "Plate number is required"),
  category: z.enum(incidentCategories, { errorMap: () => ({ message: "Category is required" }) }),
  details: z.string().optional(),
});

const ntsaSchema = z.object({
  reportType: z.literal("REPORT_TO_NTSA"),
  plateNumber: z.string().min(1, "Plate number is required"),
  ntsaPriority: z.enum(ntsaPriorities, { errorMap: () => ({ message: "Priority is required" }) }),
  ntsaCategory: z.enum(ntsaCategories, { errorMap: () => ({ message: "Category is required" }) }),
  details: z.string().optional(),
});

export const reportSchema = z.discriminatedUnion("reportType", [generalSchema, incidentSchema, ntsaSchema]);

export type ReportData = z.infer<typeof reportSchema>;
export type ReportType = ReportData["reportType"];

export const INCIDENT_CATEGORIES = incidentCategories;
export const NTSA_CATEGORIES = ntsaCategories;
export const NTSA_PRIORITIES = ntsaPriorities;
