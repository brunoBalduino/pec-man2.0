"use strict";

/*
============================================================
PIXEL QUEST - 2 PLAYERS
============================================================

JOGADOR 1
W A S D = movimento
SPACE = dash
Q = poder

JOGADOR 2
SETAS = movimento
ENTER = dash
SHIFT = poder

P = pausa
R = reiniciar
============================================================
*/


/* ==========================================================
   CANVAS
========================================================== */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const TILE = 40;


/* ==========================================================
   ELEMENTOS DA INTERFACE
========================================================== */

const menu = document.getElementById("menu");
const pauseScreen = document.getElementById("pauseScreen");
const messageScreen = document.getElementById("messageScreen");

const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const restartButton = document.getElementById("restartButton");
const continueButton = document.getElementById("continueButton");

const messageButton = document.getElementById("messageButton");

const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");
const messageIcon = document.getElementById("messageIcon");

const score1 = document.getElementById("score1");
const score2 = document.getElementById("score2");

const lives1 = document.getElementById("lives1");
const lives2 = document.getElementById("lives2");

const levelText = document.getElementById("levelText");
const difficultyText = document.getElementById("difficultyText");
const progressBar = document.getElementById("progressBar");
const objectiveText = document.getElementById("objectiveText");


/* ==========================================================
   MAPAS
========================================================== */

/*
   # = parede
   . = caminho

   Todos os mapas possuem 24 colunas x 16 linhas.
*/

const MAPS = [

[
"########################",
"#......................#",
"#.####.#####.#####.###.#",
"#......#.........#.....#",
"###.##.#.#######.#.###.#",
"#...##.#...#.....#.....#",
"#.#....###.#.###.###.#.#",
"#.#..........#.......#.#",
"#.####.######.#######..#",
"#......#............#..#",
"#.####.#.##########.#..#",
"#....#.#......#.....#..#",
"####.#.######.#.###.#..#",
"#....#........#.....#..#",
"#.###############.##..#",
"#......................#",
"########################"
],

[
"########################",
"#......................#",
"#.######.###########.#.#",
"#.#....#.#.........#.#.#",
"#.#.##.#.#.#######.#.#.#",
"#...##.#.#.....#...#...#",
"###.##.#.#####.#.#####.#",
"#......#.....#.#.......#",
"#.#########.#.#######.#",
"#.........#.#.........#",
"#.#######.#.#########.#",
"#.#.....#.#...........#",
"#.#.###.#.#############",
"#...#...#.............#",
"###.#.#################",
"#......................#",
"########################"
],

[
"########################",
"#......................#",
"#.####.##########.####.#",
"#....#......#.....#....#",
"###.######.#.#.######.##",
"#...#....#.#.#......#..#",
"#.#.#.##.#.#.####.#.#..#",
"#.#...#..#...#....#....#",
"#.#####.######.#########",
"#.....#......#.........#",
"#.###.######.#####.####",
"#...#......#.....#.....#",
"###.######.#####.#.###.#",
"#...#............#.....#",
"#.###.###############..#",
"#......................#",
"########################"
],

[
"########################",
"#......................#",
"#.#####.##########.###.#",
"#.#...#....#.......#...#",
"#.#.#.####.#.#####.#.#.#",
"#...#......#.#...#...#.#",
"#####.######.#.#.#####.#",
"#.....#......#.#.......#",
"#.###.#.######.#######.#",
"#...#.#...............#",
"###.#.###############.#",
"#...#.....#...........#",
"#.#######.#.###########",
"#.........#...........#",
"#.###################.#",
"#......................#",
"########################"
],

[
"########################",
"#......................#",
"#.###.###########.####.#",
"#...#...........#......#",
"###.#####.#####.######.#",
"#...#...#.#...#........#",
"#.#.#.#.#.#.#.########.#",
"#.#...#...#.#..........#",
"#.#####.###.############",
"#.......#...............#",
"#.#####.#.############.#",
"#.....#.#........#.....#",
"#####.#.########.#.###.#",
"#.....#..........#.....#",
"#.###################..#",
"#......................#",
"########################"
]

];


/* ==========================================================
   DIFICULDADES
========================================================== */

const DIFFICULTIES = {

    easy: {
        name: "FÁCIL",
        enemySpeed: 55,
        enemyCount: 3,
        damageCooldown: 1.5
    },

    normal: {
        name: "NORMAL",
        enemySpeed: 70,
        enemyCount: 4,
        damageCooldown: 1.1
    },

    hard: {
        name: "DIFÍCIL",
        enemySpeed: 88,
        enemyCount: 5,
        damageCooldown: .8
    }

};


let difficulty = "normal";


/* ==========================================================
   ESTADO
========================================================== */

let gameStarted = false;
let paused = false;
let currentLevel = 0;

let lastTime = 0;

