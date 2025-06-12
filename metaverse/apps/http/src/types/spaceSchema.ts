import { z } from "zod";

export const createSpaceSchema = z.object({
    name: z.string().min(3, "Space name must be at least 3 character long"),
    mapId: z.string().cuid("Invalid map ID format"),
    width: z.number().int().positive("Width must be positive integer"),
    height: z.number().int().positive("Height must be a positive integer"),
});

export type CreateSpaceInput = z.infer<typeof createSpaceSchema>