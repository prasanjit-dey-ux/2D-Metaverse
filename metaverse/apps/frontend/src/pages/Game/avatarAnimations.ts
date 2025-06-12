import Phaser from "phaser";

/**
 * Creates standard idle and walk animations for a given avatar spritesheet.
 * Assumes a specific spritesheet layout (e.g., 6 frames per direction, 4 directions).
 * @param scene The Phaser scene where the animations will be added.
 * @param textureKey The key used to load the spritesheet (e.g., "player1").
 */
export const createAvatarAnimations = (
    scene: Phaser.Scene,
    textureKey: string
) => {
    const prefix = textureKey; // Use textureKey as the animation prefix

    // Define static (idle) frames for each direction
    const staticFrames = [
        { key: `${prefix}-idle-right`, frame: 2 },   // Example frame for idle right
        { key: `${prefix}-idle-down`, frame: 20 },   // Example frame for idle down (often front-facing)
        { key: `${prefix}-idle-left`, frame: 14 },   // Example frame for idle left
        { key: `${prefix}-idle-up`, frame: 8 },    // Example frame for idle up (often back-facing)
    ];

    // Define walk animation frame ranges for each direction
    const walkFrames = [
        { key: `${prefix}-walk-right`, start: 0, end: 5 },
        { key: `${prefix}-walk-up`, start: 6, end: 11 },
        { key: `${prefix}-walk-left`, start: 12, end: 17 },
        { key: `${prefix}-walk-down`, start: 18, end: 23 },
    ];

    // Create idle animations
    staticFrames.forEach(({ key, frame }) => {
        if (!scene.anims.exists(key)) {
            scene.anims.create({
                key,
                frames: [{ key: textureKey, frame }],
                frameRate: 10,
                repeat: 1,
            });
        }
    });

    // Create walk animations
    walkFrames.forEach(({ key, start, end }) => {
        if (!scene.anims.exists(key)) {
            scene.anims.create({
                key,
                frames: scene.anims.generateFrameNumbers(textureKey, { start, end }),
                frameRate: 10,
                repeat: 1,
            });
        }
    });
};
