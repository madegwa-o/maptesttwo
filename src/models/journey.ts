import mongoose from "mongoose"

export interface ICoordinate {
    longitude: number
    latitude: number
}

export interface IJourney {
    name: string
    coordinates: ICoordinate[]
    totalDistance: number
    startTime: Date
    endTime: Date
    createdAt: Date
}

const CoordinateSchema = new mongoose.Schema({
    longitude: { type: Number, required: true },
    latitude: { type: Number, required: true },
})

const JourneySchema = new mongoose.Schema({
    name: { type: String, required: true },
    coordinates: { type: [CoordinateSchema], required: true },
    totalDistance: { type: Number, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
})

export const Journey = mongoose.models.Journey || mongoose.model<IJourney>("Journey", JourneySchema)