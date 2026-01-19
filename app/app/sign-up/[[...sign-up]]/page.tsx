"use client"

import { Logo } from "@/components/logo"
import { SignUp  } from '@clerk/nextjs'

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-accent/20 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="flex justify-center items-center">
          <SignUp />
        </div>
      </div>
    </div>
  )
}
