"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Calendar, Clock, ArrowRight, TrendingUp, Users, BookOpen } from "lucide-react"

export function IndustryInsights() {
  const insights = [
    {
      title: "CPACE Philippines and San Beda University Manila Forge Partnership",
      description: "Expanding microcredential opportunities for students through strategic educational partnership.",
      date: "March 18, 2026",
      category: "Partnership",
      image: "/api/placeholder/400/250",
      readTime: "5 min read"
    },
    {
      title: "Beyond Job Titles: Orchestrating People, Tech, and Purpose",
      description: "Exploring the evolving landscape of professional roles in the digital age.",
      date: "February 6, 2026", 
      category: "Industry Trends",
      image: "/api/placeholder/400/250",
      readTime: "8 min read"
    },
    {
      title: "Fintech Revolution Summit – Philippines 2026",
      description: "Key insights from the premier fintech event shaping the future of financial services.",
      date: "January 26, 2026",
      category: "Events",
      image: "/api/placeholder/400/250", 
      readTime: "6 min read"
    },
    {
      title: "The Future of Work: Remote and Hybrid Models",
      description: "How organizations are adapting to new work paradigms in the post-pandemic era.",
      date: "January 15, 2026",
      category: "Workplace Trends",
      image: "/api/placeholder/400/250",
      readTime: "7 min read"
    },
    {
      title: "Digital Transformation Strategies for SMEs",
      description: "Practical approaches to digital adoption for small and medium enterprises.",
      date: "December 28, 2025",
      category: "Digital Strategy",
      image: "/api/placeholder/400/250",
      readTime: "10 min read"
    },
    {
      title: "Sustainable Business Practices in 2026",
      description: "How companies are integrating sustainability into their core business strategies.",
      date: "December 10, 2025",
      category: "Sustainability",
      image: "/api/placeholder/400/250",
      readTime: "9 min read"
    }
  ]

  const categories = ["All", "Partnership", "Industry Trends", "Events", "Workplace Trends", "Digital Strategy", "Sustainability"]

  return (
    <section className="py-20 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-cpace-100 text-cpace-700 border-cpace-200">
            Industry Insights
          </Badge>
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">
            Latest from the Industry
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Stay informed with the latest trends, insights, and updates shaping the professional landscape and business environment.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category, index) => (
            <Button
              key={index}
              variant={index === 0 ? "default" : "outline"}
              className={index === 0 ? "bg-cpace-600 hover:bg-cpace-700" : "border-cpace-300 text-cpace-700 hover:bg-cpace-50"}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {insights.map((insight, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-neutral-200 hover:border-cpace-300 overflow-hidden">
              {/* Image Placeholder */}
              <div className="h-48 bg-gradient-to-br from-cpace-100 to-cpace-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                <div className="absolute top-4 left-4">
                  <Badge className="bg-white/90 text-cpace-700 border-white">
                    {insight.category}
                  </Badge>
                </div>
              </div>

              <CardHeader>
                <div className="flex items-center gap-4 text-sm text-neutral-600 mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{insight.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{insight.readTime}</span>
                  </div>
                </div>
                <CardTitle className="text-xl text-neutral-900 group-hover:text-cpace-700 transition-colors line-clamp-2">
                  {insight.title}
                </CardTitle>
                <CardDescription className="text-neutral-600 line-clamp-3">
                  {insight.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Button variant="ghost" className="text-cpace-700 hover:text-cpace-600 hover:bg-cpace-50 p-0">
                  Read More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="bg-gradient-to-r from-cpace-600 to-cpace-700 rounded-2xl p-12 text-center text-white">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold mb-4">
              Stay Updated with Industry Insights
            </h3>
            <p className="text-xl mb-8 text-cpace-100">
              Sign up to receive our newsletter and get the latest industry trends, professional development tips, and exclusive updates delivered to your inbox.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-6">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <Button className="bg-white text-cpace-700 hover:bg-gray-100 font-semibold px-6 py-3">
                Subscribe
              </Button>
            </div>
            
            <p className="text-sm text-cpace-200">
              Join 10,000+ professionals. No spam, unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
