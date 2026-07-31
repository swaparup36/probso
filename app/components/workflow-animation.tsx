"use client"

import { useEffect, useState } from "react"
import { FileText, Upload, Cpu, Video } from "lucide-react"

const steps = [
  { icon: FileText, label: "PDF File", sublabel: "Your document", color: "#e0defb" },
  { icon: Upload,   label: "Upload",   sublabel: "Secure transfer", color: "#c7c4f7" },
  { icon: Cpu,      label: "Probso Engine", sublabel: "AI processing", color: "#a5a1ef" },
  { icon: Video,    label: "Video",    sublabel: "Ready to watch", color: "#8481d9" },
]

export default function WorkflowAnimation() {
  const [active, setActive] = useState(0)
  const [completed, setCompleted] = useState<number[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setActive(prev => {
        const next = (prev + 1) % steps.length
        setCompleted(c => next === 0 ? [] : [...c, prev])
        return next
      })
    }, 1400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-3 select-none">
      {steps.map((step, i) => {
        const Icon = step.icon
        const isActive = active === i
        const isDone = completed.includes(i)

        return (
          <div key={i} className="flex flex-col items-center">
            {/* Node */}
            <div
              className="relative flex items-center gap-4 px-6 py-4 rounded-2xl border transition-all duration-500"
              style={{
                borderColor: isActive ? step.color : isDone ? `${step.color}55` : "rgba(255,255,255,0.1)",
                background: isActive
                  ? `${step.color}22`
                  : isDone
                  ? `${step.color}0d`
                  : "rgba(255,255,255,0.03)",
                boxShadow: isActive ? `0 0 24px ${step.color}44` : "none",
                transform: isActive ? "scale(1.04)" : "scale(1)",
                width: 260,
              }}
            >
              {/* Icon circle */}
              <div
                className="flex items-center justify-center rounded-xl w-11 h-11 shrink-0 transition-all duration-500"
                style={{
                  background: isActive ? step.color : isDone ? `${step.color}44` : "rgba(255,255,255,0.08)",
                }}
              >
                <Icon
                  size={20}
                  style={{ color: isActive ? "#fff" : isDone ? step.color : "rgba(255,255,255,0.4)" }}
                />
              </div>

              {/* Text */}
              <div>
                <p className="text-sm font-semibold leading-tight" style={{ color: isActive ? "#ffffff" : isDone ? "#8d8d97" : "rgba(255,255,255,0.45)" }}>
                  {step.label}
                </p>
                <p className="text-xs leading-tight mt-0.5" style={{ color: isActive ? "#8d8d97" : "rgba(141,141,151,0.6)" }}>
                  {step.sublabel}
                </p>
              </div>

              {/* Done checkmark */}
              {isDone && (
                <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center" style={{ background: `${step.color}33` }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke={step.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}

              {/* Active pulse dot */}
              {isActive && (
                <div className="ml-auto">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: step.color }} />
                    <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: step.color }} />
                  </span>
                </div>
              )}
            </div>

            {/* Connector arrow */}
            {i < steps.length - 1 && (
              <div className="flex flex-col items-center my-1" style={{ opacity: completed.includes(i) || isActive ? 1 : 0.25, transition: "opacity 0.4s" }}>
                <div className="w-px h-5 bg-gradient-to-b" style={{ backgroundImage: `linear-gradient(to bottom, ${step.color}88, ${steps[i+1].color}44)` }} />
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1L5 5L9 1" stroke={steps[i+1].color} strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
