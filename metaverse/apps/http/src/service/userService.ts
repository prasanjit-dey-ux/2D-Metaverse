import client from "@metaverse/db/client";
import { UserMetadataInput, userMetadataSchema } from "../types/userSchema";

export async function updateUserMetadata (userId: string, input: UserMetadataInput ) {
    const {
        username,
        displayName,
        profileImageUrl,
        bannerImageUrl,
        bio
    } = input;
    const finalDisplayName = displayName ?? username;

    try {
        const user = await client.user.update({
            where: { id: userId },
            data: {
                username,
                displayName: finalDisplayName,
                bannerImageUrl,
                profileImageUrl,
//              bio,
                isProfileComplete: true,
            },
            select: {
                id: true,
                email: true,
                username: true, 
                tag: true,
                displayName: true,
                bannerImageUrl: true,
                profileImageUrl: true,
                // bio: true,
                isProfileComplete:true,
            },
        });

        return user;
    } catch (err : any) {
        if (err.code === "P2002") {
            throw new Error("Username or tag already taken");
        }
        throw err;
    }

}