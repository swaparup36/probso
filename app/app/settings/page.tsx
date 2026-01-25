"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import axios from "axios"
import { useAuth, useUser } from "@clerk/nextjs"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
	Activity,
	CalendarClock,
	CheckCircle2,
	CreditCard,
	KeyRound,
	Mail,
	RefreshCcw,
	ShieldCheck,
	ShieldOff,
	Sparkles,
	User as UserIcon,
} from "lucide-react"
import { getDodoPlanDetails } from "@/utils/subscriptionHandler"

const statusClassMap: Record<string, string> = {
	active: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30",
	trialing: "bg-cyan-500/15 text-cyan-200 border border-cyan-500/30",
	canceled: "bg-rose-500/15 text-rose-200 border border-rose-500/30",
	failed: "bg-amber-500/15 text-amber-200 border border-amber-500/30",
	paused: "bg-slate-500/20 text-slate-200 border border-slate-500/40",
}

function formatStatus(label?: string) {
	if (!label) {
		return "Not subscribed"
	}
	return label
		.toLowerCase()
		.split("_")
		.map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
		.join(" ")
}

function normalizeSubscription(payload: any): SubscriptionRecord | null {
	if (!payload) return null
	if (payload.UserSubscription) return payload.UserSubscription as SubscriptionRecord
	return null
}

function normalizeTokenBalance(payload: any): TokenBalanceRecord | null {
	if (!payload) return null
	if (payload.userTokenBalance) return payload.userTokenBalance as TokenBalanceRecord
	if (typeof payload.Balance === "number") return payload as TokenBalanceRecord
	return null
}

function normalizeRole(payload: any): string {
	if (!payload) return "user"
	if (payload.userRole?.Role) return payload.userRole.Role as string
	if (payload.Role) return payload.Role as string
	return "user"
}

function formatPlanPrice(value?: number | string | null) {
	if (typeof value === "number") {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 2,
		}).format(value / 100)
	}
	if (typeof value === "string" && value.trim().length > 0) {
		return value
	}
	return "Custom billing"
}

function SettingsSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-28 w-full bg-white/5" />
			<div className="grid gap-4 md:grid-cols-3">
				<Skeleton className="h-32 bg-white/5" />
				<Skeleton className="h-32 bg-white/5" />
				<Skeleton className="h-32 bg-white/5" />
			</div>
			<div className="grid gap-6 lg:grid-cols-2">
				<Skeleton className="h-80 bg-white/5" />
				<Skeleton className="h-80 bg-white/5" />
			</div>
			<Skeleton className="h-72 bg-white/5" />
		</div>
	)
}

