"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { getMapboxToken } from "@/lib/actions"
import type { MyPosition } from "@/app/page"

interface MapProps {
    currentPosition: MyPosition | null
    coordinates: [number, number][]
}

export function Map({ currentPosition, coordinates }: MapProps) {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<mapboxgl.Map | null>(null)
    const marker = useRef<mapboxgl.Marker | null>(null)
    const [initialPosition, setInitialPosition] = useState<MyPosition | null>(null)
    const [mapLoaded, setMapLoaded] = useState(false)
    const [tokenLoaded, setTokenLoaded] = useState(false)

    // Get Mapbox token
    useEffect(() => {
        getMapboxToken().then((token) => {
            mapboxgl.accessToken = token
            ;(mapboxgl as any).workerClass = null
            setTokenLoaded(true)
        })
    }, [])

    // Get initial position
    useEffect(() => {
        if (!navigator.geolocation || initialPosition) return

        navigator.geolocation.getCurrentPosition((position) => {
            setInitialPosition(position.coords)
        })
    }, [initialPosition])

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current || map.current || !tokenLoaded || !initialPosition) return

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/dark-v11",
            center: [initialPosition.longitude, initialPosition.latitude],
            zoom: 15,
            pitch: 45,
        })

        map.current.on("load", () => {
            setMapLoaded(true)

            // Add route line source and layer
            map.current?.addSource("route", {
                type: "geojson",
                data: {
                    type: "Feature",
                    properties: {},
                    geometry: {
                        type: "LineString",
                        coordinates: [],
                    },
                },
            })

            map.current?.addLayer({
                id: "route",
                type: "line",
                source: "route",
                layout: {
                    "line-join": "round",
                    "line-cap": "round",
                },
                paint: {
                    "line-color": "#FF6B2C",
                    "line-width": 5,
                    "line-opacity": 0.9,
                },
            })

            console.log("[Map] Map loaded and route layer added")
        })

        return () => {
            marker.current?.remove()
            map.current?.remove()
        }
    }, [tokenLoaded, initialPosition])

    // Update user marker and center map on current position
    useEffect(() => {
        if (!map.current || !mapLoaded || !currentPosition) return

        const { longitude, latitude } = currentPosition

        console.log("[Map] Updating marker position:", { longitude, latitude })

        // Create or update marker
        if (!marker.current) {
            const el = document.createElement("div")
            el.className = "w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow-lg"

            marker.current = new mapboxgl.Marker({ element: el }).setLngLat([longitude, latitude]).addTo(map.current)
            console.log("[Map] Marker created")
        } else {
            marker.current.setLngLat([longitude, latitude])
            console.log("[Map] Marker updated")
        }

        // Center map on current position
        map.current.easeTo({
            center: [longitude, latitude],
            duration: 1000,
        })
    }, [currentPosition, mapLoaded])

    // Update route polyline
    useEffect(() => {
        if (!map.current || !mapLoaded) return

        const source = map.current.getSource("route") as mapboxgl.GeoJSONSource

        if (source && coordinates.length > 0) {
            source.setData({
                type: "Feature",
                properties: {},
                geometry: {
                    type: "LineString",
                    coordinates: coordinates,
                },
            })
            console.log("[Map] Route updated with", coordinates.length, "points")
        }
    }, [coordinates, mapLoaded])

    return (
        <div className="relative h-full w-full">
            <div ref={mapContainer} className="h-full w-full" />

            {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-background">
                    <div className="text-muted-foreground">Loading map...</div>
                </div>
            )}
        </div>
    )
}
