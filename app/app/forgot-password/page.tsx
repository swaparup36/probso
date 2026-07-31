"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSignIn } from "@clerk/nextjs"
import { isClerkAPIResponseError } from "@clerk/nextjs/errors"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Step = "request" | "reset"

const inputClass =
  "h-11 bg-input border-border text-white placeholder:text-muted-foreground rounded-lg px-4 focus-visible:ring-primary"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isLoaded, signIn, setActive } = useSignIn()

  const [step, setStep] = useState<Step>("request")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsSecondFactor, setNeedsSecondFactor] = useState(false)

  const readError = (err: unknown) =>
    isClerkAPIResponseError(err)
      ? err.errors[0]?.longMessage ?? err.errors[0]?.message ?? "Something went wrong."
      : "Something went wrong. Please try again."

  const sendResetCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    setIsLoading(true)
    setError(null)

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      })
      setStep("reset")
      toast({
        title: "Code sent",
        description: `We emailed a reset code to ${email}.`,
      })
    } catch (err) {
      console.log("Error requesting password reset: ", err)
      setError(readError(err))
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      })

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        toast({
          title: "Password updated",
          description: "You're signed in with your new password.",
        })
        router.push("/")
        return
      }

      if (result.status === "needs_second_factor") {
        setNeedsSecondFactor(true)
        return
      }

      setError("Could not complete the reset. Please start over.")
    } catch (err) {
      console.log("Error resetting password: ", err)
      setError(readError(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <Logo />
        </div>

        <Card className="glass-card">
          <CardHeader className="space-y-2">
            <p className="eyebrow text-primary text-center">Account recovery</p>
            <CardTitle className="font-display text-2xl font-medium text-center text-white">
              Reset your password
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              {step === "request"
                ? "Enter your email and we'll send you a reset code"
                : `Enter the code we sent to ${email} and choose a new password`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {needsSecondFactor ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 text-center">
                  <p className="text-sm text-white">
                    Your account uses two-factor authentication. Please finish signing in to complete
                    the reset.
                  </p>
                </div>
                <Button asChild className="w-full h-11" variant="outline">
                  <Link href="/sign-in">Continue to sign in</Link>
                </Button>
              </div>
            ) : step === "request" ? (
              <form onSubmit={sendResetCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className={inputClass}
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-white text-primary-foreground"
                  disabled={isLoading || !isLoaded}
                >
                  {isLoading ? "Sending..." : "Send reset code"}
                </Button>
                <Button asChild className="w-full h-11" variant="ghost">
                  <Link href="/sign-in">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to sign in
                  </Link>
                </Button>
              </form>
            ) : (
              <form onSubmit={resetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-white">
                    Reset code
                  </Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    autoComplete="one-time-code"
                    className={`${inputClass} font-mono tracking-[0.3em]`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    New password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-white text-primary-foreground"
                  disabled={isLoading || !isLoaded}
                >
                  {isLoading ? "Resetting..." : "Reset password"}
                </Button>
                <Button
                  type="button"
                  className="w-full h-11"
                  variant="ghost"
                  disabled={isLoading}
                  onClick={() => {
                    setStep("request")
                    setCode("")
                    setPassword("")
                    setError(null)
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Use a different email
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
