import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ShieldCheck, Calendar, Award, CheckCircle, XCircle, FileText, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface VerifyPageProps {
  params: Promise<{ certificateNumber: string }>
}

export default async function VerifyCertificatePage({ params }: VerifyPageProps) {
  const { certificateNumber } = await params

  const cert = await prisma.certificate.findUnique({
    where: { certificateNumber },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      course: {
        select: {
          title: true,
          category: true,
        },
      },
    },
  })

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Header />

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center py-16 px-4 relative overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-teal-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

        <div className="max-w-2xl w-full relative z-10">
          {cert ? (
            /* VERIFIED STATE */
            <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100/50 overflow-hidden transform transition-all duration-500 hover:shadow-emerald-100/30">
              {/* Premium Top Bar */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-8 text-center text-white relative">
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                  <ShieldCheck className="h-4 w-4" />
                  Official Ledger
                </div>
                <div className="w-20 h-20 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center mx-auto mb-4 border border-white/25 shadow-inner">
                  <Award className="h-10 w-10 text-white animate-pulse" />
                </div>
                <h1 className="text-2xl font-black tracking-tight">VERIFIED CREDENTIAL</h1>
                <p className="text-emerald-100 text-sm mt-1">CPACE Philippines Certification Registry</p>
              </div>

              {/* Certificate Details */}
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-emerald-50/50 border border-emerald-100/40 rounded-2xl">
                  <CheckCircle className="h-8 w-8 text-emerald-600 shrink-0" />
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg">Valid Certification</h2>
                    <p className="text-gray-500 text-xs mt-0.5">This credential has been verified as authentic and active.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recipient Name</span>
                    <p className="text-gray-900 font-extrabold text-lg leading-snug">
                      {cert.user.firstName} {cert.user.lastName}
                    </p>
                    <p className="text-gray-400 text-xs">{cert.user.email.replace(/(.{3})(.*)(@.*)/, "$1***$3")}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Course / Certification</span>
                    <p className="text-emerald-800 font-extrabold text-lg leading-snug">
                      {cert.course.title}
                    </p>
                    {cert.course.category && (
                      <span className="inline-block text-[10px] bg-emerald-100/50 text-emerald-700 font-bold px-2 py-0.5 rounded-full mt-1">
                        {cert.course.category}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Unique Credential ID</span>
                    <p className="text-gray-800 font-mono font-bold text-sm tracking-wide bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 inline-block">
                      {cert.certificateNumber}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-xs">
                        <strong>Issued On:</strong> {new Date(cert.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-xs">
                        <strong>Expires On:</strong>{" "}
                        {cert.expiresAt
                          ? new Date(cert.expiresAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                          : "Lifetime Validity"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Ledger context */}
                <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <p className="text-gray-400 text-[11px] leading-snug text-center sm:text-left">
                    Registered under the Center for Professional Advancement and Continuing Education, Inc. (CPACE).
                  </p>
                  {cert.fileUrl && (
                    <a href={cert.fileUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold flex items-center justify-center gap-2">
                        <FileText className="h-4 w-4" />
                        View PDF
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* INVALID / NOT FOUND STATE */
            <div className="bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden text-center p-8 space-y-6">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto border border-rose-100">
                <XCircle className="h-10 w-10 text-rose-500" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-gray-900">Credential Not Found</h1>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  The certificate number <strong className="font-mono text-rose-600 font-black">{certificateNumber}</strong> could not be verified in our records.
                </p>
              </div>
              <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                If you believe this is an error, please verify the certificate number carefully or contact our support team.
              </p>
              <div className="pt-4 flex justify-center">
                <Link href="/">
                  <Button variant="outline" className="border-gray-200 text-gray-600 font-semibold flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
