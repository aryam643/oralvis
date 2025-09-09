import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Search, Eye, Users, FileText, Clock, CheckCircle } from "lucide-react"

export default async function AdminDashboard() {
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

  // Get all submissions with patient info
  const { data: submissions } = await supabase
    .from("submissions")
    .select(`
      *,
      patient:users!submissions_patient_id_fkey(name, email)
    `)
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

  const stats = {
    total: submissions?.length || 0,
    pending: submissions?.filter((s) => s.status === "uploaded").length || 0,
    annotated: submissions?.filter((s) => s.status === "annotated").length || 0,
    completed: submissions?.filter((s) => s.status === "reported").length || 0,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-blue-600">OralVis Healthcare</h1>
              <p className="text-sm text-gray-600">Admin Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, Dr. {profile.name}</span>
              <form action="/auth/logout" method="post">
                <Button variant="outline" size="sm" type="submit">
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Annotated</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.annotated}</p>
                </div>
                <FileText className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Patient Submissions</CardTitle>
                <CardDescription>Review and annotate dental image submissions</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <Input placeholder="Search submissions..." className="w-64" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {submissions && submissions.length > 0 ? (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div key={submission.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{submission.name}</h3>
                          <Badge className={getStatusColor(submission.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(submission.status)}
                              {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                            </span>
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Patient:</span> {submission.patient?.name}
                          </div>
                          <div>
                            <span className="font-medium">Email:</span> {submission.email}
                          </div>
                          <div>
                            <span className="font-medium">Submitted:</span>{" "}
                            {new Date(submission.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        {submission.patient_identifier && (
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Patient ID:</span> {submission.patient_identifier}
                          </div>
                        )}
                        {submission.note && (
                          <div className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Note:</span> {submission.note}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/submissions/${submission.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Review
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No submissions yet</h3>
                <p className="text-gray-500">Patient submissions will appear here for review and annotation</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
