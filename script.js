"use strict";

/*
    MAZE CLASH
    Jogo 2D para 2 jogadores
    Sem bibliotecas externas.

    JOGADOR 1:
    W A S D = movimento
    SPACE = dash
    Q = pulso

    JOGADOR 2:
    SETAS = movimento
    ENTER = dash
    SHIFT = pulso

    P = pausa
    R = reiniciar
*/


/* =========================================================
   CANVAS
========================================================= */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;


/* =========================================================
   INTERFACE
========================================================= */

const startScreen = document.getElementById("startScreen");
const pauseScreen = document.getElementById("pauseScreen");
const messageScreen = document.getElementById("messageScreen");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");
const resumeBtn = document.getElementById("resumeBtn");

const messageBtn = document.getElementById("messageBtn");
const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");
const messageIcon = document.getElementById("messageIcon");

const score1El = document.getElementById("score1");
const score2El = document.getElementById("score2");

const lives1El = document.getElementById("lives1");
const lives2El = document.getElementById("lives2");

const levelEl = document.getElementById("level");
const difficultyLabel = document.getElementById("difficultyLabel");
const progressBar = document.getElementById("progressBar");
const objectiveEl = document.getElementById("objective");


/* =========================================================
   CONSTANTES
========================================================= */

const TILE = 40;

const COLS = 21;
const ROWS = 15;

const MAP_WIDTH = COLS * TILE;
const MAP_HEIGHT = ROWS * TILE;


/*
    1 = parede
    0 = caminho
    2 = cristal
    3 = power-up
*/

const MAPS = [

    [
        "111111111111111111111",
        "100000000010000000001",
        "101111011010110111101",
        "100000010000010000001",
        "101110111011101110101",
        "100010000000000010001",
        "111010111000111010111",
        "100000100000001000001",
        "111010111000111010111",
        "100010000000000010001",
        "101110111011101110101",
        "100000010000010000001",
        "101111011010110111101",
        "100000000010000000001",
        "111111111111111111111"
    ],

    [
        "111111111111111111111",
        "100000000000000000001",
        "101111011111101111101",
        "100000010000010000001",
        "111110111011101111101",
        "100010000000000010001",
        "101010111000111010101",
        "100000100000001000001",
        "101010111000111010101",
        "100010000000000010001",
        "111110111011101111101",
        "100000010000010000001",
        "101111011111101111101",
        "100000000000000000001",
        "111111111111111111111"
    ],

    [
        "111111111111111111111",
        "100000100000000100001",
        "101110101111111101101",
        "100010100000000101001",
        "111010111011101101111",
        "100000001000100000001",
        "101111101010101111101",
        "100000000000000000001",
        "101111101010101111101",
        "100000001000100000001",
        "111010111011101101111",
        "100010100000000101001",
        "101110101111111101101",
        "100000100000000100001",
        "111111111111111111111"
    ]

];


/* =========================================================
   CONFIGURAÇÕES DE DIFICULDADE
========================================================= */

const DIFFICULTIES = {

    easy: {
        label: "FÁCIL",
        enemySpeed: 1.05,
        enemyCount: 3,
        enemyDamageCooldown: 1.4,
        dashCooldown: 3.0,
        pulseCooldown: 5.0
    },

    normal: {
        label: "NORMAL",
        enemySpeed: 1.35,
        enemyCount: 4,
        enemyDamageCooldown: 1.2,
        dashCooldown: 3.0,
        pulseCooldown: 4.5
    },

    hard: {
        label: "DIFÍCIL",
        enemySpeed: 1.65,
        enemyCount: 5,
        enemyDamageCooldown: 1.0,
        dashCooldown: 3.0,
        pulseCooldown: 4.0
    }

};


/* =========================================================
   ESTADO DO JOGO
========================================================= */

let difficulty = "normal";

let gameRunning = false;
let paused = false;

let level = 1;

let lastTime = 0;

let particles = [];

let crystals = [];

let powerUps = [];

let enemies = [];

let portals = [];

let keys = {};

let totalCrystals = 0;

let collectedCrystals = 0;

let screenShake = 0;


/* =========================================================
   OBJETOS
========================================================= */

let player1;
let player2;


/* =========================================================
   DIREÇÕES
========================================================= */

const DIR = {

    up: {
        x: 0,
        y: -1
    },

    down: {
        x: 0,
        y: 1
    },

    left: {
        x: -1,
        y: 0
    },

    right: {
        x: 1,
        y: 0
    }

};


/* =========================================================
   UTILIDADES
========================================================= */

function clamp(value, min, max) {

    return Math.max(min, Math.min(max, value));

}


function distance(a, b) {

    return Math.hypot(
        a.x - b.x,
        a.y - b.y
    );

}


function random(min, max) {

    return Math.random() * (max - min) + min;

}


function tileCenter(col, row) {

    return {
        x: col * TILE + TILE / 2,
        y: row * TILE + TILE / 2
    };

}


function isWallAtPixel(x, y) {

    const col = Math.floor(x / TILE);
    const row = Math.floor(y / TILE);

    if (
        col < 0 ||
        row < 0 ||
        col >= COLS ||
        row >= ROWS
    ) {
        return true;
    }

    return MAPS[level - 1][row][col] === "1";

}


function canMoveTo(x, y, radius) {

    const points = [

        { x: x - radius, y: y - radius },
        { x: x + radius, y: y - radius },
        { x: x - radius, y: y + radius },
        { x: x + radius, y: y + radius }

    ];

    for (const point of points) {

        if (isWallAtPixel(point.x, point.y)) {
            return false;
        }

    }

    return true;

}


