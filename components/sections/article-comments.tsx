"use client"

import { FormEvent, useEffect, useState } from "react"
import { Loader2, MessageCircle, Send, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type PublicComment = {
  id: string
  name: string
  content: string
  createdAt: string
}

export function ArticleComments({ slug, onCountChange }: { slug: string; onCountChange?: (count: number) => void }) {
  const [comments, setComments] = useState<PublicComment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState({ name: "", email: "", comment: "", website: "" })

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/articles/${encodeURIComponent(slug)}/comments`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || "Unable to load comments")
        return result as { comments: PublicComment[]; count: number }
      })
      .then((result) => {
        setComments(result.comments)
        onCountChange?.(result.count)
        setError("")
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Unable to load comments")
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [slug, onCountChange])

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError("")
    setSuccess("")
    try {
      const response = await fetch(`/api/articles/${encodeURIComponent(slug)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to publish your comment")
      if (result.comment) {
        setComments((current) => {
          const next = [result.comment as PublicComment, ...current]
          onCountChange?.(next.length)
          return next
        })
      }
      setForm((current) => ({ ...current, comment: "", website: "" }))
      setSuccess("Your comment has been published.")
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to publish your comment")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg md:p-10" aria-labelledby="article-comments-heading">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><MessageCircle className="h-5 w-5" /></span>
        <div>
          <h2 id="article-comments-heading" className="text-xl font-black text-slate-900">Join the conversation</h2>
          <p className="text-sm text-slate-500">{comments.length} {comments.length === 1 ? "comment" : "comments"}</p>
        </div>
      </div>

      <form onSubmit={submitComment} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            Name
            <Input required minLength={2} maxLength={100} autoComplete="name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Your name" className="h-11 rounded-xl" />
          </label>
          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            Email
            <Input required type="email" maxLength={254} autoComplete="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="you@example.com" className="h-11 rounded-xl" />
          </label>
        </div>
        <label className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          Website
          <Input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} />
        </label>
        <label className="block space-y-1.5 text-sm font-semibold text-slate-700">
          Comment
          <Textarea required minLength={2} maxLength={2000} value={form.comment} onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))} placeholder="Share your thoughts about this article…" className="min-h-32 resize-y rounded-xl" />
        </label>
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-400">Your email is kept private and will not appear with your comment.</p>
          <Button type="submit" disabled={submitting} className="rounded-xl bg-emerald-600 px-5 text-white hover:bg-emerald-700">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? "Publishing…" : "Post comment"}
          </Button>
        </div>
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        {success && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}
      </form>

      <div className="mt-8 space-y-4 border-t border-slate-100 pt-6" aria-live="polite">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />Loading comments…</div>
        ) : comments.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">No comments yet. Be the first to share your thoughts.</div>
        ) : comments.map((comment) => (
          <article key={comment.id} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><UserRound className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-bold text-slate-900">{comment.name}</h3>
                <time className="text-xs text-slate-400" dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</time>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">{comment.content}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
