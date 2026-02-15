import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    // Set up any global game settings
    this.scale.refresh();
    this.scene.start('PreloadScene');
  }
}