let keys = {};

let crystals = [];
let coins = [];
let enemies = [];
let powerUps = [];
let particles = [];
let switches = [];

let totalCrystals = 0;
let collectedCrystals = 0;

let shake = 0;


/* ==========================================================
   JOGADORES
========================================================== */

let player1;
let player2;


/* ==========================================================
   UTILITÁRIOS
========================================================== */

function clamp(value, min, max) {

    return Math.max(
        min,
        Math.min(max, value)
    );

}


function distance(a, b) {

    return Math.hypot(
        a.x - b.x,
        a.y - b.y
    );

}


function randomNumber(min, max) {

    return Math.random() * (max - min) + min;

}


function getMap() {

    return MAPS[currentLevel];

}


function isWall(col, row) {

    const map = getMap();

    if (
        row < 0 ||
        row >= map.length ||
        col < 0 ||
        col >= map[0].length
    ) {
        return true;
    }

    return map[row][col] === "#";

}


function isFree(col, row) {

    return !isWall(col, row);

}


function tilePosition(col, row) {

    return {

        x: col * TILE + TILE / 2,
        y: row * TILE + TILE / 2

    };

}


function worldToTile(x, y) {

    return {

        col: Math.floor(x / TILE),
        row: Math.floor(y / TILE)

    };

}


/*
   Colisão circular simplificada.
*/

function canMove(x, y, radius) {

    const points = [

        [x - radius, y - radius],
        [x + radius, y - radius],
        [x - radius, y + radius],
        [x + radius, y + radius]

    ];

    for (const point of points) {

        const tile = worldToTile(
            point[0],
            point[1]
        );

        if (
            isWall(
                tile.col,
                tile.row
            )
        ) {
            return false;
        }

    }

    return true;

}


/*
   Procura uma posição livre.
*/

function findFreePosition() {

    const map = getMap();

    for (let attempt = 0; attempt < 500; attempt++) {

        const row =
            Math.floor(
                randomNumber(
                    1,
                    map.length - 1
                )
            );

        const col =
            Math.floor(
                randomNumber(
                    1,
                    map[0].length - 1
                )
            );

        if (isFree(col, row)) {

            return tilePosition(
                col,
                row
            );

        }

    }

    return tilePosition(1, 1);

}


/* ==========================================================
   CRIAÇÃO DOS JOGADORES
========================================================== */

function createPlayers() {

    const p1 = tilePosition(1, 1);

    const p2 = tilePosition(22, 15);


    player1 = {

        x: p1.x,
        y: p1.y,

        radius: 12,

        speed: 135,

        directionX: 1,
        directionY: 0,

        score: 0,

        lives: 3,

        dashCooldown: 0,

        powerCooldown: 0,

        invincible: 0,

        speedPower: 0,

        color: "#22b8ff",

        spawnX: p1.x,
        spawnY: p1.y

    };


    player2 = {

        x: p2.x,
        y: p2.y,

        radius: 12,

        speed: 135,

        directionX: -1,
        directionY: 0,

        score: 0,

        lives: 3,

        dashCooldown: 0,

        powerCooldown: 0,

        invincible: 0,

        speedPower: 0,

        color: "#ff8b35",

        spawnX: p2.x,
        spawnY: p2.y

    };

}


/* ==========================================================
   CRISTAIS
========================================================== */

function createCrystals() {

    crystals = [];

    collectedCrystals = 0;

    const map = getMap();


    for (
        let row = 1;
        row < map.length - 1;
        row++
    ) {

        for (
            let col = 1;
            col < map[0].length - 1;
            col++
        ) {

            if (
                isFree(col, row)
            ) {

                /*
                   Evita colocar cristal
                   exatamente nas áreas iniciais.
                */

                if (
                    (col <= 3 && row <= 3) ||
                    (col >= 20 && row >= 13)
                ) {
                    continue;
                }


                /*
                   Nem todo espaço possui cristal.
                */

                if (
                    Math.random() < .48
                ) {

                    const p =
                        tilePosition(
                            col,
                            row
                        );


                    crystals.push({

                        x: p.x,
                        y: p.y,

                        collected: false,

                        phase:
                            Math.random() * 6

                    });

                }

            }

        }

    }


    /*
       Garante quantidade mínima.
    */

    while (
        crystals.length < 15
    ) {

        const p =
            findFreePosition();


        crystals.push({

            x: p.x,
            y: p.y,

            collected: false,

            phase:
                Math.random() * 6

        });

    }


    totalCrystals =
        crystals.length;

}


/* ==========================================================
   MOEDAS
========================================================== */

function createCoins() {

    coins = [];


    for (let i = 0; i < 12; i++) {

        const p =
            findFreePosition();


        coins.push({

            x: p.x,
            y: p.y,

            collected: false,

            phase:
                Math.random() * 6

        });

    }

}


