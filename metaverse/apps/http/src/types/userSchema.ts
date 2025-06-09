import { z } from "zod";

export const userMetadataSchema = z.object({
    username: z.string().min(3, "Username is required"),
    displayName:  z.string().min(1).optional(),
    bannerImageUrl: z.string().url().optional(),
    profileImageUrl: z.string().url().optional(),
    bio: z.string().max(160).optional(), 
});

export type UserMetadataInput = z.infer<typeof userMetadataSchema>;