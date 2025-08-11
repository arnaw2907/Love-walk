// ---------- Content: messages (Stages 1–11) ----------
const messages = [
  // 1
  "Happy Birthday Hunnnn ❤️
Wishing you a year filled with love, prosperity, and endless joy.
You’ve made my life better in ways words can’t describe — thank you for taking birth and for being the most beautiful part of my world.",
  // 2
  "When I see you, I see my safe place, my happiness, and my reason to smile.",
  // 3
  "You’re not just in my heart — you are my heart.",
  // 4
  "If I could give you anything in this life, it would be the ability to see yourself through my eyes… only then would you realize how truly special you are.",
  // 5
  "Sometimes — well more than some 😂 — I feel like I don’t deserve you.
Because you are that perfect, most supportive, caring, loving, and responsible person I know.
You always put others’ needs ahead of your own.
I know I don’t give you the time you deserve, but still, you stay with me.
So please… don’t ever leave.
I love youuu ❤️",
  // 6 (lead to upper stages)
  "Here’s to many more birthdays together… keep going up 🤍",
  // 7 (lips)
  "Your smile—and those irresistible lips—my forever weakness 🤭❤️",
  // 8
  "The time I spent with you, hun, will never be forgotten — it’s etched deep in my heart.",
  // 9
  "The little fights we had (never too serious 😂🤭) only made us closer.",
  // 10
  "I still remember the first time we said “I love you” — my favorite forever moment.",
  // 11
  "When I was about to move to a different nation, you were the reason I stayed — best decision ever 🤭🤭 NOD"
];

// Photo keys (map these to actual files in assets/photos/)
const photoKeys = [
  "p1","p2","p3","p4","p5","p6","p7","p8","p9","p10","p11"
];

// Optional: for stages without unique photos yet, we’ll fall back to earlier ones
const photoFallbackMap = { 8: "p3", 9: "p4", 10: "p5", 11: "p6" };

// ---------- Phaser setup ----------
const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: 900,
  height: 506,
  physics: { default: "arcade", arcade: { gravity: { y: 0 } } },
  backgroundColor: "#0e0f14",
  scene: { preload, create, update }
};

let game = new Phaser.Game(config);

// Runtime refs
let player, target = null, moving = false, speed = 165;
let stages = [], openButtons = [];
let camera, worldHeight;
let modal, modalShown = false, cloudFx;
let preloadText, progressBar;
let finaleShown = false;
let themeBands = []; // stage 8–11 romantic backgrounds

function preload() {
  const W = this.scale.width, H = this.scale.height;

  // Preloader UI
  const barBg = this.add.rectangle(W*0.1, H*0.48, W*0.8, 8, 0x2b2f3a).setOrigin(0,0.5);
  progressBar  = this.add.rectangle(W*0.1, H*0.48, 0, 8, 0xfadadd).setOrigin(0,0.5);
  preloadText  = this.add.text(W*0.5, H*0.53, "Loading 0%", { color:"#ffffff", fontSize:"15px", fontFamily:"Georgia, serif" }).setOrigin(0.5);

  this.load.on("progress", p => {
    progressBar.width = (this.scale.width*0.8)*p;
    preloadText.setText(`Loading ${Math.round(p*100)}%`);
  });

  // Core art
  this.load.image("bg", "assets/bg.jpg");
  this.load.image("girl","assets/girl.png");

  // UI
  this.load.image("cloud","assets/ui/cloud.png");   // cloud platform art
  this.load.image("open","assets/ui/open.png");     // open icon/button
  this.load.image("panel","assets/ui/panel.png");   // popup panel

  // Photos
  this.load.image("p1","assets/photos/photo1.jpg");
  this.load.image("p2","assets/photos/photo2.jpg");
  this.load.image("p3","assets/photos/photo3.jpg");
  this.load.image("p4","assets/photos/photo4.jpg");
  this.load.image("p5","assets/photos/photo5.jpg");
  this.load.image("p6","assets/photos/photo6.jpg");
  this.load.image("p7","assets/photos/photo7.jpg");
  // Optional extra photos (place these if you have them)
  this.load.image("p8","assets/photos/photo8.jpg");
  this.load.image("p9","assets/photos/photo9.jpg");
  this.load.image("p10","assets/photos/photo10.jpg");
  this.load.image("p11","assets/photos/photo11.jpg");

  // Romantic themes (8–11): gradients + tiny particle
  this.load.image("theme8","assets/themes/theme8.png"); // peach→rose gradient 900x506
  this.load.image("theme9","assets/themes/theme9.png"); // night-violet gradient
  this.load.image("theme10","assets/themes/theme10.png"); // blossom pink
  this.load.image("theme11","assets/themes/theme11.png"); // sunrise gold
  this.load.image("petal","assets/themes/petal.png");
  this.load.image("star","assets/themes/star.png");
  this.load.image("blossom","assets/themes/blossom.png");
  this.load.image("ray","assets/themes/ray.png");
  this.load.image("heart","assets/themes/heart.png"); // finale particles
}

