"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Award, CheckCircle, XCircle, BookOpen, Flag, X } from "lucide-react"
import Link from "next/link"

type Notification = {
  id: string
  type: "certificate" | "pass" | "fail" | "enrollment" | "flag"
  title: string
  message: string
  href: string
  at: string
  isRead: boolean
}

const typeIcon = {
  certificate: <Award className="h-4 w-4 text-violet-500" />,
  pass:        <CheckCircle className="h-4 w-4 text-emerald-500" />,
  fail:        <XCircle className="h-4 w-4 text-red-500" />,
  enrollment:  <BookOpen className="h-4 w-4 text-blue-500" />,
  flag:        <Flag className="h-4 w-4 text-rose-500" />,
}

const typeBg = {
  certificate: "bg-violet-50 border-violet-100",
  pass:        "bg-emerald-50 border-emerald-100",
  fail:        "bg-red-50 border-red-100",
  enrollment:  "bg-blue-50 border-blue-100",
  flag:        "bg-rose-50 border-rose-100",
}

function timeAgo(isoDate: string) {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetch_notifs = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) setNotifications(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    })
  }

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true })
    })
  }

  // Fetch on mount and every 60s
  useEffect(() => {
    fetch_notifs()
    const t = setInterval(fetch_notifs, 60000)
    return () => clearInterval(t)
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const unread = notifications.filter(n => !n.isRead).length

  return (
    <div ref={ref} className="relative">
      <button
        id="notification-bell"
        onClick={() => setOpen(o => !o)}
        className="relative h-9 w-9 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
        aria-label="Notifications"
      >
        <Bell className={`h-4 w-4 ${unread > 0 ? "text-emerald-600" : "text-gray-500"}`} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full text-[10px] font-black text-white flex items-center justify-center px-0.5 animate-pulse">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-emerald-600" />
              <span className="font-bold text-sm text-gray-900">Notifications</span>
              {unread > 0 && (
                <span className="text-[11px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">
                  {unread} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-gray-400 hover:text-emerald-600 transition-colors font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="h-8 w-8 mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400 font-medium">You&apos;re all caught up!</p>
                <p className="text-xs text-gray-300 mt-0.5">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50/80 transition-colors group ${!n.isRead ? "bg-emerald-50/20" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${typeBg[n.type] || "bg-gray-50 border-gray-100"}`}>
                      {typeIcon[n.type]}
                    </div>
                    <Link
                      href={n.href}
                      className="flex-1 min-w-0"
                      onClick={() => { markAsRead(n.id); setOpen(false) }}
                    >
                      <p className={`text-sm leading-tight text-gray-900 ${!n.isRead ? "font-bold" : "font-semibold"}`}>{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-gray-300 mt-1">{timeAgo(n.at)}</p>
                    </Link>
                    {!n.isRead && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-lg hover:bg-gray-200 flex items-center justify-center shrink-0 transition-all"
                        title="Mark as read"
                      >
                        <X className="h-3 w-3 text-gray-400" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5">
              <Link
                href="/dashboard"
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                onClick={() => setOpen(false)}
              >
                Go to Dashboard →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
