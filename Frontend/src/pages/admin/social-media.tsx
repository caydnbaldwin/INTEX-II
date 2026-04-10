import { useEffect, useState } from 'react'
import {
  Loader2,
  Brain,
  Copy,
  Check,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { usePageTitle } from '@/hooks/usePageTitle'

// ── Types ────────────────────────────────────────────────────────────────────

interface Strategy {
  primary_platform: string
  post_type: string
  best_day: string
  best_time: string
  best_time_per_platform?: Record<string, string>
  content_topic: string
  tone: string
  boost_lift_pct?: number
}

interface Recommendations {
  money_strategy: Strategy
}

interface PipelineResult {
  pipelineResultId: number
  detailsJson?: string
}

// ── Fallback ─────────────────────────────────────────────────────────────────

const FALLBACK: Recommendations = {
  money_strategy: {
    primary_platform: 'WhatsApp',
    post_type: 'ImpactStory',
    best_day: 'Tuesday',
    best_time: '10:00',
    best_time_per_platform: {
      Facebook: '15:00', Instagram: '13:00', LinkedIn: '10:00',
      TikTok: '23:00', Twitter: '08:00', WhatsApp: '10:00', YouTube: '17:00',
    },
    content_topic: 'Health',
    tone: 'Urgent',
    boost_lift_pct: 107.3,
  },
}

// ── Filming instructions keyed by content_topic ──────────────────────────────

const FILMING_GUIDE: Record<string, { scenes: string[]; tips: string[] }> = {
  Health: {
    scenes: [
      'Open with a close-up of the safehouse entrance or clinic area (3 sec)',
      'Show a staff member preparing for a health check-in — no resident faces (5 sec)',
      'Cut to a calm, well-lit shot of the care space (beds, supplies, posters) (5 sec)',
      'End with a staff member speaking directly to camera about what donations fund (15 sec)',
    ],
    tips: [
      'Never show a resident\u2019s face — film hands, silhouettes, or over-the-shoulder',
      'Use natural light from windows when possible',
      'Keep the camera steady — prop your phone against something solid',
    ],
  },
  SafehouseLife: {
    scenes: [
      'Open with a wide shot of the safehouse common area in the morning (3 sec)',
      'Show daily routines — meals being prepared, books on a desk, shoes by the door (8 sec)',
      'Cut to a staff member describing what a typical day looks like (15 sec)',
      'End on a quiet, warm shot — a window, a drawing on the wall, a set table (4 sec)',
    ],
    tips: [
      'Film during golden hour (early morning or late afternoon) for warmth',
      'Capture sounds — laughter, dishes, music — to make it feel real',
      'No resident faces or identifying details',
    ],
  },
  Reintegration: {
    scenes: [
      'Open with a symbolic shot — a packed bag, a pair of shoes, an open door (3 sec)',
      'Show the vocational training space or classroom (5 sec)',
      'Staff member explains what reintegration means and how donors fund it (15 sec)',
      'End with an uplifting shot — a road, a sunrise, an open gate (5 sec)',
    ],
    tips: [
      'Keep the tone hopeful and forward-looking',
      'Use slow, steady camera movements',
      'A simple voiceover from staff works better than text on screen',
    ],
  },
  DonorImpact: {
    scenes: [
      'Open with a specific item donations paid for — school supplies, medicine, food (3 sec)',
      'Show several more items or spaces funded by donors, one after another (10 sec)',
      'Staff member thanks donors and names what a specific amount covers (15 sec)',
    ],
    tips: [
      'Be specific — "₱500 paid for this" is more powerful than "your donations help"',
      'Lay items out neatly on a table for a clean visual',
    ],
  },
}

// ── Caption keyed by content_topic ───────────────────────────────────────────

const CAPTIONS: Record<string, string> = {
  Health: `When Maria arrived at Lighthouse Sanctuary, she hadn\u2019t seen a doctor in years. Today, she had her first dental appointment \u2014 and she couldn\u2019t stop smiling.\n\nYour support makes moments like this possible. A gift of \u20B1500 covers one month of health check-ins for a girl in our care.\n\nWould you give today? Reply \u201CGIVE\u201D or tap the link below. Every peso stays in the Philippines and goes directly to our girls.`,
  SafehouseLife: `Sunday mornings at the safehouse look like this: pancakes, laughter, and girls helping each other braid hair.\n\nIt sounds simple. For girls who came from survival mode, it is everything.\n\nKeep the safehouse running \u2192 [donation link]. Even a small gift matters more than you know.`,
  Reintegration: `Last month, one of our graduates moved back with her family. She packed her own bag, said her goodbyes, and walked out the door with her head up.\n\nThat\u2019s what reintegration looks like when it works. Your support funded the two years of counseling that made it possible.\n\nHelp the next girl reach that door \u2192 [donation link]`,
  DonorImpact: `A donor gave \u20B12,000 last December. Here\u2019s what that paid for: 4 weeks of counseling sessions, 2 school uniforms, and one birthday cake.\n\nYour gift has a face. It has a story. Thank you.\n\nIf you haven\u2019t given yet \u2014 now is a good time. [donation link]`,
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatLabel(str: string) {
  return str ? str.replace(/([A-Z])/g, ' $1').trim() : ''
}

function fmtTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

const DAY_MAP: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
}

function getNextDate(dayName: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = DAY_MAP[dayName] ?? 2
  let diff = target - today.getDay()
  if (diff < 0) diff += 7
  const next = new Date(today)
  next.setDate(today.getDate() + diff)
  return { date: next, isToday: diff === 0 }
}

// ── Component ────────────────────────────────────────────────────────────────

export function SocialMediaRecommendation() {
  usePageTitle('Social Media')

  const [recs, setRecs] = useState<Recommendations | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.get<PipelineResult>('/api/pipeline-results/social-media-recommendation')
      .then((r) => setRecs(r?.detailsJson ? JSON.parse(r.detailsJson) : FALLBACK))
      .catch(() => setRecs(FALLBACK))
      .finally(() => setLoading(false))
  }, [])

  function copyCaption(text: string) {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  if (!recs) return null

  const s = recs.money_strategy
  const { date, isToday } = getNextDate(s.best_day)
  const time = fmtTime(s.best_time_per_platform?.[s.primary_platform] || s.best_time)
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const filming = FILMING_GUIDE[s.content_topic] || FILMING_GUIDE.Health
  const caption = CAPTIONS[s.content_topic] || CAPTIONS.Health

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Social Media</h1>
        <Badge variant="outline" className="gap-1 text-xs">
          <Brain className="h-3 w-3" />
          ML-powered
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardDescription className="text-xs font-medium">Your Next Post</CardDescription>
          <CardTitle className="text-2xl">
            {isToday ? 'Post today' : `Post this ${s.best_day}`}
          </CardTitle>
          <p className="text-base text-muted-foreground">
            {dateStr} at <strong>{time}</strong> on <strong>{s.primary_platform}</strong>
          </p>
        </CardHeader>
        <CardContent className="space-y-8">

          {/* What to post */}
          <div>
            <h3 className="mb-2 text-base font-semibold">What to Post</h3>
            <p className="text-base leading-relaxed">
              A <strong>{formatLabel(s.post_type).toLowerCase()}</strong> about <strong>{formatLabel(s.content_topic).toLowerCase()}</strong> in
              an <strong>{s.tone.toLowerCase()}</strong> tone. Feature a resident story (anonymized) with a clear donate call-to-action.
            </p>
            {s.boost_lift_pct && (
              <p className="mt-1 text-base text-muted-foreground">
                Boost this post — boosted posts drive {s.boost_lift_pct}% more donations.
              </p>
            )}
          </div>

          {/* How to film it */}
          <div>
            <h3 className="mb-3 text-base font-semibold">How to Film It</h3>
            <ol className="space-y-3">
              {filming.scenes.map((scene, i) => (
                <li key={i} className="flex gap-3 text-base leading-relaxed">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{scene}</span>
                </li>
              ))}
            </ol>
            <ul className="mt-4 space-y-2 text-base text-muted-foreground">
              {filming.tips.map((tip, i) => (
                <li key={i}>• {tip}</li>
              ))}
            </ul>
          </div>

          {/* Caption */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold">Caption</h3>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => copyCaption(caption)}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <div className="whitespace-pre-wrap rounded-lg border bg-muted/50 p-4 text-base leading-relaxed">
              {caption}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
