"use client"

import { useState, useReducer, useRef, useCallback, useEffect } from "react"
import { Calculator, X, Minus } from "lucide-react"

// ── Types ───────────────────────────────────────────────────────────────────
type CalcKey =
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  | "." | "±" | "%"
  | "+" | "-" | "×" | "÷" | "=" | "AC" | "⌫"

// ── Calculator state (single reducer = no async issues) ─────────────────────
type CalcState = {
  display: string        // what the user sees
  equation: string       // the secondary equation line
  operand: string | null // first operand stored after pressing an operator
  operator: string | null
  freshEntry: boolean    // true when the NEXT digit should start a new number
}

const INIT: CalcState = {
  display: "0",
  equation: "",
  operand: null,
  operator: null,
  freshEntry: false,
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
    default:  return b
  }
}

function reducer(state: CalcState, key: CalcKey): CalcState {
  const { display, equation, operand, operator, freshEntry } = state

  // Clear all
  if (key === "AC") return INIT

  // Backspace — disabled after a full calculation result
  if (key === "⌫") {
    if (freshEntry || display === "Error") return { ...state, display: "0", freshEntry: false }
    const next = display.length <= 1 ? "0" : display.slice(0, -1)
    return { ...state, display: next }
  }

  // Toggle sign — always applies to the current visible number
  if (key === "±") {
    if (display === "0" || display === "Error") return state
    const toggled = display.startsWith("-") ? display.slice(1) : "-" + display
    return { ...state, display: toggled }
  }

  // Percent — converts current display to %
  if (key === "%") {
    const n = parseFloat(display)
    if (isNaN(n)) return state
    return { ...state, display: fmt(n / 100), freshEntry: true }
  }

  // Operator pressed
  if (key === "+" || key === "-" || key === "×" || key === "÷") {
    if (display === "Error") return state
    // If an operator is already pending, compute intermediate result first
    if (operator && operand !== null && !freshEntry) {
      const result = compute(parseFloat(operand), operator, parseFloat(display))
      const resultStr = fmt(result)
      return {
        display: resultStr,
        equation: `${resultStr} ${key}`,
        operand: resultStr,
        operator: key,
        freshEntry: true,
      }
    }
    return {
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
    return {
      display: fmt(result),
      equation: `${operand} ${operator} ${display} =`,
      operand: null,
      operator: null,
      freshEntry: true,
    }
  }

  // Decimal point
  if (key === ".") {
    const base = freshEntry ? "0" : display
    if (base.includes(".")) return { ...state, display: base, freshEntry: false }
    return { ...state, display: base + ".", freshEntry: false }
  }

  // Digit
  if (freshEntry || display === "Error") {
    return { ...state, display: key === "0" ? "0" : key, freshEntry: false }
  }
  if (display === "0") return { ...state, display: key }
  if (display.length >= 14) return state
  return { ...state, display: display + key }
}

// ── Button styles ────────────────────────────────────────────────────────────
const keyStyle = (key: CalcKey, pressedKey: CalcKey | null) => {
  const base = "flex items-center justify-center rounded-2xl text-base font-bold select-none cursor-pointer transition-all duration-100 h-12 w-full shadow-sm active:scale-95 active:brightness-75"
  const pressed = pressedKey === key ? "scale-95 brightness-75" : ""

  if (key === "AC" || key === "±" || key === "%")
    return `${base} ${pressed} bg-[#a5a5a5] hover:bg-[#bbb] text-black`
  if (key === "÷" || key === "×" || key === "-" || key === "+" || key === "=")
    return `${base} ${pressed} bg-[#ff9f0a] hover:bg-[#ffb340] text-white`
  if (key === "⌫")
    return `${base} ${pressed} bg-[#a5a5a5] hover:bg-[#bbb] text-black text-xl`
  return `${base} ${pressed} bg-[#333333] hover:bg-[#505050] text-white`
}

// ── Button grid ──────────────────────────────────────────────────────────────
const ROWS: CalcKey[][] = [
  ["AC", "±", "%", "÷"],
  ["7",  "8", "9", "×"],
  ["4",  "5", "6", "-"],
  ["1",  "2", "3", "+"],
  ["⌫",  "0", ".", "="],
]

// ── Main component ───────────────────────────────────────────────────────────
interface FloatingCalculatorProps {
  show: boolean
}

export function FloatingCalculator({ show }: FloatingCalculatorProps) {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [pressedKey, setPressedKey] = useState<CalcKey | null>(null)
  const [state, dispatch] = useReducer(reducer, INIT)
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null)
  const calcRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  // Set initial bottom-right position after mount
  useEffect(() => {
    if (!initialized.current) {
      setPos({ x: window.innerWidth - 280, y: window.innerHeight - 520 })
      initialized.current = true
    }
  }, [])

  // Keyboard support
  useEffect(() => {
    if (!open || minimized) return
    const keyMap: Record<string, CalcKey> = {
      "0":"0","1":"1","2":"2","3":"3","4":"4",
      "5":"5","6":"6","7":"7","8":"8","9":"9",
      ".":".","+":"+","-":"-","*":"×","/":"÷",
      "Enter":"=","=":"=","Backspace":"⌫","Escape":"AC","%":"%",
    }
    const handler = (e: KeyboardEvent) => {
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

  // Drag — mouse
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startY: e.clientY, initX: pos.x, initY: pos.y }
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      setPos({
        x: Math.max(0, Math.min(dragRef.current.initX + ev.clientX - dragRef.current.startX, window.innerWidth - 260)),
        y: Math.max(0, Math.min(dragRef.current.initY + ev.clientY - dragRef.current.startY, window.innerHeight - 60)),
      })
    }
    const onUp = () => { dragRef.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp) }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }, [pos])

  // Drag — touch
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    dragRef.current = { startX: t.clientX, startY: t.clientY, initX: pos.x, initY: pos.y }
    const onMove = (ev: TouchEvent) => {
      if (!dragRef.current) return
      const touch = ev.touches[0]
      setPos({
        x: Math.max(0, Math.min(dragRef.current.initX + touch.clientX - dragRef.current.startX, window.innerWidth - 260)),
        y: Math.max(0, Math.min(dragRef.current.initY + touch.clientY - dragRef.current.startY, window.innerHeight - 60)),
      })
    }
    const onUp = () => { dragRef.current = null; window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onUp) }
    window.addEventListener("touchmove", onMove, { passive: false })
    window.addEventListener("touchend", onUp)
  }, [pos])

  const handleKey = (key: CalcKey) => {
    dispatch(key)
    setPressedKey(key)
    setTimeout(() => setPressedKey(null), 120)
  }

  if (!show) return null

  // FAB toggle
  if (!open) {
    return (
      <button
        id="calc-fab"
        onClick={() => { setOpen(true); dispatch("AC") }}
        className="fixed bottom-6 left-88 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 ring-4 ring-emerald-300/30"
        aria-label="Open Calculator"
        title="Open Calculator"
      >
        <Calculator className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div
      ref={calcRef}
      id="floating-calculator"
      style={{ left: pos.x, top: pos.y, position: "fixed", zIndex: 9999 }}
      className="w-[256px] rounded-3xl overflow-hidden shadow-2xl border border-white/10"
    >
      {/* Title bar / drag handle */}
      <div
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        className="flex items-center justify-between bg-[#1c1c1e] px-4 py-2.5 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-emerald-400" />
          <span className="text-white text-xs font-semibold tracking-wide">Calculator</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={() => setMinimized(m => !m)}
            className="w-5 h-5 rounded-full bg-[#f59f0a] flex items-center justify-center hover:brightness-90 transition"
            title={minimized ? "Restore" : "Minimize"}
          >
            <Minus className="h-2.5 w-2.5 text-black" />
          </button>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={() => { setOpen(false); setMinimized(false); dispatch("AC") }}
            className="w-5 h-5 rounded-full bg-[#ff5f56] flex items-center justify-center hover:brightness-90 transition"
            title="Close"
          >
            <X className="h-2.5 w-2.5 text-black" />
          </button>
        </div>
      </div>

      {/* Body */}
      {!minimized && (
        <div className="bg-black px-3 pb-3 pt-1">
          {/* Display */}
          <div className="mb-1 px-1 text-right">
            <p className="text-[#888] text-xs h-4 overflow-hidden truncate">{state.equation || "\u00a0"}</p>
            <p
              className={`text-white font-light tracking-tight leading-none mt-0.5 transition-all ${
                state.display.length > 10 ? "text-2xl" : "text-4xl"
              }`}
            >
              {state.display}
            </p>
          </div>

          {/* Keys */}
          <div className="grid grid-cols-4 gap-2 mt-2">
            {ROWS.flat().map((key) => (
              <button
                key={key}
                id={`calc-key-${key}`}
                className={keyStyle(key, pressedKey)}
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
      )}
    </div>
  )
}
