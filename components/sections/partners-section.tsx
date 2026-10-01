"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Handshake,
  Award,
  Users,
  Building,
  Star,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Layers,
  GraduationCap,
} from "lucide-react";
import { cpaceStats } from "@/data/stats";

export function PartnersSection() {
  return (
    <section
      id="partners"
      className="relative py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.6'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        ></div>
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-emerald-200/25 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-teal-200/25 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 lg:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-200 text-xs font-semibold tracking-wide uppercase">
            <Handshake className="w-3.5 h-3.5 text-emerald-600" />
            Institutional Collaborations
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Collaborate with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              CPACE Philippines
            </span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Partnering with premier universities, multinational corporations,
            and industry leaders to advance professional excellence nationwide.
          </p>
        </div>

        {/* Card 1: Institutional Partnerships */}
        <div className="group relative rounded-3xl border border-emerald-100 bg-white p-8 lg:p-12 shadow-xl shadow-emerald-950/[0.04] hover:shadow-2xl transition-all duration-300 overflow-hidden">
          {/* Subtle Ambient Background Gradient */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-100/40 via-transparent to-transparent rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-xs font-semibold">
                <Handshake className="w-4 h-4 text-emerald-600" />
                Institutional Partnerships
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                Partner with Us for Institutional and Strategic Programs
              </h3>
              <p className="text-slate-600 text-base lg:text-lg leading-relaxed">
                Let&apos;s drive professional excellence together. We welcome
                academic institutions, corporate organizations, and industry
                associations to co-create certified training curricula that
                empower Filipino professionals and elevate organizational
                capability.
              </p>

              {/* Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>University and Academic Tie-ups</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Corporate Upskilling Programs</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Nationwide Credential Value</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Joint Research and Media</span>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/#contact">
                  <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    Contact Us
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Visual: Asian Partners Photo + Key Metrics */}
            <div className="lg:col-span-6 space-y-4">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 shadow-lg group-hover:shadow-xl transition-shadow bg-slate-100">
                <div className="relative aspect-video w-full">
                  <Image
                    src="/assets/asian-institutional-partners.jpg"
                    alt="Asian Filipino executives and university leaders signing institutional partnership"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs">
                    <span className="font-semibold drop-shadow-sm flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-emerald-400" />
                      Academic and Corporate Signing
                    </span>
                    <span className="bg-emerald-500/80 backdrop-blur-sm px-2.5 py-0.5 rounded-full font-medium text-[11px]">
                      Nationwide Reach
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 text-center">
                  <div className="text-xl lg:text-2xl font-bold text-slate-900">
                    {cpaceStats.institutionalPartners.value}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                    Partners
                  </div>
                </div>
                <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 text-center">
                  <div className="text-xl lg:text-2xl font-bold text-slate-900">
                    {cpaceStats.certifiedProfessionals.value}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                    Professionals
                  </div>
                </div>
                <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 text-center">
                  <div className="text-xl lg:text-2xl font-bold text-slate-900">
                    {cpaceStats.programsOffered.value}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                    Programs
                  </div>
                </div>
                <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 text-center">
                  <div className="text-xl lg:text-2xl font-bold text-slate-900">
                    {cpaceStats.successRate.value}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                    Success Rate
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Branded Training Programs */}
        <div className="group relative rounded-3xl border border-slate-200/80 bg-white p-8 lg:p-12 shadow-xl shadow-slate-900/[0.03] hover:shadow-2xl transition-all duration-300 overflow-hidden">
          {/* Subtle Ambient Background Gradient */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-teal-100/40 via-transparent to-transparent rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Visual: Asian Corporate Training Photo + Pillars */}
            <div className="lg:col-span-6 space-y-4 order-2 lg:order-1">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 shadow-lg group-hover:shadow-xl transition-shadow bg-slate-100">
                <div className="relative aspect-video w-full">
                  <Image
                    src="/assets/asian-branded-training.jpg"
                    alt="Asian Filipino corporate professionals in an executive training workshop"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs">
                    <span className="font-semibold drop-shadow-sm flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-teal-400" />
                      Executive Leadership Workshop
                    </span>
                    <span className="bg-teal-600/80 backdrop-blur-sm px-2.5 py-0.5 rounded-full font-medium text-[11px]">
                      Custom Co-Branded
                    </span>
                  </div>
                </div>
              </div>

              {/* Pillars Box */}
              <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                    <Layers className="w-3.5 h-3.5" />
                  </span>
                  <span>Custom Curriculum Aligned with Corporate Goals</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-100 text-teal-700 shrink-0">
                    <Award className="w-3.5 h-3.5" />
                  </span>
                  <span>Co-Branded Credentialing and Verification</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </span>
                  <span>Flexible Delivery: In-Person, Online, or Hybrid</span>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-teal-50 text-teal-800 border border-teal-200/80 rounded-full text-xs font-semibold">
                <Award className="w-4 h-4 text-teal-600" />
                Branded Programs
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                Develop Branded Training Programs Together
              </h3>
              <p className="text-slate-600 text-base lg:text-lg leading-relaxed">
                Join CPACE Philippines in crafting customized, branded programs
                designed to elevate your workforce. We collaborate with
                leadership teams to design specialized cohorts that strengthen
                capabilities and reinforce your corporate reputation.
              </p>

              <div className="space-y-2.5 text-sm text-slate-700">
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>
                    Tailored learning modules aligned with your business
                    industry
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>
                    Real-time participant progress tracking through our Learning
                    Portal
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>
                    Official digital certificates verified via CPACE Registry
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/#contact">
                  <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    Contact Us
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
