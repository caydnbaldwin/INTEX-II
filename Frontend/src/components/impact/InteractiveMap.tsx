import { useEffect, useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchSafehouses, type SafehouseData } from '@/lib/safehouseData'
import 'leaflet/dist/leaflet.css'

const PHILIPPINES_CENTER: L.LatLngExpression = [11.5, 123.0]
const PHILIPPINES_BOUNDS: L.LatLngBoundsExpression = [
  [2.0, 114.0],
  [25.0, 130.0],
]

const defaultIcon = L.divIcon({
  className: '',
  html: `<span class="flex h-4 w-4 items-center justify-center">
    <span class="relative h-3 w-3 rounded-full bg-primary border-2 border-white shadow-md"></span>
  </span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10],
})

export function InteractiveMap() {
  const [safehouses, setSafehouses] = useState<SafehouseData[]>([])
  const markerRefs = useRef<(L.Marker | null)[]>([])

  useEffect(() => {
    fetchSafehouses().then(setSafehouses).catch(() => {})
  }, [])

  const openMarkerPopup = useCallback((index: number) => {
    const marker = markerRefs.current[index]
    if (marker) marker.openPopup()
  }, [])

  return (
    <section className="pt-10 pb-5 sm:pt-12 sm:pb-6 bg-background">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="mb-3 text-center text-base font-medium tracking-wide text-primary">
          Select a pin on the map to explore each safehouse
        </p>

        <div className="mx-auto max-w-3xl rounded-2xl overflow-hidden shadow-lg border border-border">
          <MapContainer
            center={PHILIPPINES_CENTER}
            zoom={6}
            minZoom={5}
            maxZoom={12}
            scrollWheelZoom={false}
            maxBounds={PHILIPPINES_BOUNDS}
            maxBoundsViscosity={1.0}
            style={{ height: '500px', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            {safehouses.map((sh, i) => (
              <Marker
                key={sh.id}
                position={[sh.coordinates.lat, sh.coordinates.lng]}
                icon={defaultIcon}
                ref={(ref) => { markerRefs.current[i] = ref as L.Marker | null }}
              >
                <Popup>
                  <SafehousePopupCard
                    safehouse={sh}
                    index={i}
                    total={safehouses.length}
                    onPrev={() => openMarkerPopup(i === 0 ? safehouses.length - 1 : i - 1)}
                    onNext={() => openMarkerPopup(i >= safehouses.length - 1 ? 0 : i + 1)}
                  />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </section>
  )
}

function SafehousePopupCard({
  safehouse,
  index,
  total,
  onPrev,
  onNext,
}: {
  safehouse: SafehouseData
  index: number
  total: number
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="w-[240px]">
      <img
        src={safehouse.photoPath}
        alt={safehouse.name}
        className="w-full h-[100px] object-cover"
      />
      <div className="p-3">
        <h3 className="font-serif font-bold text-sm text-foreground">
          {safehouse.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {safehouse.city}, {safehouse.province}
        </p>
        <Link
          to={`/impact/safehouse/${safehouse.id}`}
          className="mt-2 inline-flex items-center text-xs font-medium text-primary hover:underline"
        >
          Explore this safehouse &rarr;
        </Link>
      </div>
      <div className="flex items-center justify-between border-t border-gray-200 px-3 py-2">
        <button
          type="button"
          onClick={onPrev}
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Previous safehouse"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
        <span className="text-xs text-gray-500">{index + 1} / {total}</span>
        <button
          type="button"
          onClick={onNext}
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Next safehouse"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>
    </div>
  )
}
