/**
 * Procedurally generates all game textures at runtime.
 * No external asset files needed — everything is drawn to canvas.
 */

// Cyberpunk neon palette
const COLORS = {
  neonPink: 0xff2d95,
  neonCyan: 0x00f0ff,
  neonPurple: 0xb026ff,
  neonYellow: 0xffe600,
  neonGreen: 0x39ff14,
  darkBg: 0x0a0a1a,
  midBg: 0x12122a,
  lightBg: 0x1a1a3e,
  ground: 0x1e1e3a,
  groundTop: 0x00f0ff,
  white: 0xffffff
};

export { COLORS };

export function generateAssets(scene) {
  generatePlayer(scene);
  generateGround(scene);
  generateSpike(scene);
  generateParallaxLayers(scene);
  generateParticle(scene);
  generateCoin(scene);
  generateShieldPickup(scene);
  generateTrail(scene);
  generateCityElements(scene);
}

function generatePlayer(scene) {
  const g = scene.make.graphics({ add: false });

  // Running frame 1
  g.clear();
  drawRunnerFrame(g, 0);
  g.generateTexture('player_run1', 32, 40);

  // Running frame 2
  g.clear();
  drawRunnerFrame(g, 1);
  g.generateTexture('player_run2', 32, 40);

  // Jump frame
  g.clear();
  drawRunnerJump(g);
  g.generateTexture('player_jump', 32, 40);

  g.destroy();
}

function drawRunnerFrame(g, frame) {
  // Body - sleek cyberpunk runner silhouette
  g.fillStyle(0x1a1a2e);
  g.fillRoundedRect(8, 4, 16, 20, 3);

  // Neon suit outline
  g.lineStyle(2, COLORS.neonCyan, 1);
  g.strokeRoundedRect(8, 4, 16, 20, 3);

  // Visor / head
  g.fillStyle(0x0a0a1a);
  g.fillRoundedRect(10, 0, 14, 10, 4);
  g.lineStyle(2, COLORS.neonPink, 1);
  g.strokeRoundedRect(10, 0, 14, 10, 4);

  // Glowing eye visor
  g.fillStyle(COLORS.neonPink);
  g.fillRect(14, 3, 8, 3);

  // Energy core on chest
  g.fillStyle(COLORS.neonCyan);
  g.fillCircle(16, 14, 2);

  // Legs (animated)
  g.lineStyle(3, COLORS.neonCyan, 1);
  if (frame === 0) {
    // Left leg forward, right back
    g.lineBetween(12, 24, 6, 36);
    g.lineBetween(20, 24, 26, 36);
  } else {
    // Right leg forward, left back
    g.lineBetween(12, 24, 18, 36);
    g.lineBetween(20, 24, 14, 36);
  }

  // Feet glow
  g.fillStyle(COLORS.neonPink);
  if (frame === 0) {
    g.fillCircle(6, 37, 2);
    g.fillCircle(26, 37, 2);
  } else {
    g.fillCircle(18, 37, 2);
    g.fillCircle(14, 37, 2);
  }
}

function drawRunnerJump(g) {
  // Body
  g.fillStyle(0x1a1a2e);
  g.fillRoundedRect(8, 4, 16, 20, 3);
  g.lineStyle(2, COLORS.neonCyan, 1);
  g.strokeRoundedRect(8, 4, 16, 20, 3);

  // Head
  g.fillStyle(0x0a0a1a);
  g.fillRoundedRect(10, 0, 14, 10, 4);
  g.lineStyle(2, COLORS.neonPink, 1);
  g.strokeRoundedRect(10, 0, 14, 10, 4);

  // Visor
  g.fillStyle(COLORS.neonPink);
  g.fillRect(14, 3, 8, 3);

  // Core
  g.fillStyle(COLORS.neonCyan);
  g.fillCircle(16, 14, 2);

  // Legs tucked
  g.lineStyle(3, COLORS.neonCyan, 1);
  g.lineBetween(12, 24, 8, 30);
  g.lineBetween(8, 30, 14, 34);
  g.lineBetween(20, 24, 24, 30);
  g.lineBetween(24, 30, 18, 34);

  // Feet glow
  g.fillStyle(COLORS.neonPink);
  g.fillCircle(14, 35, 2);
  g.fillCircle(18, 35, 2);
}

function generateGround(scene) {
  const g = scene.make.graphics({ add: false });

  // Ground tile segment
  g.fillStyle(COLORS.ground);
  g.fillRect(0, 0, 64, 80);

  // Neon top edge
  g.fillStyle(COLORS.neonCyan);
  g.fillRect(0, 0, 64, 2);

  // Circuit-board pattern lines
  g.lineStyle(1, 0x2a2a5e, 0.5);
  for (let y = 10; y < 80; y += 12) {
    g.lineBetween(0, y, 64, y);
  }
  for (let x = 8; x < 64; x += 16) {
    g.lineBetween(x, 2, x, 80);
  }

  // Random glow dots
  g.fillStyle(COLORS.neonPurple);
  g.fillCircle(8, 20, 1);
  g.fillCircle(40, 44, 1);
  g.fillCircle(24, 60, 1);
  g.fillStyle(COLORS.neonCyan);
  g.fillCircle(52, 32, 1);
  g.fillCircle(16, 50, 1);

  g.generateTexture('ground', 64, 80);
  g.destroy();
}

