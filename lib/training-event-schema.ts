import { z } from "zod"

export const trainingEventSchema = z.object({
  title: z.string().trim().min(1).max(160),
  certification: z.string().trim().min(1).max(40),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  time: z.string().trim().min(1).max(80),
  location: z.string().trim().min(1).max(160),
  deliveryMode: z.enum(["online", "hybrid", "in-person"]),
  color: z.enum([
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-amber-600",
    "from-blue-500 to-cyan-600",
    "from-rose-500 to-pink-600",
    "from-violet-500 to-purple-600",
  ]),
  spots: z.string().trim().min(1).max(100),
  registrationUrl: z.string().url().max(500).refine(value => ["http:", "https:"].includes(new URL(value).protocol), "Registration URL must use HTTP or HTTPS."),
  isPublished: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
}).refine(value => !value.endDate || value.endDate >= value.startDate, {
  message: "End date must be on or after the start date.",
  path: ["endDate"],
})
