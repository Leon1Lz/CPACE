'use client';

import { Delete, Calculator as CalculatorIcon, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const keys = [
  'C',
  '+/-',
  '%',
  '÷',
  '7',
  '8',
  '9',
  '×',
  '4',
  '5',
  '6',
  '−',
  '1',
  '2',
  '3',
  '+',
  '0',
  '.',
  '⌫',
  '=',
];

export function Calculator() {
  const [open, setOpen] = useState(false),
    [display, setDisplay] = useState('0');
  const [stored, setStored] = useState<number | null>(null),
    [operator, setOperator] = useState<string | null>(null),
    [replace, setReplace] = useState(true);
  const calculate = useCallback(
    (a: number, b: number, op: string) =>
      op === '+'
        ? a + b
        : op === '−'
          ? a - b
          : op === '×'
            ? a * b
            : b === 0
              ? NaN
              : a / b,
    [],
  );
  const press = useCallback(
    (key: string) => {
      if (/^\d$/.test(key)) {
        setDisplay((d) => (replace || d === '0' ? key : d + key));
        setReplace(false);
        return;
      }
      if (key === '.') {
        setDisplay((d) => (replace ? '0.' : d.includes('.') ? d : d + '.'));
        setReplace(false);
        return;
      }
      if (key === 'C') {
        setDisplay('0');
        setStored(null);
        setOperator(null);
        setReplace(true);
        return;
      }
      if (key === '⌫') {
        setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : '0'));
        return;
      }
      if (key === '+/-') {
        setDisplay((d) => String(-Number(d)));
        return;
      }
      if (key === '%') {
        setDisplay((d) => String(Number(d) / 100));
        return;
      }
      if (key === '=') {
        if (stored !== null && operator) {
          const result = calculate(stored, Number(display), operator);
          setDisplay(
            Number.isFinite(result)
              ? String(Number(result.toFixed(10)))
              : 'Error',
          );
          setStored(null);
          setOperator(null);
          setReplace(true);
        }
        return;
      }
      const current = Number(display);
      setStored(
        stored !== null && operator && !replace
          ? calculate(stored, current, operator)
          : current,
      );
      setOperator(key);
      setReplace(true);
    },
    [calculate, display, operator, replace, stored],
  );
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      const map: Record<string, string> = {
        Enter: '=',
        Backspace: '⌫',
        Escape: 'C',
        '/': '÷',
        '*': '×',
        '-': '−',
      };
      const key = map[event.key] ?? event.key;
      if (/^[0-9.+%]$/.test(key) || ['=', '⌫', '÷', '×', '−'].includes(key)) {
        event.preventDefault();
        press(key);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, press]);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:border-green-500"
      >
        <CalculatorIcon className="h-4 w-4 text-[#105C2E]" />
        Calculator
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-5"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Exam calculator"
            className="w-full max-w-xs rounded-2xl border border-slate-200 bg-[#eef3f5] p-4 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CalculatorIcon className="h-4 w-4 text-[#105C2E]" />
                Exam calculator
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close calculator"
                className="rounded-md p-1 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <output className="mb-3 block min-h-20 overflow-hidden rounded-xl bg-[#105C2E] px-4 py-5 text-right text-3xl font-medium text-white">
              {display}
            </output>
            <div className="grid grid-cols-4 gap-2">
              {keys.map((key) => (
                <button
                  key={key}
                  onClick={() => press(key)}
                  className={`flex h-12 items-center justify-center rounded-lg text-sm font-semibold shadow-sm ${key === '=' ? 'bg-[#105C2E] text-white' : ['÷', '×', '−', '+'].includes(key) ? 'bg-[#E1EEE5] text-[#105C2E]' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                >
                  {key === '⌫' ? <Delete className="h-4 w-4" /> : key}
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-[10px] text-slate-400">
              Keyboard input supported · Works entirely in this page
            </p>
          </section>
        </div>
      )}
    </>
  );
}
