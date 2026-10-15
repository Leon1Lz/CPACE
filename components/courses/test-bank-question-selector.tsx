"use client"

import { useState, useEffect, useMemo } from "react"
import { Database, Search, CheckCircle2, Layers, AlertCircle, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

type BankQuestion = {
  id: string
  question: string
  type: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
  points: number
  topic: string | null
  explanation: string | null
  formula: string | null
}

type QuestionBank = {
  id: string
  title: string
  code: string | null
  courseId: string
  _count?: { questions: number }
}

interface TestBankQuestionSelectorProps {
  courseId: string
  selectedQuestionIds: string[]
  onSelectionChange: (ids: string[]) => void
}

export function TestBankQuestionSelector({
  courseId,
  selectedQuestionIds,
  onSelectionChange,
}: TestBankQuestionSelectorProps) {
  const [bank, setBank] = useState<QuestionBank | null>(null)
  const [questions, setQuestions] = useState<BankQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [importMode, setImportMode] = useState<"NONE" | "ALL" | "CUSTOM">("NONE")
  const [search, setSearch] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL")

  // Fetch bank for this course
  useEffect(() => {
    if (!courseId) {
      setBank(null)
      setQuestions([])
      setImportMode("NONE")
      onSelectionChange([])
      return
    }

    let isMounted = true
    setLoading(true)

    async function loadBankAndQuestions() {
      try {
        const banksRes = await fetch(`/api/banks?courseId=${courseId}`)
        if (!banksRes.ok) return
        const banksData = await banksRes.json()
        const foundBank = Array.isArray(banksData) && banksData.length > 0 ? banksData[0] : null

        if (!isMounted) return
        setBank(foundBank)

        if (foundBank) {
          const qRes = await fetch(`/api/banks/${foundBank.id}/questions`)
          if (qRes.ok) {
            const qData = await qRes.json()
            if (isMounted) {
              setQuestions(Array.isArray(qData) ? qData : [])
            }
          }
        } else {
          setQuestions([])
        }
      } catch (err) {
        console.error("Failed to load course question bank:", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void loadBankAndQuestions()

    return () => {
      isMounted = false
    }
  }, [courseId])

  // Handle mode changes
  const handleModeChange = (mode: "NONE" | "ALL" | "CUSTOM") => {
    setImportMode(mode)
    if (mode === "NONE") {
      onSelectionChange([])
    } else if (mode === "ALL") {
      onSelectionChange(questions.map((q) => q.id))
    }
  }

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (difficultyFilter !== "ALL" && q.difficulty !== difficultyFilter) return false
      if (search.trim()) {
        const s = search.toLowerCase()
        const matchQ = q.question?.toLowerCase().includes(s)
        const matchTopic = q.topic?.toLowerCase().includes(s)
        const matchExpl = q.explanation?.toLowerCase().includes(s)
        if (!matchQ && !matchTopic && !matchExpl) return false
      }
      return true
    })
  }, [questions, difficultyFilter, search])

  // Toggle single item
  const toggleItem = (id: string) => {
    if (selectedQuestionIds.includes(id)) {
      onSelectionChange(selectedQuestionIds.filter((item) => item !== id))
    } else {
      onSelectionChange([...selectedQuestionIds, id])
    }
  }

  // Toggle all filtered items
  const toggleSelectFiltered = () => {
    const allFilteredSelected =
      filteredQuestions.length > 0 &&
      filteredQuestions.every((q) => selectedQuestionIds.includes(q.id))

    if (allFilteredSelected) {
      const filteredIdSet = new Set(filteredQuestions.map((q) => q.id))
      onSelectionChange(selectedQuestionIds.filter((id) => !filteredIdSet.has(id)))
    } else {
      const combined = new Set([...selectedQuestionIds, ...filteredQuestions.map((q) => q.id)])
      onSelectionChange(Array.from(combined))
    }
  }

  if (loading) {
    return (
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-[#105C2E]" />
        Checking course test banks...
      </div>
    )
  }

  if (!bank || questions.length === 0) {
    return (
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-xs text-slate-500">
        <Database className="h-4 w-4 text-slate-400 shrink-0" />
        <span>No test bank questions found for this course yet. You can create the assessment empty and add questions later.</span>
      </div>
    )
  }

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Database className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900 truncate">Course Test Bank Available</span>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                {questions.length} questions
              </Badge>
            </div>
            <p className="text-[11px] text-gray-500 truncate">{bank.title}</p>
          </div>
        </div>

        {selectedQuestionIds.length > 0 && (
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg self-start sm:self-center">
            {selectedQuestionIds.length} Selected to Import
          </span>
        )}
      </div>

      {/* Mode selection buttons */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          type="button"
          onClick={() => handleModeChange("NONE")}
          className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-center ${
            importMode === "NONE"
              ? "bg-white border-[#105C2E] text-[#105C2E] shadow-xs"
              : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
          }`}
        >
          Start Empty
          <span className="block text-[10px] font-normal text-slate-400 mt-0.5">Add later</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange("ALL")}
          className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-center ${
            importMode === "ALL"
              ? "bg-white border-[#105C2E] text-[#105C2E] shadow-xs"
              : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
          }`}
        >
          Import All
          <span className="block text-[10px] font-normal text-slate-400 mt-0.5">All {questions.length} items</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange("CUSTOM")}
          className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-center ${
            importMode === "CUSTOM"
              ? "bg-white border-[#105C2E] text-[#105C2E] shadow-xs"
              : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
          }`}
        >
          Choose Questions
          <span className="block text-[10px] font-normal text-slate-400 mt-0.5">Pick specific</span>
        </button>
      </div>

      {/* Custom question selector drawer */}
      {importMode === "CUSTOM" && (
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Search test bank questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 rounded-xl text-xs bg-white"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {(["ALL", "EASY", "MEDIUM", "HARD"] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficultyFilter(diff)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    difficultyFilter === diff
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-200/70 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {diff === "ALL" ? "All Levels" : diff}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span>
              Showing {filteredQuestions.length} of {questions.length} questions
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleSelectFiltered}
              className="h-7 text-xs rounded-lg"
            >
              {filteredQuestions.length > 0 &&
              filteredQuestions.every((q) => selectedQuestionIds.includes(q.id))
                ? "Deselect Shown"
                : "Select Shown"}
            </Button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {filteredQuestions.length === 0 ? (
              <p className="text-center py-6 text-xs text-gray-400">No questions match your filter.</p>
            ) : (
              filteredQuestions.map((q, idx) => {
                const isSelected = selectedQuestionIds.includes(q.id)
                const diffColor =
                  q.difficulty === "EASY"
                    ? "bg-emerald-100 text-emerald-800"
                    : q.difficulty === "HARD"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-amber-100 text-amber-800"

                return (
                  <div
                    key={q.id}
                    onClick={() => toggleItem(q.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/60 shadow-xs"
                        : "border-gray-200 bg-white hover:border-emerald-300"
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleItem(q.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold text-gray-400">#{idx + 1}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${diffColor}`}>
                          {q.difficulty}
                        </span>
                        {q.topic && (
                          <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md truncate max-w-[120px]">
                            {q.topic}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">{q.points} pt</span>
                      </div>
                      <p className="text-xs font-medium text-gray-900 line-clamp-2 leading-relaxed">
                        {q.question}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
