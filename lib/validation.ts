import { z } from "zod";

const email = z.string().trim().email("Enter a valid email address.");
const phone = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{6,14}$/, "Use a valid phone number with country code, e.g. +14155552671.");

export const messageSchema = z.object({
  body: z.string().trim().min(1, "Write a message before sending.").max(300, "Keep your message under 300 characters."),
  website: z.string().max(0).optional(),
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
