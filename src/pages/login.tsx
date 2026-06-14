import { useState, type FormEvent } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  ArrowRightIcon,
  EyeIcon,
  EyeOffIcon,
  GemIcon,
  Loader2,
  LockIcon,
  MailIcon,
} from "lucide-react"

import { config } from "@/constants/config"
import { apiErrorMessage } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? "/"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, "Login failed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-sidebar p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <GemIcon className="size-6" />
          </div>
          <h1 className="text-xl font-semibold text-card-foreground">
            Admin Portal
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-xs">
              Email
            </Label>
            <div className="relative">
              <MailIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@moonlightblue.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 pl-9"
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password" className="text-xs">
              Password
            </Label>
            <div className="relative">
              <LockIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 px-9"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOffIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="mt-2 h-11 w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                Sign in
                <ArrowRightIcon className="size-4" />
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Staff access only.
          </p>
        </form>
      </div>

      <p className="text-xs text-sidebar-foreground/60">
        Powered by {config.brand.name}
      </p>
    </div>
  )
}
