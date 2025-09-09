"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Upload, FileText, Clock, CheckCircle, Download, CheckCircle2 } from "lucide-react"

interface Submission {
  id: string
  name: string
  email: string
  patient_identifier: string
  note: string
  original_image_url: string
  annotated_image_url: string
  report_url: string | null
  status: string
  created_at: string
}

interface PatientDashboardProps {
  initialSubmissions: Submission[]
  initialProfile: any
}

export default function PatientDashboard({ initialSubmissions, initialProfile }: PatientDashboardProps) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions)
  const [profile, setProfile] = useState(initialProfile)
  const [showSuccess, setShowSuccess] = useState(false)
  const [generatedPatientId, setGeneratedPatientId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for success message
    if (searchParams.get("success") === "upload") {
      setShowSuccess(true)
      // Get the most recent submission to show the generated patient ID
      if (submissions && submissions.length > 0) {
        setGeneratedPatientId(submissions[0].patient_identifier)
      }
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000)
    }
  }, [searchParams, submissions])

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
              <span className="text-sm text-gray-600">Welcome, {profile?.name}</span>
              <form action="/" method="post">
                <Button variant="outline" size="sm">
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Success Message */}
      {showSuccess && generatedPatientId && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Submission successful!</strong> Your patient ID is: <code className="bg-green-100 px-2 py-1 rounded text-sm font-mono">{generatedPatientId}</code>
            </AlertDescription>
          </Alert>
        </div>
      )}

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
                              Submitted: {new Date(submission.created_at).toLocaleDateString('en-US')}
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
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
                    <p className="text-gray-600 mb-4">Upload your first dental image to get started</p>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                      <Link href="/patient/upload">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Images
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
