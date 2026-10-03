"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CookieSettingsDialog } from "@/components/layout/cookie-settings-dialog";
import { Cookie, ShieldCheck, Settings2, BarChart3, Sliders, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CookiePolicyPage() {
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Header */}
          <div className="rounded-3xl bg-gray-900 text-white p-8 sm:p-10 mb-10 shadow-xl border border-white/10 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                <Cookie className="h-3.5 w-3.5" />
                Transparency & Consent Notice
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Cookie Policy
              </h1>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                This Cookie Policy explains how CPACE Philippines uses cookies, pixels, and local
                storage technologies across our learning portal, credential verification tools, and
                websites.
              </p>
              <div className="pt-3 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => setCookieSettingsOpen(true)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold h-10 px-5 rounded-xl text-xs sm:text-sm shadow-md transition-all gap-2"
                >
                  <Settings2 className="h-4 w-4" />
                  Manage Cookie Settings
                </Button>
                <Link
                  href="/privacy"
                  className="inline-flex items-center text-xs sm:text-sm text-gray-300 hover:text-emerald-400 px-3 py-2 transition-colors"
                >
                  View Privacy Policy →
                </Link>
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-200/80 space-y-10 text-gray-700 leading-relaxed text-sm sm:text-base">
            {/* 1. What are cookies */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">1. What Are Cookies?</h2>
              <p>
                Cookies are small text files placed on your computer, smartphone, or tablet when you visit
                websites. They allow websites to remember your device, keep you signed in, preserve
                examination progress, and tailor technical performance.
              </p>
            </section>

            {/* 2. Categories of Cookies */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">2. Cookies We Use & Why</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Essential */}
                <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/70 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                    <ShieldCheck className="h-4 w-4" />
                    Strictly Necessary (Essential)
                  </div>
                  <p className="text-xs text-gray-600">
                    Required for basic site functionality, secure NextAuth session authentication,
                    CSRF protection, and anti-cheating proctoring validation. Cannot be switched off.
                  </p>
                </div>

                {/* Analytics */}
                <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/70 space-y-2">
                  <div className="flex items-center gap-2 text-sky-700 font-semibold text-sm">
                    <BarChart3 className="h-4 w-4" />
                    Performance & Analytics
                  </div>
                  <p className="text-xs text-gray-600">
                    Collect aggregated, anonymized metrics on page response times, navigation patterns,
                    and learning material engagement to improve platform stability.
                  </p>
                </div>

                {/* Functional */}
                <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/70 space-y-2">
                  <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                    <Sliders className="h-4 w-4" />
                    Functional Preferences
                  </div>
                  <p className="text-xs text-gray-600">
                    Remember custom choices such as proctor video feed orientation, exam audio level,
                    sidebar expansion, and cookie consent preferences.
                  </p>
                </div>

                {/* Security & Third-Party */}
                <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/70 space-y-2">
                  <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
                    <Lock className="h-4 w-4" />
                    Security & Verification
                  </div>
                  <p className="text-xs text-gray-600">
                    Integrations such as Google reCAPTCHA v2 (preventing spam on enrollment/comment forms)
                    and Google Cloud infrastructure security tokens.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Managing Cookies */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">3. How to Control Your Cookies</h2>
              <p>
                You can adjust your cookie settings at any time using our on-site preference manager:
              </p>
              <div className="pt-1">
                <Button
                  onClick={() => setCookieSettingsOpen(true)}
                  variant="outline"
                  className="border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm font-semibold h-10 px-4 rounded-xl gap-2"
                >
                  <Settings2 className="h-4 w-4 text-emerald-600" />
                  Open Cookie Settings
                </Button>
              </div>
              <p className="text-xs text-gray-500 pt-2">
                Alternatively, most web browsers allow you to manage cookies through browser settings
                (e.g., Chrome, Edge, Firefox, Safari). Please note that disabling essential cookies may
                impair your ability to take proctored examinations or log in to the LMS portal.
              </p>
            </section>

            {/* 4. Updates */}
            <section className="space-y-3 pt-4 border-t border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">4. Policy Updates & Questions</h2>
              <p>
                We may periodically update this Cookie Policy to reflect changes in legal requirements or
                portal enhancements. For any questions, please contact{" "}
                <a href="mailto:info@cpaceph.com" className="text-emerald-600 font-medium hover:underline">
                  info@cpaceph.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />

      <CookieSettingsDialog
        open={cookieSettingsOpen}
        onOpenChange={setCookieSettingsOpen}
      />
    </div>
  );
}