function create(){
  // Remove loader UI
  progressBar.destroy(); preloadText.destroy();

  const W = this.scale.width, H = this.scale.height;

  // Tall world: 11 stages
  const segment = H * 1.05;
  worldHeight = H + segment*11 + 260;
  this.cameras.main.setBounds(0, 0, W, worldHeight);
  this.physics.world.setBounds(0, 0, W, worldHeight);

  // Tile background vertically
  for(let y = 0; y < worldHeight; y += H){
    const bg = this.add.image(0, y, "bg").setOrigin(0,0);
    fit(bg, W, H);
  }

  // Stage platforms and open buttons
  for(let i=0; i<11; i++){
    const y = worldHeight - (segment*(i+1)) - 120;
    const cloud = this.add.image(W*0.5, y, "cloud").setScale(0.92);
    const open  = this.add.image(W*0.5, y-42, "open").setScale(0.72).setInteractive({useHandCursor:true});
    open.alpha = 0; open.setData("idx", i);
    open.on("pointerdown", ()=> showModal(this, i));
    stages.push(cloud); openButtons.push(open);
  }

  // Player near bottom
  player = this.physics.add.image(W*0.5, worldHeight-150, "girl");
  player.setCollideWorldBounds(true).setDepth(5).setScale(0.8);
  // Gentle idle “breathing”
  this.tweens.add({ targets: player, scale: 0.82, duration: 1200, yoyo: true, repeat: -1 });

  // Input for movement
  this.input.on("pointerdown",(p)=> moveTo(p.worldX, p.worldY));

  // Camera follow
  camera = this.cameras.main;
  camera.startFollow(player, true, 0.13, 0.13);

  // Tip
  const tip = this.add.text(W*0.5, worldHeight-70, "Tap above to move up. Reach a cloud, then tap the Open icon.", {
    color:"#ffffff", fontSize:"18px", fontFamily:"Georgia, serif"
  }).setOrigin(0.5).setDepth(6);
  this.tweens.add({targets: tip, alpha:0.25, duration:1200, yoyo:true, repeat:-1});

  // Romantic themes for stages 8–11
  createThemeBands(this, segment);

  // Modal popup
  createModal(this);
}

function update(){
  if(!moving || !target) return;

  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const dist = Math.hypot(dx, dy);

  if(dist < 6){
    moving = false; player.setVelocity(0,0); target = null;
    checkStageProximity(this);
    return;
  }

  const ang = Math.atan2(dy, dx);
  player.setVelocity(Math.cos(ang)*speed, Math.sin(ang)*speed);
}

// --------------- Helpers ---------------
function moveTo(x, y){
  // Prevent accidental big downward moves
  if(y > player.y + 140) y = player.y + 140;
  target = {x, y}; moving = true;
}