function generateSpike(scene) {
  const g = scene.make.graphics({ add: false });

  // Spike triangle with neon glow
  g.fillStyle(COLORS.neonPink);
  g.fillTriangle(16, 0, 0, 32, 32, 32);

  // Inner darker triangle
  g.fillStyle(0x8b0045);
  g.fillTriangle(16, 6, 5, 30, 27, 30);

  // Glow line edges
  g.lineStyle(1, COLORS.neonPink, 0.8);
  g.lineBetween(16, 0, 0, 32);
  g.lineBetween(16, 0, 32, 32);
  g.lineBetween(0, 32, 32, 32);

  g.generateTexture('spike', 32, 32);
  g.destroy();
}

function generateParallaxLayers(scene) {
  // Layer 1 - Far background (stars / distant city)
  generateBgLayer1(scene);
  // Layer 2 - Mid background (buildings)
  generateBgLayer2(scene);
  // Layer 3 - Near background (close structures)
  generateBgLayer3(scene);
}

function generateBgLayer1(scene) {
  const g = scene.make.graphics({ add: false });
  const w = 800, h = 600;

  // Dark gradient sky
  for (let y = 0; y < h; y++) {
    const t = y / h;
    const r = Math.floor(10 + t * 8);
    const gv = Math.floor(10 + t * 12);
    const b = Math.floor(26 + t * 20);
    g.fillStyle(Phaser.Display.Color.GetColor(r, gv, b));
    g.fillRect(0, y, w, 1);
  }

  // Stars
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * w;
    const y = Math.random() * (h * 0.6);
    const size = Math.random() * 2;
    const colors = [COLORS.white, COLORS.neonCyan, COLORS.neonPink, COLORS.neonPurple];
    g.fillStyle(colors[Math.floor(Math.random() * colors.length)]);
    g.fillCircle(x, y, size);
  }

  // Distant cityscape silhouette
  g.fillStyle(0x0f0f28);
  for (let x = 0; x < w; x += 30 + Math.random() * 40) {
    const bh = 80 + Math.random() * 150;
    const bw = 15 + Math.random() * 25;
    g.fillRect(x, h - 200 - bh, bw, bh + 200);

    // Tiny window lights
    g.fillStyle(COLORS.neonYellow);
    for (let wy = h - 200 - bh + 10; wy < h - 200; wy += 12) {
      for (let wx = x + 4; wx < x + bw - 4; wx += 8) {
        if (Math.random() > 0.5) {
          g.fillRect(wx, wy, 3, 3);
        }
      }
    }
    g.fillStyle(0x0f0f28);
  }

  g.generateTexture('bg_layer1', w, h);
  g.destroy();
}

function generateBgLayer2(scene) {
  const g = scene.make.graphics({ add: false });
  const w = 800, h = 600;

  // Transparent-ish layer with mid buildings
  g.fillStyle(0x000000, 0);
  g.fillRect(0, 0, w, h);

  for (let x = 0; x < w; x += 40 + Math.random() * 60) {
    const bh = 100 + Math.random() * 200;
    const bw = 25 + Math.random() * 35;
    const baseY = h - 120;

    // Building body
    g.fillStyle(0x141430, 0.9);
    g.fillRect(x, baseY - bh, bw, bh + 120);

    // Neon edge strips
    const edgeColor = Math.random() > 0.5 ? COLORS.neonCyan : COLORS.neonPurple;
    g.fillStyle(edgeColor, 0.3);
    g.fillRect(x, baseY - bh, 2, bh);
    g.fillRect(x + bw - 2, baseY - bh, 2, bh);

    // Windows
    for (let wy = baseY - bh + 8; wy < baseY; wy += 14) {
      for (let wx = x + 5; wx < x + bw - 5; wx += 10) {
        if (Math.random() > 0.4) {
          const wc = Math.random() > 0.7 ? COLORS.neonPink : (Math.random() > 0.5 ? COLORS.neonCyan : COLORS.neonYellow);
          g.fillStyle(wc, 0.4);
          g.fillRect(wx, wy, 5, 5);
        }
      }
    }

    // Rooftop antenna/detail
    if (Math.random() > 0.5) {
      g.lineStyle(1, COLORS.neonPink, 0.5);
      const antennaX = x + bw / 2;
      g.lineBetween(antennaX, baseY - bh, antennaX, baseY - bh - 20);
      g.fillStyle(COLORS.neonPink, 0.8);
      g.fillCircle(antennaX, baseY - bh - 20, 2);
    }
  }

  // Horizontal neon signs / wires
  g.lineStyle(1, COLORS.neonPink, 0.2);
  g.lineBetween(0, h - 250, w, h - 250);
  g.lineStyle(1, COLORS.neonCyan, 0.15);
  g.lineBetween(0, h - 300, w, h - 300);

  g.generateTexture('bg_layer2', w, h);
  g.destroy();
}

