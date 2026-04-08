import DOMPurify from 'dompurify'

export function sanitize(dirty: string | null | undefined): string {
  return DOMPurify.sanitize(dirty ?? '')
}
