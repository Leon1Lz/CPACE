// Course badge artwork in /public/assets/badges, matched by acronym or topic keywords
// found in the course title or category.
const BADGES: { file: string; pattern: RegExp }[] = [
  { file: "cfms-badge.png", pattern: /\bcfms\b|financial\s+management/i },
  { file: "cmms-badge.png", pattern: /\bcmms\b|marketing\s+management/i },
  { file: "coms-badge.png", pattern: /\bcoms\b|operations?\s+management/i },
  { file: "lll-badge.png", pattern: /\blll\b|labor\s+law|\bchra\b/i },
]

/** Returns the badge file name (inside /public/assets/badges) for a course, or null. */
export function getCourseBadgeFile(title: string, category?: string | null): string | null {
  const haystack = `${title} ${category ?? ""}`
  return BADGES.find((badge) => badge.pattern.test(haystack))?.file ?? null
}

/** Returns the public URL of the badge for a course, or null. */
export function getCourseBadgeUrl(title: string, category?: string | null): string | null {
  const file = getCourseBadgeFile(title, category)
  return file ? `/assets/badges/${file}` : null
}
