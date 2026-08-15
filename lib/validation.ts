import { z } from "zod";

export const messageSchema = z.object({
  body: z.string().trim().max(300, "Keep your message under 300 characters."),
  hasImage: z.boolean(),
  website: z.string().max(0).optional(),
}).superRefine((value, context) => {
  if (!value.body && !value.hasImage) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Write a message or add an image before sending.", path: ["body"] });
  }
});

export const normalizeHandle = (value: string) => value.trim().toLowerCase().replace(/^@/, "");

const reservedHandles = new Set(["api", "dashboard", "m", "create", "terms", "privacy"]);

export const creatorSchema = z.object({
  handle: z.string().transform(normalizeHandle).pipe(z.string().regex(/^[a-z0-9_]{3,30}$/, "Use 3–30 lowercase letters, numbers, or underscores.")),
  key: z.string().min(8, "Use at least 8 characters for your creator key.").max(200),
}).superRefine((value, context) => {
  if (reservedHandles.has(value.handle)) context.addIssue({ code: z.ZodIssueCode.custom, message: "That link name isn’t available.", path: ["handle"] });
});
