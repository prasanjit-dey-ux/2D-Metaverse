// apps/frontend/src/Game/avatarAnimations.ts
import Phaser from 'phaser';

export const createAvatarAnimations = (
    scene: Phaser.Scene,
    textureKey: string // e.g., "player1", "player2" (without .png extension)
) => {
    const prefix = textureKey; 

    // Frame numbers for different directions (based on your spritesheet layout)
    // Make sure these match your actual avatar_anm spritesheets
    const staticFrames = [
        { key: `${prefix}-idle-right`, frame: 2 },  // Example: 3rd frame for idle right
        { key: `${prefix}-idle-down`, frame: 20 },  // Example: 21st frame for idle down
        { key: `${prefix}-idle-left`, frame: 14 },  // Example: 15th frame for idle left
        { key: `${prefix}-idle-up`, frame: 8 },    // Example: 9th frame for idle up
    ];

    const walkFrames = [
        { key: `${prefix}-walk-right`, start: 0, end: 5 },   // Frames for walking right
        { key: `${prefix}-walk-up`, start: 6, end: 11 },    // Frames for walking up
        { key: `${prefix}-walk-left`, start: 12, end: 17 },  // Frames for walking left
        { key: `${prefix}-walk-down`, start: 18, end: 23 },  // Frames for walking down
    ];

    // Create idle animations
    staticFrames.forEach(({ key, frame }) => {
        if (!scene.anims.exists(key)) { // Check if animation already exists before creating
            scene.anims.create({
                key,
                frames: [{ key: textureKey, frame }],
                frameRate: 10, // Adjust as needed
                repeat: -1, // Loop indefinitely
            });
            console.log(`Created idle animation: ${key}`);
        }
    });

    // Create walk animations
    walkFrames.forEach(({ key, start, end }) => {
        if (!scene.anims.exists(key)) { // Check if animation already exists before creating
            scene.anims.create({
                key,
                frames: scene.anims.generateFrameNumbers(textureKey, { start, end }),
                frameRate: 10, // Adjust as needed
                repeat: -1, // Loop indefinitely
            });
            console.log(`Created walk animation: ${key}`);
        }
    });
};
