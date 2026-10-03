import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2, Mail, MapPin } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | CPACE Philippines",
  description:
    "Data Privacy Policy and Information Notice of CPACE Philippines in compliance with the Philippine Data Privacy Act of 2012 (RA 10173) and the National Privacy Commission (NPC).",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Card */}
          <div className="rounded-3xl bg-gray-900 text-white p-8 sm:p-10 mb-10 shadow-xl border border-white/10 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                NPC Registered DPO / DPS • RA 10173 Compliant
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Data Privacy Policy
              </h1>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                The Center for Professional Advancement and Continuing Education, Inc. (CPACE Philippines)
                is committed to respecting and protecting your privacy in full compliance with the
                Philippine Data Privacy Act of 2012 (Republic Act No. 10173) and its Implementing Rules
                and Regulations.
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs text-gray-400">
                <span>Registration Validity: 24 September 2027</span>
                <span>•</span>
                <span>Last Updated: October 2026</span>
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-200/80 space-y-10 text-gray-700 leading-relaxed text-sm sm:text-base">
            {/* Section 1 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5 text-gray-900">
                <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                <h2 className="text-xl font-bold">1. Introduction & Scope</h2>
              </div>
              <p>
                This Privacy Policy applies to all personal data collected, stored, processed, or
                transferred by CPACE Philippines through our website, Learning Management System (LMS),
                credential verification portal, proctoring systems, and related continuing professional
                advancement programs.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5 text-gray-900">
                <Eye className="h-5 w-5 text-emerald-600 shrink-0" />
                <h2 className="text-xl font-bold">2. Personal Data We Collect</h2>
              </div>
              <p>Depending on your interaction with CPACE, we may collect:</p>
              <ul className="list-disc pl-6 space-y-1.5 text-gray-600">
                <li>
                  <strong className="text-gray-900">Personal Identification:</strong> Full name,
                  email address, contact numbers, residential/office address, and government-issued ID
                  information for verification.
                </li>
                <li>
                  <strong className="text-gray-900">Academic & Professional Records:</strong> Educational
                  background, current employer, professional license/PRC credentials, and certifications.
                </li>
                <li>
                  <strong className="text-gray-900">Assessment & Proctoring Data:</strong> Examination
                  answers, timestamps, identity verification snapshots, and proctored session video feeds
                  to ensure certification integrity.
                </li>
                <li>
                  <strong className="text-gray-900">Technical Data:</strong> IP address, device
                  information, browser type, and cookie preferences (see our{" "}
                  <Link href="/cookies" className="text-emerald-600 font-medium hover:underline">
                    Cookie Policy
                  </Link>
                  ).
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5 text-gray-900">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <h2 className="text-xl font-bold">3. Purpose of Data Processing</h2>
              </div>
              <p>We process your data strictly on legitimate grounds, including:</p>
              <ul className="list-disc pl-6 space-y-1.5 text-gray-600">
                <li>Enrolling you in certified programs (e.g. CFMS®, CMMS®, COMS®, Labor Law Lectures).</li>
                <li>Administering secure, proctored examinations and issuing verified digital credentials.</li>
                <li>Verifying authenticity of issued credentials via public verification search.</li>
                <li>Fulfilling compliance obligations mandated by the National Privacy Commission and relevant regulatory authorities.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5 text-gray-900">
                <Lock className="h-5 w-5 text-emerald-600 shrink-0" />
                <h2 className="text-xl font-bold">4. Data Security & Storage</h2>
              </div>
              <p>
                CPACE implements robust organizational, physical, and technical security measures. Our
                infrastructure is hosted with enterprise-grade cloud partners (including Google Cloud),
                utilizing TLS 1.3 encryption in transit, AES-256 encryption at rest, strict role-based access
                controls, and continuous security audits.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5 text-gray-900">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                <h2 className="text-xl font-bold">5. Your Rights as a Data Subject</h2>
              </div>
              <p>Under the Data Privacy Act of 2012, you are entitled to:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/80">
                  <strong className="text-gray-900 block text-sm">Right to be Informed</strong>
                  <span className="text-xs text-gray-500">Know how your data is collected and processed.</span>
                </div>
                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/80">
                  <strong className="text-gray-900 block text-sm">Right to Access</strong>
                  <span className="text-xs text-gray-500">Request copies of personal information on file.</span>
                </div>
                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/80">
                  <strong className="text-gray-900 block text-sm">Right to Rectification</strong>
                  <span className="text-xs text-gray-500">Correct inaccurate or outdated records.</span>
                </div>
                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/80">
                  <strong className="text-gray-900 block text-sm">Right to Object & Erasure</strong>
                  <span className="text-xs text-gray-500">Suspend or withdraw processing of your data.</span>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section className="space-y-3 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2.5 text-gray-900">
                <Mail className="h-5 w-5 text-emerald-600 shrink-0" />
                <h2 className="text-xl font-bold">6. Contact Our Data Protection Officer</h2>
              </div>
              <p>
                For inquiries, data access requests, or to exercise your rights under RA 10173, please
                reach out directly to our designated Data Protection Officer:
              </p>
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-sm space-y-1.5 text-emerald-950">
                <p>
                  <strong>Data Protection Officer (DPO)</strong> — CPACE Philippines
                </p>
                <div className="flex items-center gap-2 text-emerald-800">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a href="mailto:info@cpaceph.com" className="hover:underline">
                    info@cpaceph.com
                  </a>
                </div>
                <div className="flex items-center gap-2 text-emerald-800">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>
                    Unit 1510 High Street South Corporate Plaza Tower 1, 26th St. Corner 9th Ave., BGC Taguig City, Philippines (1634)
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
