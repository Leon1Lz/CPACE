import React from "react"
import path from "path"
import fs from "fs"
import { Document, Page, Text, View, Image, Link, StyleSheet, Font } from "@react-pdf/renderer"
import { getCourseBadgeFile } from "@/lib/course-badges"
import { getCertificateDescription, getCertificateStatus } from "@/lib/certificates"

Font.register({
  family: "Helvetica",
  fonts: [],
})

const GREEN = "#006B3F"
const GREEN_DARK = "#00432a"
const GOLD = "#b8892b"
const GOLD_LIGHT = "#e8c872"
const CREAM = "#fffdf6"
const INK = "#1f2937"
const MUTED = "#6b7280"

const logoPath = path.join(process.cwd(), "public", "cpace-logo.png")
const logoData = (() => {
  try {
    return fs.readFileSync(logoPath)
  } catch {
    return null
  }
})()

function loadCourseBadge(title: string, category: string): Buffer | null {
  const file = getCourseBadgeFile(title, category)
  if (!file) return null
  try {
    return fs.readFileSync(path.join(process.cwd(), "public", "assets", "badges", file))
  } catch {
    return null
  }
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: CREAM,
    padding: 0,
    fontFamily: "Helvetica",
  },
  borderOuter: {
    position: "absolute",
    top: 18,
    left: 18,
    right: 18,
    bottom: 18,
    borderWidth: 6,
    borderColor: GREEN,
    borderStyle: "solid",
  },
  borderGold: {
    position: "absolute",
    top: 30,
    left: 30,
    right: 30,
    bottom: 30,
    borderWidth: 1.5,
    borderColor: GOLD,
    borderStyle: "solid",
  },
  borderInner: {
    position: "absolute",
    top: 36,
    left: 36,
    right: 36,
    bottom: 36,
    borderWidth: 0.5,
    borderColor: GOLD_LIGHT,
    borderStyle: "solid",
  },
  corner: {
    position: "absolute",
    width: 26,
    height: 26,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  cornerDot: {
    width: 9,
    height: 9,
    backgroundColor: GOLD_LIGHT,
    transform: "rotate(45deg)",
  },
  topBand: {
    position: "absolute",
    top: 18,
    left: 18,
    right: 18,
    height: 10,
    backgroundColor: GREEN_DARK,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 70,
    paddingTop: 44,
    paddingBottom: 76,
  },
  logo: {
    height: 34,
    objectFit: "contain",
    marginBottom: 10,
  },
  certHeading: {
    fontSize: 34,
    fontFamily: "Times-Bold",
    color: GREEN,
    letterSpacing: 9,
    textTransform: "uppercase",
  },
  certSub: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: GOLD,
    letterSpacing: 7,
    textTransform: "uppercase",
    marginTop: 4,
  },
  ornamentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  ornamentLine: {
    width: 90,
    height: 1,
    backgroundColor: GOLD,
  },
  ornamentDiamond: {
    width: 7,
    height: 7,
    backgroundColor: GOLD,
    transform: "rotate(45deg)",
    marginHorizontal: 10,
  },
  presentedTo: {
    fontSize: 10,
    fontFamily: "Times-Italic",
    color: MUTED,
    letterSpacing: 1,
    marginBottom: 6,
  },
  recipientName: {
    fontSize: 34,
    fontFamily: "Times-BoldItalic",
    color: GREEN_DARK,
    textAlign: "center",
  },
  nameUnderline: {
    width: 360,
    height: 1,
    backgroundColor: GOLD,
    marginTop: 6,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 11,
    color: MUTED,
    textAlign: "center",
    marginBottom: 6,
  },
  courseTitle: {
    fontSize: 18,
    fontFamily: "Times-Bold",
    color: INK,
    textAlign: "center",
    maxWidth: 560,
    marginBottom: 4,
  },
  category: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: GREEN,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  description: {
    fontSize: 9,
    lineHeight: 1.4,
    color: MUTED,
    textAlign: "center",
    maxWidth: 530,
    marginTop: 10,
    maxLines: 3,
    textOverflow: "ellipsis",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    width: 600,
    marginTop: 16,
  },
  sigBlock: {
    width: 140,
    alignItems: "center",
  },
  sigValue: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    color: INK,
    marginBottom: 3,
  },
  sigLine: {
    width: 140,
    height: 1,
    backgroundColor: INK,
    marginBottom: 4,
  },
  sigLabel: {
    fontSize: 7.5,
    color: MUTED,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  badge: {
    width: 84,
    height: 84,
    objectFit: "contain",
  },
  sealOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  sealMiddle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: GREEN,
    borderWidth: 1.5,
    borderColor: GOLD_LIGHT,
    borderStyle: "solid",
    alignItems: "center",
    justifyContent: "center",
  },
  sealBrand: {
    fontSize: 13,
    fontFamily: "Times-Bold",
    color: "#ffffff",
    letterSpacing: 2,
  },
  sealCaption: {
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
    color: GOLD_LIGHT,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  qrBlock: {
    width: 84,
    alignItems: "center",
  },
  qrCode: {
    width: 72,
    height: 72,
  },
  qrCaption: {
    fontSize: 6.5,
    color: GREEN,
    marginTop: 3,
  },
  footer: {
    position: "absolute",
    bottom: 46,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  footerNumber: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: GREEN,
    letterSpacing: 1.5,
  },
  footerText: {
    fontSize: 6.5,
    color: MUTED,
    letterSpacing: 0.8,
    marginTop: 2,
    maxWidth: 650,
    textAlign: "center",
  },
  validBadge: {
    position: "absolute",
    top: 48,
    right: 58,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#6ee7b7",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  validText: {
    fontSize: 7.5,
    color: "#065f46",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
  },
})

