import { describe, expect, it } from "vitest"
import { DEMO_NOTICE, demoPrograms } from "../data/demo-programs"
import { buildDemoCourse } from "../lib/demo-materials"

describe("unofficial program demo materials", () => {
  it("covers the three requested programs with distinct course identifiers", () => {
    expect(demoPrograms.map(program => program.code)).toEqual(["CFMS", "CMMS", "COMS"])
    expect(new Set(demoPrograms.map(program => buildDemoCourse(program, "owner").id)).size).toBe(3)
  })
  for (const program of demoPrograms) {
    it(`${program.code}: keeps courses draft and assessments unpublished`, () => {
      const course = buildDemoCourse(program, "owner")
      expect(course.status).toBe("DRAFT")
      expect(course.description).toContain(DEMO_NOTICE)
      const assessments = course.assessments!.create as { type: string; isPublished: boolean; releaseScores: boolean; motionDetectionEnabled: boolean }[]
      expect(assessments.map(assessment => assessment.type)).toEqual(["PRACTICE_EXAM", "ASSIGNMENT"])
      expect(assessments.every(assessment => !assessment.isPublished && !assessment.motionDetectionEnabled)).toBe(true)
      expect(assessments[1].releaseScores).toBe(false)
      expect(course).not.toHaveProperty("enrollments")
    })
    it(`${program.code}: validates quizzes and written questions using production rules`, () => {
      expect(() => buildDemoCourse(program, "owner")).not.toThrow()
      expect(program.practice).toHaveLength(3)
      for (const question of program.practice) {
        expect(question.type).toBe("MULTIPLE_CHOICE")
        expect(question.options).toHaveLength(4)
        expect(question.options!.filter(option => option.isCorrect)).toHaveLength(1)
      }
      expect(program.assignment.map(question => question.type)).toEqual(["SHORT_ANSWER", "ESSAY"])
      expect(program.assignment.reduce((total, question) => total + question.points, 0)).toBe(15)
    })
    it(`${program.code}: includes three substantive, labelled lessons`, () => {
      expect(program.lessons).toHaveLength(3)
      for (const lesson of program.lessons) {
        expect(lesson.sections.length).toBeGreaterThanOrEqual(3)
        expect(lesson.sections.flatMap(section => section.paragraphs).join(" ").length).toBeGreaterThan(500)
      }
      const modules = buildDemoCourse(program, "owner").modules!.create as { content: string }[]
      expect(modules.every(module => module.content.includes("not official CPACE content"))).toBe(true)
    })
  }
  it("escapes inserted lesson text instead of creating executable markup", () => {
    const program = structuredClone(demoPrograms[0])
    program.lessons[0].sections[0].paragraphs = ['<script>alert(1)</script><img src=x onerror="alert(2)">']
    const modules = buildDemoCourse(program, "owner").modules!.create as { content: string }[]
    expect(modules[0].content).not.toContain("<script>")
    expect(modules[0].content).not.toContain("<img")
    expect(modules[0].content).toContain("&lt;script&gt;")
  })
})
