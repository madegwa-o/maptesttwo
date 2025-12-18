"use client"

import { useEffect, useState, use } from "react"
import { Map } from "@/components/map"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Clock, MapPin, Ruler } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { format } from "date-fns"

interface Journey {
    _id: string
    name: string
    coordinates: Array<{ longitude: number; latitude: number }>
    totalDistance: number
    startTime: string
    endTime: string
    createdAt: string
}

export default function JourneyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [journey, setJourney] = useState<Journey | null>(null)
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        const fetchJourney = async () => {
            try {
                const response = await fetch(`/api/journeys/${id}`)
                if (!response.ok) {
                    throw new Error("Failed to fetch journey")
                }
                const data = await response.json()
                setJourney(data)
            } catch (error) {
                console.error("Error fetching journey:", error)
                toast({
                    title: "Error",
                    description: "Failed to load journey",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        fetchJourney()
    }, [id, toast])

    const formatDuration = (start: string, end: string) => {
        const duration = new Date(end).getTime() - new Date(start).getTime()
        const minutes = Math.floor(duration / 60000)
        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60

        if (hours > 0) {
            return `${hours}h ${remainingMinutes}m`
        }
        return `${minutes}m`
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <p className="text-muted-foreground">Loading journey...</p>
            </div>
        )
    }

    if (!journey) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
                <p className="text-lg text-muted-foreground">Journey not found</p>
                <Link href="/journeys">
                    <Button>Back to Journeys</Button>
                </Link>
            </div>
        )
    }

    // Convert coordinates to the format expected by the Map component
    const coordinates: [number, number][] = journey.coordinates.map((coord) => [coord.longitude, coord.latitude])

    return (
        <div className="flex h-screen flex-col bg-background">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
                <div className="flex items-center gap-4">
                    <Link href="/journeys">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-foreground">{journey.name}</h1>
                </div>
            </header>

            <div className="relative flex flex-1 flex-col lg:flex-row">
                {/* Map Container */}
                <div className="relative h-[60vh] w-full lg:h-full lg:flex-1">
                    <Map currentPosition={null} coordinates={coordinates} />
                </div>

                {/* Journey Details Panel */}
                <div className="h-[40vh] w-full overflow-y-auto border-t border-border bg-card p-6 lg:h-full lg:w-96 lg:border-l lg:border-t-0">
                    <h2 className="mb-4 text-xl font-semibold">Journey Details</h2>

                    <div className="space-y-4">
                        {/* Date */}
                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm text-muted-foreground">Date</p>
                                <p className="font-medium">{format(new Date(journey.createdAt), "PPP")}</p>
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm text-muted-foreground">Duration</p>
                                <p className="font-medium">{formatDuration(journey.startTime, journey.endTime)}</p>
                            </div>
                        </div>

                        {/* Distance */}
                        <div className="flex items-start gap-3">
                            <Ruler className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm text-muted-foreground">Total Distance</p>
                                <p className="font-medium">
                                    {journey.totalDistance >= 1000
                                        ? `${(journey.totalDistance / 1000).toFixed(2)} km`
                                        : `${journey.totalDistance.toFixed(0)} m`}
                                </p>
                            </div>
                        </div>

                        {/* Points */}
                        <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm text-muted-foreground">Points Tracked</p>
                                <p className="font-medium">{journey.coordinates.length}</p>
                            </div>
                        </div>

                        {/* Time Range */}
                        <div className="rounded-lg bg-muted p-3">
                            <p className="text-sm font-medium mb-2">Time Range</p>
                            <p className="text-sm text-muted-foreground">
                                {format(new Date(journey.startTime), "p")} - {format(new Date(journey.endTime), "p")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