export default function SettingsPage() {
	const { user, isLoaded } = useUser();
	const { getToken } = useAuth();
	const { toast } = useToast()
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null)
	const [planMeta, setPlanMeta] = useState<PlanMeta | null>(null)
	const [tokenBalance, setTokenBalance] = useState<TokenBalanceRecord | null>(null)
	const [userRole, setUserRole] = useState<string>("user")
	const [lastSynced, setLastSynced] = useState<Date | null>(null)
	const [isCancelling, setIsCancelling] = useState(false)
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

	const loadAccountSnapshot = useCallback(
		async (signal?: AbortSignal) => {
			if (!user?.id) {
				return
			}

			const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
			if (!baseUrl) {
				setError("API base URL is not configured.")
				setIsLoading(false)
				return
			}

			setIsLoading(true)
			setError(null)

			const safeGet = async (path: string) => {
				try {
					const response = await axios.get(`${baseUrl}${path}`, { signal })
					return response.data
				} catch (err) {
					if (axios.isAxiosError(err) && err.response?.status === 404) {
						return null
					}
					throw err
				}
			}

			try {
				const [subscriptionPayload, rolePayload, tokenPayload] = await Promise.all([
					safeGet(`/subscription/${user.id}`),
					safeGet(`/user-role/${user.id}`),
					safeGet(`/user-token-balance/${user.id}`),
				])

				if (signal?.aborted) {
					return
				}

				const normalizedSubscription = normalizeSubscription(subscriptionPayload)
				setSubscription(normalizedSubscription)

				if (normalizedSubscription?.PlanId) {
					try {
						const details = await getDodoPlanDetails(normalizedSubscription.PlanId)
                        if (!details) {
                            toast({
                              variant: "destructive",
                              title: "Error",
                              description: "Plan details not found"
                            })
                            return;
                        }

						if (!signal?.aborted) {
							setPlanMeta(details)
						}
					} catch (planError) {
						console.error("Failed to fetch plan details", planError)
						if (!signal?.aborted) {
							setPlanMeta(null)
						}
					}
				} else {
					setPlanMeta(null)
				}

				setUserRole(normalizeRole(rolePayload))
				setTokenBalance(normalizeTokenBalance(tokenPayload))
				setLastSynced(new Date())
			} catch (fetchError) {
				if (axios.isAxiosError(fetchError) && fetchError.code === "ERR_CANCELED") {
					return
				}

				if (!signal?.aborted) {
					console.error("Failed to load settings", fetchError)
					setError("We couldn’t load your account data. Please try refreshing.")
				}
			} finally {
				if (!signal?.aborted) {
					setIsLoading(false)
				}
			}
		},
		[user?.id],
	)

	useEffect(() => {
		if (!isLoaded || !user?.id) {
			return
		}

		const controller = new AbortController()
		loadAccountSnapshot(controller.signal)

		return () => controller.abort()
	}, [isLoaded, user?.id, loadAccountSnapshot])

	const planPriceLabel = useMemo(() => formatPlanPrice(planMeta?.price ?? null), [planMeta?.price])
	const memberSince = useMemo(() => {
		if (!user?.createdAt) return null
		return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(
			new Date(user.createdAt),
		)
	}, [user?.createdAt])
	const statusKey = subscription?.Status?.toLowerCase() ?? ""
	const statusBadgeClass = statusClassMap[statusKey] ?? "bg-slate-500/20 text-slate-200 border border-slate-500/30"

	const starterName = process.env.NEXT_PUBLIC_DODO_STARTER_PLAN_NAME ?? "Starter Plan"
	const creatorName = process.env.NEXT_PUBLIC_DODO_CREATOR_PLAN_NAME ?? "Creator Plan"

	const planHighlights = useMemo(() => {
		if (!planMeta?.name) {
			return ["Access to the PDF to video pipeline", "Standard processing queue", "Community support"]
		}

		if (planMeta.name === starterName) {
			return ["Up to 10 PDF pages per conversion", "Standard rendering priority", "Email support"]
		}

		if (planMeta.name === creatorName) {
			return ["Up to 20 PDF pages per conversion", "Priority rendering queue", "Premium support response"]
		}

		return ["Custom rendering allowances", "Dedicated success manager", "Tailored onboarding"]
	}, [planMeta?.name, starterName, creatorName])

	const handleCancelSubscription = async () => {
		if (!user?.id || !subscription) {
			return
		}

		const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
		if (!baseUrl) {
			toast({ title: "Missing configuration", description: "API base URL is not configured." })
			return
		}

		setIsCancelling(true)
		try {
			const token = await getToken();
			await axios.patch(
				`${baseUrl}/cancel-subscription/${user.id}`, 
				{
					subscriptionId: subscription.SubscriptionId,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				}
			);
			toast({
				title: "Subscription cancelled",
				description: "Your plan will remain active until the current billing cycle ends.",
			})
			setCancelDialogOpen(false)
			await loadAccountSnapshot()
		} catch (cancelError) {
			console.error("Failed to cancel subscription", cancelError)
			toast({
				title: "Unable to cancel",
				description: "Please try again or contact support if the issue persists.",
			})
		} finally {
			setIsCancelling(false)
		}
	}

	const handleManualRefresh = () => {
		if (!user?.id) return
		loadAccountSnapshot()
	}

	const emailAddress = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? "—"
	const tokensOnHold = tokenBalance?.Onhold ?? 0
	const tokenUpdatedAt = tokenBalance?.UpdatedAt
		? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(tokenBalance.UpdatedAt))
		: "Never"

	const shouldShowSkeleton = (!isLoaded || isLoading) && !lastSynced && !error

	return (
		<div className="flex min-h-screen bg-[#05050d] text-white">
			<AppSidebar />
			<main className="flex-1 lg:ml-64 bg-gradient-to-b from-[#0a0a1a] via-[#0d0d1f] to-[#05050d]">
				<div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div>
							<p className="text-xs uppercase tracking-[0.3em] text-white/60">Account Center</p>
							<h1 className="text-3xl font-semibold text-[#E5E5FE]">Settings & Billing</h1>
							<p className="text-sm text-[#B0B3F3]">
								Review your profile, monitor usage, and keep your subscription up to date.
							</p>
						</div>
						<div className="flex flex-wrap items-center gap-3">
							{lastSynced && (
								<Badge className="bg-white/10 text-white border-white/20">
									Synced {new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "numeric" }).format(lastSynced)}
								</Badge>
							)}
							<Button
								variant="outline"
								className="border-white/30 bg-white/10 text-white hover:bg-white/20"
								onClick={handleManualRefresh}
								disabled={isLoading}
							>
								<RefreshCcw className="h-4 w-4" /> Refresh
							</Button>
						</div>
					</div>

					{shouldShowSkeleton && <SettingsSkeleton />}

					{!shouldShowSkeleton && !user && (
						<Card className="border border-white/10 bg-white/5">
							<CardHeader>
								<CardTitle>Sign-in required</CardTitle>
								<CardDescription>Access account settings by signing into your workspace.</CardDescription>
							</CardHeader>
							<CardContent>
								<Button asChild className="rounded-full bg-[#7c7dda] hover:bg-[#6a70de]">
									<Link href="/sign-in">Go to sign in</Link>
								</Button>
							</CardContent>
						</Card>
					)}

					{error && (
						<Card className="border border-rose-500/40 bg-rose-500/10">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-rose-100">
									<ShieldOff className="h-5 w-5" /> Unable to load settings
								</CardTitle>
								<CardDescription className="text-rose-100/80">{error}</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-wrap gap-3">
								<Button variant="outline" className="border-white/40 text-white" onClick={handleManualRefresh}>
									Retry
								</Button>
								<Button asChild variant="ghost" className="text-white">
									<Link href="mailto:support@pdf2video.ai?subject=Account%20Support">Contact support</Link>
								</Button>
							</CardContent>
						</Card>
					)}

					{!shouldShowSkeleton && user && !error && (
						<div className="space-y-8">
							<div className="grid gap-4 md:grid-cols-3">
								<Card className="border border-white/10 bg-white/5">
									<CardHeader className="flex flex-row items-center justify-between space-y-0">
										<div>
											<CardDescription className="text-white/70">Plan</CardDescription>
											<CardTitle className="text-xl text-[#E5E5FE]">{planMeta?.name ?? "No plan"}</CardTitle>
										</div>
										<Sparkles className="h-5 w-5 text-[#B0B3F3]" />
									</CardHeader>
									<CardContent>
										<p className="text-sm text-[#B0B3F3]">{planPriceLabel}</p>
									</CardContent>
								</Card>
								<Card className="border border-white/10 bg-white/5">
									<CardHeader className="flex flex-row items-center justify-between space-y-0">
										<div>
											<CardDescription className="text-white/70">Status</CardDescription>
											<CardTitle className="text-xl text-[#E5E5FE]">{formatStatus(subscription?.Status)}</CardTitle>
										</div>
										<CheckCircle2 className="h-5 w-5 text-[#B0B3F3]" />
									</CardHeader>
									<CardContent>
										<Badge className={statusBadgeClass}>{formatStatus(subscription?.Status)}</Badge>
									</CardContent>
								</Card>
								<Card className="border border-white/10 bg-white/5">
									<CardHeader className="flex flex-row items-center justify-between space-y-0">
										<div>
											<CardDescription className="text-white/70">Tokens</CardDescription>
											<CardTitle className="text-xl text-[#E5E5FE]">
												{(tokenBalance?.Balance ?? 0).toLocaleString("en-US")}
											</CardTitle>
										</div>
										<Activity className="h-5 w-5 text-[#B0B3F3]" />
									</CardHeader>
									<CardContent>
										<p className="text-sm text-[#B0B3F3]">{tokensOnHold} on hold</p>
									</CardContent>
								</Card>
							</div>

							<div className="grid gap-6 lg:grid-cols-2">
								<Card className="border border-white/10 bg-white/5">
									<CardHeader>
										<CardTitle className="flex items-center gap-2 text-[#E5E5FE]">
											<ShieldCheck className="h-5 w-5" /> Account information
										</CardTitle>
										<CardDescription className="text-[#B0B3F3]">
											Pulled from your Clerk profile and internal role records.
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid gap-4 sm:grid-cols-2">
											<div>
												<p className="text-xs uppercase tracking-wide text-white/60">Full name</p>
												<p className="text-lg font-medium text-white">{user.fullName ?? "—"}</p>
											</div>
											<div>
												<p className="text-xs uppercase tracking-wide text-white/60">Email</p>
												<div className="flex items-center gap-2 text-white">
													<Mail className="h-4 w-4 text-[#B0B3F3]" />
													<span className="truncate text-sm">{emailAddress}</span>
												</div>
											</div>
											<div>
												<p className="text-xs uppercase tracking-wide text-white/60">User ID</p>
												<div className="flex items-center gap-2 text-white">
													<KeyRound className="h-4 w-4 text-[#B0B3F3]" />
													<span className="text-sm">{user.id}</span>
												</div>
											</div>
											<div>
												<p className="text-xs uppercase tracking-wide text-white/60">Member since</p>
												<div className="flex items-center gap-2 text-white">
													<UserIcon className="h-4 w-4 text-[#B0B3F3]" />
													<span className="text-sm">{memberSince ?? "—"}</span>
												</div>
											</div>
										</div>
										<div className="flex flex-wrap items-center gap-3">
											<Badge className="bg-[#7c7dda]/30 text-[#E5E5FE] border-[#7c7dda]/60">Role: {userRole}</Badge>
											<Badge className="bg-white/10 text-white border-white/20">Clerk synced</Badge>
										</div>
									</CardContent>
								</Card>

								<Card className="border border-white/10 bg-white/5">
									<CardHeader>
										<CardTitle className="flex items-center gap-2 text-[#E5E5FE]">
											<Activity className="h-5 w-5" /> Token usage
										</CardTitle>
										<CardDescription className="text-[#B0B3F3]">
											Tokens are consumed every time you convert a PDF into a video lesson.
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="rounded-2xl bg-black/20 p-4">
											<p className="text-xs uppercase tracking-wide text-white/60">Available balance</p>
											<p className="text-3xl font-semibold text-white">
												{(tokenBalance?.Balance ?? 0).toLocaleString("en-US")}
											</p>
											<p className="text-sm text-white/70">{tokensOnHold} tokens currently locked in running jobs</p>
										</div>
										<div className="grid gap-3 sm:grid-cols-2">
											<div className="rounded-xl border border-white/10 p-4">
												<p className="text-xs text-white/60">On hold</p>
												<p className="text-lg text-white">{tokensOnHold}</p>
											</div>
											<div className="rounded-xl border border-white/10 p-4">
												<p className="text-xs text-white/60">Last updated</p>
												<p className="text-lg text-white">{tokenUpdatedAt}</p>
											</div>
										</div>
										<div className="text-sm text-white/70">
											Need additional tokens? Visit the pricing page or reach out to upgrade your allowance.
										</div>
										<Button asChild variant="outline" className="w-full border-white/30 text-white">
											<Link href="/pricing">Explore plans</Link>
										</Button>
									</CardContent>
								</Card>
							</div>

							<div className="grid gap-6 lg:grid-cols-2">
								<Card className="border border-white/10 bg-white/5">
									<CardHeader>
										<CardTitle className="flex items-center gap-2 text-[#E5E5FE]">
											<CreditCard className="h-5 w-5" /> Current subscription
										</CardTitle>
										<CardDescription className="text-[#B0B3F3]">
											Synced directly from the billing service.
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-6">
										{subscription ? (
											<>
												<div className="flex flex-wrap items-center gap-3">
													<h3 className="text-2xl font-semibold text-white">{planMeta?.name ?? subscription.PlanId}</h3>
													<Badge className={statusBadgeClass}>{formatStatus(subscription.Status)}</Badge>
												</div>
												<p className="text-sm text-[#B0B3F3]">{planMeta?.description ?? "You’re all set for unlimited conversions within your plan limits."}</p>
												<div className="grid gap-3 sm:grid-cols-2">
													<div className="rounded-xl border border-white/10 p-4">
														<p className="text-xs text-white/60">Plan ID</p>
														<p className="text-sm text-white">{subscription.PlanId}</p>
													</div>
													<div className="rounded-xl border border-white/10 p-4">
														<p className="text-xs text-white/60">Subscription ID</p>
														<p className="text-sm text-white">{subscription.SubscriptionId}</p>
													</div>
													<div className="rounded-xl border border-white/10 p-4">
														<p className="text-xs text-white/60">Customer ID</p>
														<p className="text-sm text-white">{subscription.CustomerId}</p>
													</div>
													<div className="rounded-xl border border-white/10 p-4">
														<p className="text-xs text-white/60">Billing cadence</p>
														<p className="text-sm text-white">Monthly</p>
													</div>
												</div>
												<div className="space-y-3">
													<p className="text-xs uppercase tracking-[0.2em] text-white/60">What’s included</p>
													<ul className="space-y-2 text-sm text-white">
														{planHighlights.map((highlight) => (
															<li key={highlight} className="flex items-center gap-2">
																<CheckCircle2 className="h-4 w-4 text-[#7c7dda]" /> {highlight}
															</li>
														))}
													</ul>
												</div>
												<div className="flex flex-wrap gap-3">
													<AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
														<AlertDialogTrigger asChild>
															<Button variant="destructive" disabled={isCancelling}>
																Cancel subscription
															</Button>
														</AlertDialogTrigger>
														<AlertDialogContent className="bg-[#0d0d1f] text-white border-white/10">
															<AlertDialogHeader>
																<AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
																<AlertDialogDescription className="text-white/70">
																	You’ll keep access until the cycle ends. We’ll delete billing data once the plan lapses.
																</AlertDialogDescription>
															</AlertDialogHeader>
															<AlertDialogFooter>
																<AlertDialogCancel className="border-white/30 text-white">
																	Stay subscribed
																</AlertDialogCancel>
																<AlertDialogAction
																	className="bg-rose-600 hover:bg-rose-700"
																	onClick={handleCancelSubscription}
																	disabled={isCancelling}
																>
																	{isCancelling ? "Cancelling..." : "Confirm cancel"}
																</AlertDialogAction>
															</AlertDialogFooter>
														</AlertDialogContent>
													</AlertDialog>
													<Button asChild variant="outline" className="border-white/30 text-white">
														<Link href="/pricing">Change plan</Link>
													</Button>
												</div>
											</>
										) : (
											<div className="rounded-2xl border border-dashed border-white/20 p-6 text-center text-white/80">
												<p className="text-lg font-semibold">No active subscription</p>
												<p className="text-sm text-white/70 mt-2">
													Upgrade to unlock more conversions, longer PDFs, and faster processing slots.
												</p>
												<Button asChild className="mt-4 rounded-full bg-[#7c7dda] hover:bg-[#6a70de]">
													<Link href="/pricing">Browse plans</Link>
												</Button>
											</div>
										)}
									</CardContent>
								</Card>

								<Card className="border border-white/10 bg-white/5">
									<CardHeader>
										<CardTitle className="flex items-center gap-2 text-[#E5E5FE]">
											<CalendarClock className="h-5 w-5" /> Support & receipts
										</CardTitle>
										<CardDescription className="text-[#B0B3F3]">
											Need help with billing or compliance? We’re one click away.
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="rounded-xl border border-white/10 p-4">
											<p className="text-sm text-white/80">Email our billing desk for invoices, refunds, or VAT-ready receipts.</p>
											<Button asChild variant="outline" className="mt-4 border-white/30 text-white w-full">
												<Link href="mailto:billing@pdf2video.ai?subject=Billing%20support">Email billing</Link>
											</Button>
										</div>
										<div className="rounded-xl border border-white/10 p-4">
											<p className="text-sm text-white/80">Need to talk live? Schedule a quick session with success engineering.</p>
											<Button asChild className="mt-4 w-full rounded-full bg-[#7c7dda] hover:bg-[#6a70de]">
												<Link href="https://cal.com/pdf2video/success" target="_blank" rel="noreferrer noopener">
													Schedule a call
												</Link>
											</Button>
										</div>
									</CardContent>
								</Card>
							</div>
						</div>
					)}
				</div>
			</main>
		</div>
	)
}
