import client from "@metaverse/db/client";
import { Prisma } from "@metaverse/db/client";

export interface CreateSpaceInput {
    mapId: string;
    name: string;
}

export async function createSpace(userId: string, input: CreateSpaceInput) {
    const { mapId, name } = input;

    const map = await client.map.findUnique({
        where: { id: mapId },
        include: { mapElements: true},
    });
    if (!map) throw new Error("Map not found");

    return client.$transaction(async tx => {
        // Create the session space
        const space = await tx.space.create({
            data: {
                name,
                width: map.width,
                height: map.height,
                creatorId: userId,
                mapId: map.id // Explicitly providing mapId
            },
            // Include map details for the response, similar to how getAllSpaces expects it
            select: {
                id: true,
                name: true,
                width: true,
                height: true,
                createdAt: true,
                updatedAt: true,
                map: { // Include the map relation to get its thumbnail
                    select: {
                        thumbnailUrl: true
                    }
                }
            }
        });

        // bulk-insert all elements from the map template
        // Only proceed if mapElements exist, otherwise it could try to map undefined
        if (map.mapElements && map.mapElements.length > 0) {
            const elementData: Prisma.SpaceElementsCreateManyInput[] = map.mapElements.map(e => ({
                spaceId: space.id,
                elementId: e.elementId,
                x: e.x ?? 0,
                y: e.y ?? 0,
            }));
            await tx.spaceElements.createMany({ data: elementData});
        }

        // Return the created space, ensuring it includes the map thumbnail if needed by the controller
        // The return structure here should match what the controller expects.
        // For getAllSpaces transformation to work, it needs map.thumbnailUrl.

        return {
            ...space,
            thumbnail: space.map.thumbnailUrl // // Add thumbnail property for consistency with frontend expectation
        };
    });
}

export async function listMySpace(userId: string) {
    return client.space.findMany({
        where: { creatorId: userId},
        select: {
            id: true,
            name: true,
            width: true,
            height: true,
            createdAt: true, // Inclue createAt/Update at for consistency
            updatedAt: true,
            map: {
                select: {
                    thumbnailUrl: true
                }
            }
        },
    }).then(spaces => spaces.map(space => ({
        id: space.id,
        name: space.name,
        width: space.width,
        height: space.height,
        thumbnail: space.map.thumbnailUrl,
        createdAt: space.createdAt,
        updatedAt: space.updatedAt,
    })));
}

export async function deleteSpace(userId:string, spaceId: string) {
    const space = await client.space.findUnique({where: { id: spaceId}});
    if (!space) throw new Error("Space not found");
    if (space.creatorId !== userId) throw new Error("Not authorized to delete this space");

    // Fix: Delete related SpaceElement first to avoid foreign key constrains
    await client.spaceElements.deleteMany({
        where: { spaceId: spaceId}
    });

    await client.space.delete({ where: { id: spaceId}});
}

export async function getSpaceDetails(spaceId: string) {
    const space = await client.space.findUnique({
        where: {
            id: spaceId
        },
        include: {
            elements: { include: {element: true}},
            map: {
                select: {
                    id: true,
                    name: true,
                    width: true,
                    height: true,
                    thumbnailUrl: true,
                }
            }
        },
    });
    if (!space) throw new Error("Space not found");
    return space;
}