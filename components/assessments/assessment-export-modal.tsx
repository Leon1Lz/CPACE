"use client"

import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  KeyRound,
  CheckCircle2,
  HelpCircle,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface ExportableQuestion {
  id: string
  question: string
  type: string
  difficulty?: "EASY" | "MEDIUM" | "HARD" | string
  points?: number
  topic?: string | null
  explanation?: string | null
  formula?: string | null
  order?: number
  options?: {
    id?: string
    text: string
    isCorrect?: boolean
    order?: number
  }[]
}

interface AssessmentExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  courseTitle?: string
  questions: ExportableQuestion[]
  type?: string
}

export function AssessmentExportModal({
  open,
  onOpenChange,
  title,
  courseTitle,
  questions,
  type = "EXAM",
}: AssessmentExportModalProps) {
  const [activeTab, setActiveTab] = useState<"CSV" | "EXAM_PAPER" | "ANSWER_KEY">("EXAM_PAPER")
  const printRef = useRef<HTMLDivElement>(null)

  // 1. Export as CSV
  const handleExportCSV = () => {
    if (!questions || questions.length === 0) return

    const headers = [
      "Item #",
      "Question",
      "Type",
      "Difficulty",
      "Points",
      "Topic",
      "Option A",
      "Option B",
      "Option C",
      "Option D",
      "Option E",
      "Correct Answer",
      "Explanation",
      "Formula",
    ]

    const escapeCsv = (val: unknown) => {
      if (val === null || val === undefined) return '""'
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }

    const rows = questions.map((q, idx) => {
      const opts = q.options || []
      const correctOpt = opts.find((o) => o.isCorrect)

      return [
        idx + 1,
        escapeCsv(q.question),
        escapeCsv(q.type),
        escapeCsv(q.difficulty || "MEDIUM"),
        q.points ?? 1.0,
        escapeCsv(q.topic || ""),
        escapeCsv(opts[0]?.text || ""),
        escapeCsv(opts[1]?.text || ""),
        escapeCsv(opts[2]?.text || ""),
        escapeCsv(opts[3]?.text || ""),
        escapeCsv(opts[4]?.text || ""),
        escapeCsv(correctOpt?.text || ""),
        escapeCsv(q.explanation || ""),
        escapeCsv(q.formula || ""),
      ].join(",")
    })

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const safeName = title.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase()
    link.setAttribute("href", url)
    link.setAttribute("download", `${safeName}_questions.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // 2. Trigger Print Dialog
  const handlePrint = () => {
    window.print()
  }

  const optionLetters = ["A", "B", "C", "D", "E", "F"]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">
        {/* Modal Header */}
        <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Printer className="h-5 w-5 text-emerald-600" />
                Export & Print Questions
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                {title} • {questions.length} Question{questions.length === 1 ? "" : "s"}
              </DialogDescription>
            </div>
          </div>

          {/* Format Tabs & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("EXAM_PAPER")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "EXAM_PAPER"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                Printable Exam Paper
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ANSWER_KEY")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "ANSWER_KEY"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
                Answer Key & Rationale
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="rounded-xl text-xs gap-1.5 border-gray-200 hover:bg-gray-50"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                Download CSV
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                className="rounded-xl text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                <Printer className="h-3.5 w-3.5" />
                Print / Save PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Preview Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/60 print:bg-white print:p-0">
          <div
            ref={printRef}
            className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl p-8 shadow-xs print:border-0 print:shadow-none print:p-4 text-gray-900 font-sans"
          >
            {/* Printable Document Header */}
            <div className="border-b-2 border-emerald-800 pb-5 mb-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="font-extrabold text-lg text-emerald-900 tracking-wider">CPACE PHILIPPINES</span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                Center for Professional Advancement & Continuing Education
              </p>
              <h1 className="text-xl font-black text-gray-900 mt-3">{title}</h1>
              {courseTitle && (
                <p className="text-sm font-medium text-gray-600 mt-0.5">{courseTitle}</p>
              )}

              {/* Mode indicator badge */}
              <div className="mt-3">
                {activeTab === "ANSWER_KEY" ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <KeyRound className="h-3 w-3" /> OFFICIAL INSTRUCTOR ANSWER KEY & RATIONALE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    <FileText className="h-3 w-3" /> EXAMINATION PAPER
                  </span>
                )}
              </div>

              {/* Learner info fill-in block (only on Exam Paper) */}
              {activeTab === "EXAM_PAPER" && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-dashed border-gray-200 text-left text-xs">
                  <div>
                    <span className="text-gray-500 font-semibold block">Learner Name:</span>
                    <div className="border-b border-gray-400 mt-3 h-4" />
                  </div>
                  <div>
                    <span className="text-gray-500 font-semibold block">Student / Roll ID:</span>
                    <div className="border-b border-gray-400 mt-3 h-4" />
                  </div>
                  <div>
                    <span className="text-gray-500 font-semibold block">Date:</span>
                    <div className="border-b border-gray-400 mt-3 h-4" />
                  </div>
                  <div>
                    <span className="text-gray-500 font-semibold block">Score:</span>
                    <div className="border-b border-gray-400 mt-3 h-4">
                      <span className="text-gray-400 float-right">/ {questions.reduce((acc, q) => acc + (q.points || 1), 0)} pts</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* General Instructions */}
            <div className="mb-6 p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-1 print:bg-transparent print:border-gray-300">
              <strong className="text-gray-800 block">General Instructions:</strong>
              <p>• Read each question carefully before selecting or writing your answer.</p>
              <p>• For multiple choice questions, shade or mark the letter corresponding to the best answer.</p>
              <p>• Total Questions: <strong>{questions.length}</strong> • Total Points: <strong>{questions.reduce((acc, q) => acc + (q.points || 1), 0)}</strong></p>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              {questions.map((q, idx) => {
                const opts = q.options || []

                return (
                  <div
                    key={q.id || idx}
                    className="pb-5 border-b border-gray-100 last:border-b-0 space-y-2.5 break-inside-avoid"
                  >
                    {/* Question Header & Prompt */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 text-sm text-gray-900 leading-snug">
                        <span className="font-bold shrink-0">{idx + 1}.</span>
                        <div>
                          <span className="font-semibold">{q.question}</span>
                          {q.topic && (
                            <span className="text-[11px] text-gray-400 font-normal ml-2">
                              [{q.topic}]
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-gray-500 shrink-0 bg-gray-100 px-2 py-0.5 rounded">
                        {q.points || 1} pt{(q.points || 1) === 1 ? "" : "s"}
                      </span>
                    </div>

                    {/* Options (for Multiple Choice / True-False) */}
                    {opts.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6 pt-1 text-xs">
                        {opts.map((opt, optIdx) => {
                          const letter = optionLetters[optIdx] || String(optIdx + 1)
                          const isCorrect = Boolean(opt.isCorrect)
                          const highlight = activeTab === "ANSWER_KEY" && isCorrect

                          return (
                            <div
                              key={opt.id || optIdx}
                              className={`flex items-start gap-2 p-2 rounded-lg border transition-colors ${
                                highlight
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-medium"
                                  : "border-gray-200 text-gray-700 bg-white"
                              }`}
                            >
                              <span
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold border ${
                                  highlight
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "border-gray-400 text-gray-600"
                                }`}
                              >
                                {letter}
                              </span>
                              <span className="leading-tight flex-1">{opt.text}</span>
                              {highlight && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Short Answer / Essay Lines (for Exam Paper) */}
                    {opts.length === 0 && activeTab === "EXAM_PAPER" && (
                      <div className="pl-6 pt-2 space-y-3">
                        <div className="border-b border-gray-300 h-6" />
                        <div className="border-b border-gray-300 h-6" />
                        {q.type === "ESSAY" && (
                          <>
                            <div className="border-b border-gray-300 h-6" />
                            <div className="border-b border-gray-300 h-6" />
                          </>
                        )}
                      </div>
                    )}

                    {/* Answer Key Rationale & Formula (only in Answer Key view) */}
                    {activeTab === "ANSWER_KEY" && (q.explanation || q.formula) && (
                      <div className="ml-6 mt-2 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1.5 leading-relaxed">
                        {q.explanation && (
                          <div>
                            <strong className="text-emerald-900 font-bold">Rationale: </strong>
                            {q.explanation}
                          </div>
                        )}
                        {q.formula && (
                          <div className="font-mono text-[11px] bg-white/90 px-2 py-1 rounded border border-emerald-200 text-emerald-900 font-bold">
                            📐 Formula: {q.formula}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Document Footer */}
            <div className="mt-8 pt-4 border-t border-gray-200 text-center text-[10px] text-gray-400 flex items-center justify-between">
              <span>CPACE Learning Assessment System</span>
              <span>Generated on {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
