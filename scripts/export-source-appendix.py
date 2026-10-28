"""Export actual CPACE source excerpts as a thesis appendix (standard library only)."""
from datetime import datetime, timedelta, timezone
from hashlib import sha256
import json
from pathlib import Path
import subprocess
from xml.etree import ElementTree as ET
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "APPENDIX_K_SOURCE_CODE"
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
ET.register_namespace("w", W)


def excerpt(filename, *, start=None, end=None, lines=None, include_end=False):
    source = (ROOT / filename).read_text(encoding="utf-8")
    rows = source.splitlines()
    if lines:
        first, last = lines
    else:
        first = next((i + 1 for i, row in enumerate(rows) if start in row), None) if start else 1
        if first is None:
            raise ValueError(f"Missing start marker: {filename}: {start}")
        stop = next((i for i in range(first, len(rows)) if rows[i].startswith(end)), None) if end else len(rows)
        if stop is None:
            raise ValueError(f"Missing end marker: {filename}: {end}")
        last = stop + int(include_end) if end else len(rows)
    selected = rows[first - 1:last]
    while selected and not selected[-1].strip():
        selected.pop()
        last -= 1
    code = "\n".join(selected)
    # These listings intentionally exclude environment files and connection setup.
    if any(marker in code for marker in ("postgresql://", "postgres://", "BEGIN PRIVATE KEY")):
        raise ValueError(f"Connection or private-key material must not enter the appendix: {filename}")
    return {"file": filename, "startLine": first, "endLine": last, "code": code,
            "sourceSha256": sha256(source.encode("utf-8")).hexdigest(),
            "excerptSha256": sha256(code.encode("utf-8")).hexdigest()}


def listing(title, explanation, *parts):
    return {"title": title, "explanation": explanation, "parts": parts}


listings = [
    listing("User authentication", "This credentials-provider excerpt normalizes the email, checks the active account and password hash, and records a new active-session token.",
            excerpt("lib/auth.ts", start="    async authorize(credentials) {", end="  })")),
    listing("Role and resource authorization", "These authorization helpers allow administrators to manage resources and restrict instructors to the relevant owned or assigned resources. Remaining group and image helpers are omitted.",
            excerpt("lib/authorization.ts", end="export async function canManageGroup")),
    listing("Learning-path prerequisites", "This complete module finds published learning paths assigned to a learner's groups and evaluates progress before allowing access to a course or assessment.",
            excerpt("lib/learning-path-access.ts")),
    listing("Server-enforced exam timing", "This complete module computes exam deadlines and selects previously saved answers when a submission arrives after the deadline.",
            excerpt("lib/assessment-timing.ts")),
    listing("Assessment answer autosave", "This complete API route validates enrollment, prerequisites, questions and options, then saves versioned answers inside a transaction while checking the active session and deadline.",
            excerpt("app/api/assessments/[id]/draft/route.ts")),
    listing("Automatic assessment scoring", "This submission-handler excerpt scores objective answers and retains written responses for manual review. Surrounding authorization, persistence and response code are omitted.",
            excerpt("app/api/assessments/[id]/submit/route.ts", start="    // Score the answers", end="    const { result, attemptNumber }")),
    listing("Manual grading", "This complete module validates submitted marks and computes the final score after written answers have been graded.",
            excerpt("lib/manual-grading.ts")),
    listing("Assigned proctor access", "This module excerpt scopes exam sessions by assigned course and optional group. Learners can access their own sessions, while other viewers are checked against their scope. Notification helpers are omitted.",
            excerpt("lib/proctor-access.ts", end="export async function getSessionProctorRecipients")),
    listing("Live proctoring snapshots and device health", "This complete API route validates camera-frame size and image content, updates the learner's active-session heartbeat, and publishes an accepted snapshot. It handles snapshots and device health; the full video-transport implementation is separate.",
            excerpt("app/api/assessments/[id]/session/feed/route.ts")),
    listing("Certificate issuance after a final examination", "This submission-handler excerpt creates a certificate with its description when a released final-examination result is passing and no certificate already exists for that learner and course. The enclosing handler and following notification code are omitted; the excerpt ends inside its conditional block.",
            excerpt("app/api/assessments/[id]/submit/route.ts", start="    // Auto-issue certificate", end="        // Create DB notification for certificate")),
    listing("Certificate verification URL and QR code", "This complete module constructs the public verification URL and generates a PNG QR code locally from that URL.",
            excerpt("lib/certificate-qr.ts")),
    listing("Certificate description and validity", "These complete helper functions supply a default description and distinguish valid, expired and revoked certificates.",
            excerpt("lib/certificates.ts")),
    listing("Public certificate lookup", "This verification-page excerpt retrieves the certificate and its associated learner and course, then determines its current status. Imports, the surrounding component declaration and the rendered interface are omitted.",
            excerpt("app/(landing)/verify/[certificateNumber]/page.tsx", start="  const { certificateNumber } = await params", end="  return (")),
    listing("Description and QR code on the PDF certificate", "These three separate PDF-component excerpts show the input properties, certificate description and clickable QR code. Each block preserves its original source text; omitted layout and styling remain in the source file.",
            excerpt("components/pdf/certificate-document.tsx", lines=(326, 335)),
            excerpt("components/pdf/certificate-document.tsx", lines=(377, 380)),
            excerpt("components/pdf/certificate-document.tsx", lines=(406, 411))),
    listing("Certificate database model", "This Prisma model stores the certificate number, description, dates, validity flag, and relationships to its learner and course.",
            excerpt("prisma/schema.prisma", start="model Certificate {", end="}", include_end=True)),
]

