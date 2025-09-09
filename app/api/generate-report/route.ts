import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { jsPDF } from "jspdf"

const DENTAL_CONDITIONS = {
  inflamed_gums: { label: "Inflamed / Red gums", treatment: "Scaling and professional cleaning" },
  malaligned: { label: "Malaligned teeth", treatment: "Braces or Clear Aligner therapy" },
  receded_gums: { label: "Receded gums", treatment: "Gum surgery or grafting procedures" },
  stains: { label: "Dental stains", treatment: "Teeth cleaning and polishing" },
  attrition: { label: "Tooth attrition", treatment: "Filling or Night Guard protection" },
  crowns: { label: "Crown issues", treatment: "Crown replacement or repair" },
  cavities: { label: "Cavities", treatment: "Dental fillings or restorations" },
  plaque: { label: "Plaque buildup", treatment: "Professional cleaning and oral hygiene education" },
}

export async function POST(request: NextRequest) {
  try {
    const { submissionId, selectedConditions, additionalNotes } = await request.json()

    const supabase = await createClient()

    // Get submission data
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select(`
        *,
        patient:users!submissions_patient_id_fkey(name, email, phone)
      `)
      .eq("id", submissionId)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json({ success: false, error: "Submission not found" }, { status: 404 })
    }

    // Create PDF using jsPDF with better design
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)
    let yPosition = margin

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 40) {
        doc.addPage()
        yPosition = margin
        return true
      }
      return false
    }

    // Helper function to add section header
    const addSectionHeader = (title: string, yPos: number) => {
      doc.setFontSize(18)
      doc.setTextColor(37, 99, 235)
      doc.setFont('helvetica', 'bold')
      doc.text(title, margin, yPos)
      
      // Add underline
      doc.setDrawColor(37, 99, 235)
      doc.setLineWidth(0.5)
      doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2)
      
      return yPos + 20
    }

    // Helper function to add info box
    const addInfoBox = (label: string, value: string, yPos: number) => {
      doc.setFontSize(11)
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'normal')
      doc.text(label, margin, yPos)
      
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'bold')
      const splitValue = doc.splitTextToSize(value, contentWidth - 60)
      doc.text(splitValue, margin + 60, yPos)
      
      return yPos + (splitValue.length * 5) + 8
    }

    // Header with better styling
    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, pageWidth, 50, 'F')
    
    doc.setFontSize(28)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text("OralVis Healthcare", pageWidth / 2, 25, { align: "center" })
    
    doc.setFontSize(16)
    doc.setTextColor(200, 220, 255)
    doc.setFont('helvetica', 'normal')
    doc.text("Oral Health Screening Report", pageWidth / 2, 35, { align: "center" })
    
    yPosition = 70

    // Patient Information Section
    yPosition = addSectionHeader("Patient Information", yPosition)
    
    // Patient info in a more structured format
    yPosition = addInfoBox("Name:", submission.name, yPosition)
    yPosition = addInfoBox("Email:", submission.email, yPosition)
    
    if (submission.patient_identifier) {
      yPosition = addInfoBox("Patient ID:", submission.patient_identifier, yPosition)
    }
    
    if (submission.patient?.phone) {
      yPosition = addInfoBox("Phone:", submission.patient.phone, yPosition)
    }
    
    yPosition = addInfoBox("Report Date:", new Date(submission.created_at).toLocaleDateString(), yPosition)
    yPosition += 15

    // Patient Notes Section
    if (submission.note) {
      checkNewPage(40)
      yPosition = addSectionHeader("Patient Notes", yPosition)
      
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(margin, yPosition, contentWidth, 30, 3, 3, 'F')
      
      doc.setFontSize(11)
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'normal')
      const splitNotes = doc.splitTextToSize(submission.note, contentWidth - 20)
      doc.text(splitNotes, margin + 10, yPosition + 8)
      yPosition += 40
    }

    // Screening Results Section
    checkNewPage(60)
    yPosition = addSectionHeader("Screening Results", yPosition)
    
    if (selectedConditions.length === 0) {
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'italic')
      doc.text("No conditions identified", margin + 20, yPosition)
      yPosition += 20
    } else {
      selectedConditions.forEach((conditionId: string, index: number) => {
        const condition = DENTAL_CONDITIONS[conditionId as keyof typeof DENTAL_CONDITIONS]
        if (condition) {
          // Add colored bullet point
          doc.setFillColor(37, 99, 235)
          doc.circle(margin + 10, yPosition - 2, 2, 'F')
          
          doc.setFontSize(12)
          doc.setTextColor(0, 0, 0)
          doc.setFont('helvetica', 'bold')
          doc.text(condition.label, margin + 20, yPosition)
          yPosition += 12
        }
      })
    }
    yPosition += 15

    // Treatment Recommendations Section
    checkNewPage(80)
    yPosition = addSectionHeader("Treatment Recommendations", yPosition)
    
    if (selectedConditions.length === 0) {
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'italic')
      doc.text("No specific recommendations available", margin + 20, yPosition)
      yPosition += 20
    } else {
      selectedConditions.forEach((conditionId: string, index: number) => {
        const condition = DENTAL_CONDITIONS[conditionId as keyof typeof DENTAL_CONDITIONS]
        if (condition) {
          // Check if we need a new page for this recommendation
          const treatmentLines = doc.splitTextToSize(condition.treatment, contentWidth - 40)
          const requiredSpace = 25 + (treatmentLines.length * 6)
          
          if (checkNewPage(requiredSpace)) {
            yPosition = addSectionHeader("Treatment Recommendations (continued)", yPosition)
          }
          
          // Condition title
          doc.setFontSize(13)
          doc.setTextColor(37, 99, 235)
          doc.setFont('helvetica', 'bold')
          doc.text(`${condition.label}:`, margin, yPosition)
          yPosition += 8
          
          // Treatment recommendation in a box
          doc.setFillColor(248, 250, 252)
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.5)
          doc.roundedRect(margin + 10, yPosition, contentWidth - 20, 20, 2, 2, 'FD')
          
          doc.setFontSize(11)
          doc.setTextColor(0, 0, 0)
          doc.setFont('helvetica', 'normal')
          doc.text(treatmentLines, margin + 15, yPosition + 8)
          yPosition += 30
        }
      })
    }

    // Additional Notes Section
    if (additionalNotes) {
      checkNewPage(60)
      yPosition = addSectionHeader("Additional Clinical Notes", yPosition)
      
      doc.setFillColor(255, 251, 235)
      doc.setDrawColor(251, 191, 36)
      doc.setLineWidth(0.5)
      doc.roundedRect(margin, yPosition, contentWidth, 40, 3, 3, 'FD')
      
      doc.setFontSize(11)
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'normal')
      const splitAdditionalNotes = doc.splitTextToSize(additionalNotes, contentWidth - 20)
      doc.text(splitAdditionalNotes, margin + 10, yPosition + 8)
      yPosition += 50
    }

    // Footer on every page
    const addFooter = () => {
      const currentPage = doc.getCurrentPageInfo().pageNumber
      const totalPages = doc.getNumberOfPages()
      
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'normal')
      doc.text(`Page ${currentPage} of ${totalPages}`, pageWidth - 30, pageHeight - 10)
      doc.text("Generated by OralVis Healthcare System", margin, pageHeight - 10)
    }

    // Add footer to all pages
    for (let i = 1; i <= doc.getNumberOfPages(); i++) {
      doc.setPage(i)
      addFooter()
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Upload PDF to storage
    const fileName = `reports/${submissionId}/${Date.now()}.pdf`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("dental-images")
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("dental-images").getPublicUrl(fileName)

    // Update submission with report URL
    const { error: updateError } = await supabase
      .from("submissions")
      .update({
        report_url: publicUrl,
        status: "reported",
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      reportUrl: publicUrl,
    })
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate report",
      },
      { status: 500 },
    )
  }
}
