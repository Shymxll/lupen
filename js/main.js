new Phaser.Game({
  type: Phaser.AUTO,
  width: COLS * T,
  height: ROWS * T,
  backgroundColor: '#000000',
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
  scene: GameScene
});
