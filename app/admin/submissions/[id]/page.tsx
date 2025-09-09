import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import SubmissionDetails from "./submission-details"

export default async function SubmissionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/auth/login")
  }

  // Get submission with patient info
  const { data: submission } = await supabase
    .from("submissions")
    .select(`
      *,
      patient:users!submissions_patient_id_fkey(name, email, phone)
    `)
    .eq("id", id)
    .single()

  if (!submission) {
    redirect("/admin")
  }

  return <SubmissionDetails initialSubmission={submission} />
}
