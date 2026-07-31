"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function HeroDropzone() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)

  const goToUpload = () => router.push("/sign-up")

  return (
    <div className="w-full max-w-[560px] mx-auto">
      {/* Lavender window chrome */}
      <div className="window-chrome rounded-[28px] p-3 pt-2 shadow-[0_0_80px_-20px_rgba(199,196,247,0.35)]">
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
          onClick={goToUpload}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              goToUpload()
            }
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            goToUpload()
          }}
          className={`group aspect-[4/3] w-full cursor-pointer rounded-[20px] border-2 border-dashed bg-black transition-colors duration-300 outline-none ${
            isDragging ? "border-primary bg-primary/5" : "border-white/15 hover:border-white/30"
          } focus-visible:border-primary`}
        >
          <div className="flex h-full flex-col items-center justify-center gap-5 px-8 text-center">
            {/* Document glyph */}
            <div className="relative h-[70px] w-[56px] rounded-md bg-gradient-to-b from-[#2a2a30] to-[#141418] border border-white/10 shadow-lg transition-transform duration-300 group-hover:-translate-y-1">
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
      </div>
    </div>
  )
}

export default HeroDropzone
