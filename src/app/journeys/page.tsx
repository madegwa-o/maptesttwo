"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, MapPin } from "lucide-react"
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

export default function JourneysPage() {
    const [journeys, setJourneys] = useState<Journey[]>([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    const fetchJourneys = async () => {
        try {
            const response = await fetch("/api/journeys")
            if (!response.ok) {
                throw new Error("Failed to fetch journeys")
            }
            const data = await response.json()
            setJourneys(data)
        } catch (error) {
            console.error("Error fetching journeys:", error)
            toast({
                title: "Error",
                description: "Failed to load journeys",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchJourneys()
    }, [])

    const deleteJourney = async (id: string) => {
        if (!confirm("Are you sure you want to delete this journey?")) {
            return
        }

        try {
            const response = await fetch(`/api/journeys/${id}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                throw new Error("Failed to delete journey")
            }

            toast({
                title: "Success",
                description: "Journey deleted successfully",
            })

            fetchJourneys()
        } catch (error) {
            console.error("Error deleting journey:", error)
            toast({
                title: "Error",
                description: "Failed to delete journey",
                variant: "destructive",
            })
        }
    }

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

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-card px-6 py-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground">My Journeys</h1>
                    <Link href="/">
                        <Button>Track New Journey</Button>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <p className="text-muted-foreground">Loading journeys...</p>
                    </div>
                ) : journeys.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <MapPin className="h-16 w-16 text-muted-foreground mb-4" />
                        <p className="text-lg text-muted-foreground mb-2">No journeys yet</p>
                        <p className="text-sm text-muted-foreground mb-4">Start tracking your first journey to see it here</p>
                        <Link href="/">
                            <Button>Start Tracking</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {journeys.map((journey) => (
                            <Card key={journey._id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">{journey.name}</CardTitle>
                                            <CardDescription>{format(new Date(journey.createdAt), "PPP")}</CardDescription>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteJourney(journey._id)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Distance:</span>
                                            <span className="font-medium">
                        {journey.totalDistance >= 1000
                            ? `${(journey.totalDistance / 1000).toFixed(2)} km`
                            : `${journey.totalDistance.toFixed(0)} m`}
                      </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Duration:</span>
                                            <span className="font-medium">{formatDuration(journey.startTime, journey.endTime)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Points:</span>
                                            <span className="font-medium">{journey.coordinates.length}</span>
                                        </div>
                                    </div>
                                    <Link href={`/journeys/${journey._id}`}>
                                        <Button className="w-full mt-4 bg-transparent" variant="outline">
                                            View on Map
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