function randomFreePosition() {

    for (let i = 0; i < 500; i++) {

        const col = Math.floor(random(1, COLS - 1));
        const row = Math.floor(random(1, ROWS - 1));

        if (
            MAPS[level - 1][row][col] !== "1"
        ) {

            return tileCenter(col, row);

        }

    }

    return tileCenter(1, 1);

}


/* =========================================================
   CRIAÇÃO DOS JOGADORES
========================================================= */

function createPlayers() {

    const p1Start = tileCenter(1, 1);

    const p2Start = tileCenter(COLS - 2, ROWS - 2);


    player1 = {

        x: p1Start.x,
        y: p1Start.y,

        radius: 13,

        speed: 145,

        dir: { x: 1, y: 0 },

        desired: { x: 1, y: 0 },

        color: "#24b7ff",

        score: 0,

        lives: 3,

        dashTimer: 0,

        pulseTimer: 0,

        invincible: 0,

        powerTimer: 0,

        dashFlash: 0

    };


    player2 = {

        x: p2Start.x,
        y: p2Start.y,

        radius: 13,

        speed: 145,

        dir: { x: -1, y: 0 },

        desired: { x: -1, y: 0 },

        color: "#ff8b32",

        score: 0,

        lives: 3,

        dashTimer: 0,

        pulseTimer: 0,

        invincible: 0,

        powerTimer: 0,

        dashFlash: 0

    };

}


/* =========================================================
   CRISTAIS
========================================================= */

function createCrystals() {

    crystals = [];

    collectedCrystals = 0;


    for (let row = 1; row < ROWS - 1; row++) {

        for (let col = 1; col < COLS - 1; col++) {

            if (
                MAPS[level - 1][row][col] !== "1"
            ) {

                const pos = tileCenter(col, row);

                const nearP1 =
                    distance(
                        pos,
                        tileCenter(1, 1)
                    ) < 80;

                const nearP2 =
                    distance(
                        pos,
                        tileCenter(COLS - 2, ROWS - 2)
                    ) < 80;


                if (
                    !nearP1 &&
                    !nearP2 &&
                    Math.random() < .78
                ) {

                    crystals.push({

                        x: pos.x,
                        y: pos.y,

                        value: 10,

                        pulse: random(0, Math.PI * 2),

                        active: true

                    });

                }

            }

        }

    }

    totalCrystals = crystals.length;

}


/* =========================================================
   POWER UPS
========================================================= */

function createPowerUps() {

    powerUps = [];

    const types = [
        "speed",
        "shield",
        "freeze",
        "bomb"
    ];


    for (let i = 0; i < 4; i++) {

        const pos = randomFreePosition();

        powerUps.push({

            x: pos.x,
            y: pos.y,

            type: types[i],

            active: true,

            rotation: random(0, Math.PI * 2)

        });

    }

}


/* =========================================================
   INIMIGOS
========================================================= */

function createEnemies() {

    enemies = [];

    const config = DIFFICULTIES[difficulty];


    for (let i = 0; i < config.enemyCount; i++) {

        let pos = randomFreePosition();


        while (
            distance(pos, player1) < 180 ||
            distance(pos, player2) < 180
        ) {

            pos = randomFreePosition();

        }


        enemies.push({

            x: pos.x,
            y: pos.y,

            radius: 13,

            speed:
                config.enemySpeed *
                random(.85, 1.15),

            color:
                [
                    "#ff3f68",
                    "#b45cff",
                    "#42e6a4",
                    "#ffcf4a",
                    "#ff5aa8"
                ][i % 5],

            stunned: 0,

            changeTimer: random(0, 2),

            target: null

        });

    }

}


/* =========================================================
   PORTAIS
========================================================= */

function createPortals() {

    portals = [];


    portals.push({

        x: tileCenter(1, ROWS - 2).x,
        y: tileCenter(1, ROWS - 2).y,

        radius: 16,

        color: "#a855f7",

        phase: 0

    });


    portals.push({

        x: tileCenter(COLS - 2, 1).x,
        y: tileCenter(COLS - 2, 1).y,

        radius: 16,

        color: "#32e875",

        phase: Math.PI

    });

}


/* =========================================================
   INICIALIZAÇÃO DA FASE
========================================================= */

function initLevel() {

    createPlayers();

    createCrystals();

    createPowerUps();

    createEnemies();

    createPortals();

    updateHUD();

}


/* =========================================================
   PARTÍCULAS
========================================================= */

function spawnParticles(
    x,
    y,
    color,
    amount = 10
) {

    for (let i = 0; i < amount; i++) {

        particles.push({

            x,
            y,

            vx: random(-90, 90),
            vy: random(-90, 90),

            life: random(.3, .8),

            maxLife: .8,

            size: random(2, 5),

            color

        });

    }

}


function updateParticles(dt) {

    for (const p of particles) {

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        p.vx *= .97;
        p.vy *= .97;

        p.life -= dt;

    }

    particles =
        particles.filter(
            p => p.life > 0
        );

}


