import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Upload, FileText, Clock, CheckCircle, Download } from "lucide-react"

export default async function PatientDashboard() {
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

  if (!profile || profile.role !== "patient") {
    redirect("/auth/login")
  }

  // Get user submissions
  const { data: submissions } = await supabase
    .from("submissions")
    .select("*")
    .eq("patient_id", user.id)
    .order("created_at", { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "uploaded":
        return "bg-blue-100 text-blue-800"
      case "annotated":
        return "bg-yellow-100 text-yellow-800"
      case "reported":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploaded":
        return <Clock className="w-4 h-4" />
      case "annotated":
        return <FileText className="w-4 h-4" />
      case "reported":
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-blue-600">OralVis Healthcare</h1>
              <p className="text-sm text-gray-600">Patient Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {profile.name}</span>
              <form action="/logout" method="post">
                <Button variant="outline" size="sm">
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  New Submission
                </CardTitle>
                <CardDescription>Upload dental images for professional analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                  <Link href="/patient/upload">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Images
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Your Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Submissions</span>
                  <span className="font-semibold">{submissions?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completed Reports</span>
                  <span className="font-semibold">
                    {submissions?.filter((s) => s.status === "reported").length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending Review</span>
                  <span className="font-semibold">
                    {submissions?.filter((s) => s.status !== "reported").length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submissions List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Submissions</CardTitle>
                <CardDescription>Track the progress of your dental image submissions</CardDescription>
              </CardHeader>
              <CardContent>
                {submissions && submissions.length > 0 ? (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div key={submission.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{submission.name}</h3>
                              <Badge className={getStatusColor(submission.status)}>
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(submission.status)}
                                  {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                                </span>
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              Patient ID: {submission.patient_identifier || "Not provided"}
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                              Submitted: {new Date(submission.created_at).toLocaleDateString()}
                            </p>
                            {submission.note && <p className="text-sm text-gray-600 mb-2">Note: {submission.note}</p>}
                          </div>
                          <div className="flex flex-col gap-2">
                            {submission.original_image_url && (
                              <Button variant="outline" size="sm" asChild>
                                <Link href={submission.original_image_url} target="_blank">
                                  View Image
                                </Link>
                              </Button>
                            )}
                            {submission.report_url && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" asChild>
                                <Link href={submission.report_url} target="_blank">
                                  <Download className="w-4 h-4 mr-2" />
                                  Download Report
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No submissions yet</h3>
                    <p className="text-gray-500 mb-4">
                      Upload your first dental image to get started with professional analysis
                    </p>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                      <Link href="/patient/upload">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Your First Image
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
