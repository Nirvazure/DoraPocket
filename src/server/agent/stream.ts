export function chunkResponseText(text: string, chunkSize = 24): string[] {
  return text.match(new RegExp(`.{1,${chunkSize}}`, 'g')) ?? []
}