/* =========================================================
   INPUT
========================================================= */

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
            gameRunning
        ) {

            togglePause();

        }


        if (
            event.code === "KeyR"
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


/* =========================================================
   MOVIMENTO DOS JOGADORES
========================================================= */

function getPlayerInput(player, number) {

    if (number === 1) {

        if (keys["KeyW"]) {
            player.desired = DIR.up;
        }

        if (keys["KeyS"]) {
            player.desired = DIR.down;
        }

        if (keys["KeyA"]) {
            player.desired = DIR.left;
        }

        if (keys["KeyD"]) {
            player.desired = DIR.right;
        }

    } else {

        if (keys["ArrowUp"]) {
            player.desired = DIR.up;
        }

        if (keys["ArrowDown"]) {
            player.desired = DIR.down;
        }

        if (keys["ArrowLeft"]) {
            player.desired = DIR.left;
        }

        if (keys["ArrowRight"]) {
            player.desired = DIR.right;
        }

    }

}


function movePlayer(player, dt) {

    const desired = player.desired;

    const canTurn =
        canMoveTo(
            player.x + desired.x * 4,
            player.y + desired.y * 4,
            player.radius
        );


    if (
        canTurn &&
        (
            desired.x !== 0 ||
            desired.y !== 0
        )
    ) {

        player.dir = {
            x: desired.x,
            y: desired.y
        };

    }


    let speed = player.speed;


    if (player.powerTimer > 0) {
        speed *= 1.3;
    }


    const nx =
        player.x +
        player.dir.x *
        speed *
        dt;


    const ny =
        player.y +
        player.dir.y *
        speed *
        dt;


    if (
        canMoveTo(
            nx,
            player.y,
            player.radius
        )
    ) {

        player.x = nx;

    }


    if (
        canMoveTo(
            player.x,
            ny,
            player.radius
        )
    ) {

        player.y = ny;

    }


    player.x =
        clamp(
            player.x,
            player.radius,
            W - player.radius
        );

    player.y =
        clamp(
            player.y,
            player.radius,
            H - player.radius
        );

}


/* =========================================================
   DASH
========================================================= */

function dash(player) {

    if (
        player.dashTimer > 0 ||
        !gameRunning ||
        paused
    ) {
        return;
    }


    player.dashTimer =
        DIFFICULTIES[difficulty].dashCooldown;


    player.dashFlash = .25;


    const distanceDash = 85;


    for (
        let i = 0;
        i < 8;
        i++
    ) {

        const nx =
            player.x +
            player.dir.x *
            (distanceDash / 8);


        const ny =
            player.y +
            player.dir.y *
            (distanceDash / 8);


        if (
            canMoveTo(
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


    spawnParticles(
        player.x,
        player.y,
        player.color,
        18
    );

}


/* =========================================================
   PULSO
========================================================= */

function pulse(player) {

    if (
        player.pulseTimer > 0 ||
        !gameRunning ||
        paused
    ) {
        return;
    }


    player.pulseTimer =
        DIFFICULTIES[difficulty].pulseCooldown;


    const radius = 115;


    spawnParticles(
        player.x,
        player.y,
        "#a855f7",
        30
    );


    for (const enemy of enemies) {

        if (
            distance(player, enemy) <
            radius
        ) {

            enemy.stunned = 3;

            enemy.x +=
                player.x > enemy.x
                    ? -15
                    : 15;

            enemy.y +=
                player.y > enemy.y
                    ? -15
                    : 15;

            player.score += 25;

        }

    }


    screenShake = .18;

}


/* =========================================================
   POWER UPS
========================================================= */

function collectPowerUp(player, power) {

    power.active = false;

    spawnParticles(
        power.x,
        power.y,
        "#ffd84d",
        20
    );


    switch (power.type) {

        case "speed":

            player.powerTimer = 7;

            break;


        case "shield":

            player.invincible = 7;

            break;


        case "freeze":

            for (const enemy of enemies) {
                enemy.stunned = 4;
            }

            break;


        case "bomb":

            for (const enemy of enemies) {

                if (
                    distance(player, enemy) < 180
                ) {

                    enemy.stunned = 5;

                    player.score += 50;

                }

            }

            screenShake = .35;

            break;

    }

}


/* =========================================================
   COLETA DE CRISTAIS
========================================================= */

function collectCrystals(player) {

    for (const crystal of crystals) {

        if (
            crystal.active &&
            distance(player, crystal) < 20
        ) {

            crystal.active = false;

            collectedCrystals++;

            player.score += crystal.value;

            spawnParticles(
                crystal.x,
                crystal.y,
                "#39d7ff",
                10
            );

        }

    }

}


/* =========================================================
   COLISÃO COM POWER UPS
========================================================= */

function checkPowerUps(player) {

    for (const power of powerUps) {

        if (
            power.active &&
            distance(player, power) < 22
        ) {

            collectPowerUp(
                player,
                power
            );

        }

    }

}


/* =========================================================
   DANO DOS INIMIGOS
========================================================= */

function damagePlayer(player) {

    if (
        player.invincible > 0
    ) {
        return;
    }


    player.lives--;

    player.invincible =
        DIFFICULTIES[difficulty]
            .enemyDamageCooldown;


    spawnParticles(
        player.x,
        player.y,
        "#ff465c",
        25
    );


    screenShake = .25;


    if (player.lives <= 0) {

        player.lives = 0;

        checkGameOver();

        return;

    }


    const spawn =
        player === player1
            ? tileCenter(1, 1)
            : tileCenter(COLS - 2, ROWS - 2);


    player.x = spawn.x;
    player.y = spawn.y;

}


/* =========================================================
   INIMIGOS
========================================================= */

function updateEnemies(dt) {

    for (const enemy of enemies) {

        if (enemy.stunned > 0) {

            enemy.stunned -= dt;

            continue;

        }


        enemy.changeTimer -= dt;


        const target =
            distance(enemy, player1) <
            distance(enemy, player2)
                ? player1
                : player2;


        enemy.target = target;


        let dx =
            target.x - enemy.x;

        let dy =
            target.y - enemy.y;


        const length =
            Math.hypot(dx, dy) || 1;


        dx /= length;
        dy /= length;


        let dirX = dx;
        let dirY = dy;


        /*
            A cada certo tempo o inimigo
            muda para uma direção aleatória.
        */

        if (
            enemy.changeTimer <= 0
        ) {

            enemy.changeTimer =
                random(.7, 1.8);


            const choices = [
                { x: 1, y: 0 },
                { x: -1, y: 0 },
                { x: 0, y: 1 },
                { x: 0, y: -1 }
            ];


            const randomDir =
                choices[
                    Math.floor(
                        Math.random() *
                        choices.length
                    )
                ];


            if (
                Math.random() < .35
            ) {

                dirX = randomDir.x;
                dirY = randomDir.y;

            }

        }


        const nx =
            enemy.x +
            dirX *
            enemy.speed *
            60 *
            dt;


        const ny =
            enemy.y +
            dirY *
            enemy.speed *
            60 *
            dt;


        if (
            canMoveTo(
                nx,
                enemy.y,
                enemy.radius
            )
        ) {

            enemy.x = nx;

        } else {

            enemy.changeTimer = 0;

        }


        if (
            canMoveTo(
                enemy.x,
                ny,
                enemy.radius
            )
        ) {

            enemy.y = ny;

        } else {

            enemy.changeTimer = 0;

        }


        if (
            distance(enemy, player1) <
            23
        ) {

            damagePlayer(player1);

        }


        if (
            distance(enemy, player2) <
            23
        ) {

            damagePlayer(player2);

        }

    }

}


/* =========================================================
   PORTAIS
========================================================= */

function updatePortals() {

    for (const portal of portals) {

        portal.phase += .03;


        if (
            distance(player1, portal) <
            22
        ) {

            teleportPlayer(
                player1,
                portal
            );

        }


        if (
            distance(player2, portal) <
            22
        ) {

            teleportPlayer(
                player2,
                portal
            );

        }

    }

}


function teleportPlayer(player, portal) {

    /*
        Teleporte simples entre os dois portais.
    */

    const other =
        portals.find(
            p => p !== portal
        );


    if (!other) {
        return;
    }


    player.x = other.x;
    player.y = other.y;


    spawnParticles(
        other.x,
        other.y,
        other.color,
        20
    );

}


/* =========================================================
   HABILIDADES
========================================================= */

function updateAbilities(player, dt) {

    player.dashTimer =
        Math.max(
            0,
            player.dashTimer - dt
        );


    player.pulseTimer =
        Math.max(
            0,
            player.pulseTimer - dt
        );


    player.invincible =
        Math.max(
            0,
            player.invincible - dt
        );


    player.powerTimer =
        Math.max(
            0,
            player.powerTimer - dt
        );


    player.dashFlash =
        Math.max(
            0,
            player.dashFlash - dt
        );

}


/* =========================================================
   UPDATE
========================================================= */

function update(dt) {

    if (
        !gameRunning ||
        paused
    ) {
        return;
    }


    dt =
        Math.min(
            dt,
            .033
        );


    getPlayerInput(
        player1,
        1
    );


    getPlayerInput(
        player2,
        2
    );


    movePlayer(
        player1,
        dt
    );


    movePlayer(
        player2,
        dt
    );


    updateAbilities(
        player1,
        dt
    );


    updateAbilities(
        player2,
        dt
    );


    collectCrystals(player1);
    collectCrystals(player2);


    checkPowerUps(player1);
    checkPowerUps(player2);


    updateEnemies(dt);

    updatePortals();

    updateParticles(dt);


    screenShake =
        Math.max(
            0,
            screenShake - dt
        );


    if (
        collectedCrystals >=
        totalCrystals
    ) {

        completeLevel();

    }


    updateHUD();

}


/* =========================================================
   HUD
========================================================= */

function updateHUD() {

    if (!player1 || !player2) {
        return;
    }


    score1El.textContent =
        player1.score;

    score2El.textContent =
        player2.score;


    lives1El.textContent =
        "❤️ ".repeat(
            player1.lives
        ) || "💀";


    lives2El.textContent =
        "❤️ ".repeat(
            player2.lives
        ) || "💀";


    levelEl.textContent =
        level;


    difficultyLabel.textContent =
        DIFFICULTIES[difficulty].label;


    const percentage =
        totalCrystals === 0
            ? 0
            :
            (
                collectedCrystals /
                totalCrystals
            ) * 100;


    progressBar.style.width =
        `${percentage}%`;


    objectiveEl.textContent =
        `${collectedCrystals}/${totalCrystals} cristais coletados`;

}


/* =========================================================
   DESENHO DO MAPA
========================================================= */

function drawBackground() {

    ctx.fillStyle = "#060916";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    /*
        Pequena grade decorativa.
    */

    ctx.strokeStyle =
        "rgba(255,255,255,.025)";

    ctx.lineWidth = 1;


    for (
        let x = 0;
        x < W;
        x += TILE
    ) {

        ctx.beginPath();

        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);

        ctx.stroke();

    }


    for (
        let y = 0;
        y < H;
        y += TILE
    ) {

        ctx.beginPath();

        ctx.moveTo(0, y);
        ctx.lineTo(W, y);

        ctx.stroke();

    }

}


function drawMap() {

    const map =
        MAPS[level - 1];


    for (
        let row = 0;
        row < ROWS;
        row++
    ) {

        for (
            let col = 0;
            col < COLS;
            col++
        ) {

            if (
                map[row][col] === "1"
            ) {

                const x =
                    col * TILE;

                const y =
                    row * TILE;


                ctx.fillStyle =
                    "#111a36";


                ctx.fillRect(
                    x + 1,
                    y + 1,
                    TILE - 2,
                    TILE - 2
                );


                ctx.strokeStyle =
                    "rgba(36,183,255,.16)";


                ctx.strokeRect(
                    x + 3,
                    y + 3,
                    TILE - 6,
                    TILE - 6
                );

            }

        }

    }

}


/* =========================================================
   DESENHO DOS CRISTAIS
========================================================= */

function drawCrystals(time) {

    for (const crystal of crystals) {

        if (!crystal.active) {
            continue;
        }


        crystal.pulse += .05;


        const scale =
            1 +
            Math.sin(
                time * .006 +
                crystal.pulse
            ) * .15;


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
            Math.sin(
                time * .002 +
                crystal.pulse
            )
        );


        ctx.shadowBlur = 15;
        ctx.shadowColor = "#39d7ff";

        ctx.fillStyle = "#39d7ff";

        ctx.beginPath();

        ctx.moveTo(0, -8);
        ctx.lineTo(6, 0);
        ctx.lineTo(0, 8);
        ctx.lineTo(-6, 0);

        ctx.closePath();

        ctx.fill();


        ctx.restore();

    }

}


/* =========================================================
   DESENHO DOS POWER UPS
========================================================= */

function drawPowerUps(time) {

    const colors = {

        speed: "#39d7ff",
        shield: "#32e875",
        freeze: "#a855f7",
        bomb: "#ff465c"

    };


    const symbols = {

        speed: "⚡",
        shield: "◆",
        freeze: "❄",
        bomb: "✹"

    };


    for (const power of powerUps) {

        if (!power.active) {
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
            -12,
            -12,
            24,
            24,
            7
        );

        ctx.fill();


        ctx.restore();


        ctx.save();

        ctx.translate(
            power.x,
            power.y
        );


        ctx.fillStyle = "#08101f";

        ctx.font = "bold 13px Arial";

        ctx.textAlign = "center";

        ctx.textBaseline = "middle";

        ctx.fillText(
            symbols[power.type],
            0,
            1
        );

        ctx.restore();

    }

}


/* =========================================================
   DESENHO DOS PORTAIS
========================================================= */

function drawPortals() {

    for (const portal of portals) {

        const pulse =
            Math.sin(
                portal.phase
            ) * 4;


        ctx.save();

        ctx.translate(
            portal.x,
            portal.y
        );


        ctx.shadowBlur = 25;

        ctx.shadowColor =
            portal.color;


        ctx.strokeStyle =
            portal.color;

        ctx.lineWidth = 4;


        ctx.beginPath();

        ctx.arc(
            0,
            0,
            portal.radius + pulse,
            0,
            Math.PI * 2
        );

        ctx.stroke();


        ctx.lineWidth = 1;

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            7,
            0,
            Math.PI * 2
        );

        ctx.stroke();


        ctx.restore();

    }

}


/* =========================================================
   DESENHO DOS JOGADORES
========================================================= */

function drawPlayer(player) {

    ctx.save();


    /*
        Efeito de invulnerabilidade.
    */

    if (
        player.invincible > 0 &&
        Math.floor(
            player.invincible * 10
        ) % 2 === 0
    ) {

        ctx.globalAlpha = .45;

    }


    if (
        player.powerTimer > 0
    ) {

        ctx.shadowBlur = 25;

        ctx.shadowColor =
            "#39d7ff";

    } else {

        ctx.shadowBlur = 16;

        ctx.shadowColor =
            player.color;

    }


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


    /*
        Olhos.
    */

    ctx.shadowBlur = 0;

    ctx.fillStyle = "#07101f";


    const eyeX =
        player.dir.x * 3;

    const eyeY =
        player.dir.y * 3;


    ctx.beginPath();

    ctx.arc(
        player.x - 4 + eyeX,
        player.y - 4 + eyeY,
        2,
        0,
        Math.PI * 2
    );

    ctx.arc(
        player.x + 4 + eyeX,
        player.y - 4 + eyeY,
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
            20,
            0,
            Math.PI * 2
        );

        ctx.stroke();

    }


    /*
        Efeito do dash.
    */

    if (
        player.dashFlash > 0
    ) {

        ctx.strokeStyle =
            player.color;

        ctx.lineWidth = 5;

        ctx.globalAlpha = .5;

        ctx.beginPath();

        ctx.moveTo(
            player.x -
            player.dir.x * 35,
            player.y -
            player.dir.y * 35
        );

        ctx.lineTo(
            player.x,
            player.y
        );

        ctx.stroke();

    }


    ctx.restore();

}


