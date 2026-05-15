import Phaser from 'phaser';
import './style.css';

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const GROUND_Y = 430;
const PLAYER_X = 170;
const GRAVITY_Y = 1600;
const JUMP_VELOCITY = -620;

class SkySprintScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private ground!: Phaser.GameObjects.TileSprite;
  private obstacleGroup!: Phaser.Physics.Arcade.Group;
  private scoreText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private skyline!: Phaser.GameObjects.TileSprite;
  private score = 0;
  private gameOver = false;
  private spawnTimer = 0;
  private obstacleSpeed = 340;

  constructor() {
    super('sky-sprint');
  }

  preload() {
    this.createTexture('player', 56, 72, 0xf7b801);
    this.createTexture('obstacle', 42, 80, 0xfb3640);
    this.createTexture('ground', 128, 32, 0x254441);
    this.createTexture('skyline', 256, 180, 0x3a506b, true);
  }

  create() {
    this.cameras.main.setBackgroundColor('#9ad1d4');

    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x9ad1d4)
      .setDepth(-10);
    this.add
      .rectangle(GAME_WIDTH / 2, 120, GAME_WIDTH, 220, 0xcdf7f6, 0.8)
      .setDepth(-9);

    this.skyline = this.add
      .tileSprite(GAME_WIDTH / 2, 270, GAME_WIDTH, 220, 'skyline')
      .setAlpha(0.32);

    this.ground = this.add
      .tileSprite(GAME_WIDTH / 2, GROUND_Y + 46, GAME_WIDTH, 96, 'ground')
      .setDepth(2);

    const groundHitbox = this.add.rectangle(
      GAME_WIDTH / 2,
      GROUND_Y + 28,
      GAME_WIDTH,
      20,
      0x000000,
      0
    );
    this.physics.add.existing(groundHitbox, true);

    this.add
      .text(48, 38, 'SKY SPRINT', {
        fontFamily: 'Georgia, serif',
        fontSize: '36px',
        color: '#102a43',
        fontStyle: 'bold',
      })
      .setDepth(5);

    this.scoreText = this.add.text(48, 88, 'Score: 0', {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '24px',
      color: '#102a43',
    });

    this.hintText = this.add
      .text(GAME_WIDTH / 2, 110, 'Press SPACE, UP, or TAP to jump', {
        fontFamily: 'Verdana, sans-serif',
        fontSize: '20px',
        color: '#173f5f',
      })
      .setOrigin(0.5);

    this.physics.world.gravity.y = GRAVITY_Y;

    this.player = this.physics.add.sprite(PLAYER_X, GROUND_Y - 40, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(3);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(42, 68).setOffset(7, 2);

    this.obstacleGroup = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });

    this.physics.add.collider(
      this.player,
      groundHitbox as Phaser.GameObjects.GameObject
    );

    this.physics.add.overlap(this.player, this.obstacleGroup, () => {
      this.endRun();
    });

    this.input.keyboard?.on('keydown-SPACE', this.jump, this);
    this.input.keyboard?.on('keydown-UP', this.jump, this);
    this.input.on('pointerdown', this.jump, this);

    this.scale.on('resize', this.handleResize, this);
  }

  update(_: number, delta: number) {
    if (this.gameOver) {
      return;
    }

    this.spawnTimer += delta;
    this.score += delta * 0.01;
    this.obstacleSpeed += delta * 0.0009;

    this.scoreText.setText(`Score: ${Math.floor(this.score)}`);
    this.ground.tilePositionX += (this.obstacleSpeed * delta) / 1000;
    this.skyline.tilePositionX += (this.obstacleSpeed * 0.18 * delta) / 1000;

    if (this.spawnTimer >= this.nextSpawnDelay()) {
      this.spawnObstacle();
      this.spawnTimer = 0;
    }

    this.obstacleGroup.getChildren().forEach((child) => {
      const obstacle = child as Phaser.Physics.Arcade.Image;
      obstacle.x -= (this.obstacleSpeed * delta) / 1000;

      if (obstacle.x < -80) {
        this.obstacleGroup.remove(obstacle, true, true);
      }
    });
  }

  private jump() {
    if (this.gameOver) {
      this.scene.restart();
      return;
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (!body.blocked.down) {
      return;
    }

    this.hintText.setVisible(false);
    this.player.setVelocityY(JUMP_VELOCITY);
  }

  private spawnObstacle() {
    const obstacleHeight = Phaser.Math.Between(50, 96);
    const obstacle = this.obstacleGroup.create(
      GAME_WIDTH + 60,
      GROUND_Y + 24 - obstacleHeight / 2,
      'obstacle'
    ) as Phaser.Physics.Arcade.Image;

    obstacle.setOrigin(0.5, 0.5);
    obstacle.setDisplaySize(38, obstacleHeight);
    obstacle.body?.setSize(38, obstacleHeight);
    obstacle.setDepth(3);
  }

  private nextSpawnDelay() {
    return Phaser.Math.Between(900, 1550);
  }

  private endRun() {
    if (this.gameOver) {
      return;
    }

    this.gameOver = true;
    this.physics.pause();
    this.player.setTint(0xff6b6b);

    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 360, 160, 0x102a43, 0.84)
      .setStrokeStyle(3, 0xf7b801)
      .setDepth(10);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 26, 'Run Over', {
        fontFamily: 'Georgia, serif',
        fontSize: '34px',
        color: '#f0f4f8',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 16,
        `Final Score: ${Math.floor(this.score)}\nPress jump to try again`,
        {
          fontFamily: 'Verdana, sans-serif',
          fontSize: '20px',
          align: 'center',
          color: '#d9e2ec',
        }
      )
      .setOrigin(0.5)
      .setDepth(11);
  }

  private createTexture(
    key: string,
    width: number,
    height: number,
    color: number,
    skyline = false
  ) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });

    if (skyline) {
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, 120, width, 60);
      for (let x = 0; x < width; x += 38) {
        const buildingHeight = Phaser.Math.Between(40, 130);
        graphics.fillRect(x, 180 - buildingHeight, 28, buildingHeight);
      }
    } else {
      graphics.fillStyle(color, 1);
      graphics.fillRoundedRect(0, 0, width, height, 12);
    }

    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    this.cameras.resize(gameSize.width, gameSize.height);
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#9ad1d4',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [SkySprintScene],
});

window.addEventListener('beforeunload', () => {
  game.destroy(true);
});
