import { Request, Response } from "express";
import { createSpaceSchema } from "../types/spaceSchema";
import * as spaceService from "../service/spaceService"

// create a new space
export const createSpace = async (req: Request, res: Response) => {
    try{
        const validatedData = createSpaceSchema.safeParse(req.body);

        if (!validatedData.success) {
            res.status(400).json({ success: false, error: validatedData.error.errors });
            return;
        }

        const { name, mapId, width, height } = validatedData.data; // width and height are from selected map
        const userId = (req as any).user.id; // / Get user ID from authenticated request

        // Call the service layer to create the space
        // The service layer handles map lookup and space creation logic
        const newSpace = await spaceService.createSpace(userId, { name, mapId });

        // Transform the response to match frontend expectation (thumbnail property on space object)
        const spaceFrontend = {
            id: newSpace.id,
            name: newSpace.name,
            width: newSpace.width,
            height: newSpace.height,
            thumbnail: newSpace.thumbnail, // already mapped in service
            createdAt: newSpace.createdAt,
            updatedAt: newSpace.updatedAt,
        }

        res.status(201).json({ success: true, space: spaceFrontend});
        return; 
    } catch (error) {
        console.error("Error creating space:", error);
        res.status(500).json({ success: false, error: "Failed to create space." });
        return;
    }
};

// for getting all spaces created by authenticated user
export const getAllSpaces = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id; // Get user ID from authenticated request
        const spaces = await spaceService.listMySpace(userId);

        res.status(200).json({ success: true, sessions: spaces }) // 'sessions' matches frontend expectation
        return
    } catch (error: any) {
        console.error("Error in getAllSpace controller:", error);
        res.status(500).json({ success: false, error: "Failed to retrieve spaces"});
        return;
    }
};

// to get a specific space by ID
export const getSpaceById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const space = await spaceService.getSpaceDetails(id);
        res.status(200).json({ success: true, space });
        return;
    } catch (error: any) {
        console.error("Error deleting space:", error);
        if (error instanceof Error) {
            if (error.message === "Space not found") {
                res.status(404).json({ success: false, error: "Space not found."});
            }
            if (error.message === "Not authorized to delete this space.") {
                res.status(403).json({ success: false, error: "Unauthorized to delete this space."});
            }
        }
        res.status(500).json({ success: false, error: "Failed to delete space."});
    }
};

// To delete a space
export const deleteSpace = async (req: Request, res: Response): Promise<void> => {
    try {
        const { spaceId } = req.params;
        const userId = (req as any).user.id;

        await spaceService.deleteSpace(userId, spaceId);

        res.status(200).json({ success: true, message: "Space deleted successfully." });
        return;
    } catch (error: any) {
        console.error("Error deleting space:", error);
        // error handling for authorization/not found
        if (error instanceof Error) {
            if (error.message === "Space not found") {
                res.status(404).json({ success: false, error: "Space not found." });
                return;
            }
            if (error.message === "Not authorized to delete this space.") {
                res.status(403).json({ success: false, error: "Unauthorized to delete this space." });
                return;
            }
        }
        res.status(500).json({ success: false, error: "Failed to delete space." });
        return;
    }
};
