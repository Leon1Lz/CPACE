import type { Prisma } from "@prisma/client"
import { DEMO_NOTICE, type DemoProgram } from "../data/demo-programs"
import { editableQuestionSchema } from "./question-input"
import { escapeHtmlText, sanitizeHtml } from "./sanitize"

export function buildDemoCourse(program: DemoProgram, ownerId: string): Prisma.CourseCreateInput {
  const id = `demo-${program.code.toLowerCase()}-course`
  const assessment = (kind: "practice" | "assignment") => {
    const questions = program[kind].map((input, order) => {
      const question = editableQuestionSchema.parse(input)
      return {
        id: `${id}-${kind}-question-${order + 1}`,
        question: question.question, type: question.type, points: question.points, order,
        options: { create: (question.options ?? []).map((option, optionOrder) => ({
          ...option, order: optionOrder, id: `${id}-${kind}-question-${order + 1}-option-${optionOrder + 1}`,
        })) },
      }
    })
    return {
      id: `${id}-${kind}`, title: `[DEMO] ${program.code} ${kind === "practice" ? "Practice Quiz" : "Written Case Assignment"}`,
      description: DEMO_NOTICE,
      type: kind === "practice" ? "PRACTICE_EXAM" as const : "ASSIGNMENT" as const,
      isPublished: false, releaseScores: kind === "practice", passingScore: 70,
      timeLimit: kind === "practice" ? 15 : null, attempts: null,
      motionDetectionEnabled: false, evidenceCaptureEnabled: false,
      questions: { create: questions },
    }
  }
  return {
    id, title: `[DEMO] ${program.name} (${program.code})`, category: program.code,
    description: `${DEMO_NOTICE} Three introductory lessons, a practice quiz, and a written case assignment.`,
    content: sanitizeHtml(`<p>${escapeHtmlText(DEMO_NOTICE)}</p><h2>Learning objectives</h2><ul>${program.objectives.map(objective => `<li>${escapeHtmlText(objective)}</li>`).join("")}</ul>`),
    status: "DRAFT", level: "Introductory", duration: "80 minutes", price: 0,
    learningObjectives: program.objectives,
    creator: { connect: { id: ownerId } }, instructor: { connect: { id: ownerId } },
    modules: { create: program.lessons.map((lesson, order) => ({
      id: `${id}-module-${order + 1}`, title: lesson.title,
      description: lesson.description, duration: lesson.duration, order, isPublished: true,
      content: sanitizeHtml(`<p><strong>${escapeHtmlText(DEMO_NOTICE)}</strong></p>${lesson.sections.map(section => `<h2>${escapeHtmlText(section.heading)}</h2>${section.paragraphs.map(paragraph => `<p>${escapeHtmlText(paragraph)}</p>`).join("")}`).join("")}`),
    })) },
    assessments: { create: [assessment("practice"), assessment("assignment")] },
  }
}
