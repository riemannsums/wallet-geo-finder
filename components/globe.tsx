"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import maplibregl, { Map, GeoJSONSource, LngLatLike } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

const TOTAL_SLICES = 8
const SLICE_ANGLE = 360 / TOTAL_SLICES
const ANIMATION_PERIOD = 2000
const FLY_DURATION = 2000

interface TransactionGlobeProps {
  bestWedgeIndex: number | null
  mapLoaded?: boolean
  className?: string
}

export default function TransactionGlobe({
  bestWedgeIndex,
  mapLoaded: externalMapLoaded,
  className = "",
}: TransactionGlobeProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const animationRef = useRef<number | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  const getCenterLongitude = (index: number) => -180 + index * SLICE_ANGLE + SLICE_ANGLE / 2

  const createWedgePolygon = (index: number) => {
    const centerLon = getCenterLongitude(index)
    const startLon = -180 + index * SLICE_ANGLE
    const endLon = startLon + SLICE_ANGLE

    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "Polygon" as const,
            coordinates: [
              [
                [centerLon, 90],
                [startLon, 85],
                [startLon, -85],
                [centerLon, -90],
                [endLon, -85],
                [endLon, 85],
                [centerLon, 90],
              ],
            ],
          },
        },
      ],
    }
  }

  const flyToWedge = useCallback((index: number) => {
    const map = mapRef.current
    if (!map) return
    const centerLon = getCenterLongitude(index)
    map.flyTo({
      center: [centerLon, 0] as LngLatLike,
      zoom: 2.5,
      pitch: 0,
      bearing: 0,
      duration: FLY_DURATION,
      essential: true,
    })
  }, [])

  const updateWedgeLayer = useCallback((index: number) => {
    const map = mapRef.current
    if (!map) return
    const source = map.getSource("sixteenth-wedge") as GeoJSONSource | undefined
    if (source) source.setData(createWedgePolygon(index))
  }, [])

  const animatePulse = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const now = performance.now()
    const t = (now % ANIMATION_PERIOD) / ANIMATION_PERIOD
    const sin = (phase: number) => Math.max(0, Math.sin((t + phase) * Math.PI * 2))
    const [pulse, pulse1, pulse2] = [sin(0), sin(0.25), sin(0.5)]
    map.setPaintProperty("wedge-fill", "fill-opacity", 0.2 + 0.2 * pulse)
    map.setPaintProperty("wedge-outline", "line-width", 1 + 2 * pulse)
    map.setPaintProperty("wedge-glow-inner", "line-width", 1 + 3 * pulse1)
    map.setPaintProperty("wedge-glow-inner", "line-opacity", 0.3 + 0.5 * pulse1)
    map.setPaintProperty("wedge-glow-outer", "line-width", 2 + 4 * pulse2)
    map.setPaintProperty("wedge-glow-outer", "line-opacity", 0.2 + 0.6 * pulse2)
    animationRef.current = requestAnimationFrame(animatePulse)
  }, [])

  useEffect(() => {
    if (bestWedgeIndex !== null && mapLoaded && mapRef.current) {
      updateWedgeLayer(bestWedgeIndex)
      flyToWedge(bestWedgeIndex)
    }
  }, [bestWedgeIndex, mapLoaded, updateWedgeLayer, flyToWedge])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "style.json",
      center: [270, 40],
      zoom: 4,
      projection: "globe",
    })
    mapRef.current = map
    map.on("load", () => {
      map.setProjection({ type: "globe" })
      map.addSource("sixteenth-wedge", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      })
      const layers = [
        { id: "wedge-fill", type: "fill", paint: { "fill-color": "#ff3535ff" } },
        { id: "wedge-outline", type: "line", paint: { "line-color": "#ff0000ff", "line-width": 1 } },
        { id: "wedge-glow-inner", type: "line", paint: { "line-color": "#ff4242ff", "line-width": 2, "line-opacity": 0.4 } },
        { id: "wedge-glow-outer", type: "line", paint: { "line-color": "#ff0000ff", "line-width": 4, "line-opacity": 0.3 } },
      ] as const
      for (const layer of layers) map.addLayer({ ...layer, source: "sixteenth-wedge" })
      setMapLoaded(true)
      animationRef.current = requestAnimationFrame(animatePulse)
    })
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      map.remove()
      mapRef.current = null
    }
  }, [animatePulse])

  return (
    <div className={`relative w-full h-full bg-white ${className}`} aria-label="Transaction wedge visualization">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
    </div>
  )
}
