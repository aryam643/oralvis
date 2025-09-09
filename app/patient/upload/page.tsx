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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setSelectedFile(file)
      setError(null)

      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setError("Please select an image file")
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

      // Upload image to Supabase Storage
      const fileExt = selectedFile.name.split(".").pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("dental-images")
        .upload(fileName, selectedFile)

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("dental-images").getPublicUrl(fileName)

      // Create submission record
      const { error: insertError } = await supabase.from("submissions").insert({
        patient_id: user.id,
        name: formData.name,
        email: formData.email,
        patient_identifier: formData.patientId,
        note: formData.note,
        original_image_url: publicUrl,
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
                <Label htmlFor="image">Upload Dental Image *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  {previewUrl ? (
                    <div className="space-y-4">
                      <div className="relative w-full max-w-md mx-auto">
                        <Image
                          src={previewUrl || "/placeholder.svg"}
                          alt="Preview"
                          width={400}
                          height={300}
                          className="rounded-lg object-cover"
                        />
                      </div>
                      <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSelectedFile(null)
                          setPreviewUrl(null)
                        }}
                      >
                        Change Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-gray-600">Upload your dental image</p>
                        <p className="text-sm text-gray-500">PNG, JPG, JPEG up to 10MB</p>
                      </div>
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        required
                      />
                      <Button type="button" variant="outline" onClick={() => document.getElementById("image")?.click()}>
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading || !selectedFile} className="bg-blue-600 hover:bg-blue-700">
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
