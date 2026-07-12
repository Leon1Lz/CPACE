"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  MessageSquare,
  Building,
  Users
} from "lucide-react"

export function ContactSection() {
  const contactInfo = [
    {
      title: "Main Office",
      address: "123 Business Center, Makati City, Metro Manila, Philippines",
      phone: "+63 2 8888 1234",
      email: "info@cpaceph.com",
      hours: "Monday - Friday: 9:00 AM - 6:00 PM"
    },
    {
      title: "Training Center",
      address: "456 Learning Hub, Ortigas Center, Pasig City, Philippines",
      phone: "+63 2 8888 5678",
      email: "training@cpaceph.com",
      hours: "Monday - Saturday: 8:00 AM - 8:00 PM"
    }
  ]

  const departments = [
    {
      name: "Admissions",
      email: "admissions@cpaceph.com",
      phone: "+63 2 8888 1234 ext. 101",
      description: "For program inquiries and enrollment"
    },
    {
      name: "Corporate Services",
      email: "corporate@cpaceph.com",
      phone: "+63 2 8888 1234 ext. 102",
      description: "For business training and consultancy"
    },
    {
      name: "Student Support",
      email: "support@cpaceph.com",
      phone: "+63 2 8888 1234 ext. 103",
      description: "For student assistance and resources"
    }
  ]

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
            Contact Us
          </Badge>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Get in Touch
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're here to help you advance your career and grow your business. 
            Reach out to us through any of the channels below.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {contactInfo.map((location, index) => (
            <Card key={index} className="border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Building className="h-6 w-6 text-emerald-600" />
                  {location.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700">{location.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <p className="text-gray-700">{location.phone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <p className="text-gray-700">{location.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <p className="text-gray-700">{location.hours}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Departments */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Contact Our Departments
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {departments.map((dept, index) => (
              <Card key={index} className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="h-6 w-6 text-emerald-600" />
                    <h4 className="text-lg font-semibold text-gray-900">{dept.name}</h4>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{dept.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-700">{dept.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-700">{dept.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Contact CTA */}
        <div className="bg-emerald-600 rounded-lg p-8 text-center text-white">
          <div className="max-w-3xl mx-auto">
            <MessageSquare className="h-12 w-12 text-emerald-200 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">
              Ready to Start Your Journey?
            </h3>
            <p className="text-lg text-emerald-100 mb-6">
              Our team is ready to help you choose the right program or service 
              for your professional development needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-emerald-700 hover:bg-gray-100 font-semibold">
                Schedule a Consultation
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-emerald-700 font-semibold">
                Download Brochure
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
