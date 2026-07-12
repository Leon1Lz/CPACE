"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calendar, ArrowRight, MessageCircle, Newspaper, Users, Zap, BookOpen, Globe, Mail, Send, CheckCircle, TrendingUp } from "lucide-react"

const articles = [
  {
    title: "CPACE Philippines and San Beda University Manila Forge Partnership to Expand Microcredential Opportunities for Students",
    date: "March 18, 2026",
    comments: 0,
    excerpt: "With this collaboration, CPACE Philippines and San Beda University Manila reaffirm their dedication to empowering…",
    category: "Partnership",
    categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <Users className="w-4 h-4" />,
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    featured: true,
  },
  {
    title: "Beyond Job Titles: Orchestrating People, Tech, and Purpose",
    date: "February 6, 2026",
    comments: 0,
    excerpt: "We're living in a liminal hour where titles matter less than capability. This piece argues…",
    category: "Industry Insights",
    categoryColor: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <TrendingUp className="w-4 h-4" />,
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    featured: false,
  },
  {
    title: "Fintech Revolution Summit – Philippines 2026",
    date: "January 26, 2026",
    comments: 0,
    excerpt: "The Fintech Revolution Summit is set to return to Manila on April 30, 2026, at…",
    category: "Events",
    categoryColor: "bg-violet-100 text-violet-700 border-violet-200",
    icon: <Zap className="w-4 h-4" />,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    featured: false,
  },
  {
    title: "CHRO Philippines 2026: Navigating the Future of HR in the Philippines",
    date: "December 16, 2025",
    comments: 0,
    excerpt: "CHRO Philippines 2026: Navigating the Future of HR in the Philippines 27–28 January…",
    category: "Events",
    categoryColor: "bg-violet-100 text-violet-700 border-violet-200",
    icon: <Zap className="w-4 h-4" />,
    image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    featured: false,
  },
  {
    title: "CPACE Philippines, Gordon College host CFMS exam among graduating students",
    date: "December 12, 2025",
    comments: 0,
    excerpt: "The CPACE Philippines has partnered with Gordon College to host the CFMS exam among graduating students…",
    category: "Partnership",
    categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <Users className="w-4 h-4" />,
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    featured: false,
  },
  {
    title: "BatStateU, CPACE Philippines seal accord to expand students' career growth",
    date: "December 2, 2025",
    comments: 0,
    excerpt: "The CPACE Philippines has signed an accord with BatStateU to expand students' career growth opportunities…",
    category: "Partnership",
    categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <Users className="w-4 h-4" />,
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    featured: false,
  },
  {
    title: "NEMSU Tagbina in Mindanao to collab with CPACE Philippines after fruitful first CFMS® exam",
    date: "November 28, 2025",
    comments: 0,
    excerpt: "A fruitful first CFMS® exam paves the way for a lasting collaboration between NEMSU Tagbina and CPACE Philippines…",
    category: "Partnership",
    categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <Users className="w-4 h-4" />,
    image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    featured: false,
  },
  {
    title: "Stop Forwarding Emails: How cloudHQ Gmail Label Sharing Syncs Your Entire Team",
    date: "November 25, 2025",
    comments: 0,
    excerpt: "In the modern workplace, email remains a cornerstone of communication. cloudHQ's Gmail Label Sharing changes the game…",
    category: "Technology",
    categoryColor: "bg-orange-100 text-orange-700 border-orange-200",
    icon: <Globe className="w-4 h-4" />,
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    featured: false,
  },
  {
    title: "CPACE Philippines, WLC Partner to Future-Proof Financial Mgmt Curriculum",
    date: "November 21, 2025",
    comments: 0,
    excerpt: "The CPACE Philippines has officially signed a partnership with WLC to future-proof the Financial Management curriculum…",
    category: "Partnership",
    categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <Users className="w-4 h-4" />,
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    featured: false,
  },
]

export function LatestIndustrySection() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const featured = articles[0]
  const rest = articles.slice(1, 7)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
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

          {/* Featured Article */}
          <div className="group relative bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="relative h-64 lg:h-auto min-h-[280px]">
                <img
                  src={featured.image}
                  alt={featured.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                    {featured.icon}
                    {featured.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-sm text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {featured.date}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-400">
                    <MessageCircle className="w-3.5 h-3.5" />
                    {featured.comments} Comments
                  </div>
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight group-hover:text-emerald-700 transition-colors duration-200">
                  {featured.title}
                </h3>
                <p className="text-gray-500 leading-relaxed">{featured.excerpt}</p>
                <Link href="/insights">
                  <button className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:gap-3 transition-all duration-200">
                    Read More <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rest.map((article, index) => (
              <article
                key={index}
                className="group bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border backdrop-blur-sm ${article.categoryColor}`}>
                      {article.icon}
                      {article.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {article.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {article.comments} Comments
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 leading-tight group-hover:text-emerald-600 transition-colors duration-200 line-clamp-3">
                    {article.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{article.excerpt}</p>
                  <div className="h-px bg-gray-100 group-hover:bg-emerald-100 transition-colors duration-300"></div>
                  <Link href="/insights">
                    <button className="flex items-center gap-2 text-sm font-semibold text-emerald-600 group/btn">
                      Read More
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform duration-200" />
                    </button>
                  </Link>
                </div>
                <div className="h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </article>
            ))}
          </div>

          {/* View All */}
          <div className="text-center">
            <Link href="/insights">
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-10 py-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-base">
                View All Articles
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
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
                  <h4 className="text-xl font-bold text-white">You're subscribed!</h4>
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
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] text-base"
                  >
                    <Send className="mr-2 w-4 h-4" />
                    Submit
                  </Button>
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
