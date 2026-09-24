import { z } from "zod"

export const homepageFaqSchema = z.object({
  category: z.enum(["certifications", "partnerships", "verification"]),
  question: z.string().trim().min(5).max(240),
  answer: z.string().trim().min(5).max(3000),
  isPublished: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
})
