"use client"

import { submitPublicForm } from "@/lib/public-form-client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Building, 
  Users,
  Send,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Navigation,
  ExternalLink
} from "lucide-react"

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    program: "Professional Certification",
    message: "",
  })
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [activeMapTab, setActiveMapTab] = useState<"manila" | "dubai">("manila")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await submitPublicForm("/api/contact", formData)

      setSubmitted(true)
      setSelectedPreset(null)
      setFormData({
        name: "",
        email: "",
        phone: "",
        program: "Professional Certification",
        message: "",
      })
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred. Please try again or email us directly at info@cpaceph.com.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactInfo = [
    {
      title: "Manila, Philippines",
      address: "Unit 1510 High Street South Corporate Plaza Tower 1, 26th St. Corner 9th Ave., BGC Taguig City, Philippines (1634)",
      phone: "+63 956 221-2400",
      email: "info@cpaceph.com",
      hours: "Monday - Friday: 9:00 AM - 6:00 PM (PHT)"
    },
    {
      title: "Dubai, United Arab Emirates",
      address: "StratEd Global – Level 41, Emirates Towers Sheikh Zayed Road Dubai, UAE PO Box 31303",
      phone: "+971 50 348 9439",
      email: "info@cpaceph.com",
      hours: "Sunday - Thursday: 9:00 AM - 6:00 PM (GST)"
    }
  ]

  const departments = [
    {
      name: "Admissions & Enrollment",
      email: "admissions@cpaceph.com",
      phone: "+63 956 221-2400",
      description: "For program inquiries, enrollments, and certification registration"
    },
    {
      name: "Corporate & Institutional Services",
      email: "corporate@cpaceph.com",
      phone: "+971 50 348 9439 / +63 956 221-2400",
      description: "For corporate training, global partnerships, and business consultancy"
    },
    {
      name: "Student Support & Verification",
      email: "support@cpaceph.com",
      phone: "+63 956 221-2400",
      description: "For student assistance, exam scheduling, and credential verification"
    }
  ]

  const mapLocations = {
    manila: {
      name: "Manila Headquarters (BGC)",
      address: "Unit 1510, High Street South Corporate Plaza Tower 1, 26th St. Corner 9th Ave., BGC Taguig City, Philippines (1634)",
      embedUrl: "https://www.openstreetmap.org/export/embed.html?bbox=121.0475%2C14.5475%2C121.0555%2C14.5535&layer=mapnik&marker=14.5503%2C121.0515",
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=High+Street+South+Corporate+Plaza+Tower+1,+26th+St+Corner+9th+Ave,+BGC+Taguig+City",
      wazeUrl: "https://waze.com/ul?q=High+Street+South+Corporate+Plaza+Tower+1+BGC&navigate=yes",
    },
    dubai: {
      name: "Dubai Regional Office",
      address: "StratEd Global – Level 41, Emirates Towers, Sheikh Zayed Road, Dubai, UAE PO Box 31303",
      embedUrl: "https://www.openstreetmap.org/export/embed.html?bbox=55.2780%2C25.2140%2C55.2880%2C25.2230&layer=mapnik&marker=25.2185%2C55.2829",
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Emirates+Towers+Sheikh+Zayed+Road+Dubai",
      wazeUrl: "https://waze.com/ul?q=Emirates+Towers+Dubai&navigate=yes",
    },
  }

  const presets = [
    { label: "Certification (CFMS® / CMMS® / COMS®)", program: "Professional Certification", placeholder: "I would like to inquire about upcoming examination dates, review materials, and fees for CFMS®, CMMS®, and COMS® certifications." },
    { label: "Business & ISO Consultancy", program: "Business Consultancy", placeholder: "We are interested in consulting services for ISO certification (ISO 9001/14001/45001) / IP registration for our organization." },
    { label: "Short Courses & Training", program: "Certificate & Short Courses", placeholder: "I would like to know more about available executive short courses and training schedules." },
    { label: "Institutional Partnership", program: "Institutional Partnership", placeholder: "We represent an academic/corporate institution and would like to explore a partnership with CPACE Philippines." },
  ]

  const selectPreset = (preset: typeof presets[0]) => {
    if (selectedPreset === preset.label) {
      setSelectedPreset(null)
      setFormData((prev) => ({
        ...prev,
        message: prev.message === preset.placeholder ? "" : prev.message,
      }))
    } else {
      setSelectedPreset(preset.label)
      setFormData((prev) => ({
        ...prev,
        program: preset.program,
        message: preset.placeholder,
      }))
    }
  }

  return (
    <section id="contact" className="py-20 bg-slate-50 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-100/30 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
            Contact Us
          </Badge>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Get in Touch with CPACE Philippines
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We&apos;re here to help you advance your career and grow your organization. 
            Reach out to our team directly through the form below or our official communication channels.
          </p>
        </div>

        {/* Contact Form & Main Office Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Left: Contact Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 lg:p-10 shadow-xl border border-gray-100 space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Send an Inquiry</h3>
              <p className="text-gray-500 text-sm">Fill out this quick form or tap a topic below to get started.</p>
            </div>

            {/* Quick Topic Presets */}
            {!submitted && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Inquiries</span>
                <div className="flex flex-wrap gap-2">
                  {presets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectPreset(preset)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                        selectedPreset === preset.label
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold shadow-xs ring-1 ring-emerald-300"
                          : "bg-gray-50/80 text-gray-600 border-gray-200 hover:bg-emerald-50/60 hover:text-emerald-700"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900">Message Received!</h4>
                <p className="text-gray-600 max-w-md mx-auto text-sm">
                  Thank you for reaching out to CPACE Philippines. Our representative will contact you shortly via email or phone.
                </p>
                <Button 
                  onClick={() => setSubmitted(false)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold mt-4 rounded-xl"
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div role="alert" className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold">Unable to send message</p>
                      <p className="text-red-600 text-xs">{errorMessage}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-name" className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Full Name *</label>
                    <input
                      type="text"
                      required
                      disabled={isSubmitting}
                      placeholder="Juan Dela Cruz"
                      id="contact-name"
                      maxLength={120}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-email" className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Email Address *</label>
                    <input
                      type="email"
                      required
                      disabled={isSubmitting}
                      placeholder="juan@example.com"
                      id="contact-email"
                      maxLength={254}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-phone" className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Contact Number</label>
                    <input
                      type="tel"
                      disabled={isSubmitting}
                      placeholder="+63 912 345 6789"
                      id="contact-phone"
                      maxLength={40}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-program" className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Program of Interest</label>
                    <select
                      id="contact-program"
                      value={formData.program}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        const val = e.target.value
                        const matchedPreset = presets.find((p) => p.program === val)
                        setSelectedPreset(matchedPreset ? matchedPreset.label : null)
                        setFormData((prev) => ({
                          ...prev,
                          program: val,
                          message: matchedPreset && (prev.message === "" || presets.some((p) => p.placeholder === prev.message))
                            ? matchedPreset.placeholder
                            : prev.message,
                        }))
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white disabled:bg-gray-50 transition-all"
                    >
                      <option value="Professional Certification">Professional Certification (CFMS®, CMMS®, COMS®)</option>
                      <option value="Business Consultancy">Business Consultancy & ISO Certification</option>
                      <option value="Certificate & Short Courses">Certificate & Short Courses</option>
                      <option value="Management Training">Management Training</option>
                      <option value="Institutional Partnership">Institutional Partnership</option>
                      <option value="General Inquiry">General Inquiry</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-message" className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Your Message / Inquiry *</label>
                  <textarea
                    rows={4}
                    required
                    disabled={isSubmitting}
                    placeholder="Tell us about your training requirements or questions..."
                    id="contact-message"
                    maxLength={5000}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 transition-all"
                  ></textarea>
                </div>

                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01] disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Inquiry...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Inquiry
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Right: Office Cards */}
          <div className="lg:col-span-5 flex flex-col gap-6 justify-start">
            {contactInfo.map((location, index) => (
              <Card key={index} className="border border-gray-200/80 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg text-emerald-800">
                    <Building className="h-5 w-5 text-emerald-600" />
                    {location.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-emerald-600 mt-1 flex-shrink-0" />
                    <span>{location.address}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span>{location.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span>{location.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span>{location.hours}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Interactive Location Map */}
        <div className="mb-16">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Visit Our Office
            </h3>
            <p className="text-sm text-gray-600 max-w-xl mx-auto">
              Find our physical offices in Bonifacio Global City, Taguig and Dubai, UAE.
            </p>

            {/* Location Switcher Tabs */}
            <div className="inline-flex p-1 bg-gray-100 rounded-xl mt-4 border border-gray-200">
              <button
                type="button"
                onClick={() => setActiveMapTab("manila")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeMapTab === "manila"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                🇵🇭 Manila (BGC)
              </button>
              <button
                type="button"
                onClick={() => setActiveMapTab("dubai")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeMapTab === "dubai"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                🇦🇪 Dubai (UAE)
              </button>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-200/80 bg-slate-100">
            <iframe
              key={activeMapTab}
              src={mapLocations[activeMapTab].embedUrl}
              width="100%"
              height="380"
              style={{ border: 0 }}
              loading="lazy"
              title={`CPACE Office Location - ${mapLocations[activeMapTab].name}`}
              className="w-full"
            ></iframe>

            {/* Office Info & Direction Actions */}
            <div className="p-4 bg-white/95 backdrop-blur-sm border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-gray-700 font-medium">
                  {mapLocations[activeMapTab].address}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={mapLocations[activeMapTab].googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Google Maps
                </a>
                <a
                  href={mapLocations[activeMapTab].wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium border border-slate-200 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Waze
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Departments */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Contact Our Specialized Departments
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {departments.map((dept, index) => (
              <Card key={index} className="border border-gray-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="h-6 w-6 text-emerald-600" />
                    <h4 className="text-lg font-semibold text-gray-900">{dept.name}</h4>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{dept.description}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{dept.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{dept.phone}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
