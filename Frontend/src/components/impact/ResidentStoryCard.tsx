import type { PublicResidentStory } from '@/lib/publicResidentStories'
import { getSafehouseById } from '@/lib/safehouseData'

interface ResidentStoryCardProps {
  story: PublicResidentStory
  compact?: boolean
}

export function ResidentStoryCard({ story, compact }: ResidentStoryCardProps) {
  const flowerName = story.pseudonym.split('-')[0]
  const safehouse = story.safehouseId ? getSafehouseById(story.safehouseId) : undefined
  const photoPath = story.cardImageSrc ?? safehouse?.photoPath

  if (compact) {
    return (
      <div className="rounded-xl border border-border bg-background overflow-hidden p-4 transition-shadow hover:shadow-md">
        <div className="mb-2">
          <span className="font-serif font-semibold text-foreground text-sm">{flowerName}</span>
          <span className="text-muted-foreground text-xs ml-2">Age {10 + (story.residentId % 7)}</span>
        </div>
        <h4 className="font-medium text-foreground text-xs">{story.headline}</h4>
        <p className="mt-1.5 text-muted-foreground leading-snug text-xs line-clamp-3">{story.description}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background transition-shadow hover:shadow-md">
      {/* Text — headline + one short outcome line; grows when grid row is taller */}
      <div className="min-h-0 flex-1 p-5 pb-4">
        <div className="mb-1.5">
          <span className="font-serif font-semibold text-foreground text-base">{flowerName}</span>
          <span className="text-muted-foreground text-sm ml-2">Age {10 + (story.residentId % 7)}</span>
        </div>
        <h4 className="font-medium text-foreground text-sm">{story.headline}</h4>
        <p className="mt-1.5 text-muted-foreground leading-snug text-sm line-clamp-3">
          {story.description}
        </p>
      </div>
      {/* Fixed image height so every card matches */}
      <div className="h-48 w-full shrink-0 overflow-hidden bg-muted">
        {photoPath ? (
          <img src={photoPath} alt="" className="h-full w-full object-cover object-center" />
        ) : null}
      </div>
    </div>
  )
}
