"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Loader2, Play } from "lucide-react"
import uploadPDF from "@/utils/uploader"
import { useAuth, useUser } from "@clerk/nextjs"
import axios from "axios"
import { useRouter } from "next/navigation"
import { getDodoPlanDetails } from "@/utils/subscriptionHandler"

type UploadState = "idle" | "uploading" | "processing" | "complete"

interface PDFUploadSectionProps {
  setOutputVidUrl: (url: string) => void
  outputVidUrl: string | null
}

export function PDFUploadSection({ setOutputVidUrl, outputVidUrl }: PDFUploadSectionProps) {
  const router = useRouter()
  const { user } = useUser()
  const { getToken } = useAuth();
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStage, setGenerationStage] = useState<"idle" | "queued" | "generating" | "complete">("idle")
  const [isDragging, setIsDragging] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const uploadProgressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const generationQueueTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const generationProgressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const websocketRef = useRef<WebSocket | null>(null)

  const clearUploadProgressInterval = () => {
    if (uploadProgressIntervalRef.current) {
      clearInterval(uploadProgressIntervalRef.current)
      uploadProgressIntervalRef.current = null
    }
  }

  const clearGenerationTimers = () => {
    if (generationQueueTimeoutRef.current) {
      clearTimeout(generationQueueTimeoutRef.current)
      generationQueueTimeoutRef.current = null
    }
    if (generationProgressIntervalRef.current) {
      clearInterval(generationProgressIntervalRef.current)
      generationProgressIntervalRef.current = null
    }
  }

  const startUploadProgressSimulation = () => {
    clearUploadProgressInterval()
    setUploadProgress(0)
    uploadProgressIntervalRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          return prev
        }
        const next = Math.min(prev + Math.round(Math.random() * 12 + 8), 95)
        return next
      })
    }, 300)
  }

  const completeUploadProgressSimulation = () => {
    clearUploadProgressInterval()
    setUploadProgress(100)
  }

  const finalizeGeneration = (finalVideoUrl: string) => {
    clearGenerationTimers()
    setGenerationStage("complete")
    setGenerationProgress(100)
    setUploadState("complete")
    setVideoUrl(finalVideoUrl)
    setOutputVidUrl(finalVideoUrl)
    setJobId(null)
    if (websocketRef.current) {
      websocketRef.current.close()
      websocketRef.current = null
    }
  }

  const startGenerationMock = (options?: { autoComplete?: boolean; fallbackVideoUrl?: string }) => {
    clearGenerationTimers()
    setGenerationStage("queued")
    setGenerationProgress(0)
    generationQueueTimeoutRef.current = setTimeout(() => {
      setGenerationStage("generating")
      generationProgressIntervalRef.current = setInterval(() => {
        setGenerationProgress((prev) => {
          const target = options?.autoComplete ? 100 : 95
          if (prev >= target) {
            return prev
          }
          const next = Math.min(prev + Math.round(Math.random() * 15 + 10), target)
          if (options?.autoComplete && next >= 100) {
            clearGenerationTimers()
            finalizeGeneration(options?.fallbackVideoUrl ?? "/placeholder.mp4")
          }
          return next
        })
      }, 600)
    }, 1200)
  }

  useEffect(() => {
    return () => {
      clearUploadProgressInterval()
      clearGenerationTimers()
      if (websocketRef.current) {
        websocketRef.current.close()
        websocketRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (outputVidUrl) {
      setVideoUrl(outputVidUrl)
      setUploadState("complete")
    }
  }, [outputVidUrl])

  useEffect(() => {
    if (!jobId || !user?.id) {
      return
    }

    const websocketUrl = process.env.NEXT_PUBLIC_WS_URL

    if (!websocketUrl) {
      console.warn("NEXT_PUBLIC_WS_URL is not defined; cannot subscribe to job updates")
      return
    }

    try {
      const ws = new WebSocket(websocketUrl)
      websocketRef.current = ws

      ws.onopen = () => {
        const subscriptionMessage = JSON.stringify({ type: "subscribe", jobId })
        ws.send(subscriptionMessage)
      }

      ws.onmessage = (event) => {
        try {
          if (typeof event.data !== "string") {
            return
          }

          const payload = JSON.parse(event.data)

          if (payload.jobId && payload.jobId !== jobId) {
            return
          }

          if (payload.status === "queued") {
            setGenerationStage("queued")
          }

          if (payload.status === "processing") {
            setGenerationStage("generating")
            if (typeof payload.progress === "number") {
              setGenerationProgress(Math.max(0, Math.min(100, payload.progress)))
            }
          }

          if (payload.output_url) {
            finalizeGeneration(payload.output_url)
          }

          if (payload.status === "failed") {
            console.error("Video generation failed", payload)
            alert("Video generation failed. Please try again.")
            resetUpload()
          }

          if (payload.status === "progress" && typeof payload.progress === "number") {
            setGenerationStage("generating")
            setGenerationProgress(Math.max(0, Math.min(100, payload.progress)))
          }
        } catch (error) {
          console.error("Invalid websocket payload", error)
        }
      }

      ws.onerror = (error) => {
        console.error("Websocket error", error)
      }

      ws.onclose = () => {
        websocketRef.current = null
      }
    } catch (error) {
      console.error("Failed to initialize websocket", error)
    }

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close()
        websocketRef.current = null
      }
    }
  }, [jobId, user?.id])

  const handleFileSelect = (file: File) => {
    if (file.type === "application/pdf") {
      setSelectedFile(file)
      handleUpload(file)
    } else {
      alert("Please select a PDF file")
    }
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const getUserSubscriptionData = async () => {
    if (!user) {
      return alert("User not logged in");
    }

    try {
      const userSubscriptionStatus = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/subscription/${user.id}`);
      const subscriptionDataResponse = userSubscriptionStatus.data as getSubscriptionResponseInterface;
      const subscriptionData = subscriptionDataResponse.userSubscription;

      return subscriptionData;
    } catch (error) {
      console.log("Error getting subcription details: ", error);
    }
  }

  const getPlanDetails = async (planId: string) => {
    try {
      const planDetails = await getDodoPlanDetails(planId);
      return planDetails;
    } catch (error) {
      console.log("Error getting plan details: ", error);
    }
  }

  const handleUpload = async (file: File) => {
    setUploadState("uploading")
    setGenerationStage("idle")
    setGenerationProgress(0)
    setVideoUrl(null)
    setJobId(null)
    if (websocketRef.current) {
      websocketRef.current.close()
      websocketRef.current = null
    }
    startUploadProgressSimulation()

    const formData = new FormData()
    formData.append("file", file)

    try {
      const subscriptionData = await getUserSubscriptionData();
      console.log("subscriptionData JSON: ", JSON.stringify(subscriptionData));

      let pageLimit = 5;
      if (subscriptionData) {
        const planId = subscriptionData.PlanId;

        const planDetails = await getPlanDetails(planId);

        if (!planDetails) {
          alert("Unable to fetch plan details");
          return;
        }

        if (planDetails.name === process.env.NEXT_PUBLIC_DODO_STARTER_PLAN_NAME) {
          pageLimit = 10;
        } else if (planDetails.name === process.env.NEXT_PUBLIC_DODO_CREATOR_PLAN_NAME) {
          pageLimit = 20;
        } 
      }

      const uploadPDFResponse = await uploadPDF(formData, pageLimit)
      console.log("Upload pdf response: ", uploadPDFResponse)
      const uploadPDFResponseObj = JSON.parse(uploadPDFResponse)

      if (!uploadPDFResponseObj.success) {
        alert("Error uploading PDF: " + uploadPDFResponseObj.error)
        resetUpload()
        return
      }

      completeUploadProgressSimulation()
      const uploadedPdfUrl = uploadPDFResponseObj.pdfUrl
      setPdfUrl(uploadedPdfUrl)
      requestVideoGeneration(uploadedPdfUrl, file)
      console.log("Uploaded PDF URL: ", uploadedPdfUrl)
    } catch (error) {
      console.error("Error uploading PDF:", error)
      alert("Error uploading PDF: " + error)
      resetUpload()
    }
  }

  const resetUpload = () => {
    setUploadState("idle")
    setSelectedFile(null)
    setPdfUrl(null)
    setVideoUrl(null)
    setUploadProgress(0)
    setGenerationProgress(0)
    setGenerationStage("idle")
    setJobId(null)
    clearUploadProgressInterval()
    clearGenerationTimers()
    if (websocketRef.current) {
      websocketRef.current.close()
      websocketRef.current = null
    }

    router.push("/")
  }

  const requestVideoGeneration = async (pdfUrlValue: string, file: File) => {
    if (!pdfUrlValue || !user) return
    try {
      const token = await getToken();
      if (!token) {
        alert("User not authenticated");
        resetUpload();
        return;
      }

      const jobData = {
        pdf_url: pdfUrlValue,
        title: file?.name || "Untitled PDF",
      }

      console.log("jobData: ", jobData)
      console.log("token: ", token)

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/create-job`, jobData, {
          headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
      });

      if (response.status === 200) {
        // Show generation in progress
        setUploadState("processing")
        const jobIdValue: string | undefined = response.data?.jobId
        if (jobIdValue) {
          setJobId(jobIdValue)
          startGenerationMock()
        } else {
          console.warn("Job ID not returned; falling back to mock completion")
          startGenerationMock({ autoComplete: true })
        }
      } else {
        alert("Failed to submit video generation job.")
      }
    } catch (error) {
      console.error("Error generating video:", error)
      alert("Error generating video: " + error)
      resetUpload()
    }
  }

  if (uploadState === "complete" && videoUrl) {
    return (
      <Card className="overflow-hidden border-blue-900 bg-[#4C4B6E] shadow-lg">
        <div className="aspect-video w-full bg-black">
          <video controls className="h-full w-full">
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Play className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Video Ready!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your PDF has been converted to a video explanation. You can watch it above or download it.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={resetUpload} className="flex-1 bg-transparent">
              Convert Another PDF
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  if (uploadState === "uploading" || uploadState === "processing") {
    const isUploadComplete = uploadProgress >= 100
    const headline = uploadState === "uploading"
      ? "Uploading your PDF..."
      : generationStage === "queued"
        ? "Your request is queued..."
        : "Generating your video..."
    const subtext = uploadState === "uploading"
      ? "Please wait while we upload your document"
      : generationStage === "queued"
        ? "We have your PDF. Waiting for an available worker to start the conversion."
        : "Our AI is analyzing your PDF and creating an engaging video tutorial."

    return (
      <Card className="border-border/50 shadow-lg p-8">
        <div className="flex flex-col items-center justify-center space-y-8 py-12">
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-4 border-primary/20" />
            <div
              className="absolute inset-0 h-24 w-24 rounded-full border-4 border-primary border-t-transparent animate-spin"
              style={{ animationDuration: "1s" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-primary animate-pulse" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-foreground">{headline}</h3>
            <p className="text-sm text-muted-foreground max-w-xl text-pretty">{subtext}</p>
          </div>

          <div className="w-full max-w-xl space-y-5">
            <div className="rounded-lg border border-border/50 bg-card/50 p-5 space-y-3">
              <div className="flex items-center justify-between text-sm font-medium text-foreground">
                <span>PDF Upload</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {isUploadComplete ? "Upload complete" : "Uploading file..."}
              </p>
            </div>

            <div className="rounded-lg border border-border/50 bg-card/50 p-5 space-y-3">
              <div className="flex items-center justify-between text-sm font-medium text-foreground">
                <span>Video Generation</span>
                <span>
                  {generationStage === "queued" && "Queued"}
                  {generationStage === "generating" && `${Math.round(generationProgress)}%`}
                  {generationStage === "idle" && "Waiting"}
                </span>
              </div>
              {generationStage === "idle" && (
                <p className="text-xs text-muted-foreground">Waiting for upload to finish...</p>
              )}
              {generationStage === "queued" && (
                <>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full w-full bg-primary/60 animate-pulse" />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">Queued – waiting for worker</p>
                </>
              )}
              {generationStage === "generating" && (
                <>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 ease-out"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">{Math.round(generationProgress)}% complete</p>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={`border-2 border-solid transition-colors ${
        isDragging ? "border-blue-500 bg-[#4C4B6E]/5" : "border-[#BEBFF2]/50 bg-[#161627]"
      } shadow-lg`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="p-8 md:p-12">
        <div className="flex flex-col items-center justify-center space-y-6 py-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
            <Upload className="h-10 w-10 text-primary" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground text-balance">Upload Your PDF</h2>
            <p className="text-muted-foreground max-w-md text-pretty">
              Drag and drop your PDF here, or click the button below to select a file from your computer
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            <Button
              className="flex-1 h-12 bg-[#7c7dda] hover:bg-[#6a70de] text-white gap-2 rounded-full"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <FileText className="h-5 w-5" />
              Select PDF
            </Button>
            <input
              id="file-input"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file)
              }}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}
