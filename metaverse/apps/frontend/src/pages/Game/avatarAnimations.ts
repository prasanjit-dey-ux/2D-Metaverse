// frontend/src/pages/Game/avatarAnimations.ts
import Phaser from 'phaser';

export const createAvatarAnimations = (
  scene: Phaser.Scene,
  textureKey: string
) => {
  const prefix = textureKey; // e.g., "player1", "player2"

  const staticFrames = [
    { key: `${prefix}-idle-right`, frame: 2 },
    { key: `${prefix}-idle-down`, frame: 20 },
    { key: `${prefix}-idle-left`, frame: 14 },
    { key: `${prefix}-idle-up`, frame: 8 },
  ];

  const walkFrames = [
    { key: `${prefix}-walk-right`, start: 0, end: 5 },
    { key: `${prefix}-walk-up`, start: 6, end: 11 },
    { key: `${prefix}-walk-left`, start: 12, end: 17 },
    { key: `${prefix}-walk-down`, start: 18, end: 23 },
  ];

  // Create idle animations
  staticFrames.forEach(({ key, frame }) => {
    // Check if animation already exists before creating
    if (!scene.anims.exists(key)) {
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
    // Check if animation already exists before creating
    if (!scene.anims.exists(key)) {
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(textureKey, { start, end }),
        frameRate: 10, // Adjust as needed
        repeat: 1, // Loop indefinitely
      });
      console.log(`Created walk animation: ${key}`);
    }
  });
};
