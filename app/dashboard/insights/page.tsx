"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Newspaper, Plus, Search, Calendar, MessageCircle, Star, Pencil, Trash2, ArrowLeft, Loader2, Sparkles } from "lucide-react"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const CATEGORIES = [
  { value: "Partnership", label: "Partnership", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "Industry Insights", label: "Industry Insights", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "Events", label: "Events", color: "bg-violet-100 text-violet-700 border-violet-200" },
  { value: "Technology", label: "Technology", color: "bg-orange-100 text-orange-700 border-orange-200" }
]

const ICONS = ["users", "trending-up", "zap", "globe"]

const DEFAULT_BANNER = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"

export default function ManageInsightsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Articles state
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("ALL")
  
  // Edit/Create dialog states
  const [formOpen, setFormOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<any>(null) // null = creating new
  const [formLoading, setFormLoading] = useState(false)
  
  // Form fields
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("Partnership")
  const [iconName, setIconName] = useState("users")
  const [image, setImage] = useState("")
  const [featured, setFeatured] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // Delete dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [articleToDelete, setArticleToDelete] = useState<any>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/articles")
      if (res.ok) {
        const data = await res.json()
        setArticles(data)
      }
    } catch (err) {
      console.error("Error fetching articles:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (session && session.user.role !== "ADMIN" && session.user.role !== "INSTRUCTOR") {
      router.push("/dashboard")
      return
    }
    fetchArticles()
  }, [session, status])

  // Handles updating slug dynamically when title changes (only if slug matches old generated title)
  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!editingArticle) {
      setSlug(generateSlug(val))
    }
  }

  const openCreateForm = () => {
    setEditingArticle(null)
    setTitle("")
    setSlug("")
    setExcerpt("")
    setContent("")
    setCategory("Partnership")
    setIconName("users")
    setImage(DEFAULT_BANNER)
    setFeatured(false)
    setErrorMsg("")
    setFormOpen(true)
  }

  const openEditForm = (article: any) => {
    setEditingArticle(article)
    setTitle(article.title)
    setSlug(article.slug)
    setExcerpt(article.excerpt || "")
    setContent(article.content || "")
    setCategory(article.category)
    setIconName(article.iconName)
    setImage(article.image)
    setFeatured(article.featured)
    setErrorMsg("")
    setFormOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (!title.trim()) {
      setErrorMsg("Title is required")
      return
    }
    if (!content.trim()) {
      setErrorMsg("Article content is required")
      return
    }

    const payload = {
      title,
      slug: slug.trim() || undefined,
      excerpt: excerpt.trim() || undefined,
      content,
      category,
      categoryColor: CATEGORIES.find(c => c.value === category)?.color,
      iconName,
      image: image.trim() || DEFAULT_BANNER,
      featured
    }

    try {
      setFormLoading(true)
      const url = editingArticle ? `/api/articles/${editingArticle.id}` : "/api/articles"
      const method = editingArticle ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        await fetchArticles()
        setFormOpen(false)
      } else {
        const errorData = await res.json()
        setErrorMsg(errorData.error || "Failed to save article")
      }
    } catch (err) {
      console.error("Error saving article:", err)
      setErrorMsg("An unexpected error occurred")
    } finally {
      setFormLoading(false)
    }
  }

  const openDeleteDialog = (article: any) => {
    setArticleToDelete(article)
    setDeleteConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!articleToDelete) return
    try {
      setDeleteLoading(true)
      const res = await fetch(`/api/articles/${articleToDelete.id}`, { method: "DELETE" })
      if (res.ok) {
        setArticles(prev => prev.filter(a => a.id !== articleToDelete.id))
        setDeleteConfirmOpen(false)
      }
    } catch (err) {
      console.error("Error deleting article:", err)
    } finally {
      setDeleteLoading(false)
      setArticleToDelete(null)
    }
  }

  const filteredArticles = articles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) || 
                          a.excerpt.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === "ALL" || a.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-150 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Newspaper className="w-8 h-8 text-emerald-600" />
            Manage Insights & Articles
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create, update, and manage professional certification articles and announcements shown on the public feed.
          </p>
        </div>
        <Button 
          onClick={openCreateForm}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 px-5 py-5 rounded-xl text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Article
        </Button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search articles by title or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-6 border-gray-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          />
        </div>
        <div className="w-full sm:w-60">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="py-6 border-gray-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-sm">
              <SelectValue placeholder="Filter by Category" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-150">
              <SelectItem value="ALL">All Categories</SelectItem>
              {CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Articles Listing */}
      <Card className="rounded-2xl border-gray-150 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm font-medium">Fetching articles...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-16 text-gray-400 space-y-3">
              <Newspaper className="w-12 h-12 mx-auto text-gray-300 stroke-[1.5]" />
              <h3 className="font-semibold text-gray-700">No articles found</h3>
              <p className="text-xs max-w-xs mx-auto">
                No matching insights were found in the database. Create a new article to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-20 pl-6 py-4 font-semibold text-gray-600">Image</TableHead>
                    <TableHead className="font-semibold text-gray-600 py-4">Title</TableHead>
                    <TableHead className="font-semibold text-gray-600 py-4">Category</TableHead>
                    <TableHead className="font-semibold text-gray-600 py-4">Date</TableHead>
                    <TableHead className="font-semibold text-gray-600 py-4 text-center">Featured</TableHead>
                    <TableHead className="pr-6 py-4 text-right font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArticles.map((article) => (
                    <TableRow key={article.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Image Thumbnail */}
                      <TableCell className="pl-6 py-4">
                        <div className="relative w-12 h-12 rounded-lg border border-gray-100 overflow-hidden shrink-0 shadow-sm">
                          <img
                            src={article.image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </TableCell>
                      
                      {/* Title */}
                      <TableCell className="py-4 max-w-sm">
                        <div className="font-semibold text-gray-900 leading-tight">
                          {article.title}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 truncate max-w-xs">
                          {article.slug}
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell className="py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${article.categoryColor || "bg-gray-100 text-gray-800"}`}>
                          {article.category}
                        </span>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {article.date || new Date(article.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>

                      {/* Featured */}
                      <TableCell className="py-4 text-center">
                        {article.featured ? (
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400 mx-auto" />
                        ) : (
                          <span className="text-gray-300 mx-auto">-</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="pr-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditForm(article)}
                            className="h-8 w-8 rounded-lg text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(article)}
                            className="h-8 w-8 rounded-lg text-gray-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Modal Form */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl max-h-[90vh] overflow-y-auto bg-white p-6 border-0 shadow-2xl rounded-2xl">
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="text-xl font-extrabold text-gray-900 flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              {editingArticle ? "Edit Article" : "Create New Article"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              Provide the details, category settings, and write the body content for the insight publication.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-5 py-4">
            {errorMsg && (
              <div className="bg-rose-50 text-rose-700 text-sm font-semibold p-3 border border-rose-200 rounded-xl">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Article Title</label>
                <Input
                  placeholder="e.g. Batch graduation of CFMS credentials"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                  className="border-gray-200 rounded-xl py-5 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                />
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">URL Slug</label>
                <Input
                  placeholder="e.g. batch-graduation-cfms"
                  value={slug}
                  onChange={(e) => setSlug(generateSlug(e.target.value))}
                  required
                  className="border-gray-200 rounded-xl py-5 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-gray-50/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="border-gray-200 rounded-xl py-5 focus:ring-emerald-500" style={{ height: "42px" }}>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-150">
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Icon Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Icon Group</label>
                <Select value={iconName} onValueChange={setIconName}>
                  <SelectTrigger className="border-gray-200 rounded-xl py-5 focus:ring-emerald-500" style={{ height: "42px" }}>
                    <SelectValue placeholder="Select Icon" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-150">
                    {ICONS.map(i => (
                      <SelectItem key={i} value={i} className="capitalize">{i.replace("-", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Featured Flag */}
              <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 select-none bg-gray-50/50" style={{ height: "42px", marginTop: "22px" }}>
                <Checkbox
                  id="featured"
                  checked={featured}
                  onCheckedChange={(checked) => setFeatured(!!checked)}
                  className="border-gray-300 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="featured" className="text-xs font-semibold text-gray-700 cursor-pointer flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Mark as Featured Post
                </label>
              </div>
            </div>

            {/* Banner Image URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Banner Image URL</label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="border-gray-200 rounded-xl py-5 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
            </div>

            {/* Excerpt */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Short Summary Excerpt (Short preview)</label>
              <Textarea
                placeholder="Provide a short 1-2 sentence preview text for the feed cards..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="border-gray-200 rounded-xl min-h-[60px] focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
            </div>

            {/* WYSIWYG Content Editor */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Article Body Content (Rich WYSIWYG Editor)</label>
              <RichTextEditor value={content} onChange={setContent} placeholder="Write your full article layout, content lists, paragraphs, or blocks here..." />
            </div>

            <DialogFooter className="border-t border-gray-100 pt-4 gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setFormOpen(false)}
                className="border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-600/10 px-6"
              >
                {formLoading ? (
                  <>
                    <Loader2 className="mr-1.5 w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Article"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-2xl border-0 p-6 shadow-2xl bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 font-extrabold text-lg">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 text-sm leading-relaxed mt-2">
              This action will permanently delete the article <strong className="text-gray-900">"{articleToDelete?.title}"</strong> and remove it from database records. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-lg shadow-rose-600/20"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-1.5 w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Yes, delete article"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
