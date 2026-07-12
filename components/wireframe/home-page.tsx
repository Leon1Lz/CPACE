"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlaceholderImage, PlaceholderLogo } from "@/components/wireframe/placeholder"
import { ChevronDown, Mail, Phone, MapPin, Facebook, Linkedin, Twitter, Users, BookOpen, Award, Building } from "lucide-react"

interface HomePageProps {
  onLoginClick?: () => void
}

export function HomePage({ onLoginClick }: HomePageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 border-b bg-card">
        <div className="container mx-auto h-full flex items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <PlaceholderLogo size="sm" />
            <div className="hidden sm:block">
              <div className="text-sm font-bold leading-tight">CPACE</div>
              <div className="text-[10px] text-muted-foreground">Continuing Education</div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm font-medium border-b-2 border-foreground pb-1">Home</a>
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground">About</a>
            <a href="#services" className="text-sm text-muted-foreground hover:text-foreground">Services</a>
            <a href="#programs" className="text-sm text-muted-foreground hover:text-foreground">Programs</a>
            <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground">Contact Us</a>
            <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground">Register</Link>
          </nav>

          {/* CTA Button */}
          <Link href="/login">
            <Button className="font-medium">
              Learning Portal
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center overflow-hidden">
        {/* Background Image Placeholder */}
        <div className="absolute inset-0">
          <PlaceholderImage 
            label="Professional Meeting Background"
            className="w-full h-full"
          />
        </div>

        {/* Diagonal Overlay */}
        <div 
          className="absolute inset-0 bg-foreground/80"
          style={{
            clipPath: "polygon(0 0, 65% 0, 45% 100%, 0 100%)"
          }}
        />

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-xl">
            <h1 className="text-4xl md:text-5xl font-bold text-background leading-tight mb-6 text-balance">
              Advance Your Career & Business with CPACE Philippines
            </h1>
            <p className="text-background/80 mb-8 leading-relaxed">
              The Center for Professional Advancement and Continuing Education, Inc. (CPACE Philippines), 
              is a professional organization that provides professional development and continuing education 
              opportunities to individuals and organizations for their career and professional growth.
            </p>
            <Button 
              size="lg" 
              className="bg-background text-foreground hover:bg-background/90"
            >
              LEARN MORE
            </Button>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Certification Programs</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Elevate your professional credentials with our internationally recognized certification programs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* CMS Card */}
            <div className="border rounded-lg overflow-hidden bg-background">
              <div className="h-48 relative">
                <PlaceholderImage label="Marketing Specialist" className="h-full" />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2">Certified Marketing Specialist (CMS)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Master modern marketing strategies and digital transformation techniques
                </p>
                <Button variant="outline" className="w-full">Learn More</Button>
              </div>
            </div>

            {/* CFM Card */}
            <div className="border rounded-lg overflow-hidden bg-background">
              <div className="h-48 relative">
                <PlaceholderImage label="Financial Management" className="h-full" />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2">Certified Financial Manager (CFM)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Develop expertise in financial planning, analysis, and management
                </p>
                <Button variant="outline" className="w-full">Learn More</Button>
              </div>
            </div>

            {/* COM Card */}
            <div className="border rounded-lg overflow-hidden bg-background">
              <div className="h-48 relative">
                <PlaceholderImage label="Operations Management" className="h-full" />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2">Certified Operations Manager (COM)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Excel in operational efficiency and business process optimization
                </p>
                <Button variant="outline" className="w-full">Learn More</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">About CPACE Philippines</h2>
              <p className="text-muted-foreground mb-4">
                CPACE Philippines is committed to providing world-class professional development 
                and continuing education programs that meet international standards.
              </p>
              <p className="text-muted-foreground mb-6">
                Our programs are designed to help professionals stay competitive in today&apos;s 
                rapidly evolving business landscape through practical, industry-relevant training.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-bold">5,000+</div>
                    <div className="text-xs text-muted-foreground">Certified Professionals</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-bold">50+</div>
                    <div className="text-xs text-muted-foreground">Courses Available</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Award className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-bold">15+</div>
                    <div className="text-xs text-muted-foreground">Years Experience</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Building className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-bold">200+</div>
                    <div className="text-xs text-muted-foreground">Partner Companies</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <PlaceholderImage 
                label="Team Photo" 
                className="rounded-lg h-[400px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive professional development solutions for individuals and organizations
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-card border rounded-lg p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-bold mb-2">Online Learning</h3>
              <p className="text-sm text-muted-foreground">
                Self-paced courses accessible anytime, anywhere
              </p>
            </div>

            <div className="bg-card border rounded-lg p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-bold mb-2">Corporate Training</h3>
              <p className="text-sm text-muted-foreground">
                Customized programs for your organization
              </p>
            </div>

            <div className="bg-card border rounded-lg p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Award className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-bold mb-2">Certification</h3>
              <p className="text-sm text-muted-foreground">
                Internationally recognized credentials
              </p>
            </div>

            <div className="bg-card border rounded-lg p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Building className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-bold mb-2">Consulting</h3>
              <p className="text-sm text-muted-foreground">
                Expert guidance for business growth
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Advance Your Career?</h2>
          <p className="mb-8 opacity-80 max-w-2xl mx-auto">
            Join thousands of professionals who have transformed their careers with CPACE Philippines
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-background text-foreground hover:bg-background/90"
              onClick={onLoginClick}
            >
              Access Learning Portal
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-background text-background hover:bg-background/10"
            >
              View Programs
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">Contact Us</h2>
              <p className="text-muted-foreground mb-8">
                Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">Address</div>
                    <div className="text-sm text-muted-foreground">123 Business District, Makati City, Philippines</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">Phone</div>
                    <div className="text-sm text-muted-foreground">+63 (2) 8888-CPACE</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">Email</div>
                    <div className="text-sm text-muted-foreground">info@cpace.ph</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form Placeholder */}
            <div className="border rounded-lg p-6 bg-card">
              <h3 className="font-bold mb-4">Send us a Message</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Full Name</label>
                  <div className="h-10 border rounded bg-muted/30"></div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email Address</label>
                  <div className="h-10 border rounded bg-muted/30"></div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Subject</label>
                  <div className="h-10 border rounded bg-muted/30"></div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Message</label>
                  <div className="h-24 border rounded bg-muted/30"></div>
                </div>
                <Button className="w-full">Send Message</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Logo & Description */}
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <PlaceholderLogo size="sm" />
                <div>
                  <div className="text-sm font-bold">CPACE</div>
                  <div className="text-[10px] text-muted-foreground">Continuing Education</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Empowering professionals through quality education and certification.
              </p>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Facebook className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Linkedin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Twitter className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Home</a></li>
                <li><a href="#about" className="hover:text-foreground">About Us</a></li>
                <li><a href="#services" className="hover:text-foreground">Services</a></li>
                <li><a href="#programs" className="hover:text-foreground">Programs</a></li>
                <li><a href="#contact" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>

            {/* Programs */}
            <div>
              <h4 className="font-bold mb-4">Programs</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">CMS Certification</a></li>
                <li><a href="#" className="hover:text-foreground">CFM Certification</a></li>
                <li><a href="#" className="hover:text-foreground">COM Certification</a></li>
                <li><a href="#" className="hover:text-foreground">Corporate Training</a></li>
                <li><a href="#" className="hover:text-foreground">Workshops</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-bold mb-4">Contact Info</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>123 Business District</li>
                <li>Makati City, Philippines</li>
                <li>+63 (2) 8888-CPACE</li>
                <li>info@cpace.ph</li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div>&copy; 2024 CPACE Philippines. All rights reserved.</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground">Privacy Policy</a>
              <a href="#" className="hover:text-foreground">Terms of Service</a>
              <a href="#" className="hover:text-foreground">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
