"use client"

import { use, useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Calendar, MessageCircle, ArrowLeft, ChevronLeft, ChevronRight, Loader2, Newspaper } from "lucide-react"
import Link from "next/link"
import { SafeHtml } from "@/components/ui/safe-html"
import { articlesData } from "@/data/articles"
import { ArticleImage } from "@/components/ui/article-image"

export default function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/articles")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const managedArticles = data.map((article) => {
            const matchingArticle = articlesData.find((item) => item.slug === article.slug)
            return { ...article, image: matchingArticle?.image || article.image }
          })
          const databaseSlugs = new Set(managedArticles.map((article) => article.slug))
          setArticles([
            ...managedArticles,
            ...articlesData.filter((article) => !databaseSlugs.has(article.slug)),
          ])
        }
      })
      .catch((err) => {
        console.error("Error fetching articles:", err)
        setArticles(articlesData)
      })
      .finally(() => setLoading(false))
  }, [])

  const articleIndex = articles.findIndex((a) => a.slug === slug)
  const article = articleIndex !== -1 ? articles[articleIndex] : null
  const prevArticle = articleIndex > 0 ? articles[articleIndex - 1] : null
  const nextArticle = articleIndex !== -1 && articleIndex < articles.length - 1 ? articles[articleIndex + 1] : null

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <div>
          <Header />
          <div className="flex flex-col items-center justify-center py-40 text-gray-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-semibold">Loading article details...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <div>
          <Header />
          <div className="text-center py-32 text-gray-400 space-y-3">
            <Newspaper className="w-12 h-12 mx-auto text-gray-300 stroke-[1.5]" />
            <h3 className="font-semibold text-gray-700">Article not found</h3>
            <p className="text-xs max-w-xs mx-auto">
              We couldn&apos;t find the article you&apos;re looking for.
            </p>
            <Link href="/insights" className="inline-block mt-4 text-emerald-600 font-semibold hover:underline">
              Go back to Insights
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <Header />
        
        {/* Banner */}
        <div className="relative py-16 bg-gradient-to-br from-slate-900 via-gray-900 to-emerald-950 overflow-hidden text-center">
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2310b981' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px'
          }}></div>
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <Link href="/insights" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-semibold mb-2">
              <ArrowLeft className="w-4 h-4" /> Back to Insights
            </Link>
            <h1 className="text-2xl md:text-3.5xl lg:text-4.5xl font-extrabold text-white leading-tight max-w-3xl mx-auto">
              {article.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-white/60 text-sm mt-4 flex-wrap">
              <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {article.category}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {article.date || new Date(article.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" />
                {article.comments} Comments
              </span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <article className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            {article.image && (
              <div className="relative h-[250px] md:h-[450px]">
                <ArticleImage
                  src={article.image}
                  alt={article.title}
                  priority
                  sizes="(max-width: 1024px) 100vw, 896px"
                />
              </div>
            )}
            
            <div className="p-6 md:p-12">
              <SafeHtml
                html={article.content}
                className="prose max-w-none text-gray-700 leading-relaxed text-base md:text-lg"
                externalLinks
              />
            </div>
          </article>

          {/* Navigation Links (Bottom - Next/Prev Post) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12 pt-8 border-t border-gray-200">
            {/* Previous Article */}
            <div>
              {prevArticle ? (
                <Link href={`/insights/${prevArticle.slug}`} className="group block bg-white hover:bg-emerald-50/20 p-6 rounded-2xl border border-gray-100 shadow-md transition-all duration-300 hover:shadow-lg h-full">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Previous Post
                  </div>
                  <p className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2 text-sm md:text-base">
                    {prevArticle.title}
                  </p>
                </Link>
              ) : (
                <div className="h-full bg-gray-50 border border-dashed border-gray-200 p-6 rounded-2xl flex items-center justify-center text-xs font-semibold text-gray-400 uppercase tracking-wider min-h-[110px]">
                  No Previous Post
                </div>
              )}
            </div>

            {/* Next Article */}
            <div>
              {nextArticle ? (
                <Link href={`/insights/${nextArticle.slug}`} className="group block bg-white hover:bg-emerald-50/20 p-6 rounded-2xl border border-gray-100 shadow-md transition-all duration-300 hover:shadow-lg text-right h-full">
                  <div className="flex items-center justify-end gap-2 text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    Next Post
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2 text-sm md:text-base">
                    {nextArticle.title}
                  </p>
                </Link>
              ) : (
                <div className="h-full bg-gray-50 border border-dashed border-gray-200 p-6 rounded-2xl flex items-center justify-center text-xs font-semibold text-gray-400 uppercase tracking-wider min-h-[110px]">
                  No Next Post
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      <Footer />
      
      {/* Styles for Prose container rendering */}
      <style>{`
        .prose h1 {
          font-size: 2rem;
          font-weight: 800;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #111827;
        }
        .prose h2 {
          font-size: 1.625rem;
          font-weight: 700;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
          color: #1f2937;
        }
        .prose blockquote {
          border-left: 4px solid #10b981;
          padding-left: 1.25rem;
          color: #4b5563;
          font-style: italic;
          margin: 1.5rem 0;
        }
        .prose ul {
          list-style-type: disc;
          padding-left: 1.75rem;
          margin: 1.25rem 0;
        }
        .prose ol {
          list-style-type: decimal;
          padding-left: 1.75rem;
          margin: 1.25rem 0;
        }
        .prose a {
          color: #059669;
          text-decoration: underline;
        }
        .prose p {
          margin-bottom: 1.25rem;
        }
      `}</style>
    </div>
  )
}
