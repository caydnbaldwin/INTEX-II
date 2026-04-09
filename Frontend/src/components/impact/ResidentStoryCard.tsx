import { useEffect, useState } from 'react'
import type { PublicResidentStory } from '@/lib/publicResidentStories'
import { getSafehouseById } from '@/lib/safehouseData'

interface ResidentStoryCardProps {
  story: PublicResidentStory
  compact?: boolean
}

export function ResidentStoryCard({ story, compact }: ResidentStoryCardProps) {
  const flowerName = story.pseudonym.split('-')[0]
  const [photoPath, setPhotoPath] = useState<string | undefined>()

  useEffect(() => {
    if (story.safehouseId) {
      getSafehouseById(story.safehouseId).then((sh) => setPhotoPath(sh?.photoPath))
    }
  }, [story.safehouseId])

  if (compact) {
    return (
      <div className="rounded-xl border border-border bg-background overflow-hidden p-4 transition-shadow hover:shadow-md">
        <div className="mb-2">
          <span className="font-serif font-semibold text-foreground text-sm">{flowerName}</span>
          <span className="text-muted-foreground text-xs ml-2">Age {10 + (story.residentId % 7)}</span>
        </div>
        <h4 className="font-medium text-foreground text-xs">{story.headline}</h4>
        <p className="mt-2 text-muted-foreground leading-relaxed text-xs">{story.description}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden transition-shadow hover:shadow-md flex flex-col h-[380px]">
      {/* Text */}
      <div className="p-5">
        <div className="mb-2">
          <span className="font-serif font-semibold text-foreground text-base">{flowerName}</span>
          <span className="text-muted-foreground text-sm ml-2">Age {10 + (story.residentId % 7)}</span>
        </div>
        <h4 className="font-medium text-foreground text-sm">{story.headline}</h4>
        <p className="mt-2 text-muted-foreground leading-relaxed text-sm">
          {story.description}
        </p>
      </div>
      {/* Image — fills remaining space */}
      {photoPath && (
        <div className="flex-1 min-h-0">
          <img
            src={photoPath}
            alt={story.headline}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  )
}
