"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Search,
  Download,
  Eye,
  Share2,
  Award,
  Printer,
  ExternalLink,
  CheckCircle2,
} from "lucide-react"
import { PlaceholderAvatar, PlaceholderBox, WireframeLabel } from "./placeholder"
import { Checkbox } from "@/components/ui/checkbox"

// Certificate Management (Admin View)
export function CertificateManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Certificate Management</h1>
          <p className="text-sm text-muted-foreground">
            Issue and manage learner certificates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <WireframeLabel>Admin View</WireframeLabel>
          <Button variant="outline">Manage Templates</Button>
          <Button>Generate Certificates</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Issued", value: 156, icon: Award },
          { label: "Pending", value: 23, icon: Award },
          { label: "This Month", value: 12, icon: Award },
          { label: "Programs", value: 3, icon: Award },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by learner name..." className="pl-9" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="issued">Issued</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Program" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            <SelectItem value="cms">CMS</SelectItem>
            <SelectItem value="cfm">CFM</SelectItem>
            <SelectItem value="com">COM</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Certificate Queue Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Certificate Queue</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Select All
              </Button>
              <Button size="sm">Generate Selected</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox />
                </TableHead>
                <TableHead>Learner</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Completion Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Certificate ID</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  name: "Maria Santos",
                  email: "maria@example.com",
                  program: "CMS",
                  date: "May 1, 2026",
                  status: "Pending",
                  certId: "-",
                },
                {
                  name: "Juan dela Cruz",
                  email: "juan@example.com",
                  program: "CFM",
                  date: "Apr 28, 2026",
                  status: "Pending",
                  certId: "-",
                },
                {
                  name: "Ana Reyes",
                  email: "ana@example.com",
                  program: "CMS",
                  date: "Apr 25, 2026",
                  status: "Issued",
                  certId: "CPACE-2026-0156",
                },
                {
                  name: "Pedro Garcia",
                  email: "pedro@example.com",
                  program: "COM",
                  date: "Apr 20, 2026",
                  status: "Issued",
                  certId: "CPACE-2026-0155",
                },
              ].map((row, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <PlaceholderAvatar size="sm" />
                      <div>
                        <p className="font-medium">{row.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.program}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.date}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={row.status === "Issued" ? "default" : "secondary"}
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.certId}
                  </TableCell>
                  <TableCell>
                    {row.status === "Pending" ? (
                      <Button size="sm" variant="outline">
                        Generate
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// My Certificates Page (Learner View)
export function MyCertificatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Certificates</h1>
          <p className="text-sm text-muted-foreground">
            View and download your earned certificates
          </p>
        </div>
        <WireframeLabel>Learner View</WireframeLabel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            title: "Certified Marketing Specialist",
            abbr: "CMS",
            date: "April 15, 2026",
            certId: "CPACE-2026-0142",
          },
          {
            title: "Business Communication",
            abbr: "BC",
            date: "March 20, 2026",
            certId: "CPACE-2026-0098",
          },
        ].map((cert, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="aspect-[4/3] bg-muted/50 border-b relative">
              {/* Certificate Preview */}
              <div className="absolute inset-4 border-2 border-dashed border-border bg-card rounded flex flex-col items-center justify-center p-4">
                <Award className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs font-medium text-center">{cert.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Certificate Preview
                </p>
              </div>
              <div className="absolute top-2 right-2">
                <Badge>{cert.abbr}</Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-medium mb-1">{cert.title}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <CheckCircle2 className="h-3 w-3" />
                Issued: {cert.date}
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                ID: {cert.certId}
              </p>

              <div className="flex items-center gap-2 mt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>{cert.title}</DialogTitle>
                    </DialogHeader>
                    <CertificatePreview
                      title={cert.title}
                      certId={cert.certId}
                      date={cert.date}
                    />
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty State for more certificates */}
        <Card className="border-dashed">
          <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[300px] text-center">
            <Award className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium mb-1">Earn More Certificates</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Complete more courses to earn additional certifications
            </p>
            <Button variant="outline">Browse Courses</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Certificate Preview Component
interface CertificatePreviewProps {
  title: string
  certId: string
  date: string
  name?: string
}

export function CertificatePreview({
  title,
  certId,
  date,
  name = "Juan dela Cruz",
}: CertificatePreviewProps) {
  return (
    <div className="space-y-4">
      {/* Certificate */}
      <div className="aspect-[1.4/1] border-2 border-border bg-card rounded-lg p-8 relative overflow-hidden">
        {/* Decorative border */}
        <div className="absolute inset-4 border border-dashed border-muted-foreground/30 rounded" />

        <div className="relative h-full flex flex-col items-center justify-center text-center">
          {/* Logo */}
          <div className="h-12 w-12 rounded bg-primary flex items-center justify-center mb-4">
            <span className="text-primary-foreground font-bold">CP</span>
          </div>

          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
            CPACE Philippines
          </p>

          <h2 className="text-xl font-bold mb-1">Certificate of Completion</h2>

          <p className="text-sm text-muted-foreground mb-6">
            This is to certify that
          </p>

          <p className="text-2xl font-serif mb-6">{name}</p>

          <p className="text-sm text-muted-foreground mb-2">
            has successfully completed the requirements for
          </p>

          <h3 className="text-lg font-bold mb-6">{title}</h3>

          <div className="flex items-center gap-8 text-xs text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">{date}</p>
              <p>Date Issued</p>
            </div>
            <div className="h-8 w-8 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center">
              <span className="text-[8px]">QR</span>
            </div>
            <div>
              <p className="font-medium text-foreground font-mono">{certId}</p>
              <p>Certificate ID</p>
            </div>
          </div>

          <div className="absolute bottom-8 flex items-center gap-16">
            <div className="text-center">
              <div className="w-24 border-t border-foreground mb-1" />
              <p className="text-[10px] text-muted-foreground">
                Program Director
              </p>
            </div>
            <div className="text-center">
              <div className="w-24 border-t border-foreground mb-1" />
              <p className="text-[10px] text-muted-foreground">
                Executive Director
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        <Button variant="outline">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
        <Button variant="outline">
          <ExternalLink className="h-4 w-4 mr-2" />
          Verify
        </Button>
      </div>
    </div>
  )
}