function checkStageProximity(scene){
  for(let i=0;i<stages.length;i++){
    const c = stages[i];
    const d = Phaser.Math.Distance.Between(player.x, player.y, c.x, c.y);
    const btn = openButtons[i];
    if(d < 140 && btn.alpha === 0){
      scene.tweens.add({targets: btn, alpha:1, y: btn.y-6, duration:250});
    }
  }
}

function createModal(scene){
  const W = scene.scale.width, H = scene.scale.height;

  modal = scene.add.container(0,0).setDepth(25).setVisible(false).setAlpha(0).setScrollFactor(0);
  const dim = scene.add.rectangle(0,0,W,H,0x000000,0.68).setOrigin(0);
  const panel = scene.add.image(W*0.5, H*0.5, "panel").setScale(1.02).setAlpha(0.96);

  const msg = scene.add.text(W*0.5, H*0.30, "", {
    color:"#ffffff", fontSize:"22px", fontFamily:"Georgia, serif",
    wordWrap:{width: Math.min(W*0.84, 740)}, align:"center", lineSpacing: 8
  }).setOrigin(0.5);

  const photo = scene.add.image(W*0.5, H*0.58, "p1").setOrigin(0.5).setAlpha(0.98);

  // Close on tap anywhere on dim or panel
  dim.setInteractive().on("pointerdown", ()=> hideModal(scene));
  panel.setInteractive().on("pointerdown", ()=> hideModal(scene));

  modal.add([dim, panel, msg, photo]);
  modal.msg = msg; modal.photo = photo;

  // Pop-in effect
  cloudFx = (img)=>{
    img.setScale(0.7);
    scene.tweens.add({ targets: img, scale: 0.95, duration: 280, ease: "Back.Out" });
  };
}

function showModal(scene, idx){
  if(modalShown) return;
  modalShown = true;

  const key = photoKeys[idx];
  const hasKey = scene.textures.exists(key) && scene.textures.get(key).key !== "__MISSING";
  const useKey = hasKey ? key : (photoFallbackMap[idx+1] || "p1"); // idx is 0-based, map defined 1-based readability

  modal.msg.setText(messages[idx]);
  modal.photo.setTexture(useKey);
  fit(modal.photo, scene.scale.width*0.72, scene.scale.height*0.42, true);
  cloudFx(modal.photo);

  modal.setVisible(true);
  scene.tweens.add({ targets: modal, alpha:1, duration:220 });

  // Finale after the last modal closes
  if(idx === messages.length-1 && !finaleShown){
    modal.once("hide", ()=> runFinale(scene));
  }
}

function hideModal(scene){
  scene.tweens.add({
    targets: modal, alpha:0, duration:200, onComplete(){
      modal.setVisible(false); modalShown=false; modal.emit("hide");
      highlightNextStage(scene);
    }
  });
}

function highlightNextStage(scene){
  const next = openButtons.findIndex(btn => btn.alpha < 1);
  if(next>=0){
    const btn = openButtons[next];
    scene.tweens.add({targets: btn, alpha:1, duration:250});
  }
}

function runFinale(scene){
  if(finaleShown) return;
  finaleShown = true;

  const W = scene.scale.width, H = scene.scale.height;

  // Gradient overlay + floating hearts
  const grad = scene.add.graphics().setScrollFactor(0).setDepth(30);
  const g = grad;
  const top = 0xf7bbff, mid = 0xffd1dc, bot = 0xbbe0ff;
  const grd = g.createLinearGradient(0,0,0,H);
  grd.addColorStop(0, "#f7bbff");
  grd.addColorStop(0.5, "#ffd1dc");
  grd.addColorStop(1, "#bbe0ff");
  g.fillStyle(0xffffff,1);
  g.fillGradientStyle(top, top, bot, bot, 1);
  g.fillRect(0,0,W,H);
  grad.alpha = 0;
  scene.tweens.add({targets: grad, alpha:1, duration:700});

  const hearts = scene.add.particles("heart").setDepth(31).setScrollFactor(0);
  hearts.createEmitter({
    x: {min: -20, max: W+20},
    y: H+20,
    speedY: {min: -30, max: -60},
    speedX: {min: -10, max: 10},
    scale: {start: 0.15, end: 0.02},
    alpha: {start: 0.9, end: 0},
    lifespan: 5000,
    quantity: 2,
    frequency: 120
  });

  const finalText = "Here’s to many more birthdays together. I love you more than words, more than time, more than forever. ❤️";
  const t = scene.add.text(W*0.5, H*0.5, finalText, {
    color:"#2b2340", fontSize:"26px", fontFamily:"Georgia, serif",
    wordWrap:{width: Math.min(W*0.86, 760)}, align:"center", lineSpacing:8
  }).setOrigin(0.5).setDepth(32).setScrollFactor(0).setAlpha(0);

  scene.tweens.add({targets: t, alpha:1, duration:800, delay:300});
}

