import Phaser from "phaser";
import { createAvatarAnimations } from "../avatarAnimations";
import { Socket } from "socket.io-client";

interface PlayerData {
    x: number;
    y: number;
    direction: string;
    avatar: string; // This will now be the gameSheet filename (e.g., "player1.png")
}

export default class Map1Scene extends Phaser.Scene {
    player!: Phaser.Physics.Arcade.Sprite;
    cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    map!: Phaser.Tilemaps.Tilemap;
    lastDirection: string = "down";
    avatar: string; // This holds the gameSheet filename
    private socket: Socket;
    private myId: string = "";
    private otherPlayers: { [id: string]: Phaser.Physics.Arcade.Sprite } = {};
    private loadedAvatars: Set<string> = new Set(); // Stores gameSheet keys


    constructor(avatar: string, socket: Socket, socketId: string) {
        super("Map1Scene");
        this.avatar = avatar; // This is the gameSheet filename
        this.socket = socket;
        this.myId = socketId;
    }

    preload() {
        this.load.image("Floors_only_48x48", "/images/maps/Floors_only_48x48.png");
        this.load.image("Room_Builder_48x48", "/images/maps/Room_Builder_48x48.png");
        this.load.tilemapTiledJSON("map", "/images/maps/example.tmj");

        // Load the main player's avatar spritesheet from the new folder
        const avatarKey = this.getAvatarKey(this.avatar); // e.g., "player1"
        this.load.spritesheet(avatarKey, `/images/avatar_anm/${this.avatar}`, { // <--- FIXED PATH
            frameWidth: 48,
            frameHeight: 96,
        });
    }

    create() {
        this.map = this.make.tilemap({ key: "map" });

        const floorsTileset = this.map.addTilesetImage("Floors_only_48x48", "Floors_only_48x48");
        const roomBuilderTileset = this.map.addTilesetImage("Room_Builder_48x48", "Room_Builder_48x48"); 

        this.map.createLayer("Ground", [floorsTileset!], 0, 0); 
        
        const wallLayer = this.map.createLayer("Collision", [floorsTileset!, roomBuilderTileset!], 0, 0) as Phaser.Tilemaps.TilemapLayer;
        
        wallLayer.setCollisionByProperty({ collides: true });

        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setZoom(1);

        const offset = Phaser.Math.Between(-100, 100); 
        const spawnX = this.map.widthInPixels / 2 + offset;
        const spawnY = this.map.heightInPixels / 2 + offset;
        const avatarKey = this.getAvatarKey(this.avatar); // e.g., "player1"

        this.player = this.physics.add.sprite(spawnX, spawnY, avatarKey);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, wallLayer);
        
        
        this.cameras.main.startFollow(this.player);

        // Ensure animations are created only once for this avatar
        if (!this.loadedAvatars.has(avatarKey)) {
            createAvatarAnimations(this, avatarKey);
            this.loadedAvatars.add(avatarKey);
        }

        this.cursors = this.input.keyboard!.createCursorKeys();

