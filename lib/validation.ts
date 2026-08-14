import { z } from "zod";

const email = z.string().trim().email("Enter a valid email address.");
const phone = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{6,14}$/, "Use a valid phone number with country code, e.g. +14155552671.");

export const messageSchema = z.object({
  body: z.string().trim().max(300, "Keep your message under 300 characters."),
  hasImage: z.boolean(),
  website: z.string().max(0).optional(),
}).superRefine((value, context) => {
  if (!value.body && !value.hasImage) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Write a message or add an image before sending.", path: ["body"] });
  }
});

export const waitlistSchema = z
  .object({
    firstName: z.string().trim().max(80, "First name is too long.").optional().or(z.literal("")),
    email: z.string().trim().optional().or(z.literal("")),
    phone: z.string().trim().optional().or(z.literal("")),
    consent: z.literal(true, { errorMap: () => ({ message: "Please agree to receive launch updates." }) }),
    website: z.string().max(0).optional(),
  })
  .superRefine((value, context) => {
    if (!value.email && !value.phone) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Add an email address or phone number.", path: ["email"] });
    }
    if (value.email && !email.safeParse(value.email).success) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid email address.", path: ["email"] });
    }
    if (value.phone && !phone.safeParse(value.phone).success) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Use a valid phone number with country code, e.g. +14155552671.", path: ["phone"] });
    }
  });

export const normalizePhone = (value: string) => value.replace(/[\s()-]/g, "");

export const normalizeHandle = (value: string) => value.trim().toLowerCase().replace(/^@/, "");

const reservedHandles = new Set(["api", "dashboard", "m", "waitlist", "create", "terms", "privacy"]);

export const creatorSchema = z.object({
  handle: z.string().transform(normalizeHandle).pipe(z.string().regex(/^[a-z0-9_]{3,30}$/, "Use 3–30 lowercase letters, numbers, or underscores.")),
  key: z.string().min(8, "Use at least 8 characters for your creator key.").max(200),
}).superRefine((value, context) => {
  if (reservedHandles.has(value.handle)) context.addIssue({ code: z.ZodIssueCode.custom, message: "That link name isn’t available.", path: ["handle"] });
});