/* =========================================================
   DESENHO DOS INIMIGOS
========================================================= */

function drawEnemies() {

    for (const enemy of enemies) {

        ctx.save();


        if (
            enemy.stunned > 0
        ) {

            ctx.globalAlpha = .65;

            ctx.shadowColor =
                "#a855f7";

        } else {

            ctx.shadowColor =
                enemy.color;

        }


        ctx.shadowBlur = 16;

        ctx.fillStyle =
            enemy.stunned > 0
                ? "#a855f7"
                : enemy.color;


        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y,
            enemy.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();


        /*
            Olhos.
        */

        ctx.shadowBlur = 0;

        ctx.fillStyle = "#fff";


        ctx.beginPath();

        ctx.arc(
            enemy.x - 5,
            enemy.y - 3,
            4,
            0,
            Math.PI * 2
        );

        ctx.arc(
            enemy.x + 5,
            enemy.y - 3,
            4,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.fillStyle = "#09101f";


        ctx.beginPath();

        ctx.arc(
            enemy.x - 5,
            enemy.y - 3,
            2,
            0,
            Math.PI * 2
        );

        ctx.arc(
            enemy.x + 5,
            enemy.y - 3,
            2,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.restore();

    }

}


/* =========================================================
   PARTÍCULAS
========================================================= */

function drawParticles() {

    for (const p of particles) {

        const alpha =
            clamp(
                p.life / p.maxLife,
                0,
                1
            );


        ctx.globalAlpha = alpha;

        ctx.fillStyle = p.color;


        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }

    ctx.globalAlpha = 1;

}


/* =========================================================
   TEXTO DA FASE
========================================================= */

function drawLevelInfo() {

    ctx.save();

    ctx.fillStyle =
        "rgba(255,255,255,.65)";

    ctx.font =
        "bold 11px Arial";

    ctx.textAlign = "center";

    ctx.fillText(
        `FASE ${level} • ${DIFFICULTIES[difficulty].label}`,
        W / 2,
        17
    );

    ctx.restore();

}


/* =========================================================
   DRAW
========================================================= */

function draw(time) {

    ctx.save();


    if (
        screenShake > 0
    ) {

        ctx.translate(
            random(-4,4),
            random(-4,4)
        );

    }


    drawBackground();

    drawMap();

    drawPortals();

    drawCrystals(time);

    drawPowerUps(time);

    drawEnemies();

    drawPlayer(player1);

    drawPlayer(player2);

    drawParticles();

    drawLevelInfo();


    ctx.restore();

}


/* =========================================================
   LOOP
========================================================= */

function gameLoop(timestamp) {

    if (!lastTime) {
        lastTime = timestamp;
    }


    const dt =
        (timestamp - lastTime) /
        1000;


    lastTime = timestamp;


    update(dt);

    draw(timestamp);


    requestAnimationFrame(
        gameLoop
    );

}


/* =========================================================
   FASE CONCLUÍDA
========================================================= */

function completeLevel() {

    if (!gameRunning) {
        return;
    }


    gameRunning = false;


    player1.score +=
        level * 100;


    player2.score +=
        level * 100;


    if (
        level < MAPS.length
    ) {

        messageIcon.textContent = "★";

        messageTitle.textContent =
            `FASE ${level} CONCLUÍDA!`;

        messageText.textContent =
            `Os dois jogadores ganharam ${level * 100} pontos. Prepare-se para a próxima fase!`;

        messageBtn.textContent =
            `IR PARA FASE ${level + 1}`;

        messageScreen.classList.remove(
            "hidden"
        );

        messageBtn.onclick =
            () => {

                level++;

                initLevel();

                messageScreen.classList.add(
                    "hidden"
                );

                gameRunning = true;

            };

    } else {

        messageIcon.textContent = "🏆";

        messageTitle.textContent =
            "VOCÊS VENCERAM!";

        messageText.textContent =
            `Pontuação final: ${player1.score} + ${player2.score}`;

        messageBtn.textContent =
            "JOGAR NOVAMENTE";

        messageScreen.classList.remove(
            "hidden"
        );

        messageBtn.onclick =
            () => {

                restartGame();

                messageScreen.classList.add(
                    "hidden"
                );

            };

    }


    updateHUD();

}


/* =========================================================
   GAME OVER
========================================================= */

function checkGameOver() {

    if (
        player1.lives <= 0 &&
        player2.lives <= 0
    ) {

        gameRunning = false;


        messageIcon.textContent =
            "☠";


        messageTitle.textContent =
            "GAME OVER";


        messageText.textContent =
            `Pontuação: ${player1.score} + ${player2.score}`;


        messageBtn.textContent =
            "TENTAR NOVAMENTE";


        messageScreen.classList.remove(
            "hidden"
        );


        messageBtn.onclick =
            () => {

                restartGame();

                messageScreen.classList.add(
                    "hidden"
                );

            };

    }

}


/* =========================================================
   PAUSA
========================================================= */

function togglePause() {

    if (!gameRunning) {
        return;
    }


    paused = !paused;


    if (paused) {

        pauseScreen.classList.remove(
            "hidden"
        );

        pauseBtn.textContent =
            "▶ CONTINUAR";

    } else {

        pauseScreen.classList.add(
            "hidden"
        );

        pauseBtn.textContent =
            "⏸ PAUSAR";

    }

}


pauseBtn.addEventListener(
    "click",
    togglePause
);


resumeBtn.addEventListener(
    "click",
    togglePause
);


/* =========================================================
   REINICIAR
========================================================= */

function restartGame() {

    level = 1;

    paused = false;

    gameRunning = true;

    particles = [];

    startScreen.classList.add(
        "hidden"
    );

    pauseScreen.classList.add(
        "hidden"
    );

    messageScreen.classList.add(
        "hidden"
    );


    pauseBtn.textContent =
        "⏸ PAUSAR";


    initLevel();

}


restartBtn.addEventListener(
    "click",
    restartGame
);


/* =========================================================
   COMEÇAR
========================================================= */

startBtn.addEventListener(
    "click",
    () => {

        level = 1;

        gameRunning = true;

        paused = false;

        startScreen.classList.add(
            "hidden"
        );

        initLevel();

    }
);


/* =========================================================
   ESCOLHA DE DIFICULDADE
========================================================= */

document
    .querySelectorAll(".difficulty-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".difficulty-btn"
                    )
                    .forEach(
                        btn =>
                            btn.classList.remove(
                                "active"
                            )
                    );


                button.classList.add(
                    "active"
                );


                difficulty =
                    button.dataset.difficulty;


                difficultyLabel.textContent =
                    DIFFICULTIES[
                        difficulty
                    ].label;

            }
        );

    });


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