/* ==========================================================
   POWER UPS
========================================================== */

function createPowerUps() {

    powerUps = [];


    const types = [
        "speed",
        "shield",
        "freeze",
        "bomb"
    ];


    for (
        let i = 0;
        i < 4;
        i++
    ) {

        const p =
            findFreePosition();


        powerUps.push({

            x: p.x,
            y: p.y,

            type: types[i],

            active: true,

            rotation: 0

        });

    }

}


/* ==========================================================
   SWITCHES
========================================================== */

function createSwitches() {

    switches = [];


    /*
       Dois mecanismos interativos.
    */

    for (let i = 0; i < 2; i++) {

        const p =
            findFreePosition();


        switches.push({

            x: p.x,
            y: p.y,

            active: false

        });

    }

}


/* ==========================================================
   INIMIGOS
========================================================== */

function createEnemies() {

    enemies = [];

    const config =
        DIFFICULTIES[difficulty];


    for (
        let i = 0;
        i < config.enemyCount;
        i++
    ) {

        let p =
            findFreePosition();


        let safe = false;


        for (
            let attempt = 0;
            attempt < 100;
            attempt++
        ) {

            p =
                findFreePosition();


            if (
                distance(p, player1) > 180 &&
                distance(p, player2) > 180
            ) {

                safe = true;
                break;

            }

        }


        if (!safe) {
            p = findFreePosition();
        }


        enemies.push({

            x: p.x,
            y: p.y,

            radius: 12,

            speed:
                config.enemySpeed *
                randomNumber(.8, 1.15),

            target: null,

            stunned: 0,

            directionX: 0,

            directionY: 0,

            thinkTimer: 0

        });

    }

}


/* ==========================================================
   INICIALIZAR FASE
========================================================== */

function loadLevel() {

    createPlayers();

    createCrystals();

    createCoins();

    createPowerUps();

    createSwitches();

    createEnemies();

    updateHUD();

}


/* ==========================================================
   PARTÍCULAS
========================================================== */

function createParticles(
    x,
    y,
    color,
    amount = 10
) {

    for (
        let i = 0;
        i < amount;
        i++
    ) {

        particles.push({

            x,
            y,

            velocityX:
                randomNumber(-90, 90),

            velocityY:
                randomNumber(-90, 90),

            life:
                randomNumber(.3, .8),

            maxLife: .8,

            size:
                randomNumber(2, 5),

            color

        });

    }

}


function updateParticles(dt) {

    for (const p of particles) {

        p.x +=
            p.velocityX * dt;

        p.y +=
            p.velocityY * dt;

        p.velocityX *= .96;
        p.velocityY *= .96;

        p.life -= dt;

    }


    particles =
        particles.filter(
            p => p.life > 0
        );

}


/* ==========================================================
   INPUT
========================================================== */

document.addEventListener(
    "keydown",
    event => {

        keys[event.code] = true;


        if (
            [
                "ArrowUp",
                "ArrowDown",
                "ArrowLeft",
                "ArrowRight",
                "Space",
                "Enter"
            ].includes(event.code)
        ) {

            event.preventDefault();

        }


        if (
            event.code === "KeyP" &&
            gameStarted
        ) {

            togglePause();

        }


        if (
            event.code === "KeyR" &&
            gameStarted
        ) {

            restartGame();

        }

    }
);


document.addEventListener(
    "keyup",
    event => {

        keys[event.code] = false;

    }
);


/* ==========================================================
   MOVIMENTO
========================================================== */

function movePlayer(
    player,
    up,
    down,
    left,
    right,
    dt
) {

    let dx = 0;
    let dy = 0;


    if (keys[up]) dy -= 1;
    if (keys[down]) dy += 1;
    if (keys[left]) dx -= 1;
    if (keys[right]) dx += 1;


    if (
        dx !== 0 ||
        dy !== 0
    ) {

        const length =
            Math.hypot(dx, dy);


        dx /= length;
        dy /= length;


        player.directionX = dx;
        player.directionY = dy;

    }


    let speed =
        player.speed;


    if (
        player.speedPower > 0
    ) {

        speed *= 1.5;

    }


    const nextX =
        player.x +
        dx *
        speed *
        dt;


    const nextY =
        player.y +
        dy *
        speed *
        dt;


    if (
        canMove(
            nextX,
            player.y,
            player.radius
        )
    ) {

        player.x = nextX;

    }


    if (
        canMove(
            player.x,
            nextY,
            player.radius
        )
    ) {

        player.y = nextY;

    }

}


/* ==========================================================
   DASH
========================================================== */