type Cert = {
  id: string
  title: string
  description?: string | null
  certificateNumber: string
  issuedAt: Date | string
  isValid: boolean
  expiresAt?: Date | string | null
  user: { firstName: string; lastName: string; email: string }
  course: { title: string; category: string }
}

export function CertificateDocument({ cert, verificationUrl, qrCodeDataUrl }: {
  cert: Cert
  verificationUrl: string
  qrCodeDataUrl: string
}) {
  const fullName = `${cert.user.firstName} ${cert.user.lastName}`.trim()
  const issueDate = new Date(cert.issuedAt).toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  })
  const description = getCertificateDescription(cert.description)
  const badgeData = loadCourseBadge(cert.course.title, cert.course.category ?? "")

  return (
    <Document title={`CPACE Certificate — ${fullName}`} author="CPACE">
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Frame */}
        <View style={styles.borderOuter} />
        <View style={styles.borderGold} />
        <View style={styles.borderInner} />
        <View style={styles.topBand} />

        {/* Corner ornaments */}
        <View style={[styles.corner, { top: 18, left: 18 }]}><View style={styles.cornerDot} /></View>
        <View style={[styles.corner, { top: 18, right: 18 }]}><View style={styles.cornerDot} /></View>
        <View style={[styles.corner, { bottom: 18, left: 18 }]}><View style={styles.cornerDot} /></View>
        <View style={[styles.corner, { bottom: 18, right: 18 }]}><View style={styles.cornerDot} /></View>

        {/* Valid badge */}
        {getCertificateStatus(cert) === "valid" && (
          <View style={styles.validBadge}>
            <Text style={styles.validText}>VERIFIED</Text>
          </View>
        )}

        {/* Main content */}
        <View style={styles.body}>
          {logoData ? <Image src={{ data: logoData, format: "png" }} style={styles.logo} /> : null}

          <Text style={styles.certHeading}>Certificate</Text>
          <Text style={styles.certSub}>of Completion</Text>

          <View style={styles.ornamentRow}>
            <View style={styles.ornamentLine} />
            <View style={styles.ornamentDiamond} />
            <View style={styles.ornamentLine} />
          </View>

          <Text style={styles.presentedTo}>This certificate is proudly presented to</Text>
          <Text style={styles.recipientName}>{fullName}</Text>
          <View style={styles.nameUnderline} />

          <Text style={styles.bodyText}>for successfully completing the course</Text>
          <Text style={styles.courseTitle}>{cert.course.title}</Text>
          {cert.course.category ? <Text style={styles.category}>{cert.course.category}</Text> : null}
          <Text style={styles.description}>{description}</Text>

          <View style={styles.bottomRow}>
            <View style={styles.sigBlock}>
              <Text style={styles.sigValue}>{issueDate}</Text>
              <View style={styles.sigLine} />
              <Text style={styles.sigLabel}>Date Issued</Text>
            </View>

            {badgeData ? (
              <Image src={{ data: badgeData, format: "png" }} style={styles.badge} />
            ) : (
              <View style={styles.sealOuter}>
                <View style={styles.sealMiddle}>
                  <Text style={styles.sealBrand}>CPACE</Text>
                  <Text style={styles.sealCaption}>OFFICIAL SEAL</Text>
                </View>
              </View>
            )}

            <View style={styles.sigBlock}>
              <Text style={styles.sigValue}> </Text>
              <View style={styles.sigLine} />
              <Text style={styles.sigLabel}>Authorized Signatory</Text>
            </View>

            <View style={styles.qrBlock}>
              <Link src={verificationUrl}>
                <Image src={qrCodeDataUrl} style={styles.qrCode} />
              </Link>
              <Text style={styles.qrCaption}>Scan to verify certificate</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerNumber}>CERTIFICATE NO. {cert.certificateNumber}</Text>
          <Text style={styles.footerText}>
            Verify authenticity at <Link src={verificationUrl}>{verificationUrl}</Link>
          </Text>
        </View>
      </Page>
    </Document>
  )
}
