new Phaser.Game({
  type: Phaser.AUTO,
  width: COLS * T,
  height: ROWS * T,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  backgroundColor: '#000000',
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
  scene: GameScene
});
