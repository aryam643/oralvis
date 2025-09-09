import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: NextRequest) {
  try {
    const { submissionId } = await request.json()

    if (!submissionId) {
      return NextResponse.json({ success: false, error: "Submission ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get submission data to find the report URL
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("report_url")
      .eq("id", submissionId)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json({ success: false, error: "Submission not found" }, { status: 404 })
    }

    if (!submission.report_url) {
      return NextResponse.json({ success: false, error: "No report found to delete" }, { status: 404 })
    }

    // Extract file path from the public URL
    const url = new URL(submission.report_url)
    const pathParts = url.pathname.split('/')
    const bucketName = pathParts[pathParts.length - 3] // e.g., "dental-images"
    const fileName = pathParts.slice(-2).join('/') // e.g., "reports/submissionId/filename.pdf"

    // Delete the file from storage
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([fileName])

    if (deleteError) {
      console.error("Error deleting file from storage:", deleteError)
      // Continue with database update even if file deletion fails
    }

    // Update submission to remove report URL and reset status
    const { error: updateError } = await supabase
      .from("submissions")
      .update({
        report_url: null,
        status: "annotated", // Reset to annotated status
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: "Report deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting report:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete report",
      },
      { status: 500 },
    )
  }
}
