import Phaser from 'phaser';
import { generateAssets } from '../utils/AssetGenerator.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Loading text
    const loadText = this.add.text(width / 2, height / 2, 'INITIALIZING...', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#00f0ff'
    }).setOrigin(0.5);

    // Loading bar background
    const barBg = this.add.rectangle(width / 2, height / 2 + 40, 200, 8, 0x1a1a3e);
    const barFill = this.add.rectangle(width / 2 - 100, height / 2 + 40, 0, 8, 0x00f0ff).setOrigin(0, 0.5);

    // Generate all procedural assets with simulated progress
    this.time.delayedCall(100, () => {
      generateAssets(this);

      // Animate loading bar
      this.tweens.add({
        targets: barFill,
        width: 200,
        duration: 600,
        ease: 'Power2',
        onComplete: () => {
          loadText.setText('READY');
          this.time.delayedCall(300, () => {
            this.scene.start('MenuScene');
          });
        }
      });
    });
  }
}