stamp = datetime.now(timezone(timedelta(hours=8))).strftime("%B %d, %Y")
commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
intro = ("This appendix presents selected source-code listings from the CPACE Learning Portal. "
         "The listings preserve the source text and indentation. Partial excerpts depend on their "
         "surrounding application code and are identified in the accompanying descriptions.")
snapshot = f"Source snapshot: {stamp} (Asia/Singapore). Repository revision: {commit[:12]}."

# Confirm that selected boundaries include the principal behavior described.
for index, markers in {
    0: ["bcrypt.compare", "activeSessionToken: sessionToken", "role: user.role"],
    1: ["canManageAssessment", "assessment?.course.instructorId === user.id"],
    4: ["prisma.$transaction", "draftVersion: { increment: 1 }"],
    9: ["prisma.certificate.create", "description:"],
    10: ["QRCode.toDataURL", "return { verificationUrl, qrCodeDataUrl }"],
    14: ["model Certificate {", '@@map("certificates")', "}"],
}.items():
    selected = "\n".join(part["code"] for part in listings[index]["parts"])
    if not all(marker in selected for marker in markers):
        raise ValueError(f"Incomplete source excerpt: {listings[index]['title']}")

markdown = ["# Appendix K: Source Code", "", "**CPACE Learning Portal**", "", intro, "", snapshot, "", "## List of Listings", ""]
markdown += [f"- K.{i} {item['title']}" for i, item in enumerate(listings, 1)]
markdown.append("")
for i, item in enumerate(listings, 1):
    markdown += [f"## K.{i} {item['title']}", "", item["explanation"], ""]
    for part in item["parts"]:
        language = "prisma" if part["file"].endswith(".prisma") else "tsx" if part["file"].endswith(".tsx") else "ts"
        markdown += [f"Source: `{part['file']}`, lines {part['startLine']}-{part['endLine']}.", "", f"```{language}", part["code"], "```", ""]
OUTPUT.with_suffix(".md").write_text("\n".join(markdown), encoding="utf-8")


def element(parent, name, **attributes):
    return ET.SubElement(parent, f"{{{W}}}{name}", {f"{{{W}}}{key}": str(value) for key, value in attributes.items()})


def paragraph(parent, text, style="Normal"):
    p = element(parent, "p")
    properties = element(p, "pPr")
    element(properties, "pStyle", val=style)
    if style in ("Heading1", "Heading2", "Metadata"):
        element(properties, "keepNext")
    if style == "Code":
        element(properties, "keepLines")
    run = element(p, "r")
    t = element(run, "t")
    t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    t.text = text
    return p


document = ET.Element(f"{{{W}}}document")
body = element(document, "body")
paragraph(body, "APPENDIX K", "Title")
paragraph(body, "SOURCE CODE", "Title")
paragraph(body, "CPACE Learning Portal", "Subtitle")
paragraph(body, intro)
paragraph(body, snapshot, "Metadata")
paragraph(body, "List of Listings", "Heading1")
for i, item in enumerate(listings, 1):
    paragraph(body, f"K.{i}  {item['title']}", "Index")
