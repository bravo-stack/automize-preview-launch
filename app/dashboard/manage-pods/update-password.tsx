'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { setUserPassword } from '@/lib/actions/db'
import { generateRandomString } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

export default function UpdatePassword({
  userId,
  podName,
}: {
  userId: string | null
  podName: string | null
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  console.log(userId, podName)

  const email = useMemo(() => {
    if (!podName) return ''
    return `${podName}@automize.com`
  }, [podName])

  const resetState = () => {
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setIsSaving(false)
  }

  const handleClose = () => {
    setIsOpen(false)
    resetState()
  }

  const handleGenerate = () => {
    const next = generateRandomString(14)
    setPassword(next)
    setConfirmPassword(next)
  }

  const handleCopy = async () => {
    if (!email || !password) return
    try {
      await navigator.clipboard.writeText(
        `Email: ${email}, Pass: ${password}, Sign-in: https://automize.vercel.app/login`,
      )
      toast.success('Copied to clipboard')
    } catch (err) {
      console.error('Failed to copy credentials:', err)
      toast.error('Failed to copy')
    }
  }

  const handleSave = async () => {
    if (!userId) {
      toast.error('Missing user id for this pod account')
      return
    }

    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsSaving(true)
    try {
      const { error, message } = await setUserPassword(userId, password)
      if (error) {
        toast.error(message || 'Error updating password')
        setIsSaving(false)
        return
      }

      toast.success('Password updated')
      handleClose()
      router.refresh()
    } catch (err) {
      console.error('Error updating password:', err)
      toast.error('Error updating password')
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) resetState()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2">
          Password
        </Button>
      </DialogTrigger>

      <DialogContent className="text-left">
        <DialogHeader>
          <DialogTitle>Update password</DialogTitle>
          <DialogDescription>
            {podName || 'Pod'} — {email}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`new-password-${userId || 'unknown'}`}>
              New password
            </Label>
            <Input
              id={`new-password-${userId || 'unknown'}`}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              disabled={isSaving}
              autoComplete="new-password"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`confirm-password-${userId || 'unknown'}`}>
              Confirm password
            </Label>
            <Input
              id={`confirm-password-${userId || 'unknown'}`}
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              disabled={isSaving}
              autoComplete="new-password"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                disabled={isSaving}
                className="h-4 w-4 rounded border-input bg-background"
              />
              Show password
            </label>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={isSaving}
              >
                Generate
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={isSaving || !password || !email}
              >
                Copy
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !password || !confirmPassword}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
