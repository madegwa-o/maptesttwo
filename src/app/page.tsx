"use client"

import { useEffect, useState } from "react"
import { Map } from "@/components/map"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export interface MyPosition {
  accuracy?: number
  altitude?: number | null
  altitudeAccuracy?: number | null
  heading?: number | null
  speed?: number | null
  longitude: number
  latitude: number
}

export default function MapPage() {
  const [timestamp, setTimestamp] = useState<number>(0)
  const [currentPosition, setCurrentPosition] = useState<MyPosition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [coordinates, setCoordinates] = useState<[number, number][]>([])
  const [isTracking, setIsTracking] = useState(false)
  const [totalDistance, setTotalDistance] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [journeyName, setJourneyName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      return
    }

    const watchId = navigator.geolocation.watchPosition(
        (position) => {
          console.log("Position updated: ", position)
          const newPosition = position.coords
          setCurrentPosition(newPosition)
          setTimestamp(position.timestamp)
          setError(null)

          // Add coordinate to tracking path if tracking is enabled
          if (isTracking) {
            const newCoord: [number, number] = [newPosition.longitude, newPosition.latitude]

            setCoordinates((prev) => {
              // Calculate distance from last point
              if (prev.length > 0) {
                const lastCoord = prev[prev.length - 1]
                const distance = calculateDistance(
                    lastCoord[1],
                    lastCoord[0],
                    newPosition.latitude,
                    newPosition.longitude,
                )
                setTotalDistance((prevDist) => prevDist + distance)
              }
              return [...prev, newCoord]
            })
          }
        },
        (err) => {
          console.error("Geolocation error: ", err)
          setError(err.message)
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        },
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [isTracking])

  const startTracking = () => {
    setIsTracking(true)
    setCoordinates([])
    setTotalDistance(0)
    setStartTime(new Date())
    console.log("Started tracking")
  }

  const stopTracking = () => {
    setIsTracking(false)
    console.log("Stopped tracking. Total points:", coordinates.length)
    if (coordinates.length > 0) {
      setShowSaveDialog(true)
    }
  }

  const clearRoute = () => {
    setCoordinates([])
    setTotalDistance(0)
    setStartTime(null)
    console.log("Route cleared")
  }

  const saveJourney = async () => {
    if (!journeyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a journey name",
        variant: "destructive",
      })
      return
    }

    if (coordinates.length === 0) {
      toast({
        title: "Error",
        description: "No coordinates to save",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch("/api/journeys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: journeyName,
          coordinates: coordinates.map(([longitude, latitude]) => ({
            longitude,
            latitude,
          })),
          totalDistance,
          startTime: startTime || new Date(),
          endTime: new Date(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save journey")
      }

      toast({
        title: "Success",
        description: "Journey saved successfully!",
      })

      setShowSaveDialog(false)
      setJourneyName("")
      clearRoute()
    } catch (error) {
      console.error("Error saving journey:", error)
      toast({
        title: "Error",
        description: "Failed to save journey",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
      <div className="flex h-screen flex-col bg-background">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground">RouteTracker</h1>
          <div className="flex gap-2">
            <Link href="/journeys">
              <Button variant="outline">View Journeys</Button>
            </Link>
            {!isTracking ? (
                <Button onClick={startTracking} className="bg-green-600 hover:bg-green-700">
                  Start Tracking
                </Button>
            ) : (
                <Button onClick={stopTracking} className="bg-red-600 hover:bg-red-700">
                  Stop Tracking
                </Button>
            )}
            {coordinates.length > 0 && (
                <Button onClick={clearRoute} variant="secondary">
                  Clear Route
                </Button>
            )}
          </div>
        </header>

        <div className="relative flex flex-1 flex-col lg:flex-row">
          {/* Map Container */}
          <div className="relative h-[60vh] w-full lg:h-full lg:flex-1">
            <Map currentPosition={currentPosition} coordinates={coordinates} />
          </div>

          {/* Metrics Panel */}
          <div className="h-[40vh] w-full overflow-y-auto border-t border-border bg-card p-6 lg:h-full lg:w-96 lg:border-l lg:border-t-0">
            <h2 className="mb-4 text-xl font-semibold">Location Tracker</h2>

            {error && (
                <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
                  <p>
                    <strong>Error:</strong> {error}
                  </p>
                </div>
            )}

            {/* Tracking Status */}
            <div className="mb-4 rounded-lg bg-muted p-3">
              <p className="mb-2">
                <strong>Status:</strong>{" "}
                <span className={isTracking ? "text-green-600" : "text-gray-600"}>
                {isTracking ? "Tracking Active" : "Not Tracking"}
              </span>
              </p>
              <p className="mb-2">
                <strong>Points Recorded:</strong> {coordinates.length}
              </p>
              <p>
                <strong>Total Distance:</strong>{" "}
                {totalDistance >= 1000 ? `${(totalDistance / 1000).toFixed(2)} km` : `${totalDistance.toFixed(0)} m`}
              </p>
            </div>

            {timestamp > 0 && (
                <div className="mb-4">
                  <p>
                    <strong>Last Updated:</strong> {new Date(timestamp).toLocaleTimeString()}
                  </p>
                </div>
            )}

            {currentPosition ? (
                <div className="space-y-2">
                  <h3 className="font-semibold">Current Position:</h3>
                  <p>
                    <strong>Latitude:</strong> {currentPosition.latitude.toFixed(6)}
                  </p>
                  <p>
                    <strong>Longitude:</strong> {currentPosition.longitude.toFixed(6)}
                  </p>
                  <p>
                    <strong>Accuracy:</strong> {currentPosition.accuracy?.toFixed(2)} meters
                  </p>
                  <p>
                    <strong>Altitude:</strong> {currentPosition.altitude?.toFixed(2) ?? "N/A"} meters
                  </p>
                  <p>
                    <strong>Speed:</strong>{" "}
                    {currentPosition.speed ? `${(currentPosition.speed * 3.6).toFixed(2)} km/h` : "N/A"}
                  </p>
                  <p>
                    <strong>Heading:</strong> {currentPosition.heading?.toFixed(2) ?? "N/A"}°
                  </p>
                </div>
            ) : (
                <p>Waiting for location data...</p>
            )}
          </div>
        </div>

        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Journey</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <label htmlFor="journey-name" className="text-sm font-medium">
                Journey Name
              </label>
              <Input
                  id="journey-name"
                  placeholder="e.g., Morning Run, Weekend Hike"
                  value={journeyName}
                  onChange={(e) => setJourneyName(e.target.value)}
                  className="mt-2"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Distance:{" "}
                {totalDistance >= 1000 ? `${(totalDistance / 1000).toFixed(2)} km` : `${totalDistance.toFixed(0)} m`}
              </p>
              <p className="text-sm text-muted-foreground">Points: {coordinates.length}</p>
            </div>
            <DialogFooter>
              <Button
                  variant="outline"
                  onClick={() => {
                    setShowSaveDialog(false)
                    setJourneyName("")
                  }}
                  disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={saveJourney} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Journey"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  )
}