function dash(player) {

    if (
        player.dashCooldown > 0
    ) {
        return;
    }


    player.dashCooldown = 2.2;


    const distanceDash = 90;


    for (
        let i = 0;
        i < 10;
        i++
    ) {

        const nx =
            player.x +
            player.directionX *
            (distanceDash / 10);


        const ny =
            player.y +
            player.directionY *
            (distanceDash / 10);


        if (
            canMove(
                nx,
                ny,
                player.radius
            )
        ) {

            player.x = nx;
            player.y = ny;

        } else {

            break;

        }

    }


    createParticles(
        player.x,
        player.y,
        player.color,
        18
    );

}


/* ==========================================================
   PODER
========================================================== */

function usePower(player) {

    if (
        player.powerCooldown > 0
    ) {
        return;
    }


    player.powerCooldown = 5;


    /*
       O poder cria um pulso
       que paralisa inimigos.
    */

    for (const enemy of enemies) {

        if (
            distance(
                player,
                enemy
            ) < 150
        ) {

            enemy.stunned = 3;

            player.score += 25;

        }

    }


    createParticles(
        player.x,
        player.y,
        "#a855f7",
        35
    );


    shake = .2;

}


/* ==========================================================
   COLETAR CRISTAIS
========================================================== */

function collectCrystals(player) {

    for (const crystal of crystals) {

        if (
            crystal.collected
        ) {
            continue;
        }


        if (
            distance(
                player,
                crystal
            ) < 20
        ) {

            crystal.collected = true;

            collectedCrystals++;

            player.score += 20;


            createParticles(
                crystal.x,
                crystal.y,
                "#28d9ff",
                12
            );

        }

    }

}


/* ==========================================================
   COLETAR MOEDAS
========================================================== */

function collectCoins(player) {

    for (const coin of coins) {

        if (
            coin.collected
        ) {
            continue;
        }


        if (
            distance(
                player,
                coin
            ) < 20
        ) {

            coin.collected = true;

            player.score += 10;


            createParticles(
                coin.x,
                coin.y,
                "#ffd447",
                8
            );

        }

    }

}


/* ==========================================================
   POWER UPS
========================================================== */

function collectPowerUps(player) {

    for (const power of powerUps) {

        if (!power.active) {
            continue;
        }


        if (
            distance(
                player,
                power
            ) < 22
        ) {

            power.active = false;

            activatePower(
                player,
                power.type
            );

        }

    }

}


function activatePower(
    player,
    type
) {

    if (type === "speed") {

        player.speedPower = 7;

        player.score += 30;

    }


    if (type === "shield") {

        player.invincible = 7;

        player.score += 30;

    }


    if (type === "freeze") {

        for (const enemy of enemies) {
            enemy.stunned = 5;
        }

        player.score += 40;

    }


    if (type === "bomb") {

        for (const enemy of enemies) {

            if (
                distance(
                    player,
                    enemy
                ) < 190
            ) {

                enemy.stunned = 5;

                player.score += 50;

            }

        }

        shake = .4;

    }


    createParticles(
        player.x,
        player.y,
        "#ffd447",
        25
    );

}


/* ==========================================================
   MECANISMOS DO CENÁRIO
========================================================== */

function updateSwitches(player) {

    for (const mechanism of switches) {

        if (
            mechanism.active
        ) {
            continue;
        }


        if (
            distance(
                player,
                mechanism
            ) < 25
        ) {

            mechanism.active = true;

            player.score += 40;


            createParticles(
                mechanism.x,
                mechanism.y,
                "#32e875",
                20
            );

        }

    }

}


/* ==========================================================
   DANO
========================================================== */

function damagePlayer(player) {

    if (
        player.invincible > 0
    ) {
        return;
    }


    player.lives--;

    player.invincible =
        DIFFICULTIES[difficulty]
            .damageCooldown;


    createParticles(
        player.x,
        player.y,
        "#ff4560",
        25
    );


    shake = .3;


    player.x =
        player.spawnX;

    player.y =
        player.spawnY;


    if (
        player.lives <= 0
    ) {

        player.lives = 0;

    }


    if (
        player1.lives <= 0 &&
        player2.lives <= 0
    ) {

        gameOver();

    }

}


/* ==========================================================
   INIMIGOS
========================================================== */

