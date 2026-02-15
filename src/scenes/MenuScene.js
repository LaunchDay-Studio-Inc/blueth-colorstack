import Phaser from 'phaser';
import { COLORS } from '../utils/AssetGenerator.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Parallax background layers
    this.bg1 = this.add.tileSprite(0, 0, width, height, 'bg_layer1').setOrigin(0, 0);
    this.bg2 = this.add.tileSprite(0, 0, width, height, 'bg_layer2').setOrigin(0, 0);
    this.bg3 = this.add.tileSprite(0, 0, width, height, 'bg_layer3').setOrigin(0, 0);

    // Scanline overlay effect
    const scanlines = this.add.graphics();
    for (let y = 0; y < height; y += 4) {
      scanlines.fillStyle(0x000000, 0.08);
      scanlines.fillRect(0, y, width, 2);
    }
    scanlines.setDepth(100);

    // Title: NEON DASH
    const titleY = 160;

    // Glow backing
    this.add.text(width / 2, titleY, 'NEON', {
      fontFamily: 'monospace',
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#ff2d95',
      stroke: '#ff2d95',
      strokeThickness: 8
    }).setOrigin(0.5).setAlpha(0.3);

    const titleNeon = this.add.text(width / 2, titleY, 'NEON', {
      fontFamily: 'monospace',
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#ff2d95',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Glow backing for DASH
    this.add.text(width / 2, titleY + 55, 'DASH', {
      fontFamily: 'monospace',
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#00f0ff',
      stroke: '#00f0ff',
      strokeThickness: 8
    }).setOrigin(0.5).setAlpha(0.3);

    const titleDash = this.add.text(width / 2, titleY + 55, 'DASH', {
      fontFamily: 'monospace',
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#00f0ff',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, titleY + 105, '// ENDLESS RUNNER //', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#b026ff',
      letterSpacing: 4
    }).setOrigin(0.5);

    // Pulsing title animation
    this.tweens.add({
      targets: [titleNeon, titleDash],
      alpha: { from: 1, to: 0.85 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // High score display
    const highScore = localStorage.getItem('neonDash_highScore') || 0;
    if (highScore > 0) {
      this.add.text(width / 2, 310, `BEST: ${highScore}m`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffe600'
      }).setOrigin(0.5);
    }

    // Tap to start - with blinking
    const tapText = this.add.text(width / 2, 400, 'TAP TO RUN', {
      fontFamily: 'monospace',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#00f0ff',
      stroke: '#00f0ff',
      strokeThickness: 1
    }).setOrigin(0.5);

    this.tweens.add({
      targets: tapText,
      alpha: { from: 1, to: 0.2 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Controls hint
    this.add.text(width / 2, 460, 'TAP / CLICK / SPACE to JUMP', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#666688'
    }).setOrigin(0.5);

    // Decorative runner preview
    const runner = this.add.sprite(width / 2, 520, 'player_run1').setScale(2);
    this.time.addEvent({
      delay: 200,
      callback: () => {
        runner.setTexture(runner.texture.key === 'player_run1' ? 'player_run2' : 'player_run1');
      },
      loop: true
    });

    // Ground line
    this.add.rectangle(width / 2, 545, 120, 2, COLORS.neonCyan);

    // Floating particles in background
    this.createFloatingParticles();

    // Input handling
    this.input.on('pointerdown', () => this.startGame());
    this.input.keyboard.on('keydown-SPACE', () => this.startGame());
    this.input.keyboard.on('keydown-ENTER', () => this.startGame());

    // Camera flash in
    this.cameras.main.fadeIn(500, 10, 10, 26);
  }

  createFloatingParticles() {
    const { width, height } = this.cameras.main;
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const textures = ['particle', 'particle_cyan', 'particle_spark'];
      const p = this.add.image(x, y, textures[Math.floor(Math.random() * textures.length)])
        .setAlpha(Math.random() * 0.4 + 0.1)
        .setScale(Math.random() * 0.5 + 0.3);

      this.tweens.add({
        targets: p,
        y: y - 30 - Math.random() * 40,
        x: x + (Math.random() - 0.5) * 60,
        alpha: 0,
        duration: 2000 + Math.random() * 3000,
        repeat: -1,
        onRepeat: () => {
          p.setPosition(Math.random() * width, Math.random() * height);
          p.setAlpha(Math.random() * 0.4 + 0.1);
        }
      });
    }
  }

  startGame() {
    this.cameras.main.fadeOut(300, 10, 10, 26);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }

  update() {
    // Slow parallax scroll on menu
    this.bg1.tilePositionX += 0.2;
    this.bg2.tilePositionX += 0.4;
    this.bg3.tilePositionX += 0.7;
  }
}
