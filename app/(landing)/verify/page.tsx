"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Search, Award, CheckCircle2, ArrowRight, FileCheck, HelpCircle } from "lucide-react"

export default function VerifyPage() {
  const [certNumber, setCertNumber] = useState("")
  const [error, setError] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = certNumber.trim()
    if (!trimmed) {
      setError("Please enter a valid certificate number.")
      return
    }
    setError("")
    setIsSearching(true)
    router.push(`/verify/${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex flex-col justify-between">
      <Header />

      <main className="flex-grow py-16 lg:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Decorative Blobs */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-4xl mx-auto relative z-10 space-y-12">
          {/* Header */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 inline" />
              Official Verification Registry
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
              Verify a CPACE Credential
            </h1>
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
              Verify the authenticity of professional certificates, diplomas, and credentials issued by CPACE Philippines.
            </p>
          </div>

          {/* Search Box Card */}
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white/90 backdrop-blur-md border-emerald-100/80">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 sm:p-10 text-white text-center">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 backdrop-blur-sm shadow-inner">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Instant Certificate Lookup</h2>
              <p className="text-emerald-100 text-sm max-w-lg mx-auto">
                Enter the unique Certificate ID printed on the physical or digital certificate (e.g., <code className="bg-white/20 px-2 py-0.5 rounded font-mono text-xs">CPACE-...</code>)
              </p>
            </div>

            <CardContent className="p-8 sm:p-10 space-y-6">
              <form onSubmit={handleVerify} className="space-y-4 max-w-xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="e.g. CPACE-1727452800000-A1B2"
                      value={certNumber}
                      onChange={(e) => {
                        setCertNumber(e.target.value)
                        if (error) setError("")
                      }}
                      className="pl-12 h-14 rounded-2xl text-base border-gray-200 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSearching}
                    className="h-14 px-8 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] shrink-0"
                  >
                    {isSearching ? "Verifying..." : "Verify Now"}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>

                {error && (
                  <p className="text-rose-600 text-sm font-medium pl-2">{error}</p>
                )}
              </form>

              {/* Explanatory Info */}
              <div className="pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">Tamper-Proof Ledger</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Every certificate is tied to an immutable institutional registry entry.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80">
                  <FileCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">Instant Verification</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Employers and academic institutions can verify credentials 24/7 in real time.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80">
                  <HelpCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">Need Assistance?</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Contact <Link href="/#contact" className="text-emerald-700 font-semibold underline">support</Link> for historical physical archives.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
