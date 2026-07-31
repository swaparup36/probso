"use client"

import { Logo } from "@/components/logo"
import { SignUp } from '@clerk/nextjs'
import { clerkAppearance } from "@/lib/clerk-appearance"

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <Logo />
        </div>

        <div className="flex justify-center items-center">
          <SignUp appearance={clerkAppearance} />
        </div>
      </div>
    </div>
  )
}
