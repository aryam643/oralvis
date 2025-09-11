"use client"

import type React from "react"

import { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { Square, Circle, ArrowRight, Pencil, Eraser, Save, Undo, Redo, Download } from "lucide-react"

interface Point {
  x: number
  y: number
}

interface Annotation {
  id: string
  type: "rectangle" | "circle" | "arrow" | "freehand"
  points: Point[]
  color: string
  strokeWidth: number
  labelId?: string
}

interface AnnotationCanvasProps {
  imageUrl: string
  submissionId: string
  existingAnnotations?: any
}

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"]
const CONDITION_OPTIONS = [
  { id: "inflamed_gums", label: "Inflamed / Red gums" },
  { id: "malaligned", label: "Malaligned teeth" },
  { id: "receded_gums", label: "Receded gums" },
  { id: "stains", label: "Stains" },
  { id: "attrition", label: "Attrition" },
  { id: "crowns", label: "Crowns" },
  { id: "cavities", label: "Cavities" },
  { id: "plaque", label: "Plaque" },
]

export default function AnnotationCanvas({ imageUrl, submissionId, existingAnnotations }: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentTool, setCurrentTool] = useState<"rectangle" | "circle" | "arrow" | "freehand">("rectangle")
  const [currentColor, setCurrentColor] = useState("#ef4444")
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [annotationsByImage, setAnnotationsByImage] = useState<Record<string, Annotation[]>>({})
  const [history, setHistory] = useState<Annotation[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [startPoint, setStartPoint] = useState<Point | null>(null)
  const [currentPath, setCurrentPath] = useState<Point[]>([])
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(true)
  const [imagesMap, setImagesMap] = useState<Record<string, string>>({})
  const [currentImageKey, setCurrentImageKey] = useState<'upper' | 'front' | 'lower' | 'primary'>('primary')
  const [currentLabel, setCurrentLabel] = useState<string>('stains')
  const [annotatedImagesMap, setAnnotatedImagesMap] = useState<Record<string, string>>({})

  // Load image
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      setImage(img)
      if (canvasRef.current) {
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        if (ctx) {
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)
        }
      }
    }
    img.src = imageUrl
  }, [imageUrl])

  // Load existing annotations
  useEffect(() => {
    if (existingAnnotations) {
      try {
        const parsed = typeof existingAnnotations === "string" ? JSON.parse(existingAnnotations) : existingAnnotations
        if (Array.isArray(parsed)) {
          setAnnotations(parsed)
          setHistory([parsed])
          setHistoryIndex(0)
        } else if (parsed && typeof parsed === 'object') {
          const imgs = parsed.images || { primary: imageUrl }
          setImagesMap(imgs)
          const firstKey = (['upper','front','lower','primary'] as const).find(k => imgs[k]) || 'primary'
          setCurrentImageKey(firstKey as any)
          const byImg: Record<string, Annotation[]> = parsed.annotations || {}
          setAnnotationsByImage(byImg)
          const initial = byImg[firstKey as string] || []
          setAnnotations(initial)
          setHistory([initial])
          setHistoryIndex(0)
          const annImgs: Record<string, string> = parsed.annotated_images || {}
          setAnnotatedImagesMap(annImgs)

          // Ensure canvas shows the first available image
          const src = imgs[firstKey as string] || imageUrl
          if (src) {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
              setImage(img)
              if (canvasRef.current) {
                const canvas = canvasRef.current
                const ctx = canvas.getContext("2d")
                if (ctx) {
                  canvas.width = img.width
                  canvas.height = img.height
                  ctx.drawImage(img, 0, 0)
                }
              }
            }
            img.src = src
          }
        }
      } catch (error) {
        console.error("Failed to parse existing annotations:", error)
      }
    }
  }, [existingAnnotations])

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    if (!canvasRef.current || !image) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear and redraw image
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0)

    // Draw all annotations
    annotations.forEach((annotation) => {
      ctx.strokeStyle = annotation.color
      ctx.lineWidth = annotation.strokeWidth
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      switch (annotation.type) {
        case "rectangle":
          if (annotation.points.length >= 2) {
            const [start, end] = annotation.points
            ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y)
          }
          break
        case "circle":
          if (annotation.points.length >= 2) {
            const [start, end] = annotation.points
            const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
            ctx.beginPath()
            ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI)
            ctx.stroke()
          }
          break
        case "arrow":
          if (annotation.points.length >= 2) {
            const [start, end] = annotation.points
            drawArrow(ctx, start.x, start.y, end.x, end.y)
          }
          break
        case "freehand":
          if (annotation.points.length > 1) {
            ctx.beginPath()
            ctx.moveTo(annotation.points[0].x, annotation.points[0].y)
            annotation.points.forEach((point) => ctx.lineTo(point.x, point.y))
            ctx.stroke()
          }
          break
      }
    })
  }, [annotations, image])

  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headLength = 20
    const angle = Math.atan2(toY - fromY, toX - fromX)

    // Draw line
    ctx.beginPath()
    ctx.moveTo(fromX, fromY)
    ctx.lineTo(toX, toY)
    ctx.stroke()

    // Draw arrowhead
    ctx.beginPath()
    ctx.moveTo(toX, toY)
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6))
    ctx.moveTo(toX, toY)
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6))
    ctx.stroke()
  }

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)
    setIsDrawing(true)
    setStartPoint(pos)
    setIsSaved(false)

    if (currentTool === "freehand") {
      setCurrentPath([pos])
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return

    const pos = getMousePos(e)

    if (currentTool === "freehand") {
      setCurrentPath((prev) => [...prev, pos])
      // Draw current path
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d")
        if (ctx && currentPath.length > 0) {
          redrawCanvas()
          ctx.strokeStyle = currentColor
          ctx.lineWidth = 3
          ctx.lineCap = "round"
          ctx.beginPath()
          ctx.moveTo(currentPath[0].x, currentPath[0].y)
          currentPath.forEach((point) => ctx.lineTo(point.x, point.y))
          ctx.lineTo(pos.x, pos.y)
          ctx.stroke()
        }
      }
    } else {
      // Preview other shapes
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d")
        if (ctx) {
          redrawCanvas()
          ctx.strokeStyle = currentColor
          ctx.lineWidth = 3
          ctx.lineCap = "round"

          switch (currentTool) {
            case "rectangle":
              ctx.strokeRect(startPoint.x, startPoint.y, pos.x - startPoint.x, pos.y - startPoint.y)
              break
            case "circle":
              const radius = Math.sqrt(Math.pow(pos.x - startPoint.x, 2) + Math.pow(pos.y - startPoint.y, 2))
              ctx.beginPath()
              ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI)
              ctx.stroke()
              break
            case "arrow":
              drawArrow(ctx, startPoint.x, startPoint.y, pos.x, pos.y)
              break
          }
        }
      }
    }
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return

    const pos = getMousePos(e)
    setIsDrawing(false)

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: currentTool,
      points: currentTool === "freehand" ? [...currentPath, pos] : [startPoint, pos],
      color: currentColor,
      strokeWidth: 3,
      labelId: currentLabel,
    }

    const newAnnotations = [...annotations, newAnnotation]
    setAnnotations(newAnnotations)
    setAnnotationsByImage((prev) => ({ ...prev, [currentImageKey]: newAnnotations }))

    // Update history
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newAnnotations)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)

    setStartPoint(null)
    setCurrentPath([])
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setAnnotations(history[historyIndex - 1])
      setIsSaved(false)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setAnnotations(history[historyIndex + 1])
      setIsSaved(false)
    }
  }

  const clearAll = () => {
    setAnnotations([])
    const newHistory = [...history, []]
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setIsSaved(false)
  }

  const saveAnnotations = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      // Generate annotated image
      if (canvasRef.current) {
        const canvas = canvasRef.current
        const dataUrl = canvas.toDataURL("image/png")

        // Convert to blob and upload
        const response = await fetch(dataUrl)
        const blob = await response.blob()

        const fileName = `annotated/${submissionId}/${currentImageKey}-${Date.now()}.png`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("dental-images")
          .upload(fileName, blob)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("dental-images").getPublicUrl(fileName)

        const nextData = {
          images: Object.keys(imagesMap).length ? imagesMap : { primary: imageUrl },
          annotations: { ...annotationsByImage, [currentImageKey]: annotations },
          annotated_images: { ...annotatedImagesMap, [currentImageKey]: publicUrl },
        }

        // Update submission with annotations
        const { error: updateError } = await supabase
          .from("submissions")
          .update({
            annotation_data: JSON.stringify(nextData),
            annotated_image_url: publicUrl,
            status: "annotated",
            updated_at: new Date().toISOString(),
          })
          .eq("id", submissionId)

        if (updateError) throw updateError

        // Update local annotated map
        setAnnotatedImagesMap((prev) => ({ ...prev, [currentImageKey]: publicUrl }))

        setIsSaved(true)
      }
    } catch (error) {
      console.error("Failed to save annotations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const downloadAnnotatedImage = () => {
    if (canvasRef.current) {
      const link = document.createElement("a")
      link.download = `annotated-${submissionId}.png`
      link.href = canvasRef.current.toDataURL()
      link.click()
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Image Slot Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Image:</span>
              {(["upper","front","lower","primary"] as const)
                .filter((k) => imagesMap[k])
                .map((key) => (
                  <Button
                    key={key}
                    variant={currentImageKey === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setCurrentImageKey(key)
                      const src = imagesMap[key]
                      if (!src) return
                      const img = new Image()
                      img.crossOrigin = "anonymous"
                      img.onload = () => {
                        setImage(img)
                        if (canvasRef.current) {
                          const canvas = canvasRef.current
                          const ctx = canvas.getContext("2d")
                          if (ctx) {
                            canvas.width = img.width
                            canvas.height = img.height
                            ctx.drawImage(img, 0, 0)
                          }
                        }
                      }
                      img.src = src
                      const next = annotationsByImage[key] || []
                      setAnnotations(next)
                      setHistory([next])
                      setHistoryIndex(0)
                    }}
                  >
                    {key === 'primary' ? 'Image' : key.charAt(0).toUpperCase() + key.slice(1)}
                  </Button>
                ))}
            </div>
            {/* Drawing Tools */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Tools:</span>
              <Button
                variant={currentTool === "rectangle" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("rectangle")}
              >
                <Square className="w-4 h-4" />
              </Button>
              <Button
                variant={currentTool === "circle" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("circle")}
              >
                <Circle className="w-4 h-4" />
              </Button>
              <Button
                variant={currentTool === "arrow" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("arrow")}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant={currentTool === "freehand" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("freehand")}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>

            {/* Colors */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Color:</span>
              {COLORS.map((color) => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded-full border-2 ${
                    currentColor === color ? "border-gray-800" : "border-gray-300"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setCurrentColor(color)}
                />
              ))}
            </div>

            {/* Clinical Label */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Regarding:</span>
              <select
                className="border rounded-md text-sm px-2 py-1"
                value={currentLabel}
                onChange={(e) => setCurrentLabel(e.target.value)}
              >
                {CONDITION_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
                <Undo className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
                <Redo className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll}>
                <Eraser className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={downloadAnnotatedImage}>
                <Download className="w-4 h-4" />
              </Button>
              <Button
                onClick={saveAnnotations}
                disabled={isLoading || isSaved}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? "Saving..." : isSaved ? "Saved" : "Save Annotations"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Canvas */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="max-w-full h-auto cursor-crosshair"
          style={{ display: "block" }}
        />
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={isSaved ? "default" : "secondary"}>{isSaved ? "All changes saved" : "Unsaved changes"}</Badge>
          <span className="text-sm text-gray-600">{annotations.length} annotations</span>
        </div>
      </div>
    </div>
  )
}
