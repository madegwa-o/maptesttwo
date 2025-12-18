import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { Journey } from "@/models/journey"

// GET a single journey
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase()
        const { id } = await params
        const journey = await Journey.findById(id)

        if (!journey) {
            return NextResponse.json({ error: "Journey not found" }, { status: 404 })
        }

        return NextResponse.json(journey)
    } catch (error) {
        console.error("Error fetching journey:", error)
        return NextResponse.json({ error: "Failed to fetch journey" }, { status: 500 })
    }
}

// DELETE a journey
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase()
        const { id } = await params
        const journey = await Journey.findByIdAndDelete(id)

        if (!journey) {
            return NextResponse.json({ error: "Journey not found" }, { status: 404 })
        }

        return NextResponse.json({ message: "Journey deleted successfully" })
    } catch (error) {
        console.error("Error deleting journey:", error)
        return NextResponse.json({ error: "Failed to delete journey" }, { status: 500 })
    }
}
