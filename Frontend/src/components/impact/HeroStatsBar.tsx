import { AnimatedCounter } from './AnimatedCounter'

interface HeroStatsBarProps {
  stats: {
    girlsServed: number
    safehousesOperating: number
    regionsServed: number
    totalCounselingSessions: number
  } | null
}

export function HeroStatsBar({ stats }: HeroStatsBarProps) {
  const items = stats
    ? [
        { value: stats.girlsServed, suffix: '', label: 'Girls Served' },
        { value: stats.safehousesOperating, suffix: '', label: 'Safehouses' },
        { value: stats.regionsServed, suffix: '', label: 'Regions' },
        { value: stats.totalCounselingSessions, suffix: '', label: 'Counseling Sessions' },
      ]
    : null

  return (
    <section id="impact-map" className="border-b border-border bg-muted/30 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {items
            ? items.map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
                    <AnimatedCounter end={item.value} suffix={item.suffix} />
                  </div>
                  <div className="mt-2.5 text-sm text-muted-foreground uppercase tracking-wider">
                    {item.label}
                  </div>
                </div>
              ))
            : Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center animate-pulse">
                  <div className="h-10 bg-muted rounded w-20 mx-auto" />
                  <div className="mt-2.5 h-4 bg-muted rounded w-24 mx-auto" />
                </div>
              ))}
        </div>
      </div>
    </section>
  )
}
