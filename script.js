"use strict";

/*
============================================================
NEON MAZE DUO — CAMPAIGN EDITION
============================================================

5 fases
3 dificuldades
2 jogadores
3 habilidades por jogador
inimigos com comportamentos diferentes
portais
power-ups
combo
progressão

*/

/* ============================================================
CANVAS
============================================================ */

const canvas =
document.getElementById("gameCanvas");

const ctx =
canvas.getContext("2d");

const TILE = 32;

const COLS = 28;
const ROWS = 20;

const WIDTH =
COLS * TILE;

const HEIGHT =
ROWS * TILE;

canvas.width = WIDTH;
canvas.height = HEIGHT;

/* ============================================================
INTERFACE
============================================================ */

const score1 =
document.getElementById("score1");

const score2 =
document.getElementById("score2");

const lives1 =
document.getElementById("lives1");

const lives2 =
document.getElementById("lives2");

const dash1 =
document.getElementById("dash1");

const pulse1 =
document.getElementById("pulse1");

const shield1 =
document.getElementById("shield1");

const dash2 =
document.getElementById("dash2");

const pulse2 =
document.getElementById("pulse2");

const shield2 =
document.getElementById("shield2");

const phaseLabel =
document.getElementById("phaseLabel");

const phaseName =
document.getElementById("phaseName");

const statusText =
document.getElementById("statusText");

const progressBar =
document.getElementById("progressBar");

const difficultyBadge =
document.getElementById("difficultyBadge");

const restartBtn =
document.getElementById("restartBtn");

const difficultyScreen =
document.getElementById("difficultyScreen");

const phaseScreen =
document.getElementById("phaseScreen");

const resultScreen =
document.getElementById("resultScreen");

const phaseIcon =
document.getElementById("phaseIcon");

const phaseTitle =
document.getElementById("phaseTitle");

const phaseDescription =
document.getElementById("phaseDescription");

const continueBtn =
document.getElementById("continueBtn");

const resultIcon =
document.getElementById("resultIcon");

const resultTitle =
document.getElementById("resultTitle");

const resultText =
document.getElementById("resultText");

const resultBtn =
document.getElementById("resultBtn");

const resultScore1 =
document.getElementById("resultScore1");

const resultScore2 =
document.getElementById("resultScore2");

/* ============================================================
FASES
============================================================ */

const PHASES = [

{
    name: "NEON BASE",
    description:
        "O setor inicial foi tomado pelos invasores.",
    color: "#21e5ff",
    enemyCount: 3,
    enemySpeed: 1.0
},

{
    name: "DARK FACTORY",
    description:
        "As máquinas foram ativadas. O labirinto ficou mais perigoso.",
    color: "#b55cff",
    enemyCount: 4,
    enemySpeed: 1.08
},

{
    name: "CYBER GRID",
    description:
        "A rede central está protegida por caçadores mais rápidos.",
    color: "#3187ff",
    enemyCount: 5,
    enemySpeed: 1.15
},

{
    name: "INFERNO MAZE",
    description:
        "O núcleo de energia está instável. Não fique parado.",
    color: "#ff416c",
    enemyCount: 6,
    enemySpeed: 1.25
},

{
    name: "FINAL CORE",
    description:
        "O núcleo final está à sua frente. Complete a campanha.",
    color: "#ffd447",
    enemyCount: 7,
    enemySpeed: 1.35
}

];

/* ============================================================
DIFICULDADES
============================================================ */

const DIFFICULTIES = {

easy: {

    name: "FÁCIL",

    enemyMultiplier: .78,

    lives: 4,

    itemMultiplier: 1.0,

    abilityMultiplier: .75

},

normal: {

    name: "NORMAL",

    enemyMultiplier: 1,

    lives: 3,

    itemMultiplier: 1.0,

    abilityMultiplier: 1

},

hard: {

    name: "DIFÍCIL",

    enemyMultiplier: 1.28,

    lives: 2,

    itemMultiplier: .9,

    abilityMultiplier: 1.25

}

};

let difficulty =
DIFFICULTIES.normal;

let difficultyKey =
"normal";

/* ============================================================
ESTADO
============================================================ */

let phaseIndex = 0;

let grid = [];

let pellets = [];

let crystals = [];

let portals = [];

let enemies = [];

let particles = [];

let floatingTexts = [];

let remainingItems = 0;

let totalItems = 0;

let frame = 0;

let gameRunning = false;

let phaseFinished = false;

let combo = 0;

let comboTimer = 0;

let audioContext = null;

/* ============================================================
INPUT
============================================================ */

const keys = {};

const justPressed = {};

window.addEventListener(
"keydown",
event => {

    const controlledKeys = [

        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",

        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",

        "ShiftLeft",
        "Space",
        "KeyQ",

        "Enter",
        "Slash",
        "Period"

    ];

    if (
        controlledKeys.includes(
            event.code
        )
    ) {

        event.preventDefault();

    }


    if (
        !keys[event.code]
    ) {

        justPressed[
            event.code
        ] = true;

    }

    keys[event.code] = true;

}

);

window.addEventListener(
"keyup",
event => {

    keys[event.code] = false;

}

);

/* ============================================================
SOM
============================================================ */

function tone(
frequency,
duration = .06,
type = "sine"
) {

try {

    if (!audioContext) {

        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

    }

    if (
        audioContext.state ===
        "suspended"
    ) {

        audioContext.resume();

    }

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type =
        type;

    oscillator.frequency.value =
        frequency;

    gain.gain.setValueAtTime(
        .045,
        audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        .001,
        audioContext.currentTime +
        duration
    );

    oscillator.connect(gain);

    gain.connect(
        audioContext.destination
    );

    oscillator.start();

    oscillator.stop(
        audioContext.currentTime +
        duration
    );

} catch (error) {

    /* Som opcional. */

}

}

/* ============================================================
UTILITÁRIOS
============================================================ */

