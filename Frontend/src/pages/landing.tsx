import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ChevronDown, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StoriesOfTransformationSection } from '@/components/impact/StoriesOfTransformationSection'
import { listPublicImpactJourneyStories } from '@/lib/publicResidentStories'
import { usePageTitle } from '@/hooks/usePageTitle'

export function LandingPage() {
  usePageTitle('Home')
  const API = import.meta.env.VITE_API_BASE_URL as string
  const [backendStatus, setBackendStatus] = useState('')
  const [dbStatus, setDbStatus] = useState('')
  const [isCheckingBackend, setIsCheckingBackend] = useState(false)
  const [isCheckingDb, setIsCheckingDb] = useState(false)
  async function verifyBackend() {
    setBackendStatus('Checking backend...')
    setIsCheckingBackend(true)
    try {
      const response = await fetch(`${API}/api/health`, { method: 'GET', credentials: 'include' })
      if (!response.ok) { setBackendStatus(`Backend check failed (${response.status}).`); return }
      const data = await response.json() as { message?: string }
      setBackendStatus(data.message ?? 'Backend reachable.')
    } catch {
      setBackendStatus('Unable to reach backend.')
    } finally {
      setIsCheckingBackend(false)
    }
  }

  async function verifyDatabase() {
    setDbStatus('Checking database...')
    setIsCheckingDb(true)
    try {
      const response = await fetch(`${API}/api/dbcheck`, { method: 'GET', credentials: 'include' })
      if (!response.ok) { setDbStatus(`Database check failed (${response.status}).`); return }
      const data = await response.json() as Record<string, unknown>
      setDbStatus(`Database check succeeded (${Object.keys(data).length} tables verified).`)
    } catch {
      setDbStatus('Unable to reach database check endpoint.')
    } finally {
      setIsCheckingDb(false)
    }
  }

  const scrollToContent = () => {
    document.getElementById('crisis')?.scrollIntoView({ behavior: 'smooth' })
  }

  const impactStories = listPublicImpactJourneyStories()

  return (
    <div className="flex flex-col">
      {/* ───────────────── Hero ───────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/hero-bg.jpg)' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, oklch(0.15 0.08 280 / 0.15), oklch(0.15 0.08 280 / 0.45), oklch(0.15 0.08 280 / 0.75))',
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 py-24 w-full flex justify-end">
          <div className="max-w-2xl text-right">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white leading-[1.08] whitespace-nowrap">
              Help Protect Girls<br />From Abuse
            </h1>

            <p className="mt-6 text-lg sm:text-xl leading-relaxed text-white/80 max-w-xl text-pretty ml-auto">
              Your donation funds shelter, counseling,<br />and education for children in the Philippines.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-end justify-end gap-4">
              <Button size="lg" asChild className="bg-white text-black hover:bg-white/90 font-medium rounded-full px-9 text-base">
                <Link to="/donate">
                  Donate
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <button
          onClick={scrollToContent}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/90 hover:text-white transition-colors cursor-pointer"
          aria-label="Scroll to content"
        >
          <span className="text-xs uppercase tracking-widest">See Our Impact</span>
          <ChevronDown className="h-5 w-5 animate-bounce" aria-hidden="true" />
        </button>
      </section>

      {/* ───────────────── The Crisis: 1-in-5 + COVID + Map ───────────────── */}
      <section id="crisis" className="py-20 sm:py-28 bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-14 lg:space-y-16">

          {/* Row 1: 1-in-5 graphic (left) + crisis text (right) */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <img
                src="/images/1_5GirlsGraphic.png"
                alt="1 in 5 girls in the Philippines face sexual abuse"
                className="w-full max-w-sm"
              />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-4">
                Why It Matters
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight">
                One in Five
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">1 in 5 girls</span> in the
                Philippines experience sexual abuse before turning 18 — and most have
                nowhere to go.
              </p>
              <Button asChild className="mt-8 rounded-full px-7 text-base">
                <Link to="/impact#top">
                  Our Impact
                </Link>
              </Button>
            </div>
          </div>

          {/* Row 2: COVID text + 265% stat (left) + chart (right) */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-4">
                The Pandemic Effect
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight">
                A Surge During<br />the Pandemic
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Lockdowns trapped children indoors with their abusers. Online sexual exploitation surged.
              </p>
              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-6xl font-serif font-bold text-primary">3.8x</span>
                <span className="text-lg text-muted-foreground">more cases in 2021 than 2019</span>
              </div>
            </div>

            <div>
              <CovidImpactChart />
            </div>
          </div>

          {/* Row 3: Map (left) + safe houses text (right) */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <img
                src="/images/locationsMap.png"
                alt="Map of the Philippines showing 9 Lunas safehouse locations"
                className="w-full max-w-sm rounded-2xl"
              />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-4">
                Until Now
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight">
                There Were None.<br />Now There Are Nine.
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                We built nine safe houses across the Philippines — providing shelter, counseling, and education where none existed before.
              </p>
              <Button asChild className="mt-8 rounded-full px-7 text-base">
                <Link to="/impact#impact-map">
                  See Our Locations
                </Link>
              </Button>
            </div>
          </div>

        </div>
      </section>

      <StoriesOfTransformationSection stories={impactStories} />

      {/* ───────────────── Trust Indicators ───────────────── */}
      <section className="py-12 bg-background border-t border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-muted-foreground">
            <TrustItem text="501(c)(3) Registered" />
            <span className="hidden sm:inline text-border">|</span>
            <TrustItem text="GDPR Compliant" />
            <span className="hidden sm:inline text-border">|</span>
            <TrustItem text="Transparent Reporting" />
            <span className="hidden sm:inline text-border">|</span>
            <TrustItem text="Annual Audits" />
          </div>
        </div>
      </section>

      <section className="mt-10 w-full border-y border-border bg-[#e8e2f4]">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="flex flex-col items-stretch gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
            <div className="max-w-2xl text-left">
              <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Ready to change a life?
              </h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Your gift gives a girl a safe home and a future.
              </p>
            </div>
            <div className="flex shrink-0 lg:justify-end">
              <Button asChild className="h-12 w-full rounded-full px-7 text-base sm:w-auto">
                <Link to="/donate">Donate</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── Verify Links (subtle, bottom-right) ───────────────── */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-2 flex justify-end gap-3 text-[10px] text-muted-foreground/40">
        <button
          type="button"
          onClick={verifyBackend}
          disabled={isCheckingBackend}
          className="hover:text-muted-foreground transition-colors disabled:opacity-60"
        >
          {isCheckingBackend ? 'Verifying...' : 'Verify Backend'}
        </button>
        <span>|</span>
        <button
          type="button"
          onClick={verifyDatabase}
          disabled={isCheckingDb}
          className="hover:text-muted-foreground transition-colors disabled:opacity-60"
        >
          {isCheckingDb ? 'Verifying...' : 'Verify Database'}
        </button>
        {(backendStatus || dbStatus) && (
          <span>{backendStatus && `${backendStatus}`}{backendStatus && dbStatus && ' · '}{dbStatus && `${dbStatus}`}</span>
        )}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   COVID Impact Chart — SVG bar chart (fixed axis labels)
   ────────────────────────────────────────────────────────── */
function CovidImpactChart() {
  const data = [
    { year: '2018', cases: 18, label: '~18K' },
    { year: '2019', cases: 22, label: '~22K' },
    { year: '2020', cases: 52, label: '~52K' },
    { year: '2021', cases: 83, label: '~83K' },
    { year: '2022', cases: 68, label: '~68K' },
    { year: '2023', cases: 60, label: '~60K' },
  ]
  const maxVal = 90
  const barWidth = 48
  const chartHeight = 260
  const gap = 16
  const leftPad = 50
  const totalWidth = data.length * (barWidth + gap) - gap
  const svgWidth = totalWidth + leftPad + 20
  const svgHeight = chartHeight + 60

  return (
    <div>
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-lg mx-auto"
          role="img"
          aria-label="Bar chart showing online sexual abuse cases in the Philippines from 2018 to 2023"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75].map((val) => {
            const y = chartHeight - (val / maxVal) * chartHeight + 10
            return (
              <g key={val}>
                <line
                  x1={leftPad} y1={y} x2={svgWidth - 10} y2={y}
                  stroke="currentColor" strokeOpacity={0.08} strokeDasharray="4 4"
                />
                <text x={leftPad - 8} y={y + 4} textAnchor="end" className="fill-muted-foreground" fontSize={10}>
                  {val}K
                </text>
              </g>
            )
          })}

          {data.map((d, i) => {
            const barH = (d.cases / maxVal) * chartHeight
            const x = leftPad + 4 + i * (barWidth + gap)
            const y = chartHeight - barH + 10
            const isSurge = d.year === '2019' || d.year === '2020' || d.year === '2021'

            return (
              <g key={d.year}>
                <rect
                  x={x} y={y}
                  width={barWidth} height={barH}
                  rx={6}
                  className={isSurge ? 'fill-primary' : 'fill-primary/20'}
                />
                {/* Value label */}
                <text
                  x={x + barWidth / 2} y={y - 6}
                  textAnchor="middle"
                  className={isSurge ? 'fill-primary font-semibold' : 'fill-muted-foreground'}
                  fontSize={10}
                >
                  {d.label}
                </text>
                {/* Year label */}
                <text
                  x={x + barWidth / 2} y={chartHeight + 28}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize={11}
                >
                  {d.year}
                </text>
                {/* COVID marker */}
                {d.year === '2020' && (
                  <text
                    x={x + barWidth + gap / 2} y={chartHeight + 48}
                    textAnchor="middle"
                    className="fill-primary font-medium"
                    fontSize={9}
                  >
                    {'COVID-19 \u2192'}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   Philippines Map SVG with all 9 safehouse markers
   ────────────────────────────────────────────────────────── */
const safehouses = [
  // Luzon (2)
  { name: 'Quezon City', x: 218, y: 198, region: 'Luzon' },
  { name: 'Baguio', x: 192, y: 112, region: 'Luzon' },
  // Visayas (4)
  { name: 'Cebu City', x: 232, y: 290, region: 'Visayas' },
  { name: 'Iloilo City', x: 185, y: 288, region: 'Visayas' },
  { name: 'Bacolod', x: 195, y: 305, region: 'Visayas' },
  { name: 'Tacloban', x: 268, y: 282, region: 'Visayas' },
  // Mindanao (3)
  { name: 'Davao City', x: 255, y: 400, region: 'Mindanao' },
  { name: 'Cagayan de Oro', x: 218, y: 370, region: 'Mindanao' },
  { name: 'General Santos', x: 225, y: 445, region: 'Mindanao' },
]

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PhilippinesMap() {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="relative w-full max-w-md mx-auto">
      <svg
        viewBox="0 0 400 520"
        className="w-full h-auto"
        role="img"
        aria-label="Map of the Philippines showing 9 Lunas safehouse locations"
      >
        <defs>
          <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.40 0.18 280)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="oklch(0.40 0.18 280)" stopOpacity="0.06" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Luzon */}
        <path
          d="M180 40 L210 35 L240 50 L260 80 L270 120 L265 160 L250 190 L240 210 L225 220 L210 215 L195 230 L180 240 L160 235 L145 215 L135 190 L130 160 L140 120 L155 80 L170 55 Z"
          fill="url(#landGrad)" stroke="oklch(0.40 0.18 280)" strokeWidth="1.5" strokeOpacity="0.3"
        />

        {/* Visayas — Panay / Negros */}
        <path
          d="M155 270 L180 258 L200 260 L210 270 L205 290 L195 310 L175 315 L158 305 L148 288 Z"
          fill="url(#landGrad)" stroke="oklch(0.40 0.18 280)" strokeWidth="1.5" strokeOpacity="0.3"
        />
        {/* Cebu */}
        <path
          d="M220 262 L235 258 L242 270 L240 298 L232 310 L222 308 L218 290 L216 272 Z"
          fill="url(#landGrad)" stroke="oklch(0.40 0.18 280)" strokeWidth="1.5" strokeOpacity="0.3"
        />
        {/* Leyte / Samar */}
        <path
          d="M252 260 L275 255 L288 268 L285 295 L272 305 L255 300 L248 280 Z"
          fill="url(#landGrad)" stroke="oklch(0.40 0.18 280)" strokeWidth="1.5" strokeOpacity="0.3"
        />
        {/* Bohol */}
        <ellipse cx="242" cy="318" rx="14" ry="8" fill="url(#landGrad)" stroke="oklch(0.40 0.18 280)" strokeWidth="1.5" strokeOpacity="0.3" />

        {/* Mindanao */}
        <path
          d="M155 350 L185 340 L220 342 L255 350 L275 370 L280 400 L270 430 L250 455 L225 465 L195 460 L165 450 L145 430 L135 405 L140 375 Z"
          fill="url(#landGrad)" stroke="oklch(0.40 0.18 280)" strokeWidth="1.5" strokeOpacity="0.3"
        />

        {/* Palawan */}
        <path
          d="M80 180 L90 200 L95 240 L90 280 L85 320 L75 350 L65 360 L55 350 L60 310 L65 270 L70 230 L75 200 Z"
          fill="url(#landGrad)" stroke="oklch(0.40 0.18 280)" strokeWidth="1.5" strokeOpacity="0.3"
        />

        {/* Region labels */}
        <text x="200" y="130" textAnchor="middle" className="fill-muted-foreground/30" fontSize="12" fontWeight="300" letterSpacing="0.15em">LUZON</text>
        <text x="220" y="250" textAnchor="middle" className="fill-muted-foreground/30" fontSize="10" fontWeight="300" letterSpacing="0.15em">VISAYAS</text>
        <text x="210" y="395" textAnchor="middle" className="fill-muted-foreground/30" fontSize="12" fontWeight="300" letterSpacing="0.15em">MINDANAO</text>

        {/* Safehouse markers */}
        {safehouses.map((sh, i) => (
          <g
            key={sh.name}
            filter="url(#glow)"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className="cursor-pointer"
          >
            <circle cx={sh.x} cy={sh.y} r={hovered === i ? 10 : 6} fill="oklch(0.40 0.18 280)" className="transition-all duration-200" />
            <circle cx={sh.x} cy={sh.y} r={hovered === i ? 18 : 12} fill="oklch(0.40 0.18 280)" fillOpacity="0.15" className="transition-all duration-200" />
            {/* Tooltip on hover */}
            {hovered === i && (
              <g>
                <rect
                  x={sh.x + 14} y={sh.y - 14}
                  width={sh.name.length * 7 + 16} height={24}
                  rx={6}
                  fill="oklch(0.20 0.05 280)" fillOpacity="0.95"
                />
                <text x={sh.x + 22} y={sh.y + 1} className="fill-white" fontSize={10} fontWeight="500">
                  {sh.name}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>

      {/* Legend below map */}
      <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-foreground">Luzon</span> — 2 shelters
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-foreground">Visayas</span> — 4 shelters
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-foreground">Mindanao</span> — 3 shelters
        </div>
      </div>
    </div>
  )
}


function TrustItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs uppercase tracking-widest">
      <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
      <span>{text}</span>
    </div>
  )
}