function updateEnemies(dt) {

    const config =
        DIFFICULTIES[difficulty];


    for (const enemy of enemies) {

        if (
            enemy.stunned > 0
        ) {

            enemy.stunned -= dt;

            continue;

        }


        /*
           Escolhe o jogador mais próximo.
        */

        const d1 =
            distance(
                enemy,
                player1
            );

        const d2 =
            distance(
                enemy,
                player2
            );


        enemy.target =
            d1 < d2
                ? player1
                : player2;


        enemy.thinkTimer -= dt;


        if (
            enemy.thinkTimer <= 0
        ) {

            enemy.thinkTimer = .25;


            const target =
                enemy.target;


            let dx =
                target.x -
                enemy.x;

            let dy =
                target.y -
                enemy.y;


            const length =
                Math.hypot(dx, dy) || 1;


            dx /= length;
            dy /= length;


            enemy.directionX = dx;
            enemy.directionY = dy;

        }


        const speed =
            enemy.speed;


        const nx =
            enemy.x +
            enemy.directionX *
            speed *
            dt;


        const ny =
            enemy.y +
            enemy.directionY *
            speed *
            dt;


        if (
            canMove(
                nx,
                enemy.y,
                enemy.radius
            )
        ) {

            enemy.x = nx;

        } else {

            /*
               Se bater na parede,
               tenta virar.
            */

            enemy.directionX =
                -enemy.directionX;

        }


        if (
            canMove(
                enemy.x,
                ny,
                enemy.radius
            )
        ) {

            enemy.y = ny;

        } else {

            enemy.directionY =
                -enemy.directionY;

        }


        if (
            distance(
                enemy,
                player1
            ) < 22
        ) {

            damagePlayer(
                player1
            );

        }


        if (
            distance(
                enemy,
                player2
            ) < 22
        ) {

            damagePlayer(
                player2
            );

        }

    }

}


/* ==========================================================
   HABILIDADES
========================================================== */

function updatePlayerTimers(
    player,
    dt
) {

    player.dashCooldown =
        Math.max(
            0,
            player.dashCooldown - dt
        );


    player.powerCooldown =
        Math.max(
            0,
            player.powerCooldown - dt
        );


    player.invincible =
        Math.max(
            0,
            player.invincible - dt
        );


    player.speedPower =
        Math.max(
            0,
            player.speedPower - dt
        );

}


/* ==========================================================
   ATIVAÇÃO DE TECLAS ESPECIAIS
========================================================== */

let previousSpace = false;
let previousEnter = false;
let previousQ = false;
let previousShift = false;


function handleAbilities() {

    const space =
        !!keys["Space"];

    const enter =
        !!keys["Enter"];

    const q =
        !!keys["KeyQ"];

    const shift =
        !!keys["Shift"];


    if (
        space &&
        !previousSpace
    ) {

        dash(player1);

    }


    if (
        enter &&
        !previousEnter
    ) {

        dash(player2);

    }


    if (
        q &&
        !previousQ
    ) {

        usePower(player1);

    }


    if (
        shift &&
        !previousShift
    ) {

        usePower(player2);

    }


    previousSpace = space;
    previousEnter = enter;
    previousQ = q;
    previousShift = shift;

}


/* ==========================================================
   UPDATE
========================================================== */

function update(dt) {

    if (
        !gameStarted ||
        paused
    ) {
        return;
    }


    dt =
        Math.min(
            dt,
            .033
        );


    handleAbilities();


    movePlayer(
        player1,
        "KeyW",
        "KeyS",
        "KeyA",
        "KeyD",
        dt
    );


    movePlayer(
        player2,
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        dt
    );


    updatePlayerTimers(
        player1,
        dt
    );


    updatePlayerTimers(
        player2,
        dt
    );


    collectCrystals(
        player1
    );

    collectCrystals(
        player2
    );


    collectCoins(
        player1
    );

    collectCoins(
        player2
    );


    collectPowerUps(
        player1
    );

    collectPowerUps(
        player2
    );


    updateSwitches(
        player1
    );

    updateSwitches(
        player2
    );


    updateEnemies(dt);

    updateParticles(dt);


    shake =
        Math.max(
            0,
            shake - dt
        );


    /*
       Quando todos os cristais
       são coletados, a fase termina.
    */

    if (
        collectedCrystals >=
        totalCrystals
    ) {

        finishLevel();

    }


    updateHUD();

}


/* ==========================================================
   DESENHO DO FUNDO
========================================================== */

function drawBackground() {

    ctx.fillStyle = "#070a16";

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    /*
       Grade.
    */

    ctx.strokeStyle =
        "rgba(80,130,255,.035)";

    ctx.lineWidth = 1;


    for (
        let x = 0;
        x <= WIDTH;
        x += TILE
    ) {

        ctx.beginPath();

        ctx.moveTo(x, 0);
        ctx.lineTo(x, HEIGHT);

        ctx.stroke();

    }


    for (
        let y = 0;
        y <= HEIGHT;
        y += TILE
    ) {

        ctx.beginPath();

        ctx.moveTo(0, y);
        ctx.lineTo(WIDTH, y);

        ctx.stroke();

    }

}


/* ==========================================================
   DESENHO DO MAPA
========================================================== */

