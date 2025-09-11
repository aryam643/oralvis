"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, ArrowLeft, ImageIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function UploadPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    patientId: "",
    note: "",
  })
  // Up to three optional images: upper, front, lower
  const [files, setFiles] = useState<{ upper?: File; front?: File; lower?: File }>({})
  const [previews, setPreviews] = useState<{ upper?: string; front?: string; lower?: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (slot: 'upper' | 'front' | 'lower') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file")
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB")
        return
      }

      setFiles((prev) => ({ ...prev, [slot]: file }))
      setError(null)

      const url = URL.createObjectURL(file)
      setPreviews((prev) => ({ ...prev, [slot]: url }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const hasAny = Boolean(files.upper || files.front || files.lower)
    if (!hasAny) {
      setError("Please select at least one image file")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("Not authenticated")
      }

      // Upload up to three images and collect their public URLs
      const images: Record<string, string> = {}
      for (const slot of ["upper", "front", "lower"] as const) {
        const f = files[slot]
        if (!f) continue
        const ext = f.name.split('.').pop()
        const filePath = `${user.id}/${Date.now()}-${slot}.${ext}`
        const { error: upErr } = await supabase.storage.from('dental-images').upload(filePath, f)
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage.from('dental-images').getPublicUrl(filePath)
        images[slot] = publicUrl
      }

      // Choose a primary original_image_url for backward compatibility
      const primaryUrl = images.upper || images.front || images.lower || ''

      // Create submission record, seed annotation_data with image map
      const { error: insertError } = await supabase.from("submissions").insert({
        patient_id: user.id,
        name: formData.name,
        email: formData.email,
        patient_identifier: formData.patientId,
        note: formData.note,
        original_image_url: primaryUrl,
        annotation_data: JSON.stringify({ images, annotations: {} }),
        status: "uploaded",
      })

      if (insertError) throw insertError

      router.push("/patient?success=upload")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred during upload")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Button variant="ghost" size="sm" asChild className="mr-4">
              <Link href="/patient">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-blue-600">Upload Dental Images</h1>
              <p className="text-sm text-gray-600">Submit images for professional analysis</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              New Submission
            </CardTitle>
            <CardDescription>
              Please fill out the form below and upload your dental images. Our healthcare professionals will review and
              provide detailed analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="patientId">Patient ID (Optional)</Label>
                <Input
                  id="patientId"
                  name="patientId"
                  type="text"
                  value={formData.patientId}
                  onChange={handleInputChange}
                  placeholder="Enter your patient ID if available"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Additional Notes (Optional)</Label>
                <Textarea
                  id="note"
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  placeholder="Any specific concerns or information you'd like to share..."
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <Label>Upload Dental Images (up to 3)</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(["upper","front","lower"] as const).map((slot) => (
                    <div key={slot} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                      <div className="space-y-2">
                        <p className="text-sm font-medium capitalize">{slot} teeth</p>
                        {previews[slot] ? (
                          <div className="space-y-2">
                            <Image src={previews[slot] || "/placeholder.svg"} alt={`${slot} preview`} width={220} height={160} className="rounded-lg object-cover mx-auto"/>
                            <Button type="button" variant="outline" onClick={() => { setFiles((p)=>({ ...p, [slot]: undefined })); setPreviews((p)=>({ ...p, [slot]: undefined })); }}>
                              Change
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto" />
                            <Input id={`image-${slot}`} type="file" accept="image/*" onChange={handleFileChange(slot)} className="hidden" />
                            <Button type="button" variant="outline" onClick={() => document.getElementById(`image-${slot}`)?.click()}>
                              <Upload className="w-4 h-4 mr-2" />
                              Choose File
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading || (!files.upper && !files.front && !files.lower)} className="bg-blue-600 hover:bg-blue-700">
                  {isLoading ? "Uploading..." : "Submit for Analysis"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/patient">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
