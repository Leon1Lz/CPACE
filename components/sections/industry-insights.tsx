"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Calendar, Clock, ArrowRight } from "lucide-react"
import { articlesData } from "@/data/articles"
import { useState } from "react"
import { ArticleImage } from "@/components/ui/article-image"

export function IndustryInsights() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const categories = ["All", "Partnership", "Industry Insights", "Events", "Technology"]

  const filteredArticles = selectedCategory === "All" 
    ? articlesData 
    : articlesData.filter(a => a.category === selectedCategory)

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
            Industry Insights
          </Badge>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Latest from the Industry
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay informed with the latest trends, insights, and updates shaping the professional landscape and business environment.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-gray-200 text-gray-700 hover:bg-emerald-50"}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredArticles.map((insight) => (
            <Card key={insight.id} className="group hover:shadow-xl transition-all duration-300 border-gray-200 hover:border-emerald-300 overflow-hidden">
              <div className="h-48 relative overflow-hidden">
                <ArticleImage
                  src={insight.image}
                  alt={insight.title}
                  className="group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-white/90 text-emerald-800 border-white backdrop-blur-sm">
                    {insight.category}
                  </Badge>
                </div>
              </div>

              <CardHeader>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{insight.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>5 min read</span>
                  </div>
                </div>
                <Link href={`/insights/${insight.slug}`}>
                  <CardTitle className="text-lg text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2 cursor-pointer">
                    {insight.title}
                  </CardTitle>
                </Link>
                <CardDescription className="text-gray-600 line-clamp-3 text-sm">
                  {insight.excerpt}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Link href={`/insights/${insight.slug}`}>
                  <Button variant="ghost" className="text-emerald-700 hover:text-emerald-600 hover:bg-emerald-50 p-0 text-sm font-semibold">
                    Read Full Article
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