function boot() {

    /*
        Criamos uma fase inicial
        mesmo antes do botão iniciar,
        para o canvas não ficar vazio.
    */

    level = 1;

    createPlayers();

    createCrystals();

    createPowerUps();

    createEnemies();

    createPortals();

    gameRunning = false;

    draw(0);

    updateHUD();


    requestAnimationFrame(
        gameLoop
    );

}


boot();

Como colocar no GitHub
A estrutura do repositório precisa ficar exatamente assim:

seu-projeto/
│
├── index.html
├── style.css
└── script.js

Não coloque os arquivos dentro de outra pasta.

O GitHub Pages procura um arquivo de entrada como index.html na fonte de publicação. 
G
GitHub Docs

Depois:

script.js


"use strict";

/*
    MAZE CLASH
    Jogo 2D para 2 jogadores
    Sem bibliotecas externas.

    JOGADOR 1:
    W A S D = movimento
    SPACE = dash
    Q = pulso

    JOGADOR 2:
    SETAS = movimento
    ENTER = dash
    SHIFT = pulso

    P = pausa
    R = reiniciar
*/


/* =========================================================
   CANVAS
========================================================= */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;


/* =========================================================
   INTERFACE
========================================================= */

const startScreen = document.getElementById("startScreen");
const pauseScreen = document.getElementById("pauseScreen");
const messageScreen = document.getElementById("messageScreen");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");
const resumeBtn = document.getElementById("resumeBtn");

