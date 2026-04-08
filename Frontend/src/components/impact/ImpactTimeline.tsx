const milestones = [
  { date: '2017', label: 'Lunas Founded', description: 'Mission established to protect children in the Philippines' },
  { date: 'Jan 2022', label: 'First Safehouse', description: 'Lighthouse 1 opens in Quezon City' },
  { date: 'Feb 2022', label: 'Visayas Expansion', description: 'Cebu City safehouse begins operations' },
  { date: 'Mid 2022', label: '5 Houses Open', description: 'Expansion across Luzon, Visayas, and Mindanao' },
  { date: 'Dec 2022', label: '9 Safehouses', description: 'All nine locations operational nationwide' },
  { date: 'Today', label: '150+ Lives Changed', description: 'Ongoing holistic care, education, and healing' },
]

export function ImpactTimeline() {
  return (
    <section className="pt-8 pb-16 sm:pt-10 sm:pb-20 bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-3">
            Our Journey
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
            From Vision to Impact
          </h2>
        </div>

        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto">
          {/* Horizontal line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-border hidden lg:block" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-4">
            {milestones.map((m, i) => (
              <div key={m.date} className="relative text-center lg:text-center">
                {/* Dot */}
                <div className="flex justify-center mb-3">
                  <div
                    className={`relative z-10 h-10 w-10 rounded-full border-2 flex items-center justify-center ${
                      i === milestones.length - 1
                        ? 'border-primary bg-primary text-white'
                        : 'border-primary/40 bg-background text-primary'
                    }`}
                  >
                    <span className="text-xs font-bold">{i + 1}</span>
                  </div>
                </div>

                {/* Date */}
                <div className="text-xs font-medium text-primary uppercase tracking-wider mb-1">
                  {m.date}
                </div>

                {/* Label */}
                <h4 className="text-sm font-semibold text-foreground">{m.label}</h4>

                {/* Description */}
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {m.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