function drawMap() {

    const map = getMap();


    for (
        let row = 0;
        row < map.length;
        row++
    ) {

        for (
            let col = 0;
            col < map[row].length;
            col++
        ) {

            const x =
                col * TILE;

            const y =
                row * TILE;


            if (
                map[row][col] === "#"
            ) {

                ctx.fillStyle =
                    "#121a34";


                ctx.fillRect(
                    x,
                    y,
                    TILE,
                    TILE
                );


                ctx.strokeStyle =
                    "rgba(35,184,255,.13)";


                ctx.strokeRect(
                    x + 2,
                    y + 2,
                    TILE - 4,
                    TILE - 4
                );


                /*
                   Pequeno detalhe no bloco.
                */

                ctx.fillStyle =
                    "rgba(255,255,255,.025)";


                ctx.fillRect(
                    x + 6,
                    y + 6,
                    TILE - 12,
                    3
                );

            }

        }

    }

}


/* ==========================================================
   CRISTAIS
========================================================== */

function drawCrystals(time) {

    for (const crystal of crystals) {

        if (
            crystal.collected
        ) {
            continue;
        }


        const scale =
            1 +
            Math.sin(
                time * .004 +
                crystal.phase
            ) * .12;


        ctx.save();


        ctx.translate(
            crystal.x,
            crystal.y
        );


        ctx.scale(
            scale,
            scale
        );


        ctx.rotate(
            time * .001
        );


        ctx.shadowBlur = 18;

        ctx.shadowColor =
            "#27d9ff";

        ctx.fillStyle =
            "#27d9ff";


        ctx.beginPath();

        ctx.moveTo(
            0,
            -9
        );

        ctx.lineTo(
            7,
            0
        );

        ctx.lineTo(
            0,
            9
        );

        ctx.lineTo(
            -7,
            0
        );

        ctx.closePath();

        ctx.fill();


        ctx.restore();

    }

}


/* ==========================================================
   MOEDAS
========================================================== */