const messageBtn = document.getElementById("messageBtn");
const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");
const messageIcon = document.getElementById("messageIcon");

const score1El = document.getElementById("score1");
const score2El = document.getElementById("score2");

const lives1El = document.getElementById("lives1");
const lives2El = document.getElementById("lives2");

const levelEl = document.getElementById("level");
const difficultyLabel = document.getElementById("difficultyLabel");
const progressBar = document.getElementById("progressBar");
const objectiveEl = document.getElementById("objective");


/* =========================================================
   CONSTANTES
========================================================= */

const TILE = 40;

const COLS = 21;
const ROWS = 15;

const MAP_WIDTH = COLS * TILE;
const MAP_HEIGHT = ROWS * TILE;


/*
    1 = parede
    0 = caminho
    2 = cristal
    3 = power-up
*/

const MAPS = [

    [
        "111111111111111111111",
        "100000000010000000001",
        "101111011010110111101",
        "100000010000010000001",
        "101110111011101110101",
        "100010000000000010001",
        "111010111000111010111",
        "100000100000001000001",
        "111010111000111010111",
        "100010000000000010001",
        "101110111011101110101",
        "100000010000010000001",
        "101111011010110111101",
        "100000000010000000001",
        "111111111111111111111"
    ],

    [
        "111111111111111111111",
        "100000000000000000001",
        "101111011111101111101",
        "100000010000010000001",
        "111110111011101111101",
        "100010000000000010001",
        "101010111000111010101",
        "100000100000001000001",
        "101010111000111010101",
        "100010000000000010001",
        "111110111011101111101",
        "100000010000010000001",
        "101111011111101111101",
        "100000000000000000001",
        "111111111111111111111"
    ],

    [
        "111111111111111111111",
        "100000100000000100001",
        "101110101111111101101",
        "100010100000000101001",
        "111010111011101101111",
        "100000001000100000001",
        "101111101010101111101",
        "100000000000000000001",
        "101111101010101111101",
        "100000001000100000001",
        "111010111011101101111",
        "100010100000000101001",
        "101110101111111101101",
        "100000100000000100001",
        "111111111111111111111"
    ]

];