function createThemeBands(scene, segment){
  const W = scene.scale.width, H = scene.scale.height;

  // Helper to add a themed band with optional particles
  function addBand(idx, texKey, particleKey, settings){
    const yCenter = worldHeight - (segment*(idx)) - 120; // idx is 1-based stage number
    const band = scene.add.image(W*0.5, yCenter, texKey).setDepth(1);
    fit(band, W, H, false); // cover
    band.alpha = 0;

    // fade based on camera position
    scene.events.on('update', ()=>{
      const camMid = scene.cameras.main.worldView.y + H/2;
      const dist = Math.abs(camMid - yCenter);
      const a = Phaser.Math.Clamp(1 - (dist/(H*0.9)), 0, 1);
      band.alpha = a*0.9;
    });

    // particles
    if(particleKey){
      const ps = scene.add.particles(particleKey).setDepth(2);
      const emitter = ps.createEmitter(settings || {});
      emitter.stop();
      themeBands.push({ yCenter, band, ps, emitter });
      scene.events.on('update', ()=>{
        const camMid = scene.cameras.main.worldView.y + H/2;
        const close = Math.abs(camMid - yCenter) < H*0.6;
        if(close){ emitter.start(); } else { emitter.stop(); }
      });
    }
  }

  // Stage 8 band (idx=8): petals
  addBand(8, "theme8", "petal", {
    x: { min: -20, max: W+20 }, y: -10,
    speedY: { min: 18, max: 36 }, speedX: { min: -15, max: 15 },
    scale: { start: 0.25, end: 0.08 }, alpha: { start: 0.9, end: 0 },
    rotate: { min: -50, max: 50 }, lifespan: 6000, quantity: 2, frequency: 120
  });

  // Stage 9 band: stars
  addBand(9, "theme9", "star", {
    x: { min: 0, max: W }, y: { min: 0, max: 0 },
    speedY: { min: 8, max: 16 }, scale: { start: 0.12, end: 0 },
    alpha: { start: 0.9, end: 0 }, lifespan: 4500, quantity: 3, frequency: 150
  });

  // Stage 10 band: blossoms
  addBand(10, "theme10", "blossom", {
    x: { min: -20, max: W+20 }, y: -10,
    speedY: { min: 22, max: 38 }, speedX: { min: -12, max: 12 },
    scale: { start: 0.22, end: 0.06 }, alpha: { start: 0.9, end: 0 },
    rotate: { min: -40, max: 40 }, lifespan: 5500, quantity: 2, frequency: 140
  });

  // Stage 11 band: sun rays
  addBand(11, "theme11", "ray", {
    x: { min: -20, max: W+20 }, y: -10,
    speedY: { min: 10, max: 18 }, scale: { start: 0.28, end: 0.1 },
    alpha: { start: 0.7, end: 0 }, lifespan: 5200, quantity: 1, frequency: 220
  });
}

// Utility: fit image into bounds while preserving ratio
function fit(img, maxW, maxH, contain = true){
  const rW = maxW / img.width, rH = maxH / img.height;
  const s = contain ? Math.min(rW, rH) : Math.max(rW, rH);
  img.setScale(s);
    }
