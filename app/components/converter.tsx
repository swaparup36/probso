"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { PDFUploadSection } from "@/components/pdf-upload-section"
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";


export default function Converter() {
  const { getToken } = useAuth();
  const [outputVidUrl, setOutputVidUrl] = useState<null | string>(null);

  const params = useParams();
  const conversionId = params.conversionId as string;


  async function fetchConversionDetails(conversionId: string) {
    try {
      const token = await getToken();

      if (!token) {
        console.log("No token found");
        return;
      }
      const conversionDetailsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/conversion/${conversionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (conversionDetailsResponse.status !== 200) {
        console.log("Failed to fetch recent conversions");
        return;
      }

      const conversionsData = conversionDetailsResponse.data;
      console.log("conversion details: ", conversionsData);
      setOutputVidUrl(conversionsData.job.Output_url);
    } catch (error) {
      console.log("Error fetching conversion details: ", error)
      // alert("Failed to fetch the conversion details")
      // window.location.href = "/";
    }
  }

  useEffect(() => {
    if (conversionId) {
      fetchConversionDetails(conversionId);
    }
  }, [conversionId]);

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main content */}
      <main className="flex-1 lg:ml-64 relative z-10">
        <div className="container max-w-4xl mx-auto px-6 py-12 lg:py-16">
          <div className="mb-10 space-y-5">
            <div className="eyebrow flex items-center gap-2.5 text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-slow" />
              PDF → Narrated Video
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-medium text-balance">
              <span className="text-white">Transform PDFs into </span>
              <span className="text-primary">video lessons.</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-2xl text-pretty leading-relaxed font-light">
              Upload any PDF textbook or document, and our AI will create an engaging video explanation to help you
              learn faster and retain more.
            </p>
          </div>

          <PDFUploadSection outputVidUrl={outputVidUrl} setOutputVidUrl={setOutputVidUrl}  />
        </div>
      </main>
    </div>
  )
}