function clamp(
value,
min,
max
) {

return Math.max(
    min,
    Math.min(max, value)
);

}

function distance(
a,
b
) {

return Math.hypot(
    a.x - b.x,
    a.y - b.y
);

}

function cell(
col,
row
) {

return {

    x:
        col * TILE +
        TILE / 2,

    y:
        row * TILE +
        TILE / 2

};

}

function isWall(
col,
row
) {

if (
    col < 0 ||
    col >= COLS ||
    row < 0 ||
    row >= ROWS
) {

    return true;

}

return grid[row][col] === "#";

}

/* ============================================================
MAPA PROCEDURAL
============================================================ */

function generateMap() {

grid = [];

for (
    let row = 0;
    row < ROWS;
    row++
) {

    grid[row] = [];

    for (
        let col = 0;
        col < COLS;
        col++
    ) {

        const border =
            row === 0 ||
            row === ROWS - 1 ||
            col === 0 ||
            col === COLS - 1;

        grid[row][col] =
            border
                ? "#"
                : " ";

    }

}


/*
    Paredes verticais.
    A fase altera os intervalos.
*/

const verticalSets = [

    [4, 9, 14, 19, 24],

    [5, 9, 14, 18, 23],

    [3, 7, 12, 16, 21, 25],

    [4, 8, 13, 18, 23],

    [3, 6, 10, 15, 20, 24]

];


const horizontalSets = [

    [6, 13],

    [5, 10, 15],

    [6, 11, 16],

    [5, 9, 14],

    [6, 10, 13, 16]

];


const verticals =
    verticalSets[
        phaseIndex
    ];

const horizontals =
    horizontalSets[
        phaseIndex
    ];


/*
    Cria paredes verticais
    com espaços de passagem.
*/

verticals.forEach(
    (col, index) => {

        for (
            let row = 2;
            row < ROWS - 2;
            row++
        ) {

            const gap =
                (
                    row +
                    index * 2 +
                    phaseIndex
                ) % 6 === 0;

            if (!gap) {

                grid[row][col] = "#";

            }

        }

    }
);


/*
    Paredes horizontais.
*/

horizontals.forEach(
    (row, index) => {

        for (
            let col = 2;
            col < COLS - 2;
            col++
        ) {

            const gap =
                (
                    col +
                    index * 3 +
                    phaseIndex
                ) % 7 === 0;

            if (!gap) {

                grid[row][col] = "#";

            }

        }

    }
);


/*
    Áreas abertas obrigatórias
    para os jogadores.
*/

clearArea(
    1,
    1,
    4,
    3
);

clearArea(
    COLS - 5,
    ROWS - 4,
    4,
    3
);

clearArea(
    12,
    8,
    4,
    4
);


/*
    Corredores centrais.
*/

for (
    let col = 1;
    col < COLS - 1;
    col++
) {

    grid[9][col] = " ";

}


for (
    let row = 1;
    row < ROWS - 1;
    row++
) {

    grid[row][14] = " ";

}


/*
    Portais.
*/

portals = [

    cell(1, 9),

    cell(
        COLS - 2,
        9
    )

];

}

function clearArea(
startCol,
startRow,
width,
height
) {

for (
    let row = startRow;
    row < startRow + height;
    row++
) {

    for (
        let col = startCol;
        col < startCol + width;
        col++
    ) {

        if (
            row > 0 &&
            row < ROWS - 1 &&
            col > 0 &&
            col < COLS - 1
        ) {

            grid[row][col] = " ";

        }

    }

}

}

/* ============================================================
ITENS
============================================================ */

function createItems() {

pellets = [];

crystals = [];

const skip =
    Math.random();


for (
    let row = 1;
    row < ROWS - 1;
    row++
) {

    for (
        let col = 1;
        col < COLS - 1;
        col++
    ) {

        if (
            isWall(col, row)
        ) {

            continue;

        }


        /*
            Não colocar itens
            nas bases.
        */

        const p1 =
            cell(2, 2);

        const p2 =
            cell(
                COLS - 3,
                ROWS - 3
            );

        const position =
            cell(col, row);


        if (
            distance(
                position,
                p1
            ) < 55 ||
            distance(
                position,
                p2
            ) < 55
        ) {

            continue;

        }


        /*
            Alguns corredores
            recebem cristal.
        */

        const special =
            (
                col * 3 +
                row * 7 +
                phaseIndex * 5
            ) % 31 === 0;


        if (special) {

            crystals.push({

                x: position.x,

                y: position.y,

                collected: false,

                phase:
                    Math.random() * 10

            });

        } else {

            pellets.push({

                x: position.x,

                y: position.y,

                collected: false,

                phase:
                    Math.random() * 10

            });

        }

    }

}


remainingItems =
    pellets.length +
    crystals.length;

totalItems =
    remainingItems;

}

/* ============================================================
COLISÃO
============================================================ */

function canMove(
x,
y,
radius
) {

const points = [

    {
        x: x - radius,
        y: y - radius
    },

    {
        x: x + radius,
        y: y - radius
    },

    {
        x: x - radius,
        y: y + radius
    },

    {
        x: x + radius,
        y: y + radius
    }

];


for (
    const point of points
) {

    const col =
        Math.floor(
            point.x / TILE
        );

    const row =
        Math.floor(
            point.y / TILE
        );


    if (
        isWall(col, row)
    ) {

        return false;

    }

}

return true;

}

/* ============================================================
PARTÍCULAS
============================================================ */

function particlesBurst(
x,
y,
color,
amount = 15
) {

for (
    let i = 0;
    i < amount;
    i++
) {

    particles.push({

        x,
        y,

        vx:
            (Math.random() - .5) *
            5,

        vy:
            (Math.random() - .5) *
            5,

        size:
            2 +
            Math.random() * 4,

        life:
            20 +
            Math.random() * 30,

        color

    });

}

}

