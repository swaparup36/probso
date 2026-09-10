"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Play } from "lucide-react"
import { uploadPdfToCloudinary } from "@/utils/directUpload"
import { verifyPageLimit } from "@/utils/uploader"
import { useAuth, useUser } from "@clerk/nextjs"
import axios from "axios"
import { useRouter } from "next/navigation"
import { getDodoPlanDetails } from "@/utils/subscriptionHandler"
import { useToast } from "@/hooks/use-toast"

type UploadState = "idle" | "uploading" | "processing" | "complete"

interface PDFUploadSectionProps {
  setOutputVidUrl: (url: string) => void
  outputVidUrl: string | null
}

export function PDFUploadSection({ setOutputVidUrl, outputVidUrl }: PDFUploadSectionProps) {
  const router = useRouter()
  const { user } = useUser()
  const { getToken } = useAuth();
  const { toast } = useToast()
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
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 10

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

  const clearHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
  }

  const clearReconnectTimeout = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }

  const startHeartbeat = (ws: WebSocket) => {
    clearHeartbeat()
    // Send ping every 30 seconds to keep connection alive
    heartbeatIntervalRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }))
      }
    }, 30000)
  }

  const completeUploadProgressSimulation = () => {
    clearUploadProgressInterval()
    setUploadProgress(100)
  }

  const finalizeGeneration = (finalVideoUrl: string) => {
    console.log("Finalizing the video generation")
    clearGenerationTimers()
    clearHeartbeat()
    clearReconnectTimeout()
    setGenerationStage("complete")
    setGenerationProgress(100)
    setUploadState("complete")
    setVideoUrl(finalVideoUrl)
    setOutputVidUrl(finalVideoUrl)
    reconnectAttemptsRef.current = 0
    
    // Unsubscribe from job updates before closing connection
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN && jobId) {
      console.log("Unsubscribing from job updates")
      const unsubscribeMessage = JSON.stringify({ type: "unsubscribe", jobId })
      websocketRef.current.send(unsubscribeMessage)
      
      // Give a brief moment for the message to be sent before closing
      setTimeout(() => {
        if (websocketRef.current) {
          websocketRef.current.close()
          websocketRef.current = null
        }
      }, 100)
    } else if (websocketRef.current) {
      websocketRef.current.close()
      websocketRef.current = null
    }
    
    setJobId(null)
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
      clearHeartbeat()
      clearReconnectTimeout()
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

    const connectWebSocket = () => {
      try {
        // Close existing connection if any
        if (websocketRef.current) {
          websocketRef.current.close()
          websocketRef.current = null
        }

        clearHeartbeat()
        clearReconnectTimeout()

        console.log(`Connecting to WebSocket (attempt ${reconnectAttemptsRef.current + 1})...`)
        const ws = new WebSocket(websocketUrl)
        websocketRef.current = ws

        ws.onopen = () => {
          console.log("WebSocket connected successfully")
          reconnectAttemptsRef.current = 0 // Reset on successful connection
          const subscriptionMessage = JSON.stringify({ type: "subscribe", jobId })
          ws.send(subscriptionMessage)
          
          // Start heartbeat to keep connection alive
          startHeartbeat(ws)
        }

        ws.onmessage = (event) => {
          try {
            if (typeof event.data !== "string") {
              console.warn("Received non-string message from WebSocket")
              return
            }

            // Try to parse as JSON, if it fails it might be a plain text message
            let payload
            try {
              console.log("Event data: ", event.data)
              payload = JSON.parse(event.data)
            } catch (parseError) {
              console.warn("Received non-JSON message from WebSocket:", event.data)
              return
            }

            console.log("payload: ", payload);

            // Ignore pong messages
            if (payload.type === "pong") {
              return
            }

            if (!payload.jobId || payload.jobId !== jobId) {
              return
            }

            if (payload.output_url) {
              console.log("Got output_url: ", payload.output_url)
              finalizeGeneration(payload.output_url)
            }

            if (payload.status && payload.progress !== undefined) {
              if (payload.status === "failed") {
                console.error("Video generation failed", payload)
                toast({
                  variant: "destructive",
                  title: "Video generation failed",
                  description: "Please try again."
                })
                resetUpload()
              } else {
                console.log("Got job progress: ", payload.progress)
                // Map any active processing status to "generating"
                setGenerationStage("generating")
                setGenerationProgress(Math.max(0, Math.min(100, payload.progress)))
              }
            }
          } catch (error) {
            console.error("Error processing websocket message", error)
          }
        }

        ws.onerror = (error) => {
          console.error("Websocket error", error)
        }

        ws.onclose = (event) => {
          console.log("WebSocket closed", event.code, event.reason)
          clearHeartbeat()
          websocketRef.current = null

          // Don't reconnect if job is complete or user closed it intentionally
          if (!jobId || uploadState === "complete") {
            return
          }

          // Attempt to reconnect with exponential backoff
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 30000)
            console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`)
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connectWebSocket()
            }, delay)
          } else {
            console.error("Max reconnection attempts reached")
            toast({
              variant: "destructive",
              title: "Connection Lost",
              description: "Please refresh the page and check your job status."
            })
          }
        }
      } catch (error) {
        console.error("Failed to initialize websocket", error)
      }
    }

    connectWebSocket()

    return () => {
      clearHeartbeat()
      clearReconnectTimeout()
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
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please select a PDF file"
      })
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
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "User not logged in"
      })
      return;
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
    clearUploadProgressInterval()
    setUploadProgress(0)

    try {
      const subscriptionData = await getUserSubscriptionData();
      console.log("subscriptionData JSON: ", JSON.stringify(subscriptionData));

      let pageLimit = 5;
      if (subscriptionData) {
        const planId = subscriptionData.PlanId;

        const planDetails = await getPlanDetails(planId);

        if (!planDetails) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Unable to fetch plan details"
          })
          return;
        }

        if (planDetails.name === process.env.NEXT_PUBLIC_DODO_STARTER_PLAN_NAME) {
          pageLimit = 10;
        } else if (planDetails.name === process.env.NEXT_PUBLIC_DODO_CREATOR_PLAN_NAME) {
          pageLimit = 20;
        } 
      }

      const { secureUrl, publicId } = await uploadPdfToCloudinary(file, (percent) => {
        // Hold back the last few percent for the page-limit check below.
        setUploadProgress(Math.min(percent, 95))
      })
      console.log("Uploaded PDF URL: ", secureUrl)

      const verifyResponse = JSON.parse(await verifyPageLimit(secureUrl, publicId, pageLimit))
      console.log("Page limit check: ", verifyResponse)

      if (!verifyResponse.success) {
        toast({
          variant: "destructive",
          title: "Upload Error",
          description: `Error uploading PDF: ${verifyResponse.error}`
        })
        resetUpload()
        return
      }

      completeUploadProgressSimulation()
      setPdfUrl(secureUrl)
      requestVideoGeneration(secureUrl, file)
    } catch (error) {
      console.error("Error uploading PDF:", error)
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: `Error uploading PDF: ${error}`
      })
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
    reconnectAttemptsRef.current = 0
    clearUploadProgressInterval()
    clearGenerationTimers()
    clearHeartbeat()
    clearReconnectTimeout()
    if (websocketRef.current) {
      websocketRef.current.close()
      websocketRef.current = null
    }

    setOutputVidUrl("")
    router.push("/")
  }

  const requestVideoGeneration = async (pdfUrlValue: string, file: File) => {
    if (!pdfUrlValue || !user) return
    try {
      const token = await getToken();
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "User not authenticated"
        })
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
          // Don't start mock - we'll get real progress from WebSocket
          setGenerationStage("queued")
          setGenerationProgress(0)
        } else {
          console.warn("Job ID not returned; falling back to mock completion")
          startGenerationMock({ autoComplete: true })
        }
      } else {
        toast({
          variant: "destructive",
          title: "Job Submission Failed",
          description: response.data?.message || "Unknown error"
        })
      }
    } catch (error) {
      const message = axios.isAxiosError(error)
      ? String(error.response?.data || "Request failed").trim()
      : "Unexpected error";
      
      console.log("Error generating video:", message)
      toast({
        variant: "destructive",
        title: "Generation Error",
        description: message
      })
      resetUpload();
    }
  }

  if (uploadState === "complete" && videoUrl) {
    return (
      <Card className="glass-card rounded-2xl overflow-hidden border border-border">
        <div className="aspect-video w-full bg-black border-b border-border relative group">
          <video controls className="h-full w-full object-cover">
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Play className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-lg font-medium text-white">Video Ready!</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your PDF has been successfully converted into an interactive video explanation.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Button onClick={resetUpload} className="flex-1 bg-primary hover:bg-white text-primary-foreground rounded-lg h-11 transition-all duration-300">
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
      <Card className="glass-card p-8 rounded-2xl">
        <div className="flex flex-col items-center justify-center space-y-8 py-12">
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-4 border-primary/10" />
            <div
              className="absolute inset-0 h-24 w-24 rounded-full border-4 border-primary border-t-transparent animate-spin"
              style={{ animationDuration: "1.2s" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-pulse" />
            </div>
          </div>

          <div className="text-center space-y-3">
            <h3 className="text-xl font-medium text-white">{headline}</h3>
            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">{subtext}</p>
          </div>

          <div className="w-full max-w-xl space-y-6">
            <div className="rounded-xl border border-border bg-white/[0.02] p-5 space-y-3">
              <div className="flex items-center justify-between eyebrow text-white">
                <span>PDF Upload</span>
                <span className="text-primary">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right mt-1">
                {isUploadComplete ? "Upload complete" : "Uploading file..."}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white/[0.02] p-5 space-y-3">
              <div className="flex items-center justify-between eyebrow text-white">
                <span>Video Generation</span>
                <span className="text-primary">
                  {generationStage === "idle" && "Waiting"}
                  {generationStage !== "idle" && generationProgress > 0 && `${Math.round(generationProgress)}%`}
                  {generationStage !== "idle" && generationProgress === 0 && "Starting..."}
                </span>
              </div>
              {generationStage === "idle" && (
                <p className="text-xs text-muted-foreground">Waiting for upload to finish...</p>
              )}
              {generationStage === "queued" && (
                <>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-primary/40 animate-pulse rounded-full" />
                  </div>
                  <p className="text-xs text-muted-foreground text-right mt-1">Queued – waiting for worker</p>
                </>
              )}
              {generationStage === "generating" && (
                <>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-right mt-1">{Math.round(generationProgress)}% complete</p>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  const openFilePicker = () => document.getElementById("file-input")?.click()

  return (
    <div className="window-chrome rounded-[28px] p-3 pt-2">
      {/* Title bar */}
      <div className="flex items-center justify-between px-3 h-7">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-black/20" />
          <span className="h-2 w-2 rounded-full bg-black/20" />
        </div>
        <span className="eyebrow text-black/25 text-[9px]">probso</span>
      </div>

      {/* Screen */}
      <div
        role="button"
        tabIndex={0}
        onClick={openFilePicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            openFilePicker()
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`group aspect-[16/10] w-full cursor-pointer rounded-[20px] border-2 border-dashed bg-black outline-none transition-colors duration-300 ${
          isDragging ? "border-primary bg-primary/5" : "border-white/15 hover:border-white/30"
        } focus-visible:border-primary`}
      >
        <div className="flex h-full flex-col items-center justify-center gap-5 px-8 text-center">
          <div className="relative h-[70px] w-[56px] rounded-md bg-gradient-to-b from-[#2a2a30] to-[#141418] border border-white/10 transition-transform duration-300 group-hover:-translate-y-1">
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-7 space-y-1.5">
              <div className="h-px w-full bg-white/35" />
              <div className="h-px w-3/4 bg-white/25" />
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xl font-medium text-white">Drop a PDF here</p>
            <p className="text-sm text-muted-foreground">or click to browse · up to 100 MB</p>
          </div>
        </div>
      </div>

      {/* Kept outside the clickable screen so the synthetic click does not bubble back into it */}
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
  )
}
