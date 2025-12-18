import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { Journey } from "@/models/journey"

// GET all journeys
export async function GET() {
    try {
        await connectToDatabase()
        const journeys = await Journey.find().sort({ createdAt: -1 })
        return NextResponse.json(journeys)
    } catch (error) {
        console.error("Error fetching journeys:", error)
        return NextResponse.json({ error: "Failed to fetch journeys" }, { status: 500 })
    }
}

// POST a new journey
export async function POST(request: NextRequest) {
    try {
        await connectToDatabase()
        const body = await request.json()

        const journey = new Journey({
            name: body.name,
            coordinates: body.coordinates,
            totalDistance: body.totalDistance,
            startTime: body.startTime,
            endTime: body.endTime,
        })

        await journey.save()
        return NextResponse.json(journey, { status: 201 })
    } catch (error) {
        console.error("Error saving journey:", error)
        return NextResponse.json({ error: "Failed to save journey" }, { status: 500 })
    }
}
