"use client"

import { Logo } from "@/components/logo"
import Link from "next/link"
import { SignIn } from "@clerk/nextjs"
import { clerkAppearance } from "@/lib/clerk-appearance"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <Logo />
        </div>

        <div className="flex justify-center items-center">
          <SignIn appearance={clerkAppearance} />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Forgot your password?
          </Link>
        </p>

        <p className="fine-note mt-8 text-center text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}
