import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
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
    <span class="absolute h-4 w-4 rounded-full bg-primary/30 animate-ping"></span>
    <span class="relative h-3 w-3 rounded-full bg-primary border-2 border-white shadow-md"></span>
  </span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10],
})

export function InteractiveMap() {
  const [safehouses, setSafehouses] = useState<SafehouseData[]>([])

  useEffect(() => {
    fetchSafehouses().then(setSafehouses).catch(() => {})
  }, [])

  // Compute region counts dynamically
  const regionCounts = safehouses.reduce<Record<string, number>>((acc, sh) => {
    acc[sh.region] = (acc[sh.region] ?? 0) + 1
    return acc
  }, {})

  return (
    <section className="pt-10 pb-5 sm:pt-12 sm:pb-6 bg-background">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
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
            {safehouses.map((sh) => (
              <Marker
                key={sh.id}
                position={[sh.coordinates.lat, sh.coordinates.lng]}
                icon={defaultIcon}
              >
                <Popup>
                  <div className="w-[220px]">
                    <img
                      src={sh.photoPath}
                      alt={sh.name}
                      className="w-full h-[100px] object-cover"
                    />
                    <div className="p-3">
                      <h3 className="font-serif font-bold text-sm text-foreground">
                        {sh.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {sh.city}, {sh.province}
                      </p>
                      <Link
                        to={`/impact/safehouse/${sh.id}`}
                        className="mt-2 inline-flex items-center text-xs font-medium text-primary hover:underline"
                      >
                        Explore this safehouse &rarr;
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Region summary — dynamic from API */}
        <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          {Object.entries(regionCounts).map(([region, count]) => (
            <span key={region}>
              <span className="font-semibold text-foreground">{region}</span> — {count} {count === 1 ? 'shelter' : 'shelters'}
            </span>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Click on a dot to view shelter details.
        </p>
      </div>
    </section>
  )
}
