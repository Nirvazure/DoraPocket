export function safeAuthReturnPath(value: string | null | undefined): string {
  const path = value?.trim()
  if (
    !path ||
    !path.startsWith('/') ||
    path.startsWith('//') ||
    /[\\\u0000-\u001f\u007f]/.test(path)
  ) {
    return '/analyse'
  }
  return path
}
