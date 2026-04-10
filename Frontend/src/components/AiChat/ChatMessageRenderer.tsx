import { Link } from 'react-router-dom'

interface RecordReference {
  type: string
  id: number
  label: string
  route: string
}

interface ChatMessageRendererProps {
  text: string
  references: RecordReference[]
}

// Splits the answer on [[type:id]] tags and renders them as React Router links.
// Newlines in the text are rendered as <br> so numbered lists display correctly.
export function ChatMessageRenderer({ text, references }: ChatMessageRendererProps) {
  const refMap = new Map(references.map((r) => [`${r.type}:${r.id}`, r]))

  // First split on newlines, then split each line on [[type:id]] tags.
  const lines = text.split('\n')

  return (
    <span>
      {lines.map((line, lineIdx) => {
        const parts = line.split(/(\[\[\w+:\d+\]\])/g)
        return (
          <span key={lineIdx}>
            {lineIdx > 0 && <br />}
            {parts.map((part, partIdx) => {
              const match = part.match(/^\[\[(\w+):(\d+)\]\]$/)
              if (match) {
                const key = `${match[1]}:${match[2]}`
                const ref = refMap.get(key)
                if (ref) {
                  return (
                    <Link
                      key={partIdx}
                      to={ref.route}
                      className="font-medium text-primary underline underline-offset-2 hover:no-underline"
                    >
                      {ref.label}
                    </Link>
                  )
                }
                return null
              }
              return <span key={partIdx}>{part}</span>
            })}
          </span>
        )
      })}
    </span>
  )
}