function updateParticles() {

particles.forEach(
    particle => {

        particle.x +=
            particle.vx;

        particle.y +=
            particle.vy;

        particle.vx *= .95;
        particle.vy *= .95;

        particle.life--;

    }
);


particles =
    particles.filter(
        particle =>
            particle.life > 0
    );


floatingTexts.forEach(
    text => {

        text.y -= .5;

        text.life--;

    }
);


floatingTexts =
    floatingTexts.filter(
        text =>
            text.life > 0
    );

}

function drawParticles() {

particles.forEach(
    particle => {

        ctx.globalAlpha =
            particle.life / 50;

        ctx.fillStyle =
            particle.color;

        ctx.fillRect(
            particle.x,
            particle.y,
            particle.size,
            particle.size
        );

    }
);


ctx.globalAlpha = 1;


floatingTexts.forEach(
    text => {

        ctx.globalAlpha =
            text.life / 50;

        ctx.fillStyle =
            text.color;

        ctx.font =
            "bold 12px Arial";

        ctx.textAlign =
            "center";

        ctx.fillText(
            text.text,
            text.x,
            text.y
        );

    }
);


ctx.globalAlpha = 1;

}

/* ============================================================
PLAYER
============================================================ */

class Player {

constructor(
    config
) {

    this.name =
        config.name;

    this.color =
        config.color;

    this.spawnX =
        config.x;

    this.spawnY =
        config.y;

    this.x =
        config.x;

    this.y =
        config.y;

    this.radius = 10;

    this.speed = 2.65;

    this.dirX = 0;
    this.dirY = 0;

    this.nextX = 0;
    this.nextY = 0;

    this.score = 0;

    this.lives =
        difficulty.lives;

    this.powerTimer = 0;

    this.invincible = 90;

    this.portalCooldown = 30;

    /*
        Habilidades
    */

    this.dashCooldown = 0;

    this.pulseCooldown = 0;

    this.shieldCooldown = 0;

    this.shieldTimer = 0;

    this.dashTimer = 0;

    this.dashDistance = 0;

    this.pulseEffect = 0;

    this.alive = true;

    this.controls =
        config.controls;

}


resetPosition() {

    this.x =
        this.spawnX;

    this.y =
        this.spawnY;

    this.dirX = 0;
    this.dirY = 0;

    this.nextX = 0;
    this.nextY = 0;

    this.invincible = 100;

    this.portalCooldown = 35;

    this.dashTimer = 0;

    this.dashDistance = 0;

}


update() {

    if (!this.alive) {
        return;
    }


    /*
        Movimento.
    */

    if (
        keys[
            this.controls.up
        ]
    ) {

        this.nextX = 0;
        this.nextY = -1;

    }

    if (
        keys[
            this.controls.down
        ]
    ) {

        this.nextX = 0;
        this.nextY = 1;

    }

    if (
        keys[
            this.controls.left
        ]
    ) {

        this.nextX = -1;
        this.nextY = 0;

    }

    if (
        keys[
            this.controls.right
        ]
    ) {

        this.nextX = 1;
        this.nextY = 0;

    }


    /*
        Habilidades.
    */

    if (
        justPressed[
            this.controls.dash
        ]
    ) {

        this.useDash();

    }


    if (
        justPressed[
            this.controls.pulse
        ]
    ) {

        this.usePulse();

    }


    if (
        justPressed[
            this.controls.shield
        ]
    ) {

        this.useShield();

    }


    /*
        Virar.
    */

    if (
        canMove(
            this.x +
            this.nextX *
            this.speed *
            2,

            this.y +
            this.nextY *
            this.speed *
            2,

            this.radius
        )
    ) {

        this.dirX =
            this.nextX;

        this.dirY =
            this.nextY;

    }


    /*
        Velocidade.
    */

    let currentSpeed =
        this.speed;


    if (
        this.dashTimer > 0
    ) {

        currentSpeed =
            8.5;

        this.dashTimer--;

    }


    const nextX =
        this.x +
        this.dirX *
        currentSpeed;

    const nextY =
        this.y +
        this.dirY *
        currentSpeed;


    if (
        canMove(
            nextX,
            nextY,
            this.radius
        )
    ) {

        this.x = nextX;
        this.y = nextY;

    }


    /*
        Timers.
    */

    this.invincible =
        Math.max(
            0,
            this.invincible - 1
        );

    this.portalCooldown =
        Math.max(
            0,
            this.portalCooldown - 1
        );

    this.dashCooldown =
        Math.max(
            0,
            this.dashCooldown - 1
        );

    this.pulseCooldown =
        Math.max(
            0,
            this.pulseCooldown - 1
        );

    this.shieldCooldown =
        Math.max(
            0,
            this.shieldCooldown - 1
        );

    this.shieldTimer =
        Math.max(
            0,
            this.shieldTimer - 1
        );

    this.powerTimer =
        Math.max(
            0,
            this.powerTimer - 1
        );


    collectItems(this);

    usePortal(this);

}


useDash() {

    if (
        this.dashCooldown > 0
    ) {

        return;

    }


    /*
        Dash fica disponível
        na direção atual.
    */

    if (
        this.dirX === 0 &&
        this.dirY === 0
    ) {

        this.dirX = 1;

    }


    this.dashTimer = 14;

    this.dashCooldown =
        Math.round(
            100 *
            difficulty.abilityMultiplier
        );


    particlesBurst(
        this.x,
        this.y,
        this.color,
        15
    );

    tone(
        700,
        .08,
        "square"
    );

}


usePulse() {

    if (
        this.pulseCooldown > 0
    ) {

        return;

    }


    this.pulseCooldown =
        Math.round(
            180 *
            difficulty.abilityMultiplier
        );


    this.pulseEffect = 25;


    const radius =
        105;


    let hits = 0;


    enemies.forEach(
        enemy => {

            if (
                distance(
                    this,
                    enemy
                ) <= radius
            ) {

                enemy.stunTimer =
                    150;

                enemy.knockX =
                    enemy.x -
                    this.x;

                enemy.knockY =
                    enemy.y -
                    this.y;

                hits++;

            }

        }
    );


    if (hits > 0) {

        this.score +=
            50 * hits;

        floatingTexts.push({

            x: this.x,

            y: this.y - 20,

            text:
                `PULSE +${50 * hits}`,

            color:
                "#21e5ff",

            life: 50

        });

    }


    particlesBurst(
        this.x,
        this.y,
        "#21e5ff",
        30
    );

    tone(
        350,
        .15,
        "sine"
    );

}


useShield() {

    if (
        this.shieldCooldown > 0
    ) {

        return;

    }


    this.shieldCooldown =
        Math.round(
            240 *
            difficulty.abilityMultiplier
        );


    this.shieldTimer = 180;

    particlesBurst(
        this.x,
        this.y,
        "#b55cff",
        20
    );

    tone(
        500,
        .12,
        "triangle"
    );

}


draw() {

    if (!this.alive) {
        return;
    }


    ctx.save();


    /*
        Shield.
    */

    if (
        this.shieldTimer > 0
    ) {

        const pulse =
            Math.sin(
                frame * .15
            ) * 2;

        ctx.strokeStyle =
            "#b55cff";

        ctx.shadowColor =
            "#b55cff";

        ctx.shadowBlur =
            20;

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.arc(
            this.x,
            this.y,
            17 + pulse,
            0,
            Math.PI * 2
        );

        ctx.stroke();

    }


    /*
        Pulse.
    */

    if (
        this.pulseEffect > 0
    ) {

        const progress =
            25 -
            this.pulseEffect;

        ctx.strokeStyle =
            "rgba(33,229,255,.7)";

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.arc(
            this.x,
            this.y,
            20 +
            progress * 4,
            0,
            Math.PI * 2
        );

        ctx.stroke();

        this.pulseEffect--;

    }


    /*
        Pisca quando invencível.
    */

    if (
        this.invincible > 0 &&
        Math.floor(
            this.invincible / 5
        ) % 2 === 0
    ) {

        ctx.globalAlpha = .45;

    }


    ctx.fillStyle =
        this.color;

    ctx.shadowColor =
        this.color;

    ctx.shadowBlur = 16;

    ctx.beginPath();

    ctx.arc(
        this.x,
        this.y,
        this.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /*
        Olho.
    */

    ctx.shadowBlur = 0;

    ctx.fillStyle =
        "#ffffff";

    ctx.beginPath();

    ctx.arc(
        this.x +
        this.dirX * 4,

        this.y +
        this.dirY * 4,

        3,

        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.restore();

}

}

/* ============================================================
JOGADORES
============================================================ */

const player1 =
new Player({

    name:
        "PLAYER 1",

    color:
        "#ff3b67",

    x:
        TILE * 2.5,

    y:
        TILE * 2.5,

    controls: {

        up:
            "KeyW",

        down:
            "KeyS",

        left:
            "KeyA",

        right:
            "KeyD",

        dash:
            "ShiftLeft",

        pulse:
            "Space",

        shield:
            "KeyQ"

    }

});

const player2 =
new Player({

    name:
        "PLAYER 2",

    color:
        "#3187ff",

    x:
        TILE * 25.5,

    y:
        TILE * 17.5,

    controls: {

        up:
            "ArrowUp",

        down:
            "ArrowDown",

        left:
            "ArrowLeft",

        right:
            "ArrowRight",

        dash:
            "Enter",

        pulse:
            "Slash",

        shield:
            "Period"

    }

});

/* ============================================================
ITENS
============================================================ */

function collectItems(
player
) {

pellets.forEach(
    pellet => {

        if (
            pellet.collected
        ) {

            return;

        }


        if (
            distance(
                player,
                pellet
            ) < 14
        ) {

            pellet.collected =
                true;

            remainingItems--;

            combo++;

            comboTimer = 150;

            const multiplier =
                Math.min(
                    5,
                    1 +
                    Math.floor(
                        combo / 10
                    )
                );

            const points =
                10 *
                multiplier;

            player.score +=
                points;

            floatingTexts.push({

                x:
                    pellet.x,

                y:
                    pellet.y - 8,

                text:
                    `+${points}`,

                color:
                    "#ffd447",

                life: 35

            });

            particlesBurst(
                pellet.x,
                pellet.y,
                "#ffd447",
                5
            );

            tone(
                520 +
                combo * 5,
                .035,
                "square"
            );

        }

    }
);


crystals.forEach(
    crystal => {

        if (
            crystal.collected
        ) {

            return;

        }


        if (
            distance(
                player,
                crystal
            ) < 17
        ) {

            crystal.collected =
                true;

            remainingItems--;

            player.score +=
                50;

            player.powerTimer =
                420;

            floatingTexts.push({

                x:
                    crystal.x,

                y:
                    crystal.y - 10,

                text:
                    "+50 POWER",

                color:
                    "#21e5ff",

                life: 55

            });

            particlesBurst(
                crystal.x,
                crystal.y,
                "#21e5ff",
                24
            );

            tone(
                900,
                .12,
                "sine"
            );

        }

    }
);

}

function usePortal(
player
) {

if (
    player.portalCooldown > 0
) {

    return;

}


for (
    let i = 0;
    i < portals.length;
    i++
) {

    const portal =
        portals[i];

    if (
        distance(
            player,
            portal
        ) < 14
    ) {

        const other =
            portals[
                i === 0
                    ? 1
                    : 0
            ];

        player.x =
            other.x;

        player.y =
            other.y;

        player.portalCooldown =
            45;

        player.score +=
            15;

        particlesBurst(
            other.x,
            other.y,
            "#b55cff",
            25
        );

        tone(
            450,
            .09,
            "triangle"
        );

        break;

    }

}

}

/* ============================================================
INIMIGOS
============================================================ */

class Enemy {

constructor(
    x,
    y,
    color,
    type,
    speed
) {

    this.x = x;
    this.y = y;

    this.spawnX = x;
    this.spawnY = y;

    this.color = color;

    this.type = type;

    this.radius = 10;

    this.speed = speed;

    this.dirX = 1;
    this.dirY = 0;

    this.changeTimer = 0;

    this.stunTimer = 0;

    this.knockX = 0;
    this.knockY = 0;

}


update() {

    if (
        this.stunTimer > 0
    ) {

        this.stunTimer--;

        /*
            Pequeno deslocamento
            de knockback.
        */

        const length =
            Math.hypot(
                this.knockX,
                this.knockY
            ) || 1;

        const nx =
            this.knockX /
            length;

        const ny =
            this.knockY /
            length;

        const kx =
            this.x +
            nx * 1.7;

        const ky =
            this.y +
            ny * 1.7;

        if (
            canMove(
                kx,
                ky,
                this.radius
            )
        ) {

            this.x = kx;
            this.y = ky;

        }

        return;

    }


    const target =
        this.findTarget();


    if (!target) {
        return;
    }


    if (
        this.type ===
        "random"
    ) {

        this.randomMove();

    } else if (
        this.type ===
        "ambush"
    ) {

        this.chase({

            x:
                target.x +
                target.dirX *
                TILE * 3,

            y:
                target.y +
                target.dirY *
                TILE * 3

        });

    } else if (
        this.type ===
        "hunter"
    ) {

        this.chase(
            target
        );

    } else {

        this.smartChase(
            target
        );

    }


    const nx =
        this.x +
        this.dirX *
        this.speed;

    const ny =
        this.y +
        this.dirY *
        this.speed;


    if (
        canMove(
            nx,
            ny,
            this.radius
        )
    ) {

        this.x = nx;
        this.y = ny;

    } else {

        this.chooseDirection();

    }


    this.collidePlayers();

}


findTarget() {

    const candidates =
        [
            player1,
            player2
        ].filter(
            player =>
                player.alive
        );


    if (
        candidates.length === 0
    ) {

        return null;

    }


    return candidates.sort(
        (a, b) =>
            distance(
                this,
                a
            ) -
            distance(
                this,
                b
            )
    )[0];

}


chase(target) {

    const dx =
        target.x -
        this.x;

    const dy =
        target.y -
        this.y;


    const options = [];


    if (
        Math.abs(dx) >
        Math.abs(dy)
    ) {

        options.push(
            {
                x: Math.sign(dx),
                y: 0
            }
        );

        options.push(
            {
                x: 0,
                y: Math.sign(dy)
            }
        );

    } else {

        options.push(
            {
                x: 0,
                y: Math.sign(dy)
            }
        );

        options.push(
            {
                x: Math.sign(dx),
                y: 0
            }
        );

    }


    options.push(
        {
            x: -this.dirX,
            y: -this.dirY
        }
    );


    for (
        const direction of options
    ) {

        if (
            this.canDirection(
                direction
            )
        ) {

            this.dirX =
                direction.x;

            this.dirY =
                direction.y;

            return;

        }

    }


    this.chooseDirection();

}


smartChase(target) {

    /*
        O inimigo tenta prever
        o movimento do jogador.
    */

    const predicted = {

        x:
            target.x +
            target.dirX *
            TILE * 2,

        y:
            target.y +
            target.dirY *
            TILE * 2

    };


    this.chase(
        predicted
    );

}


randomMove() {

    this.changeTimer--;

    if (
        this.changeTimer > 0 &&
        this.canDirection({
            x: this.dirX,
            y: this.dirY
        })
    ) {

        return;

    }

    this.chooseDirection();

}


canDirection(
    direction
) {

    return canMove(

        this.x +
        direction.x *
        12,

        this.y +
        direction.y *
        12,

        this.radius

    );

}


chooseDirection() {

    const options = [

        {
            x: 1,
            y: 0
        },

        {
            x: -1,
            y: 0
        },

        {
            x: 0,
            y: 1
        },

        {
            x: 0,
            y: -1
        }

    ].filter(
        direction =>
            this.canDirection(
                direction
            )
    );


    if (
        options.length === 0
    ) {

        return;

    }


    const direction =
        options[
            Math.floor(
                Math.random() *
                options.length
            )
        ];


    this.dirX =
        direction.x;

    this.dirY =
        direction.y;

    this.changeTimer =
        30 +
        Math.random() * 80;

}


collidePlayers() {

    const players =
        [
            player1,
            player2
        ];


    for (
        const player of players
    ) {

        if (
            !player.alive
        ) {

            continue;

        }


        if (
            distance(
                this,
                player
            ) <
            this.radius +
            player.radius
        ) {

            if (
                player.powerTimer > 0
            ) {

                defeatEnemy(
                    this,
                    player
                );

            } else if (
                player.shieldTimer > 0
            ) {

                /*
                    Shield repele
                    o inimigo.
                */

                this.stunTimer =
                    50;

                player.score +=
                    20;

                particlesBurst(
                    player.x,
                    player.y,
                    "#b55cff",
                    15
                );

            } else {

                hurtPlayer(
                    player
                );

            }

        }

    }

}


respawn() {

    const possible = [];


    for (
        let row = 2;
        row < ROWS - 2;
        row++
    ) {

        for (
            let col = 2;
            col < COLS - 2;
            col++
        ) {

            if (
                !isWall(
                    col,
                    row
                )
            ) {

                possible.push(
                    cell(
                        col,
                        row
                    )
                );

            }

        }

    }


    if (
        possible.length === 0
    ) {

        return;

    }


    const position =
        possible[
            Math.floor(
                Math.random() *
                possible.length
            )
        ];


    this.x =
        position.x;

    this.y =
        position.y;

    this.chooseDirection();

}


draw() {

    ctx.save();

    let color =
        this.color;


    if (
        this.stunTimer > 0
    ) {

        color =
            "#ffffff";

    }


    ctx.fillStyle =
        color;

    ctx.shadowColor =
        color;

    ctx.shadowBlur = 14;


    ctx.beginPath();

    ctx.arc(
        this.x,
        this.y,
        this.radius,
        Math.PI,
        0
    );

    ctx.lineTo(
        this.x +
        this.radius,

        this.y +
        this.radius
    );

    ctx.lineTo(
        this.x + 5,
        this.y + 7
    );

    ctx.lineTo(
        this.x,
        this.y +
        this.radius
    );

    ctx.lineTo(
        this.x - 5,
        this.y + 7
    );

    ctx.lineTo(
        this.x -
        this.radius,

        this.y +
        this.radius
    );

    ctx.closePath();

    ctx.fill();


    /*
        Olhos.
    */

    ctx.shadowBlur = 0;

    ctx.fillStyle =
        "#ffffff";

    ctx.beginPath();

    ctx.arc(
        this.x - 4,
        this.y - 2,
        3,
        0,
        Math.PI * 2
    );

    ctx.arc(
        this.x + 4,
        this.y - 2,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle =
        "#101526";

    ctx.beginPath();

    ctx.arc(
        this.x - 4 +
        this.dirX * 2,

        this.y - 2 +
        this.dirY * 2,

        1.5,

        0,
        Math.PI * 2
    );

    ctx.arc(
        this.x + 4 +
        this.dirX * 2,

        this.y - 2 +
        this.dirY * 2,

        1.5,

        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.restore();

}

}

/* ============================================================
CRIAR INIMIGOS
============================================================ */

function createEnemies() {

enemies = [];


const phase =
    PHASES[
        phaseIndex
    ];


const baseSpeed =
    phase.enemySpeed *
    difficulty.enemyMultiplier;


const colors = [

    "#ff416c",

    "#b55cff",

    "#39ee82",

    "#ff9d1c",

    "#21e5ff",

    "#ff4fc3",

    "#9dff4f"

];


const types = [

    "hunter",

    "ambush",

    "random",

    "smart"

];


/*
    Posições ao redor
    do centro.
*/

const positions = [

    [12, 8],

    [15, 8],

    [12, 11],

    [15, 11],

    [10, 9],

    [17, 9],

    [14, 12]

];


for (
    let i = 0;
    i < phase.enemyCount;
    i++
) {

    const position =
        positions[
            i
        ];


    const enemy =
        new Enemy(

            TILE *
            (position[0] + .5),

            TILE *
            (position[1] + .5),

            colors[
                i %
                colors.length
            ],

            types[
                i %
                types.length
            ],

            baseSpeed +
            i * .025

        );


    enemy.chooseDirection();

    enemies.push(
        enemy
    );

}

}

/* ============================================================
DERROTAR INIMIGO
============================================================ */

function defeatEnemy(
enemy,
player
) {

combo++;

comboTimer = 180;


const multiplier =
    Math.min(
        5,
        1 +
        Math.floor(
            combo / 5
        )
    );


const points =
    100 *
    multiplier;


player.score +=
    points;


floatingTexts.push({

    x:
        enemy.x,

    y:
        enemy.y - 10,

    text:
        `+${points}`,

    color:
        "#21e5ff",

    life: 55

});


particlesBurst(
    enemy.x,
    enemy.y,
    enemy.color,
    30
);


tone(
    220 +
    multiplier * 80,
    .1,
    "sawtooth"
);


enemy.respawn();

}

/* ============================================================
DANO
============================================================ */

function hurtPlayer(
player
) {

if (
    player.invincible > 0
) {

    return;

}


if (
    player.shieldTimer > 0
) {

    return;

}


player.lives--;

combo = 0;

comboTimer = 0;


particlesBurst(
    player.x,
    player.y,
    player.color,
    30
);


tone(
    120,
    .15,
    "sawtooth"
);


if (
    player.lives <= 0
) {

    player.alive =
        false;

} else {

    player.resetPosition();

}


if (
    !player1.alive &&
    !player2.alive
) {

    endGame();

}

}

/* ============================================================
DESENHO DO MAPA
============================================================ */

function drawBackground() {

const phase =
    PHASES[
        phaseIndex
    ];


const gradient =
    ctx.createLinearGradient(
        0,
        0,
        0,
        HEIGHT
    );


gradient.addColorStop(
    0,
    "#030819"
);

gradient.addColorStop(
    .5,
    "#050b1b"
);

gradient.addColorStop(
    1,
    "#010208"
);


ctx.fillStyle =
    gradient;

ctx.fillRect(
    0,
    0,
    WIDTH,
    HEIGHT
);


/*
    Linhas de energia.
*/

ctx.strokeStyle =
    phase.color +
    "12";

ctx.lineWidth = 1;


for (
    let x = 0;
    x < WIDTH;
    x += TILE
) {

    ctx.beginPath();

    ctx.moveTo(
        x,
        0
    );

    ctx.lineTo(
        x,
        HEIGHT
    );

    ctx.stroke();

}


for (
    let y = 0;
    y < HEIGHT;
    y += TILE
) {

    ctx.beginPath();

    ctx.moveTo(
        0,
        y
    );

    ctx.lineTo(
        WIDTH,
        y
    );

    ctx.stroke();

}

}

function drawMap() {

const phase =
    PHASES[
        phaseIndex
    ];


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
            !isWall(
                col,
                row
            )
        ) {

            continue;

        }


        const x =
            col * TILE;

        const y =
            row * TILE;


        ctx.fillStyle =
            "#08142e";

        ctx.fillRect(
            x,
            y,
            TILE,
            TILE
        );


        ctx.strokeStyle =
            phase.color +
            "80";

        ctx.lineWidth = 1;

        ctx.strokeRect(
            x + .5,
            y + .5,
            TILE - 1,
            TILE - 1
        );


        ctx.fillStyle =
            phase.color +
            "10";

        ctx.fillRect(
            x + 4,
            y + 4,
            TILE - 8,
            3
        );

    }

}


/*
    Portais.
*/

portals.forEach(
    (portal, index) => {

        const pulse =
            Math.sin(
                frame * .1 +
                index
            ) * 3;


        ctx.save();

        ctx.strokeStyle =
            "#b55cff";

        ctx.shadowColor =
            "#b55cff";

        ctx.shadowBlur =
            20;

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.arc(
            portal.x,
            portal.y,
            9 + pulse,
            0,
            Math.PI * 2
        );

        ctx.stroke();

        ctx.restore();

    }
);

}

/* ============================================================
DESENHAR ITENS
============================================================ */

function drawItems() {

pellets.forEach(
    pellet => {

        if (
            pellet.collected
        ) {

            return;

        }


        const pulse =
            Math.sin(
                frame * .12 +
                pellet.phase
            ) * 1.2;


        ctx.fillStyle =
            "#ffd447";

        ctx.shadowColor =
            "#ffd447";

        ctx.shadowBlur = 8;

        ctx.beginPath();

        ctx.arc(
            pellet.x,
            pellet.y,
            3.3 + pulse,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.shadowBlur = 0;

    }
);


crystals.forEach(
    crystal => {

        if (
            crystal.collected
        ) {

            return;

        }


        const pulse =
            Math.sin(
                frame * .1 +
                crystal.phase
            ) * 2;


        ctx.save();

        ctx.translate(
            crystal.x,
            crystal.y
        );

        ctx.rotate(
            frame * .02
        );


        ctx.fillStyle =
            "#21e5ff";

        ctx.shadowColor =
            "#21e5ff";

        ctx.shadowBlur =
            20;


        ctx.beginPath();

        ctx.moveTo(
            0,
            -10 - pulse
        );

        ctx.lineTo(
            8 + pulse,
            0
        );

        ctx.lineTo(
            0,
            10 + pulse
        );

        ctx.lineTo(
            -8 - pulse,
            0
        );

        ctx.closePath();

        ctx.fill();

        ctx.restore();

    }
);

}

/* ============================================================
HUD
============================================================ */

function formatScore(
value
) {

return String(
    Math.floor(value)
).padStart(
    6,
    "0"
);

}

function cooldownText(
value
) {

if (
    value <= 0
) {

    return "PRONTO";

}


return (
    Math.ceil(
        value / 60
    ) +
    "s"
);

}

function updateHUD() {

score1.textContent =
    formatScore(
        player1.score
    );

score2.textContent =
    formatScore(
        player2.score
    );


lives1.textContent =
    player1.lives > 0
        ? "♥ ".repeat(
            player1.lives
        )
        : "SEM VIDAS";


lives2.textContent =
    player2.lives > 0
        ? "♥ ".repeat(
            player2.lives
        )
        : "SEM VIDAS";


dash1.textContent =
    cooldownText(
        player1.dashCooldown
    );

pulse1.textContent =
    cooldownText(
        player1.pulseCooldown
    );

shield1.textContent =
    cooldownText(
        player1.shieldCooldown
    );


dash2.textContent =
    cooldownText(
        player2.dashCooldown
    );

pulse2.textContent =
    cooldownText(
        player2.pulseCooldown
    );

shield2.textContent =
    cooldownText(
        player2.shieldCooldown
    );


phaseLabel.textContent =
    `FASE ${phaseIndex + 1} / ${PHASES.length}`;

phaseName.textContent =
    PHASES[
        phaseIndex
    ].name;


const progress =
    totalItems > 0
        ? (
            (
                totalItems -
                remainingItems
            ) /
            totalItems
        ) * 100
        : 0;


progressBar.style.width =
    `${progress}%`;


if (
    player1.powerTimer > 0
) {

    statusText.textContent =
        "PLAYER 1 ESTÁ ENERGIZADO!";

} else if (
    player2.powerTimer > 0
) {

    statusText.textContent =
        "PLAYER 2 ESTÁ ENERGIZADO!";

} else if (
    combo >= 5
) {

    statusText.textContent =
        `COMBO x${Math.min(
            5,
            1 +
            Math.floor(
                combo / 5
            )
        )}`;

} else {

    statusText.textContent =
        `${remainingItems} ITENS RESTANTES`;

}

}

/* ============================================================
FIM DA FASE
============================================================ */

function finishPhase() {

if (
    phaseFinished ||
    !gameRunning
) {

    return;

}


phaseFinished =
    true;

gameRunning =
    false;


player1.score +=
    250 * (phaseIndex + 1);

player2.score +=
    250 * (phaseIndex + 1);


/*
    Última fase.
*/

if (
    phaseIndex ===
    PHASES.length - 1
) {

    showFinalVictory();

    return;

}


showPhaseResult();

}

function showPhaseResult() {

resultScreen.classList.remove(
    "hidden"
);


resultIcon.textContent =
    "✓";

resultTitle.textContent =
    `FASE ${phaseIndex + 1} CONCLUÍDA`;

resultText.textContent =
    `${PHASES[
        phaseIndex
    ].name} foi concluída.`;

resultScore1.textContent =
    formatScore(
        player1.score
    );

resultScore2.textContent =
    formatScore(
        player2.score
    );

resultBtn.textContent =
    "PRÓXIMA FASE";

}

function showFinalVictory() {

resultScreen.classList.remove(
    "hidden"
);


resultIcon.textContent =
    "🏆";

resultTitle.textContent =
    "CAMPANHA CONCLUÍDA!";

resultText.textContent =
    "Os dois jogadores chegaram ao núcleo final.";

resultScore1.textContent =
    formatScore(
        player1.score
    );

resultScore2.textContent =
    formatScore(
        player2.score
    );

resultBtn.textContent =
    "JOGAR NOVAMENTE";

}

/* ============================================================
GAME OVER
============================================================ */

function endGame() {

gameRunning =
    false;


resultScreen.classList.remove(
    "hidden"
);


resultIcon.textContent =
    "☠";

resultTitle.textContent =
    "GAME OVER";

resultText.textContent =
    "Os dois jogadores ficaram sem vidas.";

resultScore1.textContent =
    formatScore(
        player1.score
    );

resultScore2.textContent =
    formatScore(
        player2.score
    );

resultBtn.textContent =
    "TENTAR NOVAMENTE";

}

/* ============================================================
INICIAR FASE
============================================================ */

function startPhase() {

phaseFinished =
    false;

gameRunning =
    true;

resultScreen.classList.add(
    "hidden"
);

phaseScreen.classList.add(
    "hidden"
);


particles = [];

floatingTexts = [];

combo = 0;

comboTimer = 0;


generateMap();

createItems();

createEnemies();


player1.spawnX =
    TILE * 2.5;

player1.spawnY =
    TILE * 2.5;


player2.spawnX =
    TILE * 25.5;

player2.spawnY =
    TILE * 17.5;


player1.resetPosition();

player2.resetPosition();


/*
    A cada nova fase
    recupera uma vida,
    sem ultrapassar o limite.
*/

if (
    phaseIndex > 0
) {

    player1.lives =
        Math.min(
            difficulty.lives,
            player1.lives + 1
        );

    player2.lives =
        Math.min(
            difficulty.lives,
            player2.lives + 1
        );

}


updateHUD();

}

/* ============================================================
PRÓXIMA FASE
============================================================ */

function nextPhase() {

/*
    Se a campanha acabou,
    começa novamente.
*/

if (
    phaseIndex >=
    PHASES.length - 1
) {

    phaseIndex = 0;

    player1.score = 0;
    player2.score = 0;

    player1.lives =
        difficulty.lives;

    player2.lives =
        difficulty.lives;

    player1.alive =
        true;

    player2.alive =
        true;

    startPhase();

    return;

}


phaseIndex++;

phaseScreen.classList.remove(
    "hidden"
);


phaseIcon.textContent =
    String(
        phaseIndex + 1
    ).padStart(
        2,
        "0"
    );

phaseTitle.textContent =
    PHASES[
        phaseIndex
    ].name;

phaseDescription.textContent =
    PHASES[
        phaseIndex
    ].description;


gameRunning =
    false;

}

/* ============================================================
MENU DE DIFICULDADE
============================================================ */

document
.querySelectorAll(
".difficulty-button"
)
.forEach(
button => {

        button.addEventListener(
            "click",
            () => {

                const key =
                    button.dataset
                        .difficulty;


                difficultyKey =
                    key;

                difficulty =
                    DIFFICULTIES[
                        key
                    ];


                difficultyBadge.textContent =
                    difficulty.name;


                player1.lives =
                    difficulty.lives;

                player2.lives =
                    difficulty.lives;


                player1.score = 0;

                player2.score = 0;


                player1.alive =
                    true;

                player2.alive =
                    true;


                phaseIndex = 0;


                difficultyScreen
                    .classList
                    .add(
                        "hidden"
                    );


                startPhase();

            }
        );

    }
);

/* ============================================================
BOTÃO REINICIAR
============================================================ */

restartBtn.addEventListener(
"click",
() => {

    difficultyScreen
        .classList
        .remove(
            "hidden"
        );

    phaseScreen
        .classList
        .add(
            "hidden"
        );

    resultScreen
        .classList
        .add(
            "hidden"
        );

    gameRunning =
        false;

    phaseIndex = 0;

    player1.score = 0;
    player2.score = 0;

}

);

/* ============================================================
CONTINUAR
============================================================ */

continueBtn.addEventListener(
"click",
() => {

    startPhase();

}

);

resultBtn.addEventListener(
"click",
() => {

    /*
        Se ainda existem fases,
        avança.
    */

    if (
        phaseIndex <
        PHASES.length - 1 &&
        phaseFinished
    ) {

        nextPhase();

        return;

    }


    /*
        Caso seja game over
        ou final da campanha.
    */

    resultScreen
        .classList
        .add(
            "hidden"
        );

    difficultyScreen
        .classList
        .remove(
            "hidden"
        );

    phaseIndex = 0;

    player1.score = 0;
    player2.score = 0;

    player1.lives =
        difficulty.lives;

    player2.lives =
        difficulty.lives;

    player1.alive =
        true;

    player2.alive =
        true;

    gameRunning =
        false;

}

);

/* ============================================================
CHECAR FASE
============================================================ */

function checkPhaseComplete() {

if (
    remainingItems <= 0
) {

    finishPhase();

}

}

/* ============================================================
UPDATE
============================================================ */

function update() {

if (
    !gameRunning
) {

    return;

}


frame++;


player1.update();

player2.update();


enemies.forEach(
    enemy =>
        enemy.update()
);


updateParticles();


if (
    comboTimer > 0
) {

    comboTimer--;

} else {

    combo = 0;

}


checkPhaseComplete();

updateHUD();


/*
    As teclas "just pressed"
    duram somente um frame.
*/

for (
    const key in justPressed
) {

    delete justPressed[key];

}

}

/* ============================================================
DRAW
============================================================ */

function draw() {

drawBackground();

drawMap();

drawItems();


enemies.forEach(
    enemy =>
        enemy.draw()
);


player1.draw();

player2.draw();


drawParticles();

}

/* ============================================================
LOOP
============================================================ */

function loop() {

update();

draw();

requestAnimationFrame(
    loop
);

}

/* ============================================================
INICIALIZAÇÃO
============================================================ */

difficultyBadge.textContent =
"NORMAL";

updateHUD();

loop();