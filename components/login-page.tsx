"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authService } from "@/lib/auth-service"
import { logger } from "@/lib/logger"

interface LoginPageProps {
  onLoginSuccess: (user: { id: string; email: string; full_name: string }) => void
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (isRegistering) {
        logger.info("Attempting registration", { email: formData.email })
        const result = await authService.createUser({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
        })

        if (result.success && result.user) {
          logger.info("Registration successful", { userId: result.user.id, email: result.user.email })
          onLoginSuccess({ id: result.user.id, email: result.user.email, full_name: result.user.full_name })
        } else {
          setError(result.message || "Registration failed")
          logger.error("Registration failed", { email: formData.email, error: result.message })
        }
      } else {
        logger.info("Attempting login", { email: formData.email })
        const result = await authService.login({ email: formData.email, password: formData.password })

        if (result.success && result.user) {
          logger.info("Login successful", { userId: result.user.id, email: result.user.email })
          onLoginSuccess({ id: result.user.id, email: result.user.email, full_name: result.user.full_name })
        } else {
          setError(result.message || "Login failed")
          logger.error("Login failed", { email: formData.email, error: result.message })
        }
      }
    } catch (error) {
      setError("An error occurred during authentication")
      logger.error("Authentication error", { error: error instanceof Error ? error.message : String(error) })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Agent Dashboard
          </CardTitle>
          <CardDescription>
            {isRegistering ? "Create an account to manage your AI agents" : "Sign in to manage your AI agents"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading 
                ? (isRegistering ? "Creating account..." : "Signing in...") 
                : (isRegistering ? "Create Account" : "Sign In")
              }
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering)
                  setError("")
                  setFormData({ email: "", password: "", full_name: "" })
                }}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {isRegistering ? "Already have an account? Sign in" : "Don't have an account? Create one"}
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Test credentials:</p>
            <p className="text-xs text-slate-500">Email: user@example.com</p>
            <p className="text-xs text-slate-500">Password: 123456</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