function generateBgLayer3(scene) {
  const g = scene.make.graphics({ add: false });
  const w = 800, h = 600;

  g.fillStyle(0x000000, 0);
  g.fillRect(0, 0, w, h);

  // Close foreground structures - girders, pipes, neon signs
  for (let x = 0; x < w; x += 80 + Math.random() * 120) {
    const bh = 50 + Math.random() * 100;
    const bw = 20 + Math.random() * 30;
    const baseY = h - 80;

    // Dark pillar
    g.fillStyle(0x0d0d25, 0.8);
    g.fillRect(x, baseY - bh, bw, bh + 80);

    // Neon accent strip
    const nc = Math.random() > 0.5 ? COLORS.neonCyan : COLORS.neonGreen;
    g.fillStyle(nc, 0.25);
    g.fillRect(x + bw / 2 - 1, baseY - bh, 2, bh);

    // Occasional neon sign box
    if (Math.random() > 0.6) {
      const signW = 30 + Math.random() * 20;
      const signH = 10 + Math.random() * 8;
      const signY = baseY - bh + 20;
      g.fillStyle(COLORS.neonPink, 0.15);
      g.fillRect(x - 5, signY, signW, signH);
      g.lineStyle(1, COLORS.neonPink, 0.4);
      g.strokeRect(x - 5, signY, signW, signH);
    }
  }

  // Ground-level pipes
  g.fillStyle(0x1a1a40, 0.6);
  g.fillRect(0, h - 90, w, 4);
  g.fillStyle(COLORS.neonGreen, 0.15);
  g.fillRect(0, h - 90, w, 1);

  g.generateTexture('bg_layer3', w, h);
  g.destroy();
}

function generateParticle(scene) {
  const g = scene.make.graphics({ add: false });

  // Small glowing square particle
  g.fillStyle(COLORS.neonPink);
  g.fillRect(0, 0, 6, 6);
  g.fillStyle(COLORS.white, 0.8);
  g.fillRect(1, 1, 4, 4);

  g.generateTexture('particle', 6, 6);

  // Cyan particle variant
  g.clear();
  g.fillStyle(COLORS.neonCyan);
  g.fillRect(0, 0, 6, 6);
  g.fillStyle(COLORS.white, 0.8);
  g.fillRect(1, 1, 4, 4);

  g.generateTexture('particle_cyan', 6, 6);

  // Spark particle
  g.clear();
  g.fillStyle(COLORS.neonYellow);
  g.fillRect(0, 0, 4, 4);

  g.generateTexture('particle_spark', 4, 4);

  g.destroy();
}

function generateCoin(scene) {
  const g = scene.make.graphics({ add: false });

  // Glowing data orb
  g.fillStyle(COLORS.neonYellow, 0.3);
  g.fillCircle(10, 10, 10);
  g.fillStyle(COLORS.neonYellow, 0.7);
  g.fillCircle(10, 10, 7);
  g.fillStyle(COLORS.white, 0.9);
  g.fillCircle(10, 10, 3);

  g.generateTexture('coin', 20, 20);
  g.destroy();
}

function generateShieldPickup(scene) {
  const g = scene.make.graphics({ add: false });

  // Shield hexagon pickup
  g.fillStyle(COLORS.neonCyan, 0.3);
  g.fillCircle(12, 12, 12);
  g.lineStyle(2, COLORS.neonCyan, 1);
  g.strokeCircle(12, 12, 10);
  g.fillStyle(COLORS.neonCyan, 0.8);
  g.fillTriangle(12, 4, 6, 16, 18, 16);

  g.generateTexture('shield_pickup', 24, 24);
  g.destroy();
}

function generateTrail(scene) {
  const g = scene.make.graphics({ add: false });

  g.fillStyle(COLORS.neonCyan, 0.6);
  g.fillRect(0, 0, 8, 3);

  g.generateTexture('trail', 8, 3);
  g.destroy();
}

function generateCityElements(scene) {
  const g = scene.make.graphics({ add: false });

  // Holographic billboard
  g.fillStyle(COLORS.neonPurple, 0.2);
  g.fillRect(0, 0, 60, 30);
  g.lineStyle(1, COLORS.neonPurple, 0.6);
  g.strokeRect(0, 0, 60, 30);

  // Glitch lines inside
  g.fillStyle(COLORS.neonCyan, 0.3);
  g.fillRect(4, 8, 20, 2);
  g.fillRect(4, 14, 35, 2);
  g.fillRect(4, 20, 15, 2);

  g.generateTexture('billboard', 60, 30);
  g.destroy();
}
