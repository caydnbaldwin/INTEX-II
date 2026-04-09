import { useCallback, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ResidentStoryCard } from '@/components/impact/ResidentStoryCard'
import type { PublicResidentStory } from '@/lib/publicResidentStories'

export function StoriesOfTransformationSection({ stories }: { stories: PublicResidentStory[] }) {
  const perPage = 3
  const totalPages = Math.ceil(stories.length / perPage)
  const [page, setPage] = useState(0)

  const goTo = useCallback((p: number) => {
    setPage(Math.max(0, Math.min(p, totalPages - 1)))
  }, [totalPages])

  const visible = stories.slice(page * perPage, page * perPage + perPage)

  return (
    <section className="pt-8 pb-10 sm:pt-10 sm:pb-12 bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
            Stories of Transformation
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Each name is a privacy-safe pseudonym. Each milestone is real.
          </p>
        </div>

        {/* Arrows vertically centered with the story cards */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-4 lg:gap-6">
          <div className="hidden sm:flex shrink-0 items-center justify-center sm:justify-end lg:w-10">
            <button
              type="button"
              onClick={() => goTo(page - 1)}
              disabled={page === 0}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous stories"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>

          <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((story) => (
              <ResidentStoryCard key={story.residentId} story={story} />
            ))}
          </div>

          <div className="hidden sm:flex shrink-0 items-center justify-center sm:justify-start lg:w-10">
            <button
              type="button"
              onClick={() => goTo(page + 1)}
              disabled={page >= totalPages - 1}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next stories"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-200 ${
                i === page ? 'w-6 bg-primary' : 'w-2 bg-border hover:bg-muted-foreground/40'
              }`}
              aria-label={`Page ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
