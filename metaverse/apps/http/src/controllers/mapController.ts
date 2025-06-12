import { Request, Response } from "express";
import client from "@metaverse/db/client";

export const getAllMaps = async (req: Request, res: Response): Promise<void> => {
    try {
        const maps = await client.map.findMany({
            select: {
                id: true,
                name: true,
                height: true,
                width: true,
                thumbnailUrl: true,
            },
            orderBy: {
                name: 'asc' // Order alphabetically
            }
        });
        res.status(200).json({ success: true, maps});
        return;
    } catch (err) {
        console.error("Error fetching all maps:", err);
        res.status(500).json({ success: false, err: "Failed to retrieve maps"});
        return;
    }
}