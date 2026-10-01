"use client"

import { useState, useReducer, useRef, useCallback, useEffect } from "react"
import {
  Calculator,
  X,
  Minus,
  Maximize2,
  History,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react"

// ── Types ───────────────────────────────────────────────────────────────────
type CalcKey =
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  | "." | "±" | "%"
  | "+" | "-" | "×" | "÷" | "=" | "AC" | "⌫"
  // Scientific keys
  | "√" | "x²" | "x³" | "1/x" | "xʸ" | "log" | "ln" | "π" | "e" | "(" | ")"
  | "MC" | "MR" | "M+" | "M-"

type CalcMode = "standard" | "scientific"

type HistoryEntry = {
  id: string
  expression: string
  result: string
  time: string
}

// ── Calculator state ────────────────────────────────────────────────────────
type CalcState = {
  display: string        // what the user sees
  equation: string       // secondary equation expression line
  operand: string | null // first operand stored
  operator: string | null
  freshEntry: boolean    // true when next digit starts fresh number
  memory: number
  history: HistoryEntry[]
}

const INIT: CalcState = {
  display: "0",
  equation: "",
  operand: null,
  operator: null,
  freshEntry: false,
  memory: 0,
  history: [],
}

function fmt(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "Error"
  const s = parseFloat(n.toPrecision(12)).toString()
  return s.length > 14 ? n.toExponential(6) : s
}

function compute(a: number, op: string, b: number): number {
  switch (op) {
    case "+": return a + b
    case "-": return a - b
    case "×": return a * b
    case "÷": return b !== 0 ? a / b : NaN
    case "xʸ": return Math.pow(a, b)
    default:  return b
  }
}

function reducer(state: CalcState, key: CalcKey): CalcState {
  const { display, equation, operand, operator, freshEntry, memory, history } = state

  // Clear All
  if (key === "AC") {
    return { ...INIT, memory, history }
  }

  // Backspace
  if (key === "⌫") {
    if (freshEntry || display === "Error") return { ...state, display: "0", freshEntry: false }
    const next = display.length <= 1 ? "0" : display.slice(0, -1)
    return { ...state, display: next }
  }

  // Toggle sign
  if (key === "±") {
    if (display === "0" || display === "Error") return state
    const toggled = display.startsWith("-") ? display.slice(1) : "-" + display
    return { ...state, display: toggled }
  }

  // Percent
  if (key === "%") {
    const n = parseFloat(display)
    if (isNaN(n)) return state
    const res = fmt(n / 100)
    return { ...state, display: res, equation: `${display}%`, freshEntry: true }
  }

  // Single-number Scientific Functions
  if (key === "√") {
    const n = parseFloat(display)
    if (isNaN(n) || n < 0) return { ...state, display: "Error", freshEntry: true }
    const res = fmt(Math.sqrt(n))
    return { ...state, display: res, equation: `√(${display})`, freshEntry: true }
  }

  if (key === "x²") {
    const n = parseFloat(display)
    if (isNaN(n)) return state
    const res = fmt(n * n)
    return { ...state, display: res, equation: `sqr(${display})`, freshEntry: true }
  }

  if (key === "x³") {
    const n = parseFloat(display)
    if (isNaN(n)) return state
    const res = fmt(n * n * n)
    return { ...state, display: res, equation: `cube(${display})`, freshEntry: true }
  }

  if (key === "1/x") {
    const n = parseFloat(display)
    if (isNaN(n) || n === 0) return { ...state, display: "Error", freshEntry: true }
    const res = fmt(1 / n)
    return { ...state, display: res, equation: `1/(${display})`, freshEntry: true }
  }

  if (key === "log") {
    const n = parseFloat(display)
    if (isNaN(n) || n <= 0) return { ...state, display: "Error", freshEntry: true }
    const res = fmt(Math.log10(n))
    return { ...state, display: res, equation: `log(${display})`, freshEntry: true }
  }

  if (key === "ln") {
    const n = parseFloat(display)
    if (isNaN(n) || n <= 0) return { ...state, display: "Error", freshEntry: true }
    const res = fmt(Math.log(n))
    return { ...state, display: res, equation: `ln(${display})`, freshEntry: true }
  }

  if (key === "π") {
    return { ...state, display: fmt(Math.PI), freshEntry: true }
  }

  if (key === "e") {
    return { ...state, display: fmt(Math.E), freshEntry: true }
  }

  // Memory functions
  if (key === "MC") return { ...state, memory: 0 }
  if (key === "MR") return { ...state, display: fmt(memory), freshEntry: true }
  if (key === "M+") {
    const n = parseFloat(display)
    return isNaN(n) ? state : { ...state, memory: memory + n, freshEntry: true }
  }
  if (key === "M-") {
    const n = parseFloat(display)
    return isNaN(n) ? state : { ...state, memory: memory - n, freshEntry: true }
  }

  // Binary operators
  if (key === "+" || key === "-" || key === "×" || key === "÷" || key === "xʸ") {
    if (display === "Error") return state
    if (operator && operand !== null && !freshEntry) {
      const result = compute(parseFloat(operand), operator, parseFloat(display))
      const resultStr = fmt(result)
      return {
        ...state,
        display: resultStr,
        equation: `${resultStr} ${key}`,
        operand: resultStr,
        operator: key,
        freshEntry: true,
      }
    }
    return {
      ...state,
      display,
      equation: `${display} ${key}`,
      operand: display,
      operator: key,
      freshEntry: true,
    }
  }

  // Equals
  if (key === "=") {
    if (!operator || operand === null) return state
    if (display === "Error") return state
    const a = parseFloat(operand)
    const b = parseFloat(display)
    const result = compute(a, operator, b)
    const resultStr = fmt(result)
    const newEq = `${operand} ${operator} ${display} =`

    const newHistoryEntry: HistoryEntry = {
      id: Math.random().toString(36).slice(2, 9),
      expression: `${operand} ${operator} ${display}`,
      result: resultStr,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    }

    return {
      ...state,
      display: resultStr,
      equation: newEq,
      operand: null,
      operator: null,
      freshEntry: true,
      history: [newHistoryEntry, ...history.slice(0, 24)],
    }
  }

  // Decimal point
  if (key === ".") {
    const base = freshEntry ? "0" : display
    if (base.includes(".")) return { ...state, display: base, freshEntry: false }
    return { ...state, display: base + ".", freshEntry: false }
  }

  // Digits
  if (freshEntry || display === "Error") {
    return { ...state, display: key === "0" ? "0" : key, freshEntry: false }
  }
  if (display === "0") return { ...state, display: key }
  if (display.length >= 14) return state
  return { ...state, display: display + key }
}

// ── Button styles ────────────────────────────────────────────────────────────
const keyStyle = (key: CalcKey, pressedKey: CalcKey | null, mode: CalcMode) => {
  const base =
    "flex items-center justify-center rounded-xl text-xs sm:text-sm font-bold select-none cursor-pointer transition-all duration-100 shadow-sm active:scale-95 active:brightness-90"
  const pressed = pressedKey === key ? "scale-95 brightness-75 ring-2 ring-emerald-400" : ""
  const height = mode === "scientific" ? "h-9 w-full" : "h-11 w-full"

  if (key === "AC" || key === "±" || key === "%" || key === "⌫")
    return `${base} ${height} ${pressed} bg-slate-700/80 hover:bg-slate-600 text-slate-100`
  if (key === "÷" || key === "×" || key === "-" || key === "+" || key === "xʸ")
    return `${base} ${height} ${pressed} bg-amber-500/90 hover:bg-amber-500 text-white font-black`
  if (key === "=")
    return `${base} ${height} ${pressed} bg-[#105C2E] hover:bg-emerald-600 text-white font-black shadow-md`
  if (["MC", "MR", "M+", "M-", "√", "x²", "x³", "1/x", "log", "ln", "π", "e", "(", ")"].includes(key))
    return `${base} ${height} ${pressed} bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs`
  return `${base} ${height} ${pressed} bg-slate-800/90 hover:bg-slate-700 text-white font-medium`
}

// ── Standard Rows ────────────────────────────────────────────────────────────
const STANDARD_ROWS: CalcKey[][] = [
  ["AC", "±", "%", "÷"],
  ["7",  "8", "9", "×"],
  ["4",  "5", "6", "-"],
  ["1",  "2", "3", "+"],
  ["⌫",  "0", ".", "="],
]

// ── Scientific Rows ──────────────────────────────────────────────────────────
const SCIENTIFIC_ROWS: CalcKey[][] = [
  ["MC", "MR", "M+", "M-", "AC"],
  ["√",  "x²", "xʸ", "1/x", "÷"],
  ["log", "7",  "8",  "9",  "×"],
  ["ln",  "4",  "5",  "6",  "-"],
  ["π",   "1",  "2",  "3",  "+"],
  ["e",   "⌫",  "0",  ".",  "="],
]

// ── Main Component ───────────────────────────────────────────────────────────
interface FloatingCalculatorProps {
  show: boolean
}

export function FloatingCalculator({ show }: FloatingCalculatorProps) {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [mode, setMode] = useState<CalcMode>("standard")
  const [showHistory, setShowHistory] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [pressedKey, setPressedKey] = useState<CalcKey | null>(null)
  const [state, dispatch] = useReducer(reducer, INIT)
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null)
  const calcRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  // Initialize position on bottom-right corner
  useEffect(() => {
    if (!initialized.current && typeof window !== "undefined") {
      setPos({
        x: Math.max(16, window.innerWidth - 320),
        y: Math.max(16, window.innerHeight - 520),
      })
      initialized.current = true
    }
  }, [])

  // Keyboard navigation & calculation
  useEffect(() => {
    if (!open || minimized) return
    const keyMap: Record<string, CalcKey> = {
      "0": "0", "1": "1", "2": "2", "3": "3", "4": "4",
      "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
      ".": ".", "+": "+", "-": "-", "*": "×", "/": "÷",
      "Enter": "=", "=": "=", "Backspace": "⌫", "Escape": "AC", "%": "%",
      "^": "xʸ", "p": "π", "e": "e",
    }
    const handler = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in a textarea or input
      const target = e.target as HTMLElement
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return

      const k = keyMap[e.key]
      if (k) {
        e.preventDefault()
        dispatch(k)
        setPressedKey(k)
        setTimeout(() => setPressedKey(null), 120)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, minimized])

  // Mouse Drag
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      dragRef.current = { startX: e.clientX, startY: e.clientY, initX: pos.x, initY: pos.y }
      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current) return
        const width = mode === "scientific" ? 340 : 280
        setPos({
          x: Math.max(0, Math.min(dragRef.current.initX + ev.clientX - dragRef.current.startX, window.innerWidth - width)),
          y: Math.max(0, Math.min(dragRef.current.initY + ev.clientY - dragRef.current.startY, window.innerHeight - 80)),
        })
      }
      const onUp = () => {
        dragRef.current = null
        window.removeEventListener("mousemove", onMove)
        window.removeEventListener("mouseup", onUp)
      }
      window.addEventListener("mousemove", onMove)
      window.addEventListener("mouseup", onUp)
    },
    [pos, mode]
  )

  // Touch Drag
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const t = e.touches[0]
      dragRef.current = { startX: t.clientX, startY: t.clientY, initX: pos.x, initY: pos.y }
      const onMove = (ev: TouchEvent) => {
        if (!dragRef.current) return
        const touch = ev.touches[0]
        const width = mode === "scientific" ? 340 : 280
        setPos({
          x: Math.max(0, Math.min(dragRef.current.initX + touch.clientX - dragRef.current.startX, window.innerWidth - width)),
          y: Math.max(0, Math.min(dragRef.current.initY + touch.clientY - dragRef.current.startY, window.innerHeight - 80)),
        })
      }
      const onUp = () => {
        dragRef.current = null
        window.removeEventListener("touchmove", onMove)
        window.removeEventListener("touchend", onUp)
      }
      window.addEventListener("touchmove", onMove, { passive: false })
      window.addEventListener("touchend", onUp)
    },
    [pos, mode]
  )

  const handleKey = (key: CalcKey) => {
    dispatch(key)
    setPressedKey(key)
    setTimeout(() => setPressedKey(null), 120)
  }

  const copyResult = () => {
    if (state.display && state.display !== "Error") {
      navigator.clipboard?.writeText(state.display).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  if (!show) return null

  // FAB Toggle Button
  if (!open) {
    return (
      <button
        id="calc-fab"
        onClick={() => {
          setOpen(true)
          dispatch("AC")
        }}
        className="fixed bottom-5 left-20 md:left-24 z-50 h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 ring-4 ring-emerald-500/20 group border border-emerald-400/30"
        aria-label="Open Calculator"
        title="Open On-Screen Exam Calculator"
      >
        <Calculator className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:rotate-6" />
        <span className="sr-only">Calculator</span>
      </button>
    )
  }

  // Minimized Pill Mode
  if (minimized) {
    return (
      <div
        ref={calcRef}
        id="floating-calculator"
        style={{ left: pos.x, top: pos.y, position: "fixed", zIndex: 9999 }}
        className="flex items-center gap-2 rounded-2xl bg-slate-900/95 border border-emerald-500/30 shadow-2xl px-3.5 py-2 backdrop-blur-md cursor-grab active:cursor-grabbing text-white"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <Calculator className="h-4 w-4 text-emerald-400" />
        <span className="text-xs font-mono font-bold text-emerald-300">
          {state.display || "0"}
        </span>
        <div className="flex items-center gap-1 border-l border-white/10 pl-2">
          <button
            onClick={() => setMinimized(false)}
            className="p-1 text-slate-300 hover:text-white transition rounded-lg hover:bg-white/10"
            title="Restore calculator"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setOpen(false)
              setMinimized(false)
            }}
            className="p-1 text-slate-400 hover:text-rose-400 transition rounded-lg hover:bg-white/10"
            title="Close calculator"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  const rows = mode === "scientific" ? SCIENTIFIC_ROWS : STANDARD_ROWS
  const widthClass = mode === "scientific" ? "w-[340px]" : "w-[280px]"

  return (
    <div
      ref={calcRef}
      id="floating-calculator"
      style={{ left: pos.x, top: pos.y, position: "fixed", zIndex: 9999 }}
      className={`${widthClass} rounded-3xl overflow-hidden shadow-2xl border border-white/15 bg-slate-950/95 backdrop-blur-xl transition-all duration-150`}
    >
      {/* Title bar / Drag Handle */}
      <div
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        className="flex items-center justify-between bg-slate-900/90 px-3.5 py-2.5 cursor-grab active:cursor-grabbing border-b border-white/10"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center">
            <Calculator className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <span className="text-white text-xs font-bold tracking-wide">Exam Calculator</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mode toggle */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setMode((m) => (m === "standard" ? "scientific" : "standard"))}
            className="px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wider bg-white/10 text-emerald-300 hover:bg-white/20 transition uppercase"
            title={`Switch to ${mode === "standard" ? "Scientific" : "Standard"} mode`}
          >
            {mode === "standard" ? "Sci" : "Std"}
          </button>

          {/* History toggle */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setShowHistory((h) => !h)}
            className={`p-1.5 rounded-lg transition ${
              showHistory
                ? "bg-emerald-500/20 text-emerald-400"
                : "text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
            title="Calculation History"
          >
            <History className="h-3.5 w-3.5" />
          </button>

          {/* Minimize */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setMinimized(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition"
            title="Minimize to floating chip"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          {/* Close */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              setOpen(false)
              setMinimized(false)
              dispatch("AC")
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* History Slide-in Tray */}
      {showHistory ? (
        <div className="p-3 bg-slate-900/90 border-b border-white/10 max-h-56 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Calculation History
            </span>
            {state.history.length > 0 && (
              <button
                onClick={() => dispatch("AC")}
                className="text-[10px] text-rose-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          {state.history.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              No previous calculations yet.
            </p>
          ) : (
            <div className="space-y-1.5">
              {state.history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    dispatch("AC")
                    // set the result
                    for (const char of item.result) {
                      dispatch(char as CalcKey)
                    }
                    setShowHistory(false)
                  }}
                  className="rounded-xl p-2 bg-slate-800/60 hover:bg-slate-800 cursor-pointer transition border border-white/5 text-right"
                  title="Click to restore this result"
                >
                  <p className="text-[10px] text-slate-400 font-mono">{item.expression} =</p>
                  <p className="text-xs font-bold text-emerald-300 font-mono">{item.result}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Display */}
      <div className="px-4 pt-3 pb-2 bg-slate-950">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            {mode === "scientific" ? "Scientific Mode" : "Standard Mode"}
          </span>
          <button
            onClick={copyResult}
            className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-emerald-300 transition"
            title="Copy result to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> Copy
              </>
            )}
          </button>
        </div>

        <div className="text-right">
          <p className="text-slate-400 text-xs font-mono h-4 overflow-hidden truncate">
            {state.equation || "\u00a0"}
          </p>
          <p
            className={`text-white font-mono font-light tracking-tight leading-none mt-1 transition-all select-all ${
              state.display.length > 10 ? "text-xl sm:text-2xl" : "text-3xl sm:text-4xl"
            }`}
          >
            {state.display}
          </p>
        </div>
      </div>

      {/* Button Grid */}
      <div className="p-3 bg-slate-900/60">
        <div
          className={`grid gap-1.5 ${
            mode === "scientific" ? "grid-cols-5" : "grid-cols-4"
          }`}
        >
          {rows.flat().map((key) => (
            <button
              key={key}
              id={`calc-key-${key}`}
              className={keyStyle(key, pressedKey, mode)}
              onPointerDown={(e) => {
                e.stopPropagation()
                handleKey(key)
              }}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
