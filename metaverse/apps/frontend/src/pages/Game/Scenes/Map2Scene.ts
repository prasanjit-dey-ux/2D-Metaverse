import Phaser from "phaser";
import { createAvatarAnimations } from "../avatarAnimations"; // Ensure this import is correct

interface PlayerData {
  id: string;
  username: string;
  x: number;
  y: number;
  direction: string;
  avatar: string; // This is the gameSheet filename (e.g., "player1.png")
  spaceId: string;
}

interface SceneData {
  avatar: string; // This is the gameSheet filename (e.g., "player1.png")
  socket: any;
  socketId: string;
  username: string;
  spaceId: string;
  gameControlCallback: ((control: 'toggleMute' | 'enteredPrivate' | 'exitedPrivate') => void);
}

export default class Map2Scene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private map!: Phaser.Tilemaps.Tilemap;
  private lastDirection: string = "down";
  private avatar!: string; // Local player's avatar filename
  private username!: string; // Local player's username
  private spaceId!: string; // Current space ID
  private socket: any;
  private myId: string = "";
  private otherPlayers: { [id: string]: Phaser.Physics.Arcade.Sprite } = {};
  // `loadedAvatarAnimations` tracks if animation sets for a specific avatar KEY have been created in Phaser.
  private loadedAvatarAnimations: Set<string> = new Set(); 

  private privateAreaText?: Phaser.GameObjects.Text;
  private receptionistText?: Phaser.GameObjects.Text;
  private backgroundMusic?: Phaser.Sound.WebAudioSound; 
  private lastMusicVolume: number = 0.5;

  private gameControlCallback!: ((control: 'toggleMute' | 'enteredPrivate' | 'exitedPrivate') => void);

  constructor() {
    super("Map2Scene");
    console.log("Map2Scene: Constructor called.");
  }

  init(data: SceneData) {
    this.avatar = data.avatar;
    this.username = data.username;
    this.spaceId = data.spaceId;
    this.socket = data.socket;
    this.myId = data.socketId;
    this.gameControlCallback = data.gameControlCallback;
    console.log("Map2Scene: init() called. Game control callback received. Username:", this.username, "SpaceId:", this.spaceId, "Avatar:", this.avatar);
  }

  preload() {
    console.log("Map2Scene: preload() called. Loading assets...");
    this.load.on('fileloaderror', (file: Phaser.Loader.File) => {
        console.error(`Map2Scene: Error loading file: ${file.key} at ${file.url}`);
    });
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
        console.error(`Map2Scene: Generic load error for file: ${file.key} at ${file.url}`);
    });
    this.load.on('complete', () => {
        console.log("Map2Scene: All assets loaded successfully or with warnings.");
        console.log("Map2Scene: Textures in cache after preload:", this.sys.textures.list);
        if (!this.sys.textures.exists(this.getAvatarKey(this.avatar))) {
            console.error(`Map2Scene: Player avatar texture '${this.getAvatarKey(this.avatar)}' not found in cache after preload.`);
        }
        if (!this.sys.textures.exists("receptionist")) {
            console.error("Map2Scene: Receptionist texture 'receptionist' not found in cache after preload.");
        }
    });

    // Load static map assets
    this.load.image("Floors_only_48x48", "/images/maps/Floors_only_48x48.png");
    this.load.image("Room_Builder_48x48", "/images/maps/Room_Builder_48x48.png");
    this.load.image("Conference", "/images/maps/Conference.png");
    this.load.image("Generic", "/images/maps/Generic.png");
    this.load.image("basement", "/images/maps/basement.png");
    this.load.image("library", "/images/maps/library.png");
    this.load.tilemapTiledJSON("map", "/images/maps/auditorium.tmj");

    // Load local player's avatar spritesheet
    const localAvatarKey = this.getAvatarKey(this.avatar);
    this.load.spritesheet(localAvatarKey, `/images/avatar_anm/${this.avatar}`, {
      frameWidth: 48,
      frameHeight: 96,
    });
    // PROACTIVE: Create local player's animations immediately after loading the spritesheet
    this.load.once(`filecomplete-spritesheet-${localAvatarKey}`, () => {
        if (!this.loadedAvatarAnimations.has(localAvatarKey)) {
            createAvatarAnimations(this, localAvatarKey);
            this.loadedAvatarAnimations.add(localAvatarKey);
            console.log(`Map2Scene: Local player avatar animations created during preload for ${localAvatarKey}.`);
        }
    }, this);

    // Load receptionist spritesheet
    this.load.spritesheet("receptionist", "/images/avatar_anm/receptionist.png", {
      frameWidth: 48,
      frameHeight: 48,
    });

    this.load.audio("background_music", "/audio/background_music.mp3");
  }

  create() {
    console.log("Map2Scene: create() called. Initializing map and scene elements.");

    this.map = this.make.tilemap({ key: "map" });
    if (!this.map) {
        console.error("Map2Scene: Failed to create tilemap. 'map' key might be incorrect or TMJ file is invalid. Stopping scene creation.");
        return;
    }
    console.log(`Map2Scene: Tilemap created successfully. Map dimensions: ${this.map.widthInPixels}x${this.map.heightInPixels} pixels.`);

    const tileset1 = this.map.addTilesetImage("Floors_only_48x48", "Floors_only_48x48");
    const tileset2 = this.map.addTilesetImage("Room_Builder_48x48", "Room_Builder_48x48");
    const tileset3 = this.map.addTilesetImage("Conference", "Conference");
    const tileset4 = this.map.addTilesetImage("Generic", "Generic");
    const tileset5 = this.map.addTilesetImage("basement", "basement");
    const tileset6 = this.map.addTilesetImage("library", "library");

    const layersConfig = [
      { name: "Floor", tileset: [tileset1, tileset2], collision: false },
      { name: "Stage", tileset: [tileset3], collision: true },
      { name: "Wall", tileset: [tileset2], collision: true },
      { name: "Monitor", tileset: [tileset3], collision: false },
      { name: "Decor", tileset: [tileset4, tileset5, tileset6], collision: true },
      { name: "Wall2", tileset: [tileset2], collision: true },
      { name: "PrivateZone", tileset: [tileset4], collision: true },
      { name: "Reception", tileset: [tileset4, tileset5, tileset6], collision: true },
      { name: "Decor2", tileset: [tileset4, tileset5, tileset6], collision: true }
    ];

    const avatarKey = this.getAvatarKey(this.avatar);
    
    // Player spawn logic
    const spawnObject = this.map
      .getObjectLayer("Spawn")
      ?.objects.find((obj) => obj.name === "playerSpawn");
    const baseX = spawnObject?.x ?? this.map.widthInPixels / 2;
    const baseY = spawnObject?.y ?? this.map.heightInPixels / 2;
    const offsetX = Phaser.Math.Between(-20, 20);
    const offsetY = Phaser.Math.Between(-20, 20);
    const spawnX = baseX + offsetX;
    const spawnY = baseY + offsetY;

    if (this.sys.textures.exists(avatarKey)) {
        this.player = this.physics.add.sprite(spawnX, spawnY, avatarKey);
        this.player.setCollideWorldBounds(true).setDepth(3);
        console.log(`Map2Scene: Local player sprite created at (${spawnX}, ${spawnY}).`);
    } else {
        console.error(`Map2Scene: Cannot create local player sprite. Texture '${avatarKey}' not found. Game may not function correctly.`);
    }

    // Create map layers and add colliders
    layersConfig.forEach(layerInfo => {
      const layer = this.map.createLayer(
        layerInfo.name, 
        layerInfo.tileset as (Phaser.Tilemaps.Tileset | Phaser.Tilemaps.Tileset[]), 
        0, 0
      );
      if (!layer) {
          console.warn(`Map2Scene: Layer '${layerInfo.name}' could not be created. Check Tiled map layer names and tilesets. This layer might be missing from your TMJ.`);
      } else {
          console.log(`Map2Scene: Layer '${layerInfo.name}' created.`);
          if (layerInfo.collision && this.player) {
              layer.setCollisionFromCollisionGroup();
              this.physics.add.collider(this.player, layer);
              console.log(`Map2Scene: Collider added for layer '${layerInfo.name}'.`);
          }
      }
    });

    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setZoom(1);

    if (this.player) {
        this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
        console.log("Map2Scene: Camera set to follow local player.");
    }

    console.log("Map2Scene: Physics world and camera bounds set.");

    // Initialize cursors
    if (this.input?.keyboard) { 
      this.cursors = this.input.keyboard.createCursorKeys();
    } else {
      console.warn("Map2Scene: Keyboard input not available. Local player movement might not work.");
    }

    // Socket.IO setup
    if (this.socket) {
      this.socket.on("connect", () => {
        this.myId = this.socket.id;
        console.log(`Map2Scene: Socket connected in scene with ID: ${this.myId}`);
      });

      this.socket.on(
        "playersUpdate",
        (players: { [id: string]: PlayerData }) => {
          this.updateOtherPlayers(players);
        }
      );

      // Listen for chat input focus/blur events to manage Phaser keyboard input
      this.socket.on('chatInputFocused', () => {
        if (this.input?.keyboard) { 
          this.input.keyboard.enabled = false;
          console.log("Phaser keyboard input DISABLED (chat focused).");
        }
      });
      this.socket.on('chatInputBlurred', () => {
        if (this.input?.keyboard) { 
          this.input.keyboard.enabled = true;
          console.log("Phaser keyboard input ENABLED (chat blurred).");
        }
      });

      if (this.player) {
          this.socket.emit("newPlayer", {
            username: this.username,
            avatar: this.avatar,
            spaceId: this.spaceId,
            x: this.player.x,
            y: this.player.y,
            direction: this.lastDirection,
          });
          console.log(`Map2Scene: Emitted 'newPlayer' event for ${this.username} (${this.myId}) in space ${this.spaceId}.`);
      } else {
          console.error("Map2Scene: Local player sprite not created, cannot emit 'newPlayer' event.");
      }
    }

    // Setup interactive elements and NPCs
    this.setupMonitorClick();
    this.setupPrivateZones();
    this.showReceptionistWelcome(); 

    console.log("✅ Map2Scene created with:", {
      avatar: this.avatar,
      socketId: this.myId,
      username: this.username,
      spaceId: this.spaceId,
    });

    // Background music setup
    if (this.sound) {
        this.backgroundMusic = this.sound.add("background_music", {
          loop: true,
          volume: this.lastMusicVolume,
        }) as Phaser.Sound.WebAudioSound;
        
        this.backgroundMusic.play();
        console.log("Map2Scene: Background music initialized and playing.");
    } else {
        console.warn("Map2Scene: Sound manager not available. Background music will not play.");
    }

    this.sys.game.events.on('toggleMusicMute', this.handleMusicMuteToggle, this);
  }

  update() {
    if (!this.cursors || !this.player) {
      return;
    }

    // Only allow player movement if keyboard input is enabled (i.e., chat is not focused)
    if (this.input?.keyboard?.enabled) {
      const speed = 250;
      let vx = 0, vy = 0;

      if (this.cursors.left?.isDown) { vx = -speed; this.lastDirection = "left"; }
      else if (this.cursors.right?.isDown) { vx = speed; this.lastDirection = "right"; }

      if (this.cursors.up?.isDown) { vy = -speed; this.lastDirection = "up"; }
      else if (this.cursors.down?.isDown) { vy = speed; this.lastDirection = "down"; }

      this.player.setVelocity(vx, vy);

      const avatarKey = this.getAvatarKey(this.avatar);
      const isMoving = vx !== 0 || vy !== 0;
      const animKey = isMoving
        ? `${avatarKey}-walk-${this.lastDirection}`
        : `${avatarKey}-idle-${this.lastDirection}`;

      // Only play animation if it's different from the current one
      if (this.sys.textures.exists(avatarKey) && this.player.anims.currentAnim?.key !== animKey) {
        this.player.anims.play(animKey, true);
        // console.log(`Map2Scene: Local player playing animation: ${animKey}`); // Uncomment for detailed local player anim debugging
      }

      // Emit move event only if actually moving
      if (this.socket && isMoving) {
        this.socket.emit("move", {
          x: this.player.x,
          y: this.player.y,
          direction: this.lastDirection,
          avatar: this.avatar,
        });
      }
    } else {
        // If keyboard input is disabled (chat is open), stop local player movement and ensure idle animation
        this.player.setVelocity(0, 0);
        const avatarKey = this.getAvatarKey(this.avatar);
        const animKey = `${avatarKey}-idle-${this.lastDirection}`;
        if (this.sys.textures.exists(avatarKey) && this.player.anims.currentAnim?.key !== animKey) {
            this.player.anims.play(animKey, true);
        }
    }
  }

  // Refactored to handle new vs. existing players more robustly
  updateOtherPlayers(players: { [id: string]: PlayerData }) {
    const activePlayerIds = new Set(Object.keys(players));
    const currentOtherPlayerIds = new Set(Object.keys(this.otherPlayers));

    // Cleanup players who have left the space
    currentOtherPlayerIds.forEach((id) => {
      if (!activePlayerIds.has(id)) {
        const spriteToRemove = this.otherPlayers[id];
        if (spriteToRemove) {
            spriteToRemove.destroy();
            // FIX: Destroy the associated username text when player leaves
            const usernameText = spriteToRemove.getData('usernameText') as Phaser.GameObjects.Text;
            if (usernameText) {
                usernameText.destroy();
                console.log(`Map2Scene: Destroyed username text for disconnected player ${id}.`);
            }
            delete this.otherPlayers[id];
            console.log(`Map2Scene: Removed disconnected player ${id}.`);
        }
      }
    });

    // Add or update existing players
    Object.entries(players).forEach(([id, data]) => {
      if (id === this.myId) {
        return; // Skip local player
      }

      const avatarKey = this.getAvatarKey(data.avatar);

      // Handle NEW players: load asset, create animations, then create sprite
      if (!this.otherPlayers[id]) {
          console.log(`Map2Scene: NEW other player detected: ${id} (${data.username}).`);
          // Check if spritesheet texture for this avatar is already loaded
          if (!this.sys.textures.exists(avatarKey)) {
              console.log(`Map2Scene: Queuing spritesheet '${avatarKey}' for new player ${id}.`);
              this.load.spritesheet(avatarKey, `/images/avatar_anm/${data.avatar}`, {
                  frameWidth: 48,
                  frameHeight: 96,
              });
              // Set up a listener for WHEN THIS SPECIFIC SPRITESHEET FINISHES LOADING
              this.load.once(`filecomplete-spritesheet-${avatarKey}`, () => {
                  console.log(`Map2Scene: Spritesheet '${avatarKey}' loaded for new player '${id}'.`);
                  // Ensure animations are created if they don't exist after loading
                  if (!this.anims.get(`${avatarKey}-idle-down`)) { // Check if a common animation for this key exists
                      createAvatarAnimations(this, avatarKey);
                      this.loadedAvatarAnimations.add(avatarKey);
                      console.log(`Map2Scene: Created animations for new player (on-demand): ${avatarKey}.`);
                  }
                  // Now that assets and animations are ready, create the sprite
                  this.createOtherPlayerSprite(id, data, avatarKey);
              }, this); // Pass 'this' as context to the callback for proper scope
              
              // IMPORTANT: Only start the loader if it's not already running and there's something new to load
              if (!this.load.isLoading()) {
                  this.load.start(); 
                  console.log("Map2Scene: Loader started for new spritesheet.");
              } else {
                  console.log("Map2Scene: Loader already running, new spritesheet added to queue.");
              }
          } else {
              // Spritesheet already exists. Ensure animations are created.
              if (!this.anims.get(`${avatarKey}-idle-down`)) {
                  createAvatarAnimations(this, avatarKey);
                  this.loadedAvatarAnimations.add(avatarKey);
                  console.log(`Map2Scene: Animations created for existing avatar texture (pre-loaded): ${avatarKey}.`);
              }
              // Then create the sprite immediately
              this.createOtherPlayerSprite(id, data, avatarKey);
          }
      } else {
          // Handle EXISTING players: update position and animation
          const sprite = this.otherPlayers[id];
          const usernameText = sprite.getData('usernameText') as Phaser.GameObjects.Text;

          // Always update position and text position
          sprite.setPosition(data.x, data.y);
          if (usernameText) {
              usernameText.setPosition(data.x, data.y - 60); // Adjust Y offset as needed
          }

          // Determine animation key
          // Check if player is moving by comparing current position to received position
          // Using a small threshold to account for floating point inaccuracies
          const isOtherMoving = Math.abs(sprite.x - data.x) > 0.1 || Math.abs(sprite.y - data.y) > 0.1;
          const otherPlayerFacingDirection = data.direction || 'down';
          const animKey = isOtherMoving
            ? `${avatarKey}-walk-${otherPlayerFacingDirection}`
            : `${avatarKey}-idle-${otherPlayerFacingDirection}`;

          // Crucial: Ensure animation exists before playing for existing players
          // If animation doesn't exist, create it (it might be a very first movement packet)
          if (!this.anims.get(animKey) && !this.loadedAvatarAnimations.has(avatarKey)) {
              console.warn(`Map2Scene: Animation '${animKey}' not found for EXISTING player ${id}. Creating animations for ${avatarKey} now.`);
              createAvatarAnimations(this, avatarKey);
              this.loadedAvatarAnimations.add(avatarKey);
          }
          
          // Play animation if it's different from current OR if it was just created/confirmed to exist
          if (sprite.anims.currentAnim?.key !== animKey && this.anims.get(animKey)) {
            sprite.anims.play(animKey, true);
            console.log(`Map2Scene: Player ${id} playing animation: ${animKey}`); 
          } else if (!this.anims.get(animKey)) {
            console.warn(`Map2Scene: Animation '${animKey}' still NOT FOUND for player ${id}. Sprite will be static.`);
          }
      }
    });
  }

  // Helper function to centralize the actual sprite creation once all assets and animations are ready
  private createOtherPlayerSprite(id: string, data: PlayerData, avatarKey: string) {
    // Critical double-check before creating the sprite
    if (!this.sys.textures.exists(avatarKey)) {
        console.error(`Map2Scene: FATAL ERROR: Cannot create other player sprite for '${id}'. Texture '${avatarKey}' still not found in cache. This should not happen.`);
        return;
    }
    if (this.otherPlayers[id]) { // Prevent re-creating if it somehow got created already
        console.warn(`Map2Scene: Attempted to re-create existing other player sprite for ${id}. Skipping redundant creation.`);
        return;
    }

    const otherPlayer = this.physics.add.sprite(data.x, data.y, avatarKey);
    otherPlayer.setCollideWorldBounds(true).setDepth(3); // Ensure depth for proper layering
    this.otherPlayers[id] = otherPlayer;
    
    const animKey = `${avatarKey}-idle-${data.direction || 'down'}`;
    // Play initial animation. It *must* exist now due to the logic in createOrUpdateOtherPlayerSprite.
    if (this.anims.get(animKey)) { 
        otherPlayer.play(animKey, true);
        console.log(`Map2Scene: Other player '${id}' sprite created and playing animation: ${animKey}.`);
    } else {
        // This warning should ideally not happen with the refined logic, but keep for debugging.
        console.warn(`Map2Scene: Animation '${animKey}' not found for other player '${id}' immediately after sprite creation. Sprite will be static.`);
    }
    
    // Create and attach username text
    const usernameText = this.add.text(data.x, data.y - 60, data.username, {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 5, y: 2 },
      align: 'center'
    }).setOrigin(0.5, 0.5).setDepth(4); // Ensure text is above player
    otherPlayer.setData('usernameText', usernameText); // Store text object with sprite
    console.log(`Map2Scene: Username text created for player ${id}: '${data.username}'`);
  }


  private getAvatarKey(filename: string): string {
    return filename.split(".")[0];
  }


  private setupMonitorClick() {
    const existingMonitorObjects = this.map.getObjectLayer("Monitors")?.objects;
    existingMonitorObjects?.forEach((obj) => {
        const type = obj.properties?.find((p: any) => p.name === "type")?.value;
        if (type === "monitor") {
            const monitorZone = this.add.zone(obj.x!, obj.y!, obj.width ?? 48, obj.height ?? 48)
              .setOrigin(0, 0)
              .setInteractive({ useHandCursor: true });
            monitorZone.on("pointerdown", () => this.showVideo("/videos/video.mp4"));
        }
    });
  }

  private showVideo(src: string) {
    const videoElement = document.getElementById("monitor-video") as HTMLVideoElement;
    const closeButton = document.getElementById("monitor-close") as HTMLButtonElement;

    if (videoElement && closeButton) {
      videoElement.src = src;
      videoElement.style.display = "block";
      closeButton.style.display = "block";
      videoElement.play();

      closeButton.onclick = () => {
        videoElement.pause();
        videoElement.style.display = "none";
        closeButton.style.display = "none";
      };
    }
  }

  private setupPrivateZones() {
    const zones = this.map.getObjectLayer("PrivateAreas")?.objects;

    zones?.forEach((zone) => {
      const privateArea = this.add
        .zone(zone.x!, zone.y!, zone.width!, zone.height!)
        .setOrigin(0, 0);

      this.physics.world.enable(privateArea);
      (privateArea as any).playerInside = false;

      if (!this.privateAreaText) {
        this.privateAreaText = this.add
          .text(16, 16, "", {
            fontSize: "18px",
            color: "#fff",
            backgroundColor: "#000",
            padding: { x: 8, y: 4 },
          })
          .setScrollFactor(0)
          .setDepth(1000)
          .setVisible(false);
      }

      if (this.player) {
          this.physics.add.overlap(this.player, privateArea, () => {
            if (!(privateArea as any).playerInside) {
              (privateArea as any).playerInside = true;
              this.privateAreaText!.setText(
                "🕵️ You entered a private area"
              ).setVisible(true);
              if (this.gameControlCallback) {
                  this.gameControlCallback('enteredPrivate');
              }
            }
          });

          this.events.on("update", () => {
            if (!this.physics.overlap(this.player, privateArea)) {
              if ((privateArea as any).playerInside) {
                (privateArea as any).playerInside = false;
                this.privateAreaText!.setVisible(false);
                if (this.gameControlCallback) {
                    this.gameControlCallback('exitedPrivate');
                }
              }
            }
          });
      } else {
          console.warn("Map2Scene: Player not initialized, private zone overlap will not be active.");
      }
    });
  }

  private showReceptionistWelcome() {
    const receptionistObj = this.map
      .getObjectLayer("Receptionist")
      ?.objects.find((obj) => obj.name === "npcReceptionist");

    if (!receptionistObj) {
        console.warn("🚨 Map2Scene: Receptionist object not found in Tiled map. NPC will not appear.");
        return;
    }
    
    if (this.sys.textures.exists("receptionist") && !this.anims.get("receptionist-idle")) {
        this.anims.create({
          key: "receptionist-idle",
          frames: this.anims.generateFrameNumbers("receptionist", {
            start: 0,
            end: 6,
          }),
          frameRate: 4,
          repeat: -1,
        });
        console.log("Map2Scene: Receptionist animation created (from showReceptionistWelcome).");
    } else if (!this.sys.textures.exists("receptionist")) {
        console.warn("Map2Scene: Skipping receptionist animation creation. Texture 'receptionist' not found.");
        return;
    }


    const textX = receptionistObj.x! + 25;
    const textY = receptionistObj.y! - 20;

    this.receptionistText = this.add
      .text(textX, textY, "👋 Welcome to Metaverse!", {
        fontSize: "16px",
        color: "#fff",
        backgroundColor: "#333",
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5, 1)
      .setDepth(1000)
      .setVisible(true);

    this.time.delayedCall(3000, () => {
      this.receptionistText?.destroy();
    });

    const receptionist = this.add
        .sprite(receptionistObj.x! + 4, receptionistObj.y! + 48, "receptionist")
        .setOrigin(0, 1)
        .setDepth(3);

    receptionist.play("receptionist-idle");
    console.log("Map2Scene: Receptionist sprite added and playing idle animation.");

  }

  private handleMusicMuteToggle() {
      if (this.backgroundMusic && (this.backgroundMusic as Phaser.Sound.WebAudioSound).volume !== undefined) {
          const music = this.backgroundMusic as Phaser.Sound.WebAudioSound;
          if (music.volume > 0) {
              this.lastMusicVolume = music.volume;
              music.setVolume(0);
              console.log(`Map2Scene: Background Music muted. Stored volume: ${this.lastMusicVolume}`);
          } else {
              music.setVolume(this.lastMusicVolume);
              console.log(`Map2Scene: Background Music unmuted. Restored volume: ${this.lastMusicVolume}`);
          }
      } else {
        console.warn("Map2Scene: Background music not initialized or does not have volume control.");
      }
  }

  shutdown() {
      console.log("Map2Scene: shutdown() called. Stopping music and cleaning up.");
      this.backgroundMusic?.stop();
      this.backgroundMusic?.destroy();
      this.backgroundMusic = undefined;
      this.sys.game.events.off('toggleMusicMute', this.handleMusicMuteToggle, this);
  }
}
