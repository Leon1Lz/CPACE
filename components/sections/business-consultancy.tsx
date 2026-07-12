"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Building2, FileText, Shield, Users, Lightbulb, Target, ArrowRight } from "lucide-react"

export function BusinessConsultancy() {
  const services = [
    {
      title: "ISO Certification Consulting",
      description: "Expert guidance for businesses seeking ISO certification and compliance",
      icon: <Shield className="h-6 w-6" />,
      features: ["ISO 9001", "ISO 14001", "ISO 45001", "Gap Analysis"],
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "Business Registration Services",
      description: "Seamless business registration and legal compliance assistance",
      icon: <FileText className="h-6 w-6" />,
      features: ["SEC Registration", "Business Permits", "Tax Compliance", "Legal Documentation"],
      color: "bg-green-100 text-green-600"
    },
    {
      title: "Intellectual Property Protection",
      description: "Comprehensive IP protection and trademark registration services",
      icon: <Building2 className="h-6 w-6" />,
      features: ["Trademark Registration", "Patent Filing", "Copyright Protection", "IP Strategy"],
      color: "bg-purple-100 text-purple-600"
    },
    {
      title: "Strategic Business Planning",
      description: "Develop comprehensive business strategies for sustainable growth",
      icon: <Target className="h-6 w-6" />,
      features: ["Market Analysis", "Growth Strategy", "Financial Planning", "Risk Assessment"],
      color: "bg-orange-100 text-orange-600"
    },
    {
      title: "Organizational Development",
      description: "Enhance organizational structure and employee performance",
      icon: <Users className="h-6 w-6" />,
      features: ["Team Building", "Performance Management", "Leadership Development", "Culture Transformation"],
      color: "bg-red-100 text-red-600"
    },
    {
      title: "Digital Transformation",
      description: "Modernize your business with cutting-edge digital solutions",
      icon: <Lightbulb className="h-6 w-6" />,
      features: ["Digital Strategy", "Process Automation", "Technology Integration", "Change Management"],
      color: "bg-cpace-100 text-cpace-600"
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-accent-100 text-accent-700 border-accent-200">
            Business Consultancy
          </Badge>
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">
            Expert Business Solutions
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Transform your business with our expert consultancy services. From ISO certification to strategic planning, we help organizations achieve excellence.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-neutral-200 hover:border-cpace-300">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${service.color}`}>
                  {service.icon}
                </div>
                <CardTitle className="text-xl text-neutral-900 group-hover:text-cpace-700 transition-colors">
                  {service.title}
                </CardTitle>
                <CardDescription className="text-neutral-600">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-cpace-600 rounded-full"></div>
                        <span className="text-neutral-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" className="w-full border-cpace-300 text-cpace-700 hover:bg-cpace-50">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Partnership CTA */}
        <div className="bg-gradient-to-r from-accent-500 to-accent-600 rounded-2xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">
            Partner with Us for Institutional Programs
          </h3>
          <p className="text-xl mb-8 text-accent-100 max-w-2xl mx-auto">
            Develop branded training programs together and bring world-class education to your organization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/consultancy">
              <Button size="lg" className="bg-white text-accent-700 hover:bg-gray-100 font-semibold px-8 py-4">
                Explore Consultancy Services
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-accent-700 font-semibold px-8 py-4">
                Schedule Consultation
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
