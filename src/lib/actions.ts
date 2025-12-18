"use server"

export async function getMapboxToken() {
    return process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
}
