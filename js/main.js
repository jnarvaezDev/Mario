function Spider(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'spider');

    // anchor
    this.anchor.set(0.5);
    // animation
    this.animations.add('crawl', [0, 1, 2], 8, true);
    this.animations.add('die', [0, 4, 0, 4, 0, 4, 3, 3, 3, 3, 3, 3], 12);
    this.animations.play('crawl');
    // physic properties
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true;
    this.body.velocity.x = Spider.SPEED;
}

Spider.SPEED = 100;

// inherit from Phaser.Sprite
Spider.prototype = Object.create(Phaser.Sprite.prototype);
Spider.prototype.constructor = Spider;

//las arañas giren al toparse con la pared
Spider.prototype.update = function () {
    // check against walls and reverse direction if necessary
    if (this.body.touching.right || this.body.blocked.right) {
        this.body.velocity.x = -Spider.SPEED; // turn left
    }
    else if (this.body.touching.left || this.body.blocked.left) {
        this.body.velocity.x = Spider.SPEED; // turn right
    }
};

Spider.prototype.die = function () {
    this.body.enable = false;

    this.animations.play('die').onComplete.addOnce(function () {
        this.kill();
    }, this);
};

/*************************************************************************************************************************** */

function Hero(game, x, y) {
    // call Phaser.Sprite constructor
    Phaser.Sprite.call(this, game, x, y, 'hero');
    //subir el centro de gravedad del heroe
    this.anchor.set(0.5, 0.5);
    //habilitar fisica
    this.game.physics.enable(this);
    //evitar que hero salga d ela pantalla
    this.body.collideWorldBounds = true;

    this.animations.add('stop', [0]);
    this.animations.add('run', [1, 2], 8, true); // 8fps looped
    this.animations.add('jump', [3]);
    this.animations.add('fall', [4]);
}

// inherit from Phaser.Sprite
Hero.prototype = Object.create(Phaser.Sprite.prototype);
Hero.prototype.constructor = Hero;

Hero.prototype.update = function () {
    // update sprite animation, if it needs changing
    let animationName = this._getAnimationName();
    if (this.animations.name !== animationName) {
        this.animations.play(animationName);
    }
};

Hero.prototype.move = function (direction) {
    const SPEED = 200;
    this.body.velocity.x = direction * SPEED;

    if (this.body.velocity.x < 0) {
        this.scale.x = -1;
    }
    else if (this.body.velocity.x > 0) {
        this.scale.x = 1;
    }
};

Hero.prototype.jump = function () {
    const JUMP_SPEED = 600;
    let canJump = this.body.touching.down;

    if (canJump) {
        this.body.velocity.y = -JUMP_SPEED;
    }

    return canJump;
};

Hero.prototype.bounce = function () {
    const BOUNCE_SPEED = 200;
    this.body.velocity.y = -BOUNCE_SPEED;
};

Hero.prototype._getAnimationName = function () {
    let name = 'stop'; // default animation

    // jumping
    if (this.body.velocity.y < 0) {
        name = 'jump';
    }
    // falling
    else if (this.body.velocity.y >= 0 && !this.body.touching.down) {
        name = 'fall';
    }
    else if (this.body.velocity.x !== 0 && this.body.touching.down) {
        name = 'run';
    }

    return name;
};

/*************************************************************************************************************************** */

PlayState = {};
const LEVEL_COUNT = 2;

PlayState.init = function (data) {
    this.game.renderer.renderSession.roundPixels = true;
    //detectar movimiento
    this.keys = this.game.input.keyboard.addKeys({
        left: Phaser.KeyCode.LEFT,
        right: Phaser.KeyCode.RIGHT,
        up: Phaser.KeyCode.UP // add this line
    });

    this.keys.up.onDown.add(function () {
        let didJump = this.hero.jump();
        if (didJump) {
            this.sfx.jump.play();
        }
    }, this);

    this.coinPickupCount = 0;
    this.hasKey = false;

    this.level = (data.level || 0) % LEVEL_COUNT;
};

