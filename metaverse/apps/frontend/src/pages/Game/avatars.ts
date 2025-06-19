// apps/frontend/src/pages/Game/avatars.ts
// This array defines the available avatar sprites and their display names.
// Ensure the 'displaySprite' and 'gameSheet' values match the actual filenames in /public/images/avatars/ and /public/images/avatar_anm/

export const avatars = [
    {
        id: "avatar1", // Explicit ID matching Dashboard's generation
        name: "Freddie",
        displaySprite: "Freddie.png", // For display in UI (e.g., dashboard)
        gameSheet: "player1.png"      // For the Phaser game spritesheet
    },
    {
        id: "avatar2", // Explicit ID
        name: "Kurt",
        displaySprite: "Kurt.png",
        gameSheet: "player2.png"
    },    
    {
        id: "avatar3", // Explicit ID
        name: "Bella",
        displaySprite: "Bella.png",
        gameSheet: "player3.png"
    },    
    {
        id: "avatar4", // Explicit ID
        name: "Billie",
        displaySprite: "Billie.png",
        gameSheet: "player4.png"
    },    
    {
        id: "avatar5", // Explicit ID
        name: "Jimmy",
        displaySprite: "Jimmy.png",
        gameSheet: "player5.png"
    },    
];
