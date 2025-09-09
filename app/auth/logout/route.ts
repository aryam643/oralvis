import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

async function handleSignOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    return NextResponse.redirect(
      new URL("/auth/error", process.env.NEXT_PUBLIC_SITE_URL || "https://oralvis-two.vercel.app/")
    )
  }

  return NextResponse.redirect(
    new URL("/auth/logout", process.env.NEXT_PUBLIC_SITE_URL || "https://oralvis-two.vercel.app/")
  )
}
export async function GET() {
  return handleSignOut()
}
export async function POST() {
  return handleSignOut()
}