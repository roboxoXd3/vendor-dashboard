/**
 * This route previously allowed unauthenticated approve/reject of vendors
 * via Supabase. That is a critical security hole and is not part of the
 * vendor dashboard product surface (approvals belong in the admin panel).
 *
 * Disabled intentionally — do not re-enable without proper admin auth.
 */

export async function GET() {
  return Response.json(
    {
      success: false,
      error: 'This endpoint has been disabled. Use the admin panel to manage vendor approvals.',
    },
    { status: 410 }
  )
}

export async function POST() {
  return Response.json(
    {
      success: false,
      error: 'This endpoint has been disabled. Use the admin panel to manage vendor approvals.',
    },
    { status: 410 }
  )
}
