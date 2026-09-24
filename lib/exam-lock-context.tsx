"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface ExamLockContextType {
  isExamLocked: boolean
  setIsExamLocked: (locked: boolean) => void
}

const ExamLockContext = createContext<ExamLockContextType>({
  isExamLocked: false,
  setIsExamLocked: () => {},
})

export function ExamLockProvider({ children }: { children: ReactNode }) {
  const [isExamLocked, setIsExamLocked] = useState(false)

  return (
    <ExamLockContext.Provider value={{ isExamLocked, setIsExamLocked }}>
      {children}
    </ExamLockContext.Provider>
  )
}

export function useExamLock() {
  return useContext(ExamLockContext)
}