function drawCoins(time) {

    for (const coin of coins) {

        if (
            coin.collected
        ) {
            continue;
        }


        const scale =
            1 +
            Math.sin(
                time * .005 +
                coin.phase
            ) * .1;


        ctx.save();


        ctx.translate(
            coin.x,
            coin.y
        );


        ctx.scale(
            scale,
            scale
        );


        ctx.shadowBlur = 12;

        ctx.shadowColor =
            "#ffd447";

        ctx.fillStyle =
            "#ffd447";


        ctx.beginPath();

        ctx.arc(
            0,
            0,
            7,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.fillStyle =
            "#8b6510";


        ctx.font =
            "bold 8px Arial";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        ctx.fillText(
            "$",
            0,
            1
        );


        ctx.restore();

    }

}


/* ==========================================================
   POWER UPS
========================================================== */

function drawPowerUps(time) {

    const colors = {

        speed: "#28d9ff",
        shield: "#32e875",
        freeze: "#a855f7",
        bomb: "#ff4560"

    };


    const symbols = {

        speed: "⚡",
        shield: "◆",
        freeze: "❄",
        bomb: "✹"

    };


    for (const power of powerUps) {

        if (
            !power.active
        ) {
            continue;
        }


        power.rotation += .02;


        ctx.save();


        ctx.translate(
            power.x,
            power.y
        );


        ctx.rotate(
            power.rotation
        );


        ctx.shadowBlur = 18;

        ctx.shadowColor =
            colors[power.type];

        ctx.fillStyle =
            colors[power.type];


        ctx.beginPath();

        ctx.roundRect(
            -11,
            -11,
            22,
            22,
            6
        );

        ctx.fill();


        ctx.restore();


        ctx.save();


        ctx.translate(
            power.x,
            power.y
        );


        ctx.fillStyle =
            "#07101d";

        ctx.font =
            "bold 12px Arial";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        ctx.fillText(
            symbols[power.type],
            0,
            1
        );


        ctx.restore();

    }

}


/* ==========================================================
   MECANISMOS
========================================================== */

function drawSwitches() {

    for (const mechanism of switches) {

        ctx.save();


        ctx.translate(
            mechanism.x,
            mechanism.y
        );


        ctx.shadowBlur =
            mechanism.active
                ? 18
                : 8;


        ctx.shadowColor =
            mechanism.active
                ? "#32e875"
                : "#ff4560";


        ctx.fillStyle =
            mechanism.active
                ? "#32e875"
                : "#ff4560";


        ctx.beginPath();

        ctx.arc(
            0,
            0,
            9,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.fillStyle =
            "#08101c";


        ctx.beginPath();

        ctx.arc(
            0,
            0,
            4,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.restore();

    }

}


/* ==========================================================
   INIMIGOS
========================================================== */

function drawEnemies() {

    for (const enemy of enemies) {

        ctx.save();


        ctx.shadowBlur = 15;


        ctx.shadowColor =
            enemy.stunned > 0
                ? "#a855f7"
                : "#ff4560";


        ctx.fillStyle =
            enemy.stunned > 0
                ? "#a855f7"
                : "#ff4560";


        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y,
            enemy.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.shadowBlur = 0;


        ctx.fillStyle = "#ffffff";


        ctx.beginPath();

        ctx.arc(
            enemy.x - 4,
            enemy.y - 3,
            3,
            0,
            Math.PI * 2
        );

        ctx.arc(
            enemy.x + 4,
            enemy.y - 3,
            3,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.fillStyle =
            "#08101c";


        ctx.beginPath();

        ctx.arc(
            enemy.x - 4,
            enemy.y - 3,
            1.5,
            0,
            Math.PI * 2
        );

        ctx.arc(
            enemy.x + 4,
            enemy.y - 3,
            1.5,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.restore();

    }

}


/* ==========================================================
   JOGADORES
========================================================== */

function drawPlayer(player) {

    ctx.save();


    /*
       Pisca quando está invulnerável.
    */

    if (
        player.invincible > 0 &&
        Math.floor(
            player.invincible * 10
        ) % 2 === 0
    ) {

        ctx.globalAlpha = .45;

    }


    ctx.shadowBlur = 20;

    ctx.shadowColor =
        player.color;


    ctx.fillStyle =
        player.color;


    ctx.beginPath();

    ctx.arc(
        player.x,
        player.y,
        player.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.shadowBlur = 0;


    /*
       Olhos.
    */

    ctx.fillStyle =
        "#07101c";


    ctx.beginPath();

    ctx.arc(
        player.x - 4,
        player.y - 3,
        2,
        0,
        Math.PI * 2
    );

    ctx.arc(
        player.x + 4,
        player.y - 3,
        2,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /*
       Escudo.
    */

    if (
        player.invincible > 0
    ) {

        ctx.strokeStyle =
            "#32e875";

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.arc(
            player.x,
            player.y,
            19,
            0,
            Math.PI * 2
        );

        ctx.stroke();

    }


    /*
       Power de velocidade.
    */

    if (
        player.speedPower > 0
    ) {

        ctx.strokeStyle =
            "#28d9ff";

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.arc(
            player.x,
            player.y,
            22,
            0,
            Math.PI * 2
        );

        ctx.stroke();

    }


    ctx.restore();

}


/* ==========================================================
   PARTÍCULAS
========================================================== */

function drawParticles() {

    for (const particle of particles) {

        ctx.globalAlpha =
            clamp(
                particle.life /
                particle.maxLife,
                0,
                1
            );


        ctx.fillStyle =
            particle.color;


        ctx.beginPath();

        ctx.arc(
            particle.x,
            particle.y,
            particle.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }


    ctx.globalAlpha = 1;

}


/* ==========================================================
   TEXTO NO CANVAS
========================================================== */

function drawLevelLabel() {

    ctx.save();


    ctx.fillStyle =
        "rgba(255,255,255,.55)";


    ctx.font =
        "bold 12px Arial";


    ctx.textAlign =
        "center";


    ctx.fillText(
        `FASE ${currentLevel + 1}  •  ${DIFFICULTIES[difficulty].name}`,
        WIDTH / 2,
        17
    );


    ctx.restore();

}


/* ==========================================================
   DRAW
========================================================== */

function draw(time) {

    ctx.save();


    if (
        shake > 0
    ) {

        ctx.translate(
            randomNumber(-4, 4),
            randomNumber(-4, 4)
        );

    }


    drawBackground();

    drawMap();

    drawSwitches();

    drawCrystals(time);

    drawCoins(time);

    drawPowerUps(time);

    drawEnemies();

    drawPlayer(player1);

    drawPlayer(player2);

    drawParticles();

    drawLevelLabel();


    ctx.restore();

}


/* ==========================================================
   HUD
========================================================== */

function updateHUD() {

    if (
        !player1 ||
        !player2
    ) {
        return;
    }


    score1.textContent =
        player1.score;


    score2.textContent =
        player2.score;


    lives1.textContent =
        player1.lives > 0
            ? "❤️ ".repeat(
                player1.lives
            )
            : "💀";


    lives2.textContent =
        player2.lives > 0
            ? "❤️ ".repeat(
                player2.lives
            )
            : "💀";


    levelText.textContent =
        currentLevel + 1;


    difficultyText.textContent =
        DIFFICULTIES[
            difficulty
        ].name;


    const percentage =
        totalCrystals > 0
            ?
            (
                collectedCrystals /
                totalCrystals
            ) * 100
            :
            0;


    progressBar.style.width =
        percentage + "%";


    if (
        collectedCrystals <
        totalCrystals
    ) {

        objectiveText.textContent =
            `Cristais: ${collectedCrystals}/${totalCrystals}`;

    } else {

        objectiveText.textContent =
            "Portal liberado!";

    }

}


/* ==========================================================
   FASE CONCLUÍDA
========================================================== */

function finishLevel() {

    if (!gameStarted) {
        return;
    }


    gameStarted = false;


    const bonus =
        100 +
        currentLevel * 50;


    player1.score += bonus;
    player2.score += bonus;


    if (
        currentLevel <
        MAPS.length - 1
    ) {

        messageIcon.textContent =
            "★";


        messageTitle.textContent =
            `FASE ${currentLevel + 1} CONCLUÍDA`;


        messageText.textContent =
            `Os dois jogadores receberam ${bonus} pontos de bônus.`;


        messageButton.textContent =
            `FASE ${currentLevel + 2}`;


        messageScreen.classList.remove(
            "hidden"
        );


        messageButton.onclick =
            nextLevel;

    } else {

        messageIcon.textContent =
            "🏆";


        messageTitle.textContent =
            "VOCÊS VENCERAM!";


        messageText.textContent =
            `Pontuação final: ${player1.score} + ${player2.score}`;


        messageButton.textContent =
            "JOGAR NOVAMENTE";


        messageScreen.classList.remove(
            "hidden"
        );


        messageButton.onclick =
            restartGameFromMessage;

    }


    updateHUD();

}


/* ==========================================================
   PRÓXIMA FASE
========================================================== */

function nextLevel() {

    currentLevel++;

    messageScreen.classList.add(
        "hidden"
    );


    loadLevel();


    gameStarted = true;

}


/* ==========================================================
   GAME OVER
========================================================== */

function gameOver() {

    gameStarted = false;


    messageIcon.textContent =
        "☠";


    messageTitle.textContent =
        "GAME OVER";


    messageText.textContent =
        `Pontuação: ${player1.score} + ${player2.score}`;


    messageButton.textContent =
        "TENTAR NOVAMENTE";


    messageScreen.classList.remove(
        "hidden"
    );


    messageButton.onclick =
        restartGameFromMessage;

}


/* ==========================================================
   PAUSA
========================================================== */

function togglePause() {

    if (!gameStarted) {
        return;
    }


    paused = !paused;


    if (paused) {

        pauseScreen.classList.remove(
            "hidden"
        );


        pauseButton.textContent =
            "CONTINUAR";

    } else {

        pauseScreen.classList.add(
            "hidden"
        );


        pauseButton.textContent =
            "PAUSAR";

    }

}


pauseButton.addEventListener(
    "click",
    togglePause
);


continueButton.addEventListener(
    "click",
    togglePause
);


/* ==========================================================
   INICIAR JOGO
========================================================== */

startButton.addEventListener(
    "click",
    () => {

        currentLevel = 0;

        particles = [];

        paused = false;

        gameStarted = true;


        menu.classList.add(
            "hidden"
        );


        pauseScreen.classList.add(
            "hidden"
        );


        messageScreen.classList.add(
            "hidden"
        );


        pauseButton.textContent =
            "PAUSAR";


        loadLevel();

    }
);


/* ==========================================================
   REINICIAR
========================================================== */

function restartGame() {

    currentLevel = 0;

    particles = [];

    paused = false;

    gameStarted = true;


    menu.classList.add(
        "hidden"
    );


    pauseScreen.classList.add(
        "hidden"
    );


    messageScreen.classList.add(
        "hidden"
    );


    pauseButton.textContent =
        "PAUSAR";


    loadLevel();

}


function restartGameFromMessage() {

    messageScreen.classList.add(
        "hidden"
    );


    restartGame();

}


restartButton.addEventListener(
    "click",
    restartGame
);


/* ==========================================================
   DIFICULDADE
========================================================== */

document
    .querySelectorAll(
        "[data-difficulty]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        "[data-difficulty]"
                    )
                    .forEach(
                        other =>
                            other.classList.remove(
                                "selected"
                            )
                    );


                button.classList.add(
                    "selected"
                );


                difficulty =
                    button.dataset.difficulty;


                difficultyText.textContent =
                    DIFFICULTIES[
                        difficulty
                    ].name;

            }
        );

    });


/* ==========================================================
   LOOP PRINCIPAL
========================================================== */

function gameLoop(timestamp) {

    if (!lastTime) {
        lastTime = timestamp;
    }


    const delta =
        (timestamp - lastTime) /
        1000;


    lastTime = timestamp;


    update(delta);

    draw(timestamp);


    requestAnimationFrame(
        gameLoop
    );

}


/* ==========================================================
   INICIALIZAÇÃO
========================================================== */

function initialize() {

    currentLevel = 0;

    createPlayers();

    createCrystals();

    createCoins();

    createPowerUps();

    createSwitches();

    createEnemies();


    gameStarted = false;

    paused = false;


    updateHUD();

    draw(0);


    requestAnimationFrame(
        gameLoop
    );

}


initialize();
