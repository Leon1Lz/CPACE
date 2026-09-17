import { z } from "zod"

export const editableQuestionSchema = z.object({
  question: z.string().trim().min(1).max(10000),
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY"]),
  points: z.number().finite().min(0).max(10000),
  options: z.array(z.object({
    text: z.string().trim().min(1).max(5000),
    isCorrect: z.boolean(),
  }).strict()).max(20).optional(),
}).strict().superRefine((value, ctx) => {
  const choices = value.type === "MULTIPLE_CHOICE" || value.type === "TRUE_FALSE"
  if (choices && (!value.options || value.options.length < 2 || value.options.filter(option => option.isCorrect).length !== 1))
    ctx.addIssue({ code: "custom", message: "Provide at least two options and exactly one correct answer." })
  if (value.type === "TRUE_FALSE" && value.options?.length !== 2)
    ctx.addIssue({ code: "custom", message: "True/false requires two options." })
  if (!choices && value.options?.length)
    ctx.addIssue({ code: "custom", message: "Written questions cannot have options." })
})
