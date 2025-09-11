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

// Fixed colors for legend items (RGB)
const CONDITION_COLORS: Record<string, [number, number, number]> = {
  inflamed_gums: [168, 85, 247], // purple
  malaligned: [249, 115, 22],    // orange
  receded_gums: [107, 114, 128], // gray
  stains: [239, 68, 68],         // red
  attrition: [34, 211, 238],     // cyan
  crowns: [236, 72, 153],        // pink
  cavities: [59, 130, 246],      // blue
  plaque: [234, 179, 8],         // yellow
}

export async function POST(request: NextRequest) {
  try {
    const { submissionId, selectedConditions = [], additionalNotes } = await request.json()

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

    // Derive conditions from annotation labels if present
    let derivedConditions: string[] = []
    try {
      const data = submission.annotation_data || {}
      const annotationsByImage = (data?.annotations || {}) as Record<string, Array<{ labelId?: string }>>
      const labels = new Set<string>()
      Object.values(annotationsByImage).forEach((arr) => {
        if (Array.isArray(arr)) {
          for (const a of arr) {
            if (a && a.labelId) labels.add(a.labelId)
          }
        }
      })
      derivedConditions = Array.from(labels)
    } catch {}
    const conditions = (derivedConditions.length ? derivedConditions : selectedConditions).filter((id) => DENTAL_CONDITIONS[id as keyof typeof DENTAL_CONDITIONS])
    
    if (conditions.length < 2) {
      return NextResponse.json({ success: false, error: "Please annotate at least two different issues (labels) before generating." }, { status: 400 })
    }

    // Create a single‑page PDF styled similar to the demo
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 12
    const contentWidth = pageWidth - margin * 2
    let y = 12

    // Top banner
    doc.setFillColor(124, 58, 237)
    doc.rect(0, 0, pageWidth, 32, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(255, 255, 255)
    doc.text('Oral Health Screening Report', pageWidth / 2, 20, { align: 'center' })

    // Patient info row
    y = 40
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    const dateStr = new Date(submission.created_at).toLocaleDateString()
    // Resolve phone number with fallback direct query
    let phone = submission.patient?.phone ? String(submission.patient.phone) : ''
    if (!phone && submission.patient_id) {
      try {
        const { data: userRow } = await supabase
          .from('users')
          .select('phone')
          .eq('id', submission.patient_id)
          .single()
        if (userRow?.phone) phone = String(userRow.phone)
      } catch {}
    }
    if (!phone) phone = '—'
    doc.text(`Name: ${submission.name}`, margin, y)
    doc.text(`Phone: ${phone}`, pageWidth / 2, y)
    doc.text(`Date: ${dateStr}`, pageWidth - margin, y, { align: 'right' })

    // Screening report box (3 images + legend)
    y += 6
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(210, 214, 220)
    doc.roundedRect(margin, y, contentWidth, 120, 3, 3, 'FD')

    // Title inside box
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(31, 41, 55)
    doc.text('SCREENING REPORT:', margin + 6, y + 10)

    // Prepare up to three image slots with robust fallbacks
    let dataObj: any = {}
    try {
      dataObj = typeof submission.annotation_data === 'string'
        ? JSON.parse(submission.annotation_data)
        : (submission.annotation_data || {})
    } catch {
      dataObj = {}
    }
    const rawImages = (dataObj?.images || {}) as Record<string, string>
    const rawAnnotated = (dataObj?.annotated_images || {}) as Record<string, string>

    // Normalize keys like "Upper Teeth", "uupper", "frontteeth" → upper|front|lower
    const normalizeKey = (k: string): 'upper' | 'front' | 'lower' | 'primary' | undefined => {
      const s = (k || '').toString().toLowerCase().replace(/[^a-z]/g, '')
      if (s.startsWith('upper')) return 'upper'
      if (s.startsWith('front') || s.startsWith('middle')) return 'front'
      if (s.startsWith('lower')) return 'lower'
      if (s.startsWith('primary') || s === 'image') return 'primary'
      // common typos
      if (s.startsWith('uupper')) return 'upper'
      return undefined
    }

    const images: Record<'upper' | 'front' | 'lower', string | undefined> = { upper: undefined, front: undefined, lower: undefined }
    const annotated: Record<'upper' | 'front' | 'lower', string | undefined> = { upper: undefined, front: undefined, lower: undefined }

    // Fill normalized maps
    Object.entries(rawImages).forEach(([k, v]) => {
      const nk = normalizeKey(k)
      if (nk && nk !== 'primary') {
        images[nk] = v
      } else if (nk === 'primary') {
        images.front = images.front || v
      }
    })
    Object.entries(rawAnnotated).forEach(([k, v]) => {
      const nk = normalizeKey(k)
      if (nk && nk !== 'primary') {
        annotated[nk] = v
      } else if (nk === 'primary') {
        annotated.front = annotated.front || v
      }
    })

    // Fallback: if everything empty, use single-image fields in Front slot
    if (!images.upper && !images.front && !images.lower && !annotated.upper && !annotated.front && !annotated.lower) {
      const fallback = submission.annotated_image_url || submission.original_image_url
      if (fallback) images.front = fallback
    }
    const order: Array<"upper" | "front" | "lower"> = ["upper", "front", "lower"]

    const cellW = (contentWidth - 24) / 3 // padding between
    const cellH = 78
    const cellY = y + 16
    for (let i = 0; i < 3; i++) {
      const key = order[i]
      const x = margin + 6 + i * (cellW + 12)
      // container with light border
      doc.setDrawColor(224, 224, 224)
      doc.roundedRect(x, cellY, cellW, cellH, 2, 2)
      const link = annotated[key] || images[key]
      if (link) {
        try {
          const res = await fetch(link)
          if (res.ok) {
            // Decide format by URL extension first, then header
            const lowerUrl = link.toLowerCase()
            let fmt: 'PNG' | 'JPEG' = lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg') ? 'JPEG' : 'PNG'
            const typeHeader = res.headers.get('content-type') || ''
            if (!fmt && (typeHeader.includes('jpeg') || typeHeader.includes('jpg'))) fmt = 'JPEG'
            
            const buf = await res.arrayBuffer()
            const b64 = Buffer.from(buf).toString('base64')
            const mime = fmt === 'JPEG' ? 'image/jpeg' : 'image/png'
            const url = `data:${mime};base64,${b64}`
            // slight padding
            doc.addImage(url, fmt as any, x + 2, cellY + 2, cellW - 4, cellH - 4)
          }
        } catch {}
      } else {
        // draw empty placeholder
        doc.setFontSize(9)
        doc.setTextColor(148, 163, 184)
        doc.text('No image', x + cellW / 2, cellY + cellH / 2, { align: 'center' })
      }
      // slot label pill
      const pillY = cellY + cellH + 6
      doc.setFillColor(255, 92, 92)
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      const label = key === 'upper' ? 'Upper Teeth' : key === 'front' ? 'Front Teeth' : 'Lower Teeth'
      const tw = doc.getTextWidth(label) + 8
      const px = x + (cellW - tw) / 2
      doc.roundedRect(px, pillY - 5, tw, 10, 5, 5, 'F')
      doc.text(label, px + 4, pillY + 1)
    }

    // Legend under images
    const legendTop = y + 16 + cellH + 18
    const itemHeight = 6
    const itemSpacingX = 4
    const squareSize = 4
    let lx = margin + 8
    let ly = legendTop
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    conditions.forEach((id) => {
      const condition = DENTAL_CONDITIONS[id as keyof typeof DENTAL_CONDITIONS]
      const rgb = CONDITION_COLORS[id] || [37, 99, 235]
      if (!condition) return
      const labelWidth = doc.getTextWidth(condition.label) + squareSize + 4
      // wrap within box width
      if (lx + labelWidth > pageWidth - margin - 8) {
        lx = margin + 8
        ly += itemHeight + 2
      }
      doc.setFillColor(rgb[0], rgb[1], rgb[2])
      doc.rect(lx, ly - squareSize + 3, squareSize, squareSize, 'F')
      doc.setTextColor(55, 65, 81)
      doc.text(condition.label, lx + squareSize + 2, ly + 3)
      lx += labelWidth + itemSpacingX
    })

    // Treatment recommendations block
    const recTop = y + 120 + 8
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(31, 41, 55)
    doc.text('TREATMENT RECOMMENDATIONS:', margin, recTop)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(17, 24, 39)
    let recY = recTop + 6
    const bulletX = margin + 2
    conditions.forEach((id) => {
      const c = DENTAL_CONDITIONS[id as keyof typeof DENTAL_CONDITIONS]
      if (!c) return
      const text = `${c.label}: ${c.treatment}`
      const lines = doc.splitTextToSize(text, contentWidth - 8)
      // bullet
      doc.setFillColor(37, 99, 235)
      doc.circle(bulletX, recY - 2, 1.5, 'F')
      doc.text(lines, bulletX + 4, recY)
      recY += lines.length * 5 + 2
    })

    // Footer note
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text('Generated by OralVis Healthcare', pageWidth / 2, pageHeight - 8, { align: 'center' })

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