// setear recursos
PlayState.preload = function () {
    this.game.load.json('level:0', 'data/level00.json');
    this.game.load.json('level:1', 'data/level01.json');

    this.game.load.image('background', 'images/background.png');
    this.game.load.image('ground', 'images/ground.png');
    this.game.load.image('grass:8x1', 'images/grass_8x1.png');
    this.game.load.image('grass:6x1', 'images/grass_6x1.png');
    this.game.load.image('grass:4x1', 'images/grass_4x1.png');
    this.game.load.image('grass:2x1', 'images/grass_2x1.png');
    this.game.load.image('grass:1x1', 'images/grass_1x1.png');
    
    this.game.load.image('invisible-wall', 'images/invisible_wall.png');//paredes invisibles
    this.game.load.image('icon:coin', 'images/coin_icon.png');
    this.game.load.image('font:numbers', 'images/numbers.png');
    
    this.game.load.spritesheet('hero', 'images/hero.png', 36, 42);
    this.game.load.spritesheet('spider', 'images/spider.png', 42, 32);
    this.game.load.spritesheet('coin', 'images/coin_animated.png', 22, 22);
    this.game.load.spritesheet('door', 'images/door.png', 42, 66);
    this.game.load.image('key', 'images/key.png');
    this.game.load.spritesheet('icon:key', 'images/key_icon.png', 34, 30);
    

    this.game.load.audio('sfx:jump', 'audio/jump.wav');
    this.game.load.audio('sfx:coin', 'audio/coin.wav');
    this.game.load.audio('sfx:stomp', 'audio/stomp.wav');
    this.game.load.audio('sfx:key', 'audio/key.wav');
    this.game.load.audio('sfx:door', 'audio/door.wav');
};

// create game entities and set up world here
PlayState.create = function () {
    // crear sonidos
    this.sfx = {
        jump: this.game.add.audio('sfx:jump'),
        coin: this.game.add.audio('sfx:coin'),
        stomp: this.game.add.audio('sfx:stomp'),
        key: this.game.add.audio('sfx:key'),
        door: this.game.add.audio('sfx:door'),
    };
    this.game.add.image(0, 0, 'background');
    this._loadLevel(this.game.cache.getJSON(`level:${this.level}`));
    this._createHud();
};

PlayState.update = function () {
    this._handleCollisions();
    this._handleInput();
    this.coinFont.text = `x${this.coinPickupCount}`;
    this.keyIcon.frame = this.hasKey ? 1 : 0;
};

PlayState._handleCollisions = function () {
    this.game.physics.arcade.collide(this.hero, this.platforms);//evitar eroe traspase las plataformas flotantes
    this.game.physics.arcade.collide(this.spiders,this.platforms);//evitar arañas traspasen las plataformas flotantes
    this.game.physics.arcade.collide(this.spiders, this.enemyWalls);//evitar choque de arañas con paredes invisbles
    //recojer y no bloquearse con las monedas
    this.game.physics.arcade.overlap(this.hero, this.coins, this._onHeroVsCoin,null, this);
    //chocar con los enemigos
    this.game.physics.arcade.overlap(this.hero, this.spiders,this._onHeroVsEnemy, null, this);

    this.game.physics.arcade.overlap(this.hero, this.key, this._onHeroVsKey,null, this);

    // ignore if there is no key or the player is on air
    this.game.physics.arcade.overlap(this.hero, this.door, this._onHeroVsDoor,function (hero, door) {
        return this.hasKey && hero.body.touching.down;
    }, this);
};

PlayState._handleInput = function () {
    if (this.keys.left.isDown) { // move hero left
        this.hero.move(-1);
    }
    else if (this.keys.right.isDown) { // move hero right
        this.hero.move(1);
    }else { // stop
        this.hero.move(0);
    }
};

PlayState._loadLevel = function (data) {
    // create all the groups/layers that we need
    this.platforms = this.game.add.group();
    this.coins = this.game.add.group();
    this.spiders = this.game.add.group();
    this.enemyWalls = this.game.add.group();
    this.bgDecoration = this.game.add.group();
    //ocultar paredes invisbles
    this.enemyWalls.visible = false;
    // carga todas las plataformas
    data.platforms.forEach(this._spawnPlatform, this);
    // cargar héroe y enemigos
    this._spawnCharacters({hero: data.hero, spiders: data.spiders});
    // render monedas
    data.coins.forEach(this._spawnCoin, this);
    this._spawnDoor(data.door.x, data.door.y);
    this._spawnKey(data.key.x, data.key.y);
    // enable gravity
    const GRAVITY = 1200;
    this.game.physics.arcade.gravity.y = GRAVITY;
};

