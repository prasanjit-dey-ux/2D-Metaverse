import { z } from "zod";

export const userMetadataSchema = z.object({
    username: z.string()
        .min(3, "Username must be at least 3 characters long.")
        .max(20, "Username must not exceed 20 characters.")
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores."),
    displayName:  z.string().min().optional().nullable().transform(e => e === "" ? null : e),
    bannerImageUrl: z.string().url("Invalid URL for banner image.").optional().nullable().transform(e => e === "" ? null : e),
    profileImageUrl: z.string().url("Invalid URL for profile image.").optional().nullable().transform(e => e === "" ? null : e),
    bio: z.string().max(160, "Bio must not exceed 160 characters.").optional().nullable().transform(e => e === "" ? null : e),
});

export type UserMetadata = z.infer<typeof userMetadataSchema>;
export type UserMetadataInput = z.infer<typeof userMetadataSchema>;