// import client from "@metaverse/db/client";
// import { UserMetadataInput, userMetadataSchema } from "../types/userSchema";

// export async function updateUserMetadata (userId: string, input: UserMetadataInput ) {
//     const {
//         username,
//         displayName,
//         profileImageUrl,
//         bannerImageUrl,
//         bio
//     } = input;
//     const finalDisplayName = displayName ?? username;

//     try {
//         const user = await client.user.update({
//             where: { id: userId },
//             data: {
//                 username,
//                 displayName: finalDisplayName,
//                 bannerImageUrl,
//                 profileImageUrl,
//                 bio,
//                 isProfileComplete: true,
//             },
//             select: {
//                 id: true,
//                 email: true,
//                 username: true, 
//                 tag: true,
//                 displayName: true,
//                 bannerImageUrl: true,
//                 profileImageUrl: true,
//                 bio: true,
//                 isProfileComplete:true,
//             },
//         });

//         return user;
//     } catch (err : any) {
//         if (err.code === "P2002") {
//             throw new Error("Username or tag already taken");
//         }
//         throw err;
//     }

// }


import client from "@metaverse/db/client"; // Your Prisma client instance
import { generateUniqueTag } from "@metaverse/utils"; // Assuming this exists and works
import { UserMetadata } from "../types/userSchema"; 

export async function updateUserMetadata(userId: string, data: UserMetadata ) {
    const {
        username,
        displayName,
        bio,
        profileImageUrl,
        bannerImageUrl
    } = data;

    const currentUser = await client.user.findUnique({ where: { id: userId } });
    let updateTag = currentUser?.tag;

    if (currentUser && currentUser.username !== username) {
        updateTag = await generateUniqueTag(username);
    } 

    try {
        const user = await client.user.update({
            where: { id: userId},
            data: {
                username,
                displayName: displayName || null,
                bannerImageUrl: bannerImageUrl || null,
                profileImageUrl: profileImageUrl || null,
                bio: bio || null,
                isProfileComplete: true,
                tag: updateTag
            },
            select: {
                id: true,
                email: true,
                username: true,
                tag: true,
                displayName: true,
                bannerImageUrl: true, 
                profileImageUrl: true,
                bio: true,            
                isProfileComplete: true,
                provider: true,
                providerId: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
            }
        });

        return user;
    } catch (err : any) {
        if (err.code === "P2002") {
            throw new Error("Username or tag already taken"); // This specific message is caught by userController
        }
        throw err; 
    }
}

export const getUserById = async (userId: string) => {
    return await client.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            bio: true,
            profileImageUrl: true,
            bannerImageUrl: true, 
            isProfileComplete: true,
            provider: true,
            providerId: true,
            tag: true,
            createdAt: true,
            updatedAt: true,
            lastLoginAt: true,
        },
    });
}