//reset al morir o matar al enemigo detectando la velocidad vertical del cuerpo
PlayState._onHeroVsEnemy = function (hero, enemy) {
    if (hero.body.velocity.y > 0) { // kill enemies when hero is falling
        hero.bounce();
        enemy.die();
        this.sfx.stomp.play();
    }else { // game over -> restart the game
        this.sfx.stomp.play();
        //this.game.state.restart();
        this.game.state.restart(true, false, {level: this.level});//enviarlo al sigt nivel
    }
};

//desaparecer coin al tomarla
PlayState._onHeroVsCoin = function (hero, coin) {
    //reproducir sonido 
    this.sfx.coin.play();
    coin.kill();
    this.coinPickupCount++;
};

PlayState._onHeroVsKey = function (hero, key) {
    this.sfx.key.play();
    key.kill();
    this.hasKey = true;
};

PlayState._onHeroVsDoor = function (hero, door) {
    this.sfx.door.play();
    //this.game.state.restart();
    this.game.state.restart(true, false, { level: this.level + 1 });//enviarlo al sgt nivel
    // TODO: go to the next level instead
};

PlayState._createHud = function () {
    this.keyIcon = this.game.make.image(0, 19, 'icon:key');
    this.keyIcon.anchor.set(0, 0.5);
    const NUMBERS_STR = '0123456789X ';
    this.coinFont = this.game.add.retroFont('font:numbers', 20, 26,NUMBERS_STR);

    let coinIcon = this.game.make.image(this.keyIcon.width + 7, 0, 'icon:coin');
    let coinScoreImg = this.game.make.image(coinIcon.x + coinIcon.width,coinIcon.height / 2, this.coinFont);
    coinScoreImg.anchor.set(0, 0.5);

    this.hud = this.game.add.group();
    this.hud.add(coinIcon);
    this.hud.position.set(10, 10);
    this.hud.add(coinScoreImg);
    this.hud.add(this.keyIcon);
};

PlayState._spawnPlatform = function (platform) {
    let sprite = this.platforms.create(
        platform.x, platform.y, platform.image);

    this.game.physics.enable(sprite);
    //desactivar grabvedad para las plataformas
    sprite.body.allowGravity = false;
    sprite.body.immovable = true;
    //add paredes invisibles a las plataforma flotantes
    this._spawnEnemyWall(platform.x, platform.y, 'left');
    this._spawnEnemyWall(platform.x + sprite.width, platform.y, 'right');
};

PlayState._spawnCharacters = function (data) {
    // render spiders
    data.spiders.forEach(function (spider) {
        let sprite = new Spider(this.game, spider.x, spider.y);
        this.spiders.add(sprite);
    }, this);
    // render heroe
    this.hero = new Hero(this.game, data.hero.x, data.hero.y);
    this.game.add.existing(this.hero);
};

PlayState._spawnCoin = function (coin) {
    let sprite = this.coins.create(coin.x, coin.y, 'coin');
    sprite.anchor.set(0.5, 0.5);
    //girar moneda
    sprite.animations.add('rotate', [0, 1, 2, 1], 6, true); // 6fps, looped
    sprite.animations.play('rotate');
    //recojer comedas
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
};


PlayState._spawnEnemyWall = function (x, y, side) {
    let sprite = this.enemyWalls.create(x, y, 'invisible-wall');
    // anchor and y displacement
    sprite.anchor.set(side === 'left' ? 1 : 0, 1);

    // physic properties
    this.game.physics.enable(sprite);
    sprite.body.immovable = true;
    sprite.body.allowGravity = false;
};

PlayState._spawnDoor = function (x, y) {
    this.door = this.bgDecoration.create(x, y, 'door');
    this.door.anchor.setTo(0.5, 1);
    this.game.physics.enable(this.door);
    this.door.body.allowGravity = false;
};

PlayState._spawnKey = function (x, y) {
    this.key = this.bgDecoration.create(x, y, 'key');
    this.key.anchor.set(0.5, 0.5);
    this.game.physics.enable(this.key);
    this.key.body.allowGravity = false;

    this.key.y -= 3;
    this.game.add.tween(this.key)
        .to({y: this.key.y + 6}, 800, Phaser.Easing.Sinusoidal.InOut)
        .yoyo(true)
        .loop()
        .start();
};

window.onload = function () {
    let game = new Phaser.Game(960, 600, Phaser.AUTO, 'game');
    game.state.add('play', PlayState);
    game.state.start('play', true, false, {level: 0});
};