"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
} from "lucide-react";

export function Footer() {
  const quickLinks = [
    { name: "About Us", href: "/about" },
    { name: "Services & Certifications", href: "/services" },
    { name: "Industry Insights", href: "/insights" },
    { name: "Contact Us", href: "/#contact" },
  ];

  const programs = [
    { name: "Financial Management (CFMS®)", href: "/services#certifications" },
    { name: "Marketing Management (CMMS®)", href: "/services#certifications" },
    { name: "Operations Management (COMS®)", href: "/services#certifications" },
    { name: "Labor Law Lecture (LLL)", href: "/services#certifications" },
    { name: "Business Consultancy", href: "/services#consultancy" },
  ];

  const resources = [
    { name: "About CPACE", href: "/about" },
    { name: "Verify Credential", href: "/verify" },
    { name: "Insights & Articles", href: "/insights" },
    { name: "Institutional Partnerships", href: "/#partners" },
    { name: "Learning Portal (LMS)", href: "/login", external: false },
    { name: "Create an Account", href: "/register", external: false },
    { name: "Inquire Now", href: "/#contact" },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 shadow-md ring-2 ring-emerald-500/30">
                <Image
                  src="/cpace-icon.png"
                  alt="CPACE Philippines Emblem"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                CPACE <span className="text-emerald-400">Philippines</span>
              </h3>
            </div>
            <p className="text-gray-300 max-w-md text-sm leading-relaxed">
              The Center for Professional Advancement and Continuing Education,
              Inc. (CPACE Philippines) is dedicated to empowering professionals
              through quality education and certification programs.
            </p>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-start gap-2 text-gray-300">
                <MapPin className="h-4 w-4 text-emerald-400 mt-1 shrink-0" />
                <span className="leading-snug">
                  <strong className="text-white font-medium">Manila:</strong>{" "}
                  Unit 1510 High Street South Corporate Plaza Tower 1, 26th St.
                  Corner 9th Ave., BGC Taguig City, Philippines (1634)
                </span>
              </div>
              <div className="flex items-start gap-2 text-gray-300">
                <MapPin className="h-4 w-4 text-emerald-400 mt-1 shrink-0" />
                <span className="leading-snug">
                  <strong className="text-white font-medium">Dubai:</strong>{" "}
                  StratEd Global – Level 41, Emirates Towers, Sheikh Zayed Rd,
                  Dubai, UAE PO Box 31303
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-x-4 gap-y-1 pt-1">
                <div className="flex items-center gap-2 text-gray-300">
                  <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                  <a
                    href="tel:+639562212400"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    +63 956 221-2400 (PH)
                  </a>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                  <a
                    href="tel:+971503489439"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    +971 50 348 9439 (UAE)
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Mail className="h-4 w-4 text-emerald-400 shrink-0" />
                <a
                  href="mailto:info@cpaceph.com"
                  className="hover:text-emerald-400 transition-colors"
                >
                  info@cpaceph.com
                </a>
              </div>
            </div>

            {/* National Privacy Commission (NPC) DPO/DPS Registration Seal */}
            <div className="pt-2">
              <div className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm hover:border-emerald-500/30 transition-all max-w-md">
                <a
                  href="/assets/cor-seal.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-white p-1 shadow-md hover:scale-105 transition-transform"
                  title="Click to view full National Privacy Commission Certificate"
                >
                  <Image
                    src="/assets/cor-seal.png"
                    alt="National Privacy Commission DPO/DPS Registered Seal"
                    fill
                    className="object-contain"
                  />
                </a>
                <div className="space-y-1 text-xs">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                    <ShieldCheck className="h-3 w-3" />
                    NPC Registered DPO/DPS
                  </div>
                  <p className="text-xs font-semibold text-white">
                    National Privacy Commission
                  </p>
                  <p className="text-[11px] text-gray-300 leading-tight">
                    Data Protection Officer & Processing System
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Validity Period: 24 September 2027
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base font-semibold mb-4 text-emerald-400">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-emerald-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Programs */}
          <div>
            <h3 className="text-base font-semibold mb-4 text-emerald-400">
              Programs
            </h3>
            <ul className="space-y-2 text-sm">
              {programs.map((program) => (
                <li key={program.name}>
                  <Link
                    href={program.href}
                    className="text-gray-300 hover:text-emerald-400 transition-colors"
                  >
                    {program.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-base font-semibold mb-4 text-emerald-400">
              Resources
            </h3>
            <ul className="space-y-2 text-sm">
              {resources.map((resource) => (
                <li key={resource.name}>
                  <Link
                    href={resource.href}
                    target={resource.external ? "_blank" : undefined}
                    rel={resource.external ? "noopener noreferrer" : undefined}
                    className="text-gray-300 hover:text-emerald-400 transition-colors"
                  >
                    {resource.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} CPACE Philippines. All rights
              reserved.
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-6">
              <a
                href="https://www.facebook.com/cpaceph"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-emerald-400 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/cpacephilippines/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-emerald-400 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://ph.linkedin.com/company/cpaceph"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-emerald-400 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
