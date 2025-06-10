import client from "@metaverse/db";
import { Prisma } from "@metaverse/db";

export interface CreateSpaceInput {
    mapId?: string; // map template
    name: string; // session name
    dimensions?:  string// eg: (1000x1000) if no map
}

export async function createSpace(
    userId: string,
    input: CreateSpaceInput
) {
    const { mapId, name, dimensions } = input;

    // if no mapId is present then parse dimention and create blank space
    if (!mapId) {
        if (!dimensions) throw new Error ("Dimention required if no mapId");
        const [w, h] = dimensions.split("x").map(n => parseInt(n, 10));
        return client.space.create({
            data: {name, width: w, height: h, creatorId: userId},
        });
    }

    // if map present then clone it in a single transaction
    const map = await client.map.findUnique({
        where: {id: mapId},
        include: {mapElements: true},
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
            },
        });

        // bulk-insert all elemnts fromt the map template
        const elementData: Prisma.SpaceElementsCreateManyInput[] = map.mapElements.map(e=> ({
            spaceId: space.id,
            elementId: e.elementId,
            x: e.x ?? 0,
            y: e.y ?? 0,
        }));

        await tx.spaceElements.createMany({ data: elementData});
        return space;
    });
}

export async function listMySpace(userId: string) {
    return client.space.findMany({
        where: { creatorId: userId},
        select: { id: true, name: true, thumbnail: true, width: true, height: true},
    });
}

export async function deleteSpace(userId: string, spaceId: string) {
    const space = await client.space.findUnique({ where: { id: spaceId} });
    if (!space) throw new Error("Space not found");
    if (space.creatorId !== userId) throw new Error ("Not authorized");
    await client.space.delete({ where: { id: spaceId}});
}

export async function  getSpaceDetails(spaceId: string) {
    const space = await client.space.findUnique({
        where: {
            id: spaceId
        },
        include: {
            elements: { include: { element: true}},
        },
    });
    if (!space) throw new Error("Space not found");
    return space;
}

// export async function joinSpace(
//     userId: string,
//     spaceId: string,
//     avatarId: string
// ) {
//     // prevent duplicate joins

// }