/* =========================================================
   CONFIGURAÇÕES DE DIFICULDADE
========================================================= */

const DIFFICULTIES = {

    easy: {
        label: "FÁCIL",
        enemySpeed: 1.05,
        enemyCount: 3,
        enemyDamageCooldown: 1.4,
        dashCooldown: 3.0,
        pulseCooldown: 5.0
    },

    normal: {
        label: "NORMAL",
        enemySpeed: 1.35,
        enemyCount: 4,
        enemyDamageCooldown: 1.2,
        dashCooldown: 3.0,
        pulseCooldown: 4.5
    },

    hard: {
        label: "DIFÍCIL",
        enemySpeed: 1.65,
        enemyCount: 5,
        enemyDamageCooldown: 1.0,
        dashCooldown: 3.0,
        pulseCooldown: 4.0
    }

};


/* =========================================================
   ESTADO DO JOGO
========================================================= */

let difficulty = "normal";

let gameRunning = false;
let paused = false;

let level = 1;

let lastTime = 0;

let particles = [];

let crystals = [];

let powerUps = [];

let enemies = [];

let portals = [];

let keys = {};

let totalCrystals = 0;

let collectedCrystals = 0;

let screenShake = 0;


/* =========================================================
   OBJETOS
========================================================= */

let player1;
let player2;


