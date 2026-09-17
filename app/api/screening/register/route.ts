import { NextResponse } from "next/server"

/**
 * The previous prototype created learner accounts and enrollments before
 * verifying email ownership, while its generated magic credential was never
 * persisted. Keep this route explicit until screening is rebuilt on the
 * normal pre-approved invitation flow.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Screening registration is not available" },
    { status: 410 },
  )
}
