import client from "@metaverse/db";

export const generateUniqueTag = async (username: string): Promise<string> => {
    const maxRetries = 5;

    for (let i = 0; i< maxRetries; i++ ) {
        const tag = Math.floor(1000 + Math.random() * 9000).toString();

        const existing = await client.user.findUnique({
            where: {
                username_tag: {
                    username,
                    tag,
                },
            },
        });

        if(!existing) return tag;
    }

    throw new Error("Failed to generate unique tag. Please try again");
}