        if (this.socket) {
            this.socket.on("connect", () => {
                this.myId = this.socket.id!;
                console.log("Map1Scene: Reconnected with socket id:", this.myId);
                // Emit initial position upon reconnection
                this.socket.emit("move", {
                    x: this.player.x,
                    y: this.player.y,
                    direction: this.lastDirection,
                    avatar: this.avatar,
                });
            });

            this.socket.on("playersUpdate", (players: { [id: string]: PlayerData }) => {
                console.log("Received playersUpdate:", players); // Temporary log
                this.updateOtherPlayers(players);
            });

            this.socket.on('disconnect', (reason: string) => {
                console.log(`Map1Scene: Disconnected from server: ${reason}`);
                // Destroy all other player sprites on disconnect
                Object.values(this.otherPlayers).forEach(p => p.destroy());
                this.otherPlayers = {};
            });
        }
    }

    update() {
        const speed = 250;
        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown) {
            vx = -speed;
            this.lastDirection = "left";
        } else if (this.cursors.right.isDown) {
            vx = speed;
            this.lastDirection = "right";
        }

        if (this.cursors.up.isDown) {
            vy = -speed;
            this.lastDirection = "up";
        } else if (this.cursors.down.isDown) {
            vy = speed;
            this.lastDirection = "down";
        }

        this.player.setVelocity(vx, vy);

        const avatarKey = this.getAvatarKey(this.avatar);
        if (vx === 0 && vy === 0) {
            // Play idle animation only if not currently playing that animation
            if (this.player.anims.currentAnim?.key !== `${avatarKey}-idle-${this.lastDirection}`) {
                this.player.anims.play(`${avatarKey}-idle-${this.lastDirection}`, true);
            }
        } else {
            // Play walk animation only if not currently playing that animation
            if (this.player.anims.currentAnim?.key !== `${avatarKey}-walk-${this.lastDirection}`) {
                this.player.anims.play(`${avatarKey}-walk-${this.lastDirection}`, true);
            }
        }

        // Only emit 'move' if the player's position or direction has actually changed
        // This is a basic optimization, more advanced would check position difference
        // For now, always emit if keys are down to ensure smooth real-time updates
        if (this.socket) {
            // Emit move event every frame if keys are pressed or player is still animating a walk
            // A more optimized approach would be to only emit when actual position or direction changes significantly
            // For now, let's ensure it's always emitting if moving or idle just finished
            this.socket.emit("move", {
                x: this.player.x,
                y: this.player.y,
                direction: this.lastDirection,
                avatar: this.avatar,
            });
        }
    }

    updateOtherPlayers(players: { [id: string]: PlayerData }) {
        // Remove players who are no longer in the 'players' object received from the server
        Object.keys(this.otherPlayers).forEach((id) => {
            if (!players[id]) {
                this.otherPlayers[id].destroy(); // Remove sprite from scene
                delete this.otherPlayers[id];    // Remove from local tracking object
            }
        });

        Object.entries(players).forEach(([id, data]) => {
            if (id === this.myId) return; // Don't update our own player via server updates

            const avatarKey = this.getAvatarKey(data.avatar); // e.g., "player1"

            // Check if the avatar spritesheet for this player is already loaded
            if (!this.loadedAvatars.has(avatarKey)) {
                // If not loaded, load it.
                if (!this.load.isLoading()) { 
                    this.load.spritesheet(avatarKey, `/images/avatar_anm/${data.avatar}`, { // <--- FIXED PATH
                        frameWidth: 48,
                        frameHeight: 96,
                    });

                    // Set up a one-time event listener for when this specific spritesheet finishes loading
                    this.load.once(`filecomplete-spritesheet-${avatarKey}`, () => {
                        createAvatarAnimations(this, avatarKey); // Create animations for the newly loaded sprite
                        this.loadedAvatars.add(avatarKey);       // Mark as loaded
                        this.createOtherPlayer(id, data, avatarKey); // Now create the player sprite
                    });

                    this.load.start(); // Start the loader to process the new spritesheet
                }
                return; // Exit, wait for loading to complete
            }

            // If avatar is loaded, either update existing player or create new one
            if (this.otherPlayers[id]) {
                // Update existing player's position and animation
                const sprite = this.otherPlayers[id];
                sprite.setPosition(data.x, data.y);

                const animKey = data.direction ? `${avatarKey}-walk-${data.direction}` : `${avatarKey}-idle-${data.direction || 'down'}`; // Ensure idle direction is chosen
                
                // Only play animation if it's different from the current one
                if (!sprite.anims.currentAnim || sprite.anims.currentAnim.key !== animKey) {
                    sprite.anims.play(animKey, true);
                }
            } else {
                // Create new player sprite (if it hasn't been created yet)
                this.createOtherPlayer(id, data, avatarKey);
            }
        });
    }

    private createOtherPlayer(id: string, data: PlayerData, avatarKey: string) {
        // This check prevents creating multiple sprites if updateOtherPlayers is called before loading completes
        if (!this.otherPlayers[id]) {
            const otherPlayer = this.physics.add.sprite(data.x, data.y, avatarKey);
            otherPlayer.setCollideWorldBounds(true);
            this.otherPlayers[id] = otherPlayer;

            const initialAnimKey = data.direction
                ? `${avatarKey}-walk-${data.direction}`
                : `${avatarKey}-idle-down`; // Default idle direction

            // Ensure animations exist before playing
            if (this.anims.exists(initialAnimKey)) {
                otherPlayer.anims.play(initialAnimKey, true);
            } else {
                // Fallback for cases where animation might not be ready yet (e.g. race condition)
                otherPlayer.anims.play(`${avatarKey}-idle-down`, true); // Play default idle
                console.warn(`Animation ${initialAnimKey} not found for other player ${id}. Playing default idle.`);
            }
        }
    }

    private getAvatarKey(filename: string): string {
        // Converts "player1.png" to "player1"
        return filename.split(".")[0];
    }
}
