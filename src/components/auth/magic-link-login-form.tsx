'use client'

import Link from 'next/link'
import { startTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

type Status = 'idle' | 'success' | 'error'

export function MagicLinkLoginForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setStatus('error')
      setMessage('请输入邮箱地址。')
      return
    }

    setPending(true)
    setStatus('idle')
    setMessage('')

    const supabase = createSupabaseBrowserClient()
    const redirectTo = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent('/analyse')}`
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: redirectTo,
      },
    })

    startTransition(() => {
      setPending(false)
      if (error) {
        setStatus('error')
        setMessage(error.message || '发送登录链接失败。')
        return
      }
      setStatus('success')
      setMessage('登录链接已发送，请前往邮箱完成登录。')
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-bold text-foreground">
            邮箱
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 rounded-2xl"
          />
        </div>
        <Button
          type="submit"
          className="h-12 rounded-full px-5 text-sm font-bold"
          disabled={pending}
        >
          {pending ? '发送中...' : '发送 Magic Link'}
        </Button>
      </form>

      {message ? (
        <p
          className={
            status === 'error'
              ? 'text-sm font-medium text-destructive'
              : 'text-sm font-medium text-emerald-700'
          }
        >
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" className="h-11 rounded-full px-5 text-sm font-bold">
          <Link href="/analyse">先匿名体验</Link>
        </Button>
      </div>
    </div>
  )
}
