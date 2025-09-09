"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, User, Mail, Calendar, FileText, Trash2 } from "lucide-react"
import AnnotationCanvas from "@/components/annotation-canvas"
import DeleteReportButton from "./delete-report-button"

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
  annotation_data?: any
  patient: {
    name: string
    email: string
    phone: string
  }
}

interface SubmissionDetailsProps {
  initialSubmission: Submission
}

export default function SubmissionDetails({ initialSubmission }: SubmissionDetailsProps) {
  const [submission, setSubmission] = useState<Submission>(initialSubmission)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Subscribe to real-time updates for this specific submission
    const channel = supabase
      .channel(`submission-${submission.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'submissions',
          filter: `id=eq.${submission.id}`,
        },
        (payload) => {
          console.log('Real-time update received:', payload)
          setSubmission(prev => ({
            ...prev,
            ...payload.new
          }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [submission.id])

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Button variant="ghost" size="sm" asChild className="mr-4">
              <Link href="/admin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-blue-600">Review Submission</h1>
              <p className="text-sm text-gray-600">Annotate and analyze dental images</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Name</Label>
                  <p className="text-sm">{submission.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {submission.email}
                  </p>
                </div>
                {submission.patient?.phone && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Phone</Label>
                    <p className="text-sm">{submission.patient.phone}</p>
                  </div>
                )}
                {submission.patient_identifier && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Patient ID</Label>
                    <p className="text-sm">{submission.patient_identifier}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-600">Submitted</Label>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(submission.created_at).toLocaleDateString('en-US')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <Badge className={getStatusColor(submission.status)}>
                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                  </Badge>
                </div>
                {submission.note && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Patient Notes</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg">{submission.note}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {submission.status === "annotated" && (
                  <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                    <Link href={`/admin/submissions/${submission.id}/generate-report`}>Generate PDF Report</Link>
                  </Button>
                )}
                {submission.report_url && (
                  <>
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <Link href={submission.report_url} target="_blank">
                        View Generated Report
                      </Link>
                    </Button>
                    <DeleteReportButton submissionId={submission.id} />
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Annotation Canvas */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Image Annotation</CardTitle>
                <CardDescription>
                  Use the tools below to annotate the dental image. Your annotations will be saved automatically.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnnotationCanvas
                  imageUrl={submission.original_image_url}
                  submissionId={submission.id}
                  existingAnnotations={submission.annotation_data}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <label className={className}>{children}</label>
}