pagebreak = element(element(body, "p"), "r")
element(pagebreak, "br", type="page")
code_lines = []
for i, item in enumerate(listings, 1):
    paragraph(body, f"K.{i}  {item['title']}", "Heading1")
    paragraph(body, item["explanation"])
    for part in item["parts"]:
        paragraph(body, f"Source: {part['file']} | Lines {part['startLine']}-{part['endLine']}", "Metadata")
        for line in part["code"].split("\n"):
            paragraph(body, line, "Code")
            code_lines.append(line)
    paragraph(body, "", "Index")
section = element(body, "sectPr")
footer_ref = element(section, "footerReference", type="default")
footer_ref.set("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id", "rId2")
element(section, "pgSz", w=12240, h=15840)
element(section, "pgMar", top=1440, right=1080, bottom=1440, left=1440, header=720, footer=720, gutter=0)

styles = ET.Element(f"{{{W}}}styles")
for name, font, halfpoints, bold, after in [
    ("Normal", "Times New Roman", 24, False, 120),
    ("Title", "Times New Roman", 28, True, 160),
    ("Subtitle", "Times New Roman", 24, False, 160),
    ("Heading1", "Times New Roman", 24, True, 100),
    ("Metadata", "Times New Roman", 18, False, 70),
    ("Index", "Times New Roman", 22, False, 40),
    ("Code", "Consolas", 18, False, 0),
]:
    style = element(styles, "style", type="paragraph", styleId=name)
    element(style, "name", val=name)
    ppr = element(style, "pPr")
    element(ppr, "spacing", before=160 if name == "Heading1" else 0, after=after,
            line=240 if name == "Code" else 276, lineRule="auto")
    if name in ("Title", "Subtitle"):
        element(ppr, "jc", val="center")
    if name == "Code":
        element(ppr, "shd", val="clear", fill="F4F5F7")
    rpr = element(style, "rPr")
    element(rpr, "rFonts", ascii=font, hAnsi=font, eastAsia=font, cs=font)
    element(rpr, "sz", val=halfpoints)
    if bold:
        element(rpr, "b")

footer = ET.Element(f"{{{W}}}ftr")
p = paragraph(footer, "CPACE | Appendix K | ", "Metadata")
element(p.find(f"{{{W}}}pPr"), "jc", val="center")
for kind, text in (("begin", None), (None, " PAGE "), ("end", None)):
    run = element(p, "r")
    if kind:
        element(run, "fldChar", fldCharType=kind)
    else:
        instruction = element(run, "instrText")
        instruction.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
        instruction.text = text

def xml(node):
    return ET.tostring(node, encoding="utf-8", xml_declaration=True)

parts = {
    "[Content_Types].xml": b'''<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>''',
    "_rels/.rels": b'''<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>''',
    "word/_rels/document.xml.rels": b'''<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>''',
    "word/document.xml": xml(document), "word/styles.xml": xml(styles), "word/footer1.xml": xml(footer),
}
with ZipFile(OUTPUT.with_suffix(".docx"), "w", ZIP_DEFLATED) as archive:
    for name, data in parts.items():
        archive.writestr(name, data)

# Verify package integrity, XML readability and every exported source-code line.
with ZipFile(OUTPUT.with_suffix(".docx")) as archive:
    assert archive.testzip() is None
    for name in archive.namelist():
        ET.fromstring(archive.read(name))
    saved = ET.fromstring(archive.read("word/document.xml"))
    extracted = ["".join(p.itertext()) for p in saved.findall(f".//{{{W}}}p")
                 if p.find(f"{{{W}}}pPr/{{{W}}}pStyle[@{{{W}}}val='Code']") is not None]
    assert extracted == code_lines, "Word export changed source-code text"

manifest = {"snapshotDate": stamp, "revision": commit, "listingCount": len(listings),
            "codeLineCount": len(code_lines), "listings": [
                {"number": f"K.{i}", "title": item["title"], "excerpts": [
                    {k: v for k, v in part.items() if k != "code"} for part in item["parts"]]}
                for i, item in enumerate(listings, 1)]}
OUTPUT.with_suffix(".sources.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"listings": len(listings), "sourceLines": len(code_lines),
                  "word": str(OUTPUT.with_suffix('.docx')), "markdown": str(OUTPUT.with_suffix('.md')),
                  "verified": "All Word code lines match the selected project source"}, indent=2))