/* =========================================================
   DIREÇÕES
========================================================= */

const DIR = {

    up: {
        x: 0,
        y: -1
    },

    down: {
        x: 0,
        y: 1
    },

    left: {
        x: -1,
        y: 0
    },

    right: {
        x: 1,
        y: 0
    }

};


/* =========================================================
   UTILIDADES
========================================================= */

function clamp(value, min, max) {

    return Math.max(min, Math.min(max, value));

}


function distance(a, b) {

    return Math.hypot(
        a.x - b.x,
        a.y - b.y
    );

}


function random(min, max) {

    return Math.random() * (max - min) + min;

}


function tileCenter(col, row) {

    return {
        x: col * TILE + TILE / 2,
        y: row * TILE + TILE / 2
    };

}


function isWallAtPixel(x, y) {

    const col = Math.floor(x / TILE);
    const row = Math.floor(y / TILE);

    if (
        col < 0 ||
        row < 0 ||
        col >= COLS ||
        row >= ROWS
    ) {
        return true;
    }

    return MAPS[level - 1][row][col] === "1";

}


function canMoveTo(x, y, radius) {

    const points = [

        { x: x - radius, y: y - radius },
        { x: x + radius, y: y - radius },
        { x: x - radius, y: y + radius },
        { x: x + radius, y: y + radius }

    ];

    for (const point of points) {

        if (isWallAtPixel(point.x, point.y)) {
            return false;
        }

    }

    return true;

}


function randomFreePosition() {

    for (let i = 0; i < 500; i++) {

        const col = Math.floor(random(1, COLS - 1));
        const row = Math.floor(random(1, ROWS - 1));

        if (
            MAPS[level - 1][row][col] !== "1"
        ) {

            return tileCenter(col, row);

        }

    }

    return tileCenter(1, 1);

}


/* =========================================================
   CRIAÇÃO DOS JOGADORES
========================================================= */

function createPlayers() {

    const p1Start = tileCenter(1, 1);

    const p2Start = tileCenter(COLS - 2, ROWS - 2);


    player1 = {

        x: p1Start.x,
        y: p1Start.y,

        radius: 13,

        speed: 145,

        dir: { x: 1, y: 0 },

        desired: { x: 1, y: 0 },

        color: "#24b7ff",

        score: 0,

        lives: 3,

        dashTimer: 0,

        pulseTimer: 0,

        invincible: 0,

        powerTimer: 0,

        dashFlash: 0

    };


    player2 = {

        x: p2Start.x,
        y: p2Start.y,

        radius: 13,

        speed: 145,

        dir: { x: -1, y: 0 },

        desired: { x: -1, y: 0 },

        color: "#ff8b32",

        score: 0,

        lives: 3,

        dashTimer: 0,

        pulseTimer: 0,

        invincible: 0,

        powerTimer: 0,

        dashFlash: 0

    };

}


/* =========================================================
   CRISTAIS
========================================================= */

function createCrystals() {

    crystals = [];

    collectedCrystals = 0;


    for (let row = 1; row < ROWS - 1; row++) {

        for (let col = 1; col < COLS - 1; col++) {

            if (
                MAPS[level - 1][row][col] !== "1"
            ) {

                const pos = tileCenter(col, row);

                const nearP1 =
                    distance(
                        pos,
                        tileCenter(1, 1)
                    ) < 80;

                const nearP2 =
                    distance(
                        pos,
                        tileCenter(COLS - 2, ROWS - 2)
                    ) < 80;


                if (
                    !nearP1 &&
                    !nearP2 &&
                    Math.random() < .78
                ) {

                    crystals.push({

                        x: pos.x,
                        y: pos.y,

                        value: 10,

                        pulse: random(0, Math.PI * 2),

                        active: true

                    });

                }

            }

        }

    }

    totalCrystals = crystals.length;

}


/* =========================================================
   POWER UPS
========================================================= */

function createPowerUps() {

    powerUps = [];

    const types = [
        "speed",
        "shield",
        "freeze",
        "bomb"
    ];


    for (let i = 0; i < 4; i++) {

        const pos = randomFreePosition();

        powerUps.push({

            x: pos.x,
            y: pos.y,

            type: types[i],

            active: true,

            rotation: random(0, Math.PI * 2)

        });

    }

}


/* =========================================================
   INIMIGOS
========================================================= */

function createEnemies() {

    enemies = [];

    const config = DIFFICULTIES[difficulty];


    for (let i = 0; i < config.enemyCount; i++) {

        let pos = randomFreePosition();


        while (
            distance(pos, player1) < 180 ||
            distance(pos, player2) < 180
        ) {

            pos = randomFreePosition();

        }


        enemies.push({

            x: pos.x,
            y: pos.y,

            radius: 13,

            speed:
                config.enemySpeed *
                random(.85, 1.15),

            color:
                [
                    "#ff3f68",
                    "#b45cff",
                    "#42e6a4",
                    "#ffcf4a",
                    "#ff5aa8"
                ][i % 5],

            stunned: 0,

            changeTimer: random(0, 2),

            target: null

        });

    }

}


/* =========================================================
   PORTAIS
========================================================= */

function createPortals() {

    portals = [];


    portals.push({
