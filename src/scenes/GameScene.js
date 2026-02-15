import Phaser from 'phaser';
import { COLORS } from '../utils/AssetGenerator.js';
import {
  initAudio, playJump, playDoubleJump, playCoin, playCoinCombo,
  playShieldPickup, playShieldBreak, playDeath, playMilestone, playLand,
  toggleMute, isMuted
} from '../utils/AudioManager.js';

const GROUND_Y = 520;
const GROUND_HEIGHT = 80;
const PLAYER_X = 80;
const BASE_SPEED = 180;
const MAX_SPEED = 420;
const SPEED_INCREMENT = 0.08;
const JUMP_VELOCITY = -520;
const DOUBLE_JUMP_VELOCITY = -440;
const GAP_MIN_WIDTH = 50;
const GAP_MAX_WIDTH = 90;
const SPAWN_DISTANCE = 450;
const MIN_SEGMENT_WIDTH = 120;
const MAX_SEGMENT_WIDTH = 300;
const COIN_SCORE = 5;

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init() {
    this.gameSpeed = BASE_SPEED;
    this.score = 0;
    this.isAlive = true;
    this.jumpsRemaining = 0;
    this.maxJumps = 2;
    this.hasShield = false;
    this.comboMultiplier = 1;
    this.comboTimer = 0;
    this.distanceTraveled = 0;
    this.lastSpawnX = 400;
    this.screenShaking = false;
    this.coinCount = 0;
    this.speedMilestone = 0;
    this.nearMissStreak = 0;
    this.wasInAir = false;
    this.justLanded = false;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Initialize audio on first user interaction
    initAudio();

    // Parallax backgrounds
    this.bg1 = this.add.tileSprite(0, 0, width, height, 'bg_layer1').setOrigin(0, 0).setScrollFactor(0);
    this.bg2 = this.add.tileSprite(0, 0, width, height, 'bg_layer2').setOrigin(0, 0).setScrollFactor(0);
    this.bg3 = this.add.tileSprite(0, 0, width, height, 'bg_layer3').setOrigin(0, 0).setScrollFactor(0);

    // Scanline overlay
    const scanlines = this.add.graphics().setScrollFactor(0).setDepth(90);
    for (let y = 0; y < height; y += 4) {
      scanlines.fillStyle(0x000000, 0.05);
      scanlines.fillRect(0, y, width, 2);
    }

    // Speed vignette overlay (darkens edges at high speed)
    this.vignetteGfx = this.add.graphics().setScrollFactor(0).setDepth(89);
    this.vignetteGfx.setAlpha(0);

    // Speed lines container
    this.speedLines = this.add.graphics().setScrollFactor(0).setDepth(88);

    // Groups
    this.groundGroup = this.physics.add.staticGroup();
    this.spikeGroup = this.physics.add.group({ allowGravity: false });
    this.laserGroup = this.physics.add.group({ allowGravity: false });
    this.coinGroup = this.physics.add.group({ allowGravity: false });
    this.shieldGroup = this.physics.add.group({ allowGravity: false });
    this.movingPlatGroup = this.physics.add.staticGroup();

    // Generate initial ground
    this.generateInitialGround();

    // Player
    this.player = this.physics.add.sprite(PLAYER_X, GROUND_Y - 40, 'player_run1');
    this.player.setCollideWorldBounds(false);
    this.player.body.setSize(16, 34);
    this.player.body.setOffset(8, 4);
    this.player.setDepth(10);

    // Trail emitter behind player
    this.trailEmitter = this.add.particles(0, 0, 'trail', {
      follow: this.player,
      followOffset: { x: -12, y: 8 },
      speed: { min: 10, max: 30 },
      angle: { min: 170, max: 190 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 300,
      frequency: 50,
      tint: [COLORS.neonCyan, COLORS.neonPurple]
    });
    this.trailEmitter.setDepth(9);

    // Shield visual (hidden initially)
    this.shieldVisual = this.add.graphics().setDepth(11);
    this.shieldVisual.setVisible(false);

    // Collisions
    this.physics.add.collider(this.player, this.groundGroup, this.onLand, null, this);
    this.physics.add.collider(this.player, this.movingPlatGroup, this.onLand, null, this);
    this.physics.add.overlap(this.player, this.spikeGroup, this.onHitSpike, null, this);
    this.physics.add.overlap(this.player, this.laserGroup, this.onHitSpike, null, this);
    this.physics.add.overlap(this.player, this.coinGroup, this.onCollectCoin, null, this);
    this.physics.add.overlap(this.player, this.shieldGroup, this.onCollectShield, null, this);

    // Animation timer for run cycle
    this.runFrame = 0;
    this.runTimer = this.time.addEvent({
      delay: 150,
      callback: () => {
        if (this.isAlive && this.player.body.touching.down) {
          this.runFrame = 1 - this.runFrame;
          this.player.setTexture(this.runFrame === 0 ? 'player_run1' : 'player_run2');
        }
      },
      loop: true
    });

    // UI - Score
    this.scoreText = this.add.text(20, 20, '0m', {
      fontFamily: 'monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#00f0ff',
      stroke: '#00f0ff',
      strokeThickness: 1
    }).setScrollFactor(0).setDepth(100);

    // UI - Combo text
    this.comboText = this.add.text(20, 44, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffe600'
    }).setScrollFactor(0).setDepth(100);

    // UI - Speed indicator
    this.speedText = this.add.text(width - 20, 20, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#b026ff',
      align: 'right'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

    // UI - Shield indicator
    this.shieldText = this.add.text(width - 20, 36, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#00f0ff'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

    // UI - Coin count
    this.coinText = this.add.text(20, 64, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffe600'
    }).setScrollFactor(0).setDepth(100);

    // UI - Near miss text
    this.nearMissText = this.add.text(width / 2, height / 2 - 30, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#39ff14',
      stroke: '#39ff14',
      strokeThickness: 1
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0);

    // Speed milestone flash text
    this.milestoneText = this.add.text(width / 2, height / 2 - 60, '', {
      fontFamily: 'monospace',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ff2d95',
      stroke: '#ff2d95',
      strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0);

    // Mute button (top-right corner)
    this.muteBtn = this.add.text(width - 20, height - 20, isMuted() ? 'MUTE' : 'SND', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#444466',
      backgroundColor: '#0a0a1a',
      padding: { x: 4, y: 2 }
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });

    this.muteBtn.on('pointerdown', (pointer) => {
      pointer.event.stopPropagation();
      const nowMuted = toggleMute();
      this.muteBtn.setText(nowMuted ? 'MUTE' : 'SND');
    });

    // Input
    this.input.on('pointerdown', () => this.jump());
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.mKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);

    // Camera
    this.cameras.main.fadeIn(300, 10, 10, 26);
    this.cameras.main.setBackgroundColor('#0a0a1a');

    // Speed milestone messages
    this.milestones = [
      { speed: 220, text: 'WARMING UP' },
      { speed: 260, text: 'FAST!' },
      { speed: 300, text: 'BLAZING!' },
      { speed: 340, text: 'HYPERDRIVE!' },
      { speed: 380, text: 'LUDICROUS!' },
      { speed: 410, text: 'MAX OVERLOAD!' }
    ];

    // Laser graphics array for animated beams
    this.laserBeams = [];
  }

  generateInitialGround() {
    for (let x = 0; x < 500; x += 64) {
      this.createGroundTile(x, GROUND_Y);
    }
    this.lastSpawnX = 500;
    this.scheduleNextSegment();
  }

  createGroundTile(x, y) {
    const tile = this.groundGroup.create(x, y, 'ground');
    tile.setOrigin(0, 0);
    tile.body.updateFromGameObject();
    tile.refreshBody();
    return tile;
  }

  scheduleNextSegment() {
    const roll = Math.random();
    const speedFactor = Math.min((this.gameSpeed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED), 1);

    if (roll < 0.28 + speedFactor * 0.08) {
      this.createGap();
    } else if (roll < 0.50 + speedFactor * 0.08) {
      this.createSpikeSegment();
    } else if (roll < 0.62 + speedFactor * 0.06 && speedFactor > 0.15) {
      this.createLaserSegment();
    } else if (roll < 0.72 + speedFactor * 0.05 && speedFactor > 0.25) {
      this.createDoubleGapSegment();
    } else {
      this.createPlainSegment();
    }
  }

  createGap() {
    const speedFactor = Math.min((this.gameSpeed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED), 1);
    const gapWidth = GAP_MIN_WIDTH + Math.random() * (GAP_MAX_WIDTH - GAP_MIN_WIDTH) * (0.6 + speedFactor * 0.4);

    this.lastSpawnX += gapWidth;

    if (Math.random() > 0.3) {
      const coinX = this.lastSpawnX - gapWidth / 2;
      this.spawnCoin(coinX, GROUND_Y - 80);
    }

    const segWidth = MIN_SEGMENT_WIDTH + Math.random() * (MAX_SEGMENT_WIDTH - MIN_SEGMENT_WIDTH);
    for (let x = this.lastSpawnX; x < this.lastSpawnX + segWidth; x += 64) {
      this.createGroundTile(x, GROUND_Y);
    }

    if (Math.random() < 0.08 && !this.hasShield) {
      this.spawnShield(this.lastSpawnX + segWidth / 2, GROUND_Y - 60);
    }

    this.lastSpawnX += segWidth;
  }

  createDoubleGapSegment() {
    // Two gaps with a small landing platform between them
    const speedFactor = Math.min((this.gameSpeed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED), 1);

    // First gap
    const gap1Width = GAP_MIN_WIDTH + Math.random() * 20;
    this.lastSpawnX += gap1Width;

    // Small landing platform
    const platWidth = 64 + Math.random() * 32;
    for (let x = this.lastSpawnX; x < this.lastSpawnX + platWidth; x += 64) {
      this.createGroundTile(x, GROUND_Y);
    }

    // Coin reward in the middle
    this.spawnCoin(this.lastSpawnX + platWidth / 2, GROUND_Y - 50);
    this.lastSpawnX += platWidth;

    // Second gap
    const gap2Width = GAP_MIN_WIDTH + Math.random() * 30;
    this.lastSpawnX += gap2Width;

    // Continuation
    const segWidth = MIN_SEGMENT_WIDTH + Math.random() * MAX_SEGMENT_WIDTH;
    for (let x = this.lastSpawnX; x < this.lastSpawnX + segWidth; x += 64) {
      this.createGroundTile(x, GROUND_Y);
    }
    this.lastSpawnX += segWidth;
  }

  createSpikeSegment() {
    const segWidth = MIN_SEGMENT_WIDTH + Math.random() * MAX_SEGMENT_WIDTH;

    for (let x = this.lastSpawnX; x < this.lastSpawnX + segWidth; x += 64) {
      this.createGroundTile(x, GROUND_Y);
    }

    const speedFactor = Math.min((this.gameSpeed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED), 1);
    const spikeCount = 1 + Math.floor(Math.random() * (1 + speedFactor * 2));
    const spikeStartX = this.lastSpawnX + 40;
    const spikeSpacing = 36;

    for (let i = 0; i < spikeCount; i++) {
      const sx = spikeStartX + i * spikeSpacing;
      if (sx < this.lastSpawnX + segWidth - 20) {
        const spike = this.spikeGroup.create(sx, GROUND_Y - 16, 'spike');
        spike.setOrigin(0.5, 1);
        spike.body.setSize(20, 24);
        spike.body.setOffset(6, 4);
      }
    }

    if (Math.random() > 0.5) {
      this.spawnCoin(spikeStartX + (spikeCount * spikeSpacing) / 2, GROUND_Y - 70);
    }

    this.lastSpawnX += segWidth;
  }

  createLaserSegment() {
    // Ground with a horizontal laser beam to duck under (jump timing)
    const segWidth = MIN_SEGMENT_WIDTH + Math.random() * MAX_SEGMENT_WIDTH;

    for (let x = this.lastSpawnX; x < this.lastSpawnX + segWidth; x += 64) {
      this.createGroundTile(x, GROUND_Y);
    }

    // Laser beam - a horizontal danger zone at jump height
    const laserX = this.lastSpawnX + 60;
    const laserWidth = 40 + Math.random() * 30;

    // Create physics body for laser
    const laser = this.laserGroup.create(laserX + laserWidth / 2, GROUND_Y - 50, null);
    laser.setVisible(false);
    laser.body.setSize(laserWidth, 8);

    // Visual laser beam
    const beamGfx = this.add.graphics().setDepth(5);
    beamGfx.fillStyle(COLORS.neonPink, 0.6);
    beamGfx.fillRect(laserX, GROUND_Y - 54, laserWidth, 8);
    beamGfx.lineStyle(1, COLORS.neonPink, 1);
    beamGfx.strokeRect(laserX, GROUND_Y - 54, laserWidth, 8);

    // Emitter posts
    beamGfx.fillStyle(COLORS.neonPink, 0.8);
    beamGfx.fillRect(laserX - 3, GROUND_Y - 60, 6, 60);
    beamGfx.fillRect(laserX + laserWidth - 3, GROUND_Y - 60, 6, 60);

    // Store reference for cleanup and animation
    this.laserBeams.push({ gfx: beamGfx, x: laserX, width: laserWidth, body: laser });

    // Coins as reward for jumping through
    if (Math.random() > 0.4) {
      this.spawnCoin(laserX + laserWidth / 2, GROUND_Y - 90);
    }

    this.lastSpawnX += segWidth;
  }

  createPlainSegment() {
    const segWidth = MIN_SEGMENT_WIDTH + Math.random() * MAX_SEGMENT_WIDTH * 1.5;

    for (let x = this.lastSpawnX; x < this.lastSpawnX + segWidth; x += 64) {
      this.createGroundTile(x, GROUND_Y);
    }

    const coinCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < coinCount; i++) {
      const cx = this.lastSpawnX + 30 + Math.random() * (segWidth - 60);
      const cy = GROUND_Y - 40 - Math.random() * 50;
      this.spawnCoin(cx, cy);
    }

    if (Math.random() < 0.05 && !this.hasShield) {
      this.spawnShield(this.lastSpawnX + segWidth / 2, GROUND_Y - 70);
    }

    this.lastSpawnX += segWidth;
  }

  spawnCoin(x, y) {
    const coin = this.coinGroup.create(x, y, 'coin');
    coin.setOrigin(0.5);

    this.tweens.add({
      targets: coin,
      y: y - 8,
      duration: 600 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  spawnShield(x, y) {
    const shield = this.shieldGroup.create(x, y, 'shield_pickup');
    shield.setOrigin(0.5);

    this.tweens.add({
      targets: shield,
      y: y - 10,
      angle: 360,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  jump() {
    if (!this.isAlive) return;

    if (this.player.body.touching.down) {
      this.jumpsRemaining = this.maxJumps - 1;
      this.player.setVelocityY(JUMP_VELOCITY);
      this.player.setTexture('player_jump');
      this.spawnJumpParticles();
      playJump();
    } else if (this.jumpsRemaining > 0) {
      this.jumpsRemaining--;
      this.player.setVelocityY(DOUBLE_JUMP_VELOCITY);
      this.spawnJumpParticles();
      playDoubleJump();
    }
  }

  spawnJumpParticles() {
    const particles = this.add.particles(this.player.x, this.player.y + 16, 'particle_cyan', {
      speed: { min: 40, max: 120 },
      angle: { min: 60, max: 120 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 400,
      quantity: 6,
      tint: [COLORS.neonCyan, COLORS.neonPurple]
    });
    particles.setDepth(8);
    this.time.delayedCall(500, () => particles.destroy());
  }

  onLand(player, ground) {
    if (player.body.touching.down) {
      this.jumpsRemaining = this.maxJumps;
      if (this.wasInAir) {
        this.justLanded = true;
        this.wasInAir = false;
        playLand();
      }
    }
  }

  checkNearMiss() {
    // Check proximity to spikes for "near miss" dopamine hit
    let nearMiss = false;
    this.spikeGroup.getChildren().forEach(spike => {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, spike.x, spike.y);
      if (dist < 40 && dist > 15 && !this.player.body.touching.down) {
        nearMiss = true;
      }
    });

    if (nearMiss) {
      this.nearMissStreak++;
      const bonus = this.nearMissStreak * 3;
      this.score += bonus;

      this.nearMissText.setText(`NEAR MISS! +${bonus}`);
      this.nearMissText.setAlpha(1);
      this.tweens.add({
        targets: this.nearMissText,
        alpha: 0,
        y: this.nearMissText.y - 15,
        duration: 600,
        onComplete: () => {
          this.nearMissText.y = this.cameras.main.height / 2 - 30;
        }
      });
    }
  }

  onHitSpike(player, obstacle) {
    if (!this.isAlive) return;

    if (this.hasShield) {
      this.hasShield = false;
      this.shieldVisual.setVisible(false);
      this.shieldText.setText('');
      obstacle.destroy();
      playShieldBreak();

      const breakParticles = this.add.particles(player.x, player.y, 'particle_cyan', {
        speed: { min: 80, max: 200 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 500,
        quantity: 12,
        tint: [COLORS.neonCyan]
      });
      this.time.delayedCall(600, () => breakParticles.destroy());

      this.tweens.add({
        targets: player,
        alpha: { from: 0.3, to: 1 },
        duration: 100,
        repeat: 3
      });
      return;
    }

    this.die();
  }

  onCollectCoin(player, coin) {
    coin.destroy();
    this.coinCount++;
    this.score += COIN_SCORE * this.comboMultiplier;

    this.comboMultiplier = Math.min(this.comboMultiplier + 0.5, 5);
    this.comboTimer = 120;

    if (this.comboMultiplier > 1.5) {
      playCoinCombo(this.comboMultiplier);
    } else {
      playCoin();
    }

    const popText = this.add.text(coin.x, coin.y, `+${COIN_SCORE * this.comboMultiplier | 0}`, {
      fontFamily: 'monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffe600'
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: popText,
      y: coin.y - 30,
      alpha: 0,
      duration: 600,
      onComplete: () => popText.destroy()
    });

    const collectParticles = this.add.particles(coin.x, coin.y, 'particle_spark', {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: 300,
      quantity: 5,
      tint: [COLORS.neonYellow]
    });
    this.time.delayedCall(400, () => collectParticles.destroy());
  }

  onCollectShield(player, shield) {
    shield.destroy();
    this.hasShield = true;
    this.shieldVisual.setVisible(true);
    playShieldPickup();

    const fx = this.add.particles(shield.x, shield.y, 'particle_cyan', {
      speed: { min: 60, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      lifespan: 400,
      quantity: 10,
      tint: [COLORS.neonCyan]
    });
    this.time.delayedCall(500, () => fx.destroy());
  }

  die() {
    this.isAlive = false;
    this.trailEmitter.stop();
    playDeath();

    // Death particles - big explosion
    const deathParticles = this.add.particles(this.player.x, this.player.y, 'particle', {
      speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 800,
      quantity: 25,
      tint: [COLORS.neonPink, COLORS.neonCyan, COLORS.neonPurple, COLORS.neonYellow]
    });
    deathParticles.setDepth(20);

    // Secondary spark burst
    const sparks = this.add.particles(this.player.x, this.player.y, 'particle_spark', {
      speed: { min: 150, max: 400 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      quantity: 15,
      tint: [COLORS.neonYellow, COLORS.white]
    });
    sparks.setDepth(20);

    // Screen shake
    this.cameras.main.shake(400, 0.02);

    // Flash
    this.cameras.main.flash(200, 255, 45, 149, true);

    // Hide player
    this.player.setVisible(false);
    this.player.body.enable = false;

    // Slow-mo effect
    this.time.timeScale = 0.3;

    // Transition to game over
    this.time.delayedCall(600, () => {
      this.time.timeScale = 1;
      this.cameras.main.fadeOut(400, 10, 10, 26);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        const finalScore = Math.floor(this.distanceTraveled / 10);
        this.scene.start('GameOverScene', {
          score: finalScore,
          coins: this.coinCount
        });
      });
    });
  }

  showMilestone(text) {
    this.milestoneText.setText(text);
    this.milestoneText.setAlpha(0);
    this.milestoneText.setScale(0.5);
    playMilestone();

    this.tweens.add({
      targets: this.milestoneText,
      alpha: 1,
      scale: 1.2,
      duration: 300,
      yoyo: true,
      hold: 500,
      ease: 'Back.easeOut'
    });
  }

  update(time, delta) {
    if (!this.isAlive) return;

    const dt = delta / 1000;

    // Track air state for landing sound
    if (!this.player.body.touching.down) {
      this.wasInAir = true;
    }

    // Increase speed over time
    if (this.gameSpeed < MAX_SPEED) {
      this.gameSpeed += SPEED_INCREMENT;
    }

    // Check milestones
    for (const m of this.milestones) {
      if (this.gameSpeed >= m.speed && this.speedMilestone < m.speed) {
        this.speedMilestone = m.speed;
        this.showMilestone(m.text);
      }
    }

    // Distance tracking
    this.distanceTraveled += this.gameSpeed * dt;
    const displayScore = Math.floor(this.distanceTraveled / 10);
    this.scoreText.setText(`${displayScore}m`);

    // Speed indicator
    const speedPct = Math.floor(((this.gameSpeed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED)) * 100);
    this.speedText.setText(`SPD ${speedPct}%`);

    // Coin display
    if (this.coinCount > 0) {
      this.coinText.setText(`DATA: ${this.coinCount}`);
    }

    // Combo timer
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboMultiplier > 1) {
        this.comboText.setText(`x${this.comboMultiplier.toFixed(1)} COMBO`);
      }
    } else {
      this.comboMultiplier = 1;
      this.comboText.setText('');
    }

    // Parallax scrolling
    const speedRatio = this.gameSpeed / BASE_SPEED;
    this.bg1.tilePositionX += 0.3 * speedRatio;
    this.bg2.tilePositionX += 0.7 * speedRatio;
    this.bg3.tilePositionX += 1.2 * speedRatio;

    // Speed-reactive effects
    const speedFactor = Math.min((this.gameSpeed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED), 1);

    // Vignette intensifies at high speed
    this.vignetteGfx.clear();
    if (speedFactor > 0.3) {
      const vigAlpha = (speedFactor - 0.3) * 0.3;
      this.vignetteGfx.setAlpha(vigAlpha);
      const { width: vw, height: vh } = this.cameras.main;
      // Left edge
      this.vignetteGfx.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.6, 0.6, 0, 0);
      this.vignetteGfx.fillRect(0, 0, 60, vh);
      // Right edge
      this.vignetteGfx.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.6, 0.6);
      this.vignetteGfx.fillRect(vw - 60, 0, 60, vh);
      // Top edge
      this.vignetteGfx.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.4, 0.4, 0, 0);
      this.vignetteGfx.fillRect(0, 0, vw, 40);
    }

    // Horizontal speed lines at very high speed
    this.speedLines.clear();
    if (speedFactor > 0.5) {
      const lineAlpha = (speedFactor - 0.5) * 0.2;
      this.speedLines.lineStyle(1, COLORS.neonCyan, lineAlpha);
      const numLines = Math.floor(speedFactor * 6);
      for (let i = 0; i < numLines; i++) {
        const ly = 80 + Math.random() * 400;
        const lx = Math.random() * 200;
        const ll = 40 + Math.random() * 80;
        this.speedLines.lineBetween(lx, ly, lx + ll, ly);
      }
    }

    // Trail emitter reacts to speed
    if (this.trailEmitter && this.trailEmitter.active) {
      this.trailEmitter.setFrequency(Math.max(15, 50 - speedFactor * 35));
      this.trailEmitter.setLifespan(300 + speedFactor * 200);
    }

    // Move all world objects left
    const moveAmount = this.gameSpeed * dt;

    this.groundGroup.getChildren().forEach(tile => {
      tile.x -= moveAmount;
      tile.body.x = tile.x;
      if (tile.x < -128) {
        tile.destroy();
      }
    });

    this.spikeGroup.getChildren().forEach(spike => {
      spike.x -= moveAmount;
      if (spike.x < -64) spike.destroy();
    });

    this.laserGroup.getChildren().forEach(laser => {
      laser.x -= moveAmount;
      laser.body.x = laser.x - laser.body.width / 2;
      if (laser.x < -100) laser.destroy();
    });

    // Move and clean up laser beam graphics
    for (let i = this.laserBeams.length - 1; i >= 0; i--) {
      const beam = this.laserBeams[i];
      beam.x -= moveAmount;

      // Redraw at new position with animated flicker
      beam.gfx.clear();
      const flicker = 0.4 + Math.sin(time / 80) * 0.3;
      beam.gfx.fillStyle(COLORS.neonPink, flicker);
      beam.gfx.fillRect(beam.x, GROUND_Y - 54, beam.width, 8);
      beam.gfx.lineStyle(1, COLORS.neonPink, flicker + 0.2);
      beam.gfx.strokeRect(beam.x, GROUND_Y - 54, beam.width, 8);
      // Posts
      beam.gfx.fillStyle(COLORS.neonPink, 0.8);
      beam.gfx.fillRect(beam.x - 3, GROUND_Y - 60, 6, 60);
      beam.gfx.fillRect(beam.x + beam.width - 3, GROUND_Y - 60, 6, 60);

      if (beam.x + beam.width < -50) {
        beam.gfx.destroy();
        this.laserBeams.splice(i, 1);
      }
    }

    this.movingPlatGroup.getChildren().forEach(plat => {
      plat.x -= moveAmount;
      plat.body.x = plat.x;
      if (plat.x < -100) plat.destroy();
    });

    this.coinGroup.getChildren().forEach(coin => {
      coin.x -= moveAmount;
      if (coin.x < -32) coin.destroy();
    });

    this.shieldGroup.getChildren().forEach(s => {
      s.x -= moveAmount;
      if (s.x < -32) s.destroy();
    });

    // Track how far left the last spawn point has moved
    this.lastSpawnX -= moveAmount;

    // Spawn new segments when needed
    while (this.lastSpawnX < SPAWN_DISTANCE + 200) {
      this.scheduleNextSegment();
    }

    // Player fell into a gap
    if (this.player.y > 650) {
      this.die();
      return;
    }

    // Jump texture management
    if (!this.player.body.touching.down) {
      this.player.setTexture('player_jump');
    }

    // Input check (held keys)
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.upKey)) {
      this.jump();
    }

    // Mute toggle via M key
    if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
      const nowMuted = toggleMute();
      this.muteBtn.setText(nowMuted ? 'MUTE' : 'SND');
    }

    // Near miss detection
    this.checkNearMiss();

    // Shield visual follows player
    if (this.hasShield) {
      this.shieldVisual.clear();
      this.shieldVisual.lineStyle(2, COLORS.neonCyan, 0.5 + Math.sin(time / 200) * 0.3);
      this.shieldVisual.strokeCircle(this.player.x, this.player.y, 22);
      this.shieldText.setText('SHIELD');
    }
  }
}
