import Phaser from 'phaser';
import { COLORS } from '../utils/AssetGenerator.js';
import { playNewRecord, playUIClick } from '../utils/AudioManager.js';
import { pokiGameplayStop, pokiCommercialBreak, pokiGameplayStart } from '../utils/PokiSDK.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.coins = data.coins || 0;
  }

  create() {
    // Notify Poki: gameplay stopped, show ad between runs
    pokiGameplayStop();
    pokiCommercialBreak();

    const { width, height } = this.cameras.main;

    // Background
    this.bg1 = this.add.tileSprite(0, 0, width, height, 'bg_layer1').setOrigin(0, 0);
    this.bg2 = this.add.tileSprite(0, 0, width, height, 'bg_layer2').setOrigin(0, 0);

    // Dark overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);

    // Scanlines
    const scanlines = this.add.graphics().setDepth(100);
    for (let y = 0; y < height; y += 4) {
      scanlines.fillStyle(0x000000, 0.06);
      scanlines.fillRect(0, y, width, 2);
    }

    // SYSTEM CRASH header
    const crashText = this.add.text(width / 2, 100, 'SYSTEM\nCRASH', {
      fontFamily: 'monospace',
      fontSize: '44px',
      fontStyle: 'bold',
      color: '#ff2d95',
      stroke: '#ff2d95',
      strokeThickness: 4,
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5);

    // Glitch flicker
    this.tweens.add({
      targets: crashText,
      alpha: { from: 1, to: 0.7 },
      x: { from: width / 2 - 2, to: width / 2 + 2 },
      duration: 100,
      yoyo: true,
      repeat: -1,
      ease: 'Steps(2)'
    });

    // Horizontal glitch lines
    for (let i = 0; i < 5; i++) {
      const lineY = 80 + Math.random() * 80;
      const line = this.add.rectangle(
        width / 2 + (Math.random() - 0.5) * 100,
        lineY,
        50 + Math.random() * 100,
        2,
        COLORS.neonCyan,
        0.3
      );
      this.tweens.add({
        targets: line,
        x: line.x + (Math.random() - 0.5) * 40,
        alpha: { from: 0.3, to: 0 },
        duration: 200 + Math.random() * 300,
        repeat: -1,
        yoyo: true
      });
    }

    // Score display
    const scoreY = 230;

    this.add.text(width / 2, scoreY, 'DISTANCE', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#666688'
    }).setOrigin(0.5);

    const scoreValueText = this.add.text(width / 2, scoreY + 30, `${this.finalScore}m`, {
      fontFamily: 'monospace',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#00f0ff',
      stroke: '#00f0ff',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Animate score counting up
    const counter = { val: 0 };
    this.tweens.add({
      targets: counter,
      val: this.finalScore,
      duration: 1000,
      ease: 'Power2',
      onUpdate: () => {
        scoreValueText.setText(`${Math.floor(counter.val)}m`);
      }
    });

    // Data collected
    if (this.coins > 0) {
      this.add.text(width / 2, scoreY + 70, `DATA COLLECTED: ${this.coins}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffe600'
      }).setOrigin(0.5);
    }

    // High score logic
    const prevHigh = parseInt(localStorage.getItem('neonDash_highScore') || '0', 10);
    const isNewHigh = this.finalScore > prevHigh;

    if (isNewHigh) {
      localStorage.setItem('neonDash_highScore', this.finalScore.toString());
    }

    const highY = scoreY + 100;

    if (isNewHigh && this.finalScore > 0) {
      playNewRecord();
      const newHighText = this.add.text(width / 2, highY, 'NEW RECORD!', {
        fontFamily: 'monospace',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffe600',
        stroke: '#ffe600',
        strokeThickness: 1
      }).setOrigin(0.5);

      this.tweens.add({
        targets: newHighText,
        scale: { from: 1, to: 1.15 },
        alpha: { from: 1, to: 0.7 },
        duration: 500,
        yoyo: true,
        repeat: -1
      });

      // Celebration particles
      this.createCelebrationParticles();
    } else {
      this.add.text(width / 2, highY, `BEST: ${Math.max(prevHigh, this.finalScore)}m`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#666688'
      }).setOrigin(0.5);
    }

    // Retry button area
    const retryY = 460;

    const retryBg = this.add.rectangle(width / 2, retryY, 180, 50, 0x1a1a3e)
      .setStrokeStyle(2, COLORS.neonCyan)
      .setInteractive({ useHandCursor: true });

    const retryText = this.add.text(width / 2, retryY, 'RUN AGAIN', {
      fontFamily: 'monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#00f0ff'
    }).setOrigin(0.5);

    // Pulsing retry
    this.tweens.add({
      targets: [retryBg, retryText],
      alpha: { from: 1, to: 0.7 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Hover effect
    retryBg.on('pointerover', () => {
      retryBg.setFillStyle(0x2a2a5e);
    });
    retryBg.on('pointerout', () => {
      retryBg.setFillStyle(0x1a1a3e);
    });

    // Menu button
    const menuY = 520;
    const menuBg = this.add.rectangle(width / 2, menuY, 180, 36, 0x0a0a1a)
      .setStrokeStyle(1, COLORS.neonPurple)
      .setInteractive({ useHandCursor: true });

    this.add.text(width / 2, menuY, 'MENU', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#b026ff'
    }).setOrigin(0.5);

    menuBg.on('pointerover', () => menuBg.setFillStyle(0x1a1a2e));
    menuBg.on('pointerout', () => menuBg.setFillStyle(0x0a0a1a));

    // Input handling
    const restart = () => {
      playUIClick();
      pokiGameplayStart();
      this.cameras.main.fadeOut(300, 10, 10, 26);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene');
      });
    };

    const goMenu = () => {
      playUIClick();
      this.cameras.main.fadeOut(300, 10, 10, 26);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    };

    retryBg.on('pointerdown', restart);
    menuBg.on('pointerdown', goMenu);

    this.input.keyboard.on('keydown-SPACE', restart);
    this.input.keyboard.on('keydown-ENTER', restart);
    this.input.keyboard.on('keydown-ESC', goMenu);

    // Tip text
    const tips = [
      'TIP: Double-tap for double jump',
      'TIP: Collect data orbs for bonus points',
      'TIP: Shield absorbs one hit',
      'TIP: Combos multiply your score',
      'TIP: Speed increases over time',
      'TIP: Dodge close to spikes for near-miss bonus',
      'TIP: Watch for laser barriers at high speed',
      'TIP: Press M to toggle sound',
      'TIP: Jump early over double gaps',
      'TIP: Data orbs above spikes are worth the risk'
    ];
    const tip = tips[Math.floor(Math.random() * tips.length)];
    this.add.text(width / 2, height - 30, tip, {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#444466'
    }).setOrigin(0.5);

    // Fade in
    this.cameras.main.fadeIn(400, 10, 10, 26);
  }

  createCelebrationParticles() {
    const { width, height } = this.cameras.main;

    // Burst particles from sides
    for (let i = 0; i < 20; i++) {
      const side = Math.random() > 0.5 ? 0 : width;
      const p = this.add.image(side, 100 + Math.random() * 300,
        ['particle', 'particle_cyan', 'particle_spark'][Math.floor(Math.random() * 3)]
      ).setScale(0.5 + Math.random());

      this.tweens.add({
        targets: p,
        x: width / 2 + (Math.random() - 0.5) * 200,
        y: p.y + 100 + Math.random() * 200,
        alpha: { from: 1, to: 0 },
        scale: { from: p.scaleX, to: 0 },
        duration: 1000 + Math.random() * 1000,
        delay: Math.random() * 500,
        onComplete: () => p.destroy()
      });
    }
  }

  update() {
    // Slow background drift
    this.bg1.tilePositionX += 0.1;
    this.bg2.tilePositionX += 0.2;
  }
}
