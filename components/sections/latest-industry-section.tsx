"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calendar, ArrowRight, MessageCircle, Newspaper, Users, Zap, Globe, Mail, Send, CheckCircle, TrendingUp, Loader2 } from "lucide-react"
import { articlesData, type Article } from "@/data/articles"
import { ArticleImage } from "@/components/ui/article-image"

const iconMap: Record<string, React.ReactNode> = {
  users: <Users className="w-4 h-4" />,
  "trending-up": <TrendingUp className="w-4 h-4" />,
  zap: <Zap className="w-4 h-4" />,
  globe: <Globe className="w-4 h-4" />,
}

export function LatestIndustrySection() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [articles, setArticles] = useState<Article[]>(articlesData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/articles")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const managedArticles = data.map((article) => {
            const matchingArticle = articlesData.find((item) => item.slug === article.slug)
            return {
              ...article,
              image: matchingArticle?.image || article.image,
              comments: article.comments ?? 0,
              createdAt: article.createdAt ?? new Date().toISOString(),
            }
          }) as Article[]
          const managedSlugs = new Set(managedArticles.map((article) => article.slug))
          setArticles([
            ...managedArticles,
            ...articlesData.filter((article) => !managedSlugs.has(article.slug)),
          ])
        }
      })
      .catch((err) => console.error("Error fetching articles:", err))
      .finally(() => setLoading(false))
  }, [])

  const featured = articles.find(a => a.featured) || articles[0]
  const rest = articles.filter(a => a.id !== featured?.id).slice(0, 6)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to subscribe right now.")
      setSubmitted(true)
      setName("")
      setEmail("")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to subscribe right now.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="insights" className="relative overflow-hidden">

      {/* ── Header Banner ── */}
      <div className="relative py-16 lg:py-20 bg-gradient-to-br from-slate-900 via-gray-900 to-emerald-950 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{
            backgroundImage: `url("https://images.unsplash.com/photo-1504711434969-e33886168f5c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80")`
          }}></div>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 to-emerald-950/90"></div>
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2310b981' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        <div className="absolute top-8 left-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-8 right-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-full text-sm font-semibold backdrop-blur-sm">
            <Newspaper className="w-4 h-4" />
            From the desk of CPACE Philippines
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Insights, News &{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              Updates
            </span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Stay updated with the latest news, partnerships, industry events, and expert insights shaping the professional landscape in the Philippines and beyond.
          </p>
        </div>
      </div>

      {/* ── Articles ── */}
      <div className="relative py-16 lg:py-20 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-100/40 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm font-semibold">Loading insights...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Newspaper className="w-12 h-12 mx-auto text-gray-300 mb-3 stroke-[1.5]" />
              <p className="text-sm font-semibold">No insights found.</p>
            </div>
          ) : (
            <>
              {/* Featured Article */}
              {featured && (
                <div className="group relative bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="relative h-64 lg:h-auto min-h-[280px]">
                      <ArticleImage
                        src={featured.image}
                        alt={featured.title}
                        priority
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 lg:bg-gradient-to-l lg:from-transparent lg:to-black/20"></div>
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">
                          ★ Featured
                        </span>
                      </div>
                    </div>
                    <div className="p-8 lg:p-10 flex flex-col justify-center space-y-5">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border ${featured.categoryColor}`}>
                          {iconMap[featured.iconName]}
                          {featured.category}
                        </span>
                        <div className="flex items-center gap-1.5 text-sm text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          {featured.date || new Date(featured.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-400">
                          <MessageCircle className="w-3.5 h-3.5" />
                          {featured.comments} Comments
                        </div>
                      </div>
                      <Link href={`/insights/${featured.slug}`}>
                        <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight group-hover:text-emerald-700 transition-colors duration-200 cursor-pointer">
                          {featured.title}
                        </h3>
                      </Link>
                      <p className="text-gray-500 leading-relaxed line-clamp-3">{featured.excerpt}</p>
                      <Link href={`/insights/${featured.slug}`}>
                        <span className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:gap-3 transition-all duration-200 cursor-pointer">
                          Read More <ArrowRight className="w-4 h-4" />
                        </span>
                      </Link>
                    </div>
                  </div>
                  <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </div>
              )}

              {/* Articles Grid */}
              {rest.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {rest.map((article) => (
                    <article
                      key={article.id}
                      className="group bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                    >
                      {/* Image */}
                      <div className="relative h-44 overflow-hidden">
                        <ArticleImage
                          src={article.image}
                          alt={article.title}
                          className="group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                        <div className="absolute top-3 left-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border backdrop-blur-sm ${article.categoryColor}`}>
                            {iconMap[article.iconName]}
                            {article.category}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 space-y-4">
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {article.date || new Date(article.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5" />
                            {article.comments} Comments
                          </div>
                        </div>
                        <Link href={`/insights/${article.slug}`}>
                          <h3 className="font-bold text-gray-900 leading-tight group-hover:text-emerald-600 transition-colors duration-200 line-clamp-3 cursor-pointer">
                            {article.title}
                          </h3>
                        </Link>
                        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{article.excerpt}</p>
                        <div className="h-px bg-gray-100 group-hover:bg-emerald-100 transition-colors duration-300"></div>
                        <Link href={`/insights/${article.slug}`}>
                          <span className="flex items-center gap-2 text-sm font-semibold text-emerald-600 group/btn cursor-pointer">
                            Read More
                            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform duration-200" />
                          </span>
                        </Link>
                      </div>
                      <div className="h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                    </article>
                  ))}
                </div>
              )}

              {/* View All */}
              <div className="text-center">
                <Link href="/insights">
                  <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-10 py-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-base">
                    View All Articles
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Newsletter Section ── */}
      <div className="relative py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-cover bg-center" style={{
            backgroundImage: `url("https://images.unsplash.com/photo-1586282391129-76a6df230234?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80")`
          }}></div>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/97 via-teal-900/95 to-slate-900/97"></div>
        </div>
        <div className="absolute top-8 right-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-8 left-8 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left — Info */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-full text-sm font-semibold">
                <Mail className="w-4 h-4" />
                Newsletter
              </div>
              <h3 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
                Sign up to receive our{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  newsletter.
                </span>
              </h3>
              <p className="text-white/70 leading-relaxed text-lg">
                Elevate your professional development by subscribing to our official newsletter. Gain access to curated updates on our upcoming professional certifications, short courses, training programs, seminars, and webinars.
              </p>
              <p className="text-white/60 leading-relaxed">
                Additionally, receive expert insights, industry trends, and exclusive invitations to events designed to advance your career.
              </p>
              <div className="space-y-3 pt-2">
                {[
                  "Upcoming certifications & short courses",
                  "Expert insights & industry trends",
                  "Exclusive event invitations",
                  "Training programs & webinars",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-white/70 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Form */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 lg:p-10 shadow-2xl">
              {submitted ? (
                <div className="text-center space-y-4 py-8">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h4 className="text-xl font-bold text-white">You&apos;re subscribed!</h4>
                  <p className="text-white/60">Thank you for subscribing to the CPACE Philippines newsletter.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold text-white">Stay in the loop</h4>
                    <p className="text-white/60 text-sm">Get the latest updates delivered straight to your inbox.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-white/80">Full Name</label>
                      <input
                        type="text"
                        placeholder="Juan Santos Dela Cruz"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 text-sm backdrop-blur-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-white/80">Email Address</label>
                      <input
                        type="email"
                        placeholder="example@mail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 text-sm backdrop-blur-sm"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] text-base"
                  >
                    {isSubmitting ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : <Send className="mr-2 w-4 h-4" />}
                    {isSubmitting ? "Subscribing..." : "Submit"}
                  </Button>
                  {errorMessage && <p className="text-rose-300 text-sm text-center">{errorMessage}</p>}
                  <p className="text-white/40 text-xs text-center">
                    We respect your privacy. Unsubscribe at any time.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

    </section>
  )
}
