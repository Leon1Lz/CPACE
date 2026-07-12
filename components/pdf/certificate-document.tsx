import React from "react"
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer"

Font.register({
  family: "Helvetica",
  fonts: [],
})

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    padding: 0,
    fontFamily: "Helvetica",
  },
  borderOuter: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    bottom: 16,
    borderWidth: 4,
    borderColor: "#006B3F",
    borderStyle: "solid",
  },
  borderInner: {
    position: "absolute",
    top: 24,
    left: 24,
    right: 24,
    bottom: 24,
    borderWidth: 1,
    borderColor: "#d1fae5",
    borderStyle: "solid",
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 60,
    paddingVertical: 50,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  logoBox: {
    width: 36,
    height: 36,
    backgroundColor: "#006B3F",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  logoText: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  orgName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#006B3F",
    letterSpacing: 1,
  },
  orgSub: {
    fontSize: 8,
    color: "#6b7280",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 2,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: "#f59e0b",
    marginVertical: 16,
  },
  certTitle: {
    fontSize: 11,
    letterSpacing: 3,
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  certOf: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    letterSpacing: 1,
    marginBottom: 20,
  },
  presentedTo: {
    fontSize: 10,
    color: "#9ca3af",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  recipientName: {
    fontSize: 34,
    fontFamily: "Helvetica-BoldOblique",
    color: "#006B3F",
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 11,
    color: "#4b5563",
    textAlign: "center",
    lineHeight: 1.6,
    maxWidth: 400,
    marginBottom: 6,
  },
  courseTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    textAlign: "center",
    marginBottom: 20,
  },
  divider2: {
    width: 120,
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 20,
  },
  metaRow: {
    flexDirection: "row",
    gap: 40,
    marginBottom: 24,
  },
  metaItem: {
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 8,
    color: "#9ca3af",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
  },
  signatureLine: {
    width: 140,
    height: 1,
    backgroundColor: "#374151",
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: "#6b7280",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: "#9ca3af",
    letterSpacing: 1,
  },
  validBadge: {
    position: "absolute",
    top: 40,
    right: 50,
    backgroundColor: "#d1fae5",
    borderWidth: 1,
    borderColor: "#6ee7b7",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  validText: {
    fontSize: 8,
    color: "#065f46",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
})

type Cert = {
  id: string
  title: string
  certificateNumber: string
  issuedAt: Date | string
  isValid: boolean
  user: { firstName: string; lastName: string; email: string }
  course: { title: string; category: string }
}

export function CertificateDocument({ cert }: { cert: Cert }) {
  const fullName = `${cert.user.firstName} ${cert.user.lastName}`
  const issueDate = new Date(cert.issuedAt).toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  })

  return (
    <Document title={`CPACE Certificate — ${fullName}`} author="CPACE">
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Decorative borders */}
        <View style={styles.borderOuter} />
        <View style={styles.borderInner} />

        {/* Valid badge */}
        {cert.isValid && (
          <View style={styles.validBadge}>
            <Text style={styles.validText}>✓  VALID</Text>
          </View>
        )}

        {/* Main content */}
        <View style={styles.body}>
          {/* Logo */}
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>C</Text>
            </View>
            <View>
              <Text style={styles.orgName}>CPACE</Text>
              <Text style={styles.orgSub}>Learning Portal</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.certTitle}>This is to certify that</Text>
          <Text style={styles.certOf}>Certificate of Completion</Text>

          <Text style={styles.presentedTo}>is proudly presented to</Text>
          <Text style={styles.recipientName}>{fullName}</Text>

          <Text style={styles.bodyText}>
            has successfully completed the course
          </Text>
          <Text style={styles.courseTitle}>{cert.course.title}</Text>

          <View style={styles.divider2} />

          {/* Meta info */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Certificate No.</Text>
              <Text style={styles.metaValue}>{cert.certificateNumber}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date Issued</Text>
              <Text style={styles.metaValue}>{issueDate}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Program</Text>
              <Text style={styles.metaValue}>{cert.course.category}</Text>
            </View>
          </View>

          {/* Signature */}
          <View style={{ alignItems: "center" }}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Authorized Signatory</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This certificate is electronically generated and verified by CPACE Learning Portal.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
