"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { ArrowLeft, FileText, Download, Loader2, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Submission {
  id: string
  name: string
  email: string
  patient_identifier: string
  note: string
  original_image_url: string
  annotated_image_url: string
  report_url: string | null
  created_at: string
  patient: {
    name: string
    email: string
    phone: string
  }
}

const DENTAL_CONDITIONS = [
  { id: "inflamed_gums", label: "Inflamed / Red gums", treatment: "Scaling and professional cleaning" },
  { id: "malaligned", label: "Malaligned teeth", treatment: "Braces or Clear Aligner therapy" },
  { id: "receded_gums", label: "Receded gums", treatment: "Gum surgery or grafting procedures" },
  { id: "stains", label: "Dental stains", treatment: "Teeth cleaning and polishing" },
  { id: "attrition", label: "Tooth attrition", treatment: "Filling or Night Guard protection" },
  { id: "crowns", label: "Crown issues", treatment: "Crown replacement or repair" },
  { id: "cavities", label: "Cavities", treatment: "Dental fillings or restorations" },
  { id: "plaque", label: "Plaque buildup", treatment: "Professional cleaning and oral hygiene education" },
]

export default function GenerateReportPage() {
  const params = useParams<{ id: string }>()
  const submissionId = (params?.id as string) || ""
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()


  useEffect(() => {
    if (submissionId) {
      fetchSubmission()
    }
  }, [submissionId])

  const fetchSubmission = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("submissions")
        .select(`
          *,
          patient:users!submissions_patient_id_fkey(name, email, phone)
        `)
        .eq("id", submissionId)
        .single()

      if (error) throw error
      setSubmission(data)
    } catch (error) {
      setError("Failed to load submission")
      console.error(error)
    }
  }

  const handleConditionChange = (conditionId: string, checked: boolean) => {
    if (checked) {
      setSelectedConditions([...selectedConditions, conditionId])
    } else {
      setSelectedConditions(selectedConditions.filter((id) => id !== conditionId))
    }
  }

  const generateReport = async () => {
    if (!submission) return

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId: submission.id,
          selectedConditions,
          additionalNotes,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate report")
      }

      const result = await response.json()

      if (result.success) {
        router.push(`/admin/submissions/${submission.id}?report=generated`)
      } else {
        throw new Error(result.error || "Failed to generate report")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  const deleteReport = async () => {
    if (!submission) return

    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch("/api/delete-report", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId: submission.id,
        }),
      })

      const result = await response.json()

      if (result.success) {
        router.push(`/admin/submissions/${submission.id}?report=deleted`)
      } else {
        throw new Error(result.error || "Failed to delete report")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsDeleting(false)
    }
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Button variant="ghost" size="sm" asChild className="mr-4">
              <Link href={`/admin/submissions/${submission.id}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Submission
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-blue-600">Generate Report</h1>
              <p className="text-sm text-gray-600">Create comprehensive dental analysis report</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Patient Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Summary</CardTitle>
              <CardDescription>Review patient information before generating report</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Patient Name</Label>
                  <p className="text-sm">{submission.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="text-sm">{submission.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Patient ID</Label>
                  <p className="text-sm">{submission.patient_identifier || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Submission Date</Label>
                  <p className="text-sm">{new Date(submission.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              {submission.note && (
                <div className="mt-4">
                  <Label className="text-sm font-medium text-gray-600">Patient Notes</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg mt-1">{submission.note}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Diagnosis Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Diagnosis & Treatment Recommendations</CardTitle>
              <CardDescription>Select the conditions identified in the dental images</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DENTAL_CONDITIONS.map((condition) => (
                  <div key={condition.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={condition.id}
                      checked={selectedConditions.includes(condition.id)}
                      onCheckedChange={(checked) => handleConditionChange(condition.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={condition.id} className="text-sm font-medium cursor-pointer">
                        {condition.label}
                      </Label>
                      <p className="text-xs text-gray-600 mt-1">{condition.treatment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Clinical Notes</CardTitle>
              <CardDescription>Add any additional observations or recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter additional clinical observations, treatment recommendations, or follow-up instructions..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Generate Report
              </CardTitle>
              <CardDescription>Create a comprehensive PDF report with your analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <div className="flex gap-4">
                <Button
                  onClick={generateReport}
                  disabled={isGenerating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Generate PDF Report
                    </>
                  )}
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/admin/submissions/${submission.id}`}>Cancel</Link>
                </Button>
                {submission.report_url && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Report
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Report</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this generated report? This action cannot be undone.
                          The submission status will be reset to "annotated" and you can generate a new report.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={deleteReport}
                          disabled={isDeleting}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Report
                            </>
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Tip: Conditions in the PDF are derived from your annotation labels. Selecting here is optional.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
