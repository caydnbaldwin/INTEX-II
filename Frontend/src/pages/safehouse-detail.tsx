import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import { ArrowLeft, Heart, MapPin, Calendar, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getSafehouseById } from '@/lib/safehouseData'
import type { SafehouseData } from '@/lib/safehouseData'
import { getStoriesBySafehouseId } from '@/lib/publicResidentStories'
import 'leaflet/dist/leaflet.css'
import { usePageTitle } from '@/hooks/usePageTitle'

const markerIcon = L.divIcon({
  className: '',
  html: `<span class="relative flex h-5 w-5 items-center justify-center">
    <span class="absolute h-5 w-5 rounded-full bg-primary/30"></span>
    <span class="relative h-3.5 w-3.5 rounded-full bg-primary border-2 border-white shadow-md"></span>
  </span>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

export function SafehouseDetail() {
  usePageTitle('Safehouse Details')
  const { id } = useParams<{ id: string }>()
  const [safehouse, setSafehouse] = useState<SafehouseData | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSafehouseById(Number(id))
      .then(setSafehouse)
      .finally(() => setLoading(false))
  }, [id])

  const stories = safehouse ? getStoriesBySafehouseId(safehouse.id) : []

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!safehouse) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-serif font-bold text-foreground">Safehouse not found</h1>
        <Button asChild variant="outline">
          <Link to="/impact">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Impact Map
          </Link>
        </Button>
      </div>
    )
  }

  const openYear = new Date(safehouse.openDate).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Back link */}
      <div className="mx-auto max-w-7xl px-6 pt-6 lg:px-8">
        <Link
          to="/impact"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Impact Map
        </Link>
      </div>

      {/* Hero photo */}
      <div className="relative mt-4 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative h-[280px] sm:h-[350px] rounded-2xl overflow-hidden">
          <img
            src={safehouse.photoPath}
            alt={safehouse.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white">
              {safehouse.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-white/80">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {safehouse.city}, {safehouse.province}
              </span>
              <span>{safehouse.region}</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Opened {openYear}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stories">Stories</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-8">
            <div className="grid gap-10 lg:grid-cols-2">
              {/* Narrative */}
              <div>
                <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                  About This Safehouse
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {safehouse.narrative}
                </p>

                {/* Key facts */}
                <div className="mt-8 grid grid-cols-3 gap-4">
                  <div className="text-center rounded-xl border border-border p-4">
                    <Users className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-serif font-bold text-foreground">
                      {safehouse.occupancy}
                    </div>
                    <div className="text-xs text-muted-foreground">Girls in care</div>
                  </div>
                  <div className="text-center rounded-xl border border-border p-4">
                    <Calendar className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-serif font-bold text-foreground">
                      {new Date(safehouse.openDate).getFullYear()}
                    </div>
                    <div className="text-xs text-muted-foreground">Year opened</div>
                  </div>
                  <div className="text-center rounded-xl border border-border p-4">
                    <Heart className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-serif font-bold text-foreground">
                      {safehouse.capacity}
                    </div>
                    <div className="text-xs text-muted-foreground">Total capacity</div>
                  </div>
                </div>

                {/* Programs as pills */}
                <div className="mt-8">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Programs Offered</h3>
                  <div className="flex flex-wrap gap-2">
                    {safehouse.programs.map((program) => (
                      <span
                        key={program}
                        className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {program}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mini map */}
              <div className="rounded-2xl overflow-hidden border border-border shadow-sm h-[350px] lg:h-auto">
                <MapContainer
                  center={[safehouse.coordinates.lat, safehouse.coordinates.lng]}
                  zoom={12}
                  scrollWheelZoom={false}
                  dragging={false}
                  zoomControl={false}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  />
                  <Marker
                    position={[safehouse.coordinates.lat, safehouse.coordinates.lng]}
                    icon={markerIcon}
                  />
                </MapContainer>
              </div>
            </div>
          </TabsContent>

          {/* Stories Tab */}
          <TabsContent value="stories" className="mt-8">
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">
              Lives Being Transformed
            </h2>
            <p className="text-muted-foreground mb-8">
              Each name is a privacy-safe pseudonym. Each story is real.
            </p>

            {stories.length > 0 ? (
              <div className="space-y-8">
                {stories.map((story) => (
                  <div
                    key={story.residentId}
                    className="grid gap-6 lg:grid-cols-[280px_1fr] rounded-2xl border border-border overflow-hidden"
                  >
                    {/* Photo */}
                    <div className="h-[200px] lg:h-auto">
                      <img
                        src={safehouse.photoPath}
                        alt={`Photo of ${safehouse.name}`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Story content */}
                    <div className="p-6 lg:py-8">
                      <span className="inline-block text-xs font-medium text-primary bg-primary/10 rounded-full px-3 py-1 mb-3">
                        {story.pseudonym}
                      </span>
                      <h3 className="font-serif text-xl font-semibold text-foreground">
                        {story.headline}
                      </h3>
                      <p className="mt-3 text-base text-muted-foreground leading-relaxed">
                        {story.longNarrative}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Stories for this safehouse are being collected. Check back soon.
              </p>
            )}
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="mt-8">
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">
              Photos
            </h2>
            <p className="text-muted-foreground mb-8">
              Images from {safehouse.name} in {safehouse.city}.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl overflow-hidden border border-border aspect-[4/3]">
                <img
                  src={safehouse.photoPath}
                  alt={`${safehouse.name} — ${safehouse.city}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              {/* Placeholder cards for future photos */}
              <div className="rounded-2xl border border-dashed border-border aspect-[4/3] flex items-center justify-center">
                <p className="text-sm text-muted-foreground text-center px-4">
                  More photos coming soon
                </p>
              </div>
            </div>
          </TabsContent>

        </Tabs>

        {/* CTA */}
        <div className="mt-16 rounded-2xl bg-primary/5 border border-primary/20 p-8 sm:p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
            <Heart className="h-7 w-7 text-primary" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-foreground">
            Support {safehouse.name}
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Your gift directly supports the {safehouse.occupancy} girls living at {safehouse.name} in {safehouse.city}, providing shelter, education, counseling, and a path toward independence.
          </p>
          <Button asChild className="mt-6 rounded-full px-8 text-base">
            <Link to="/donate">Donate Now</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
