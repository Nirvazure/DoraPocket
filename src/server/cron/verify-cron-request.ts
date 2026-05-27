export function verifyCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false

  const authorization = request.headers.get('authorization')?.trim()
  return authorization === `Bearer ${secret}`
}
