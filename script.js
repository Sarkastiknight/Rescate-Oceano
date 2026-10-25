// ==========================================
// RESCATE DEL OCÉANO: ECOSISTEMA CON WEBGL & VECTOR ENGINE
// ==========================================

const oceano = document.getElementById("oceano");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d');

const canvasShader = document.getElementById("canvasShader");
const gl = canvasShader ? (canvasShader.getContext("webgl") || canvasShader.getContext("experimental-webgl")) : null;

const toggleBtn = document.getElementById('autoPlanctonToggle');
const modeLabel = document.getElementById('mode-label');

let autoGeneracion = true;
let juegoIniciado = false;

let pecesRescatados = 0;
let basuraRetirada = 0;
let puntos = 0;

let peces = [];
let tiburones = [];
let planctons = [];
let basuras = [];
let ductos = [];
let buzos = [];

if (toggleBtn) {
    toggleBtn.addEventListener('change', (e) => {
        autoGeneracion = e.target.checked;
        modeLabel.innerText = autoGeneracion ? "Auto" : "Manual";
        modeLabel.style.color = autoGeneracion ? "#00c8ff" : "#ff9696";
    });
}

function ajustarCanvas() {
    const w = window.innerWidth;
    const h = window.innerHeight - 55;

    canvas.width = w;
    canvas.height = h;
    
    if (canvasShader) {
        canvasShader.width = w;
        canvasShader.height = h;
        if (gl) gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }
}

window.addEventListener('resize', () => {
    ajustarCanvas();
    generarFondoCorales();
});

// ==========================================
// MOTOR SHADER WEBGL (RAYOS DE LUZ SUBMARINOS)
// ==========================================

let shaderProgram, positionAttributeLocation, resolutionUniformLocation, timeUniformLocation;

function initWebGL() {
    if (!gl) return;

    const vertexShaderSource = `
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    const fragmentShaderSource = `
        precision mediump float;
        uniform vec2 u_resolution;
        uniform float u_time;

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            
            vec3 surfaceColor = vec3(0.02, 0.45, 0.65); 
            vec3 abyssColor = vec3(0.01, 0.04, 0.12);   
            vec3 baseColor = mix(abyssColor, surfaceColor, 1.0 - uv.y);

            float ray = sin((uv.x + uv.y * 0.5 + u_time * 0.04) * 6.0) * 0.5 + 0.5;
            ray *= cos((uv.x * 2.0 - u_time * 0.02) * 4.0) * 0.5 + 0.5;
            
            float intensity = ray * (uv.y * 0.7);
            vec3 finalColor = baseColor + vec3(0.08, 0.25, 0.35) * intensity;

            gl_FragColor = vec4(finalColor, 1.0);
        }
    `;

    const vShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vShader, vertexShaderSource);
    gl.compileShader(vShader);

    const fShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fShader, fragmentShaderSource);
    gl.compileShader(fShader);

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vShader);
    gl.attachShader(shaderProgram, fShader);
    gl.linkProgram(shaderProgram);

    positionAttributeLocation = gl.getAttribLocation(shaderProgram, "a_position");
    resolutionUniformLocation = gl.getUniformLocation(shaderProgram, "u_resolution");
    timeUniformLocation = gl.getUniformLocation(shaderProgram, "u_time");
}

function renderShader(time) {
    if (!gl || !shaderProgram) return;
    
    gl.useProgram(shaderProgram);
    gl.enableVertexAttribArray(positionAttributeLocation);
    
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,  1, -1, -1,  1,
        -1,  1,  1, -1,  1,  1,
    ]), gl.STATIC_DRAW);

    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(resolutionUniformLocation, canvasShader.width, canvasShader.height);
    gl.uniform1f(timeUniformLocation, time * 0.001);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// --- FONDO FRACTAL (Corales recursivos) ---
const fondoCanvas = document.createElement('canvas');
const fCtx = fondoCanvas.getContext('2d');

function generarFondoCorales() {
    fondoCanvas.width = canvas.width;
    fondoCanvas.height = canvas.height;
    
    fCtx.clearRect(0, 0, fondoCanvas.width, fondoCanvas.height);

    function dibujarCoral(x, y, longitud, angulo, profundidad) {
        if (profundidad === 0) return;
        const xFin = x + Math.cos(angulo) * longitud;
        const yFin = y + Math.sin(angulo) * longitud;

        fCtx.strokeStyle = `rgb(${220 - profundidad * 15}, ${80 + profundidad * 12}, ${130 + profundidad * 10})`;
        fCtx.lineWidth = Math.max(1, profundidad * 1.2);
        fCtx.lineCap = 'round';
        fCtx.beginPath();
        fCtx.moveTo(x, y);
        fCtx.lineTo(xFin, yFin);
        fCtx.stroke();

        const anguloDiff = 0.35 + Math.random() * 0.1;
        const reduccion = 0.75;
        dibujarCoral(xFin, yFin, longitud * reduccion, angulo - anguloDiff, profundidad - 1);
        dibujarCoral(xFin, yFin, longitud * reduccion, angulo + anguloDiff, profundidad - 1);
    }

    const numeroCorales = Math.max(4, Math.floor(fondoCanvas.width / 220));
    const espacio = fondoCanvas.width / numeroCorales;
    for (let i = 0; i < numeroCorales; i++) {
        let baseX = espacio * i + espacio / 2 + (Math.random() * 40 - 20);
        dibujarCoral(baseX, fondoCanvas.height, 80 + Math.random() * 40, -Math.PI / 2, 7);
    }
}

// ==========================================
// PECES ESPECIALES - CONCIENCIA MARINA
// ==========================================

const animalesEspeciales = [
    {
        emoji: "🐬",
        nombre: "Delfín",
        texto: "Los delfines son mamíferos marinos vitales para mantener el equilibrio de las poblaciones oceánicas.",
        dato: "🌊 Impacto Ambiental: Múltiples delfines mueren al año atrapados en redes de pesca abandonadas y por ingerir plásticos flotantes."
    },
    {
        emoji: "🐢",
        nombre: "Tortuga marina",
        texto: "Navegan miles de kilómetros y ayudan a mantener sanos los arrecifes de coral y los pastos marinos.",
        dato: "⚠️ Conciencia Marina: Más del 52% de las tortugas marinas del mundo han ingerido residuos plásticos al confundir las bolsas con medusas."
    },
    {
        emoji: "🐙",
        nombre: "Pulpo",
        texto: "Son depredadores esenciales en el bentos marino y destacan por su altísima inteligencia.",
        dato: "🚫 Alerta Ecológica: La acidificación del agua y la microcontaminación alteran seriamente el desarrollo de sus crías."
    },
    {
        emoji: "🦈",
        nombre: "Tiburón",
        texto: "Como superdepredadores, regulan la salud del ecosistema eliminando peces enfermos o débiles.",
        dato: "🛡️ Protección Marina: La sobrepesca elimina más de 100 millones de tiburones al año, lo que causa el colapso de las redes tróficas del océano."
    },
    {
        emoji: "🐳",
        nombre: "Ballena",
        texto: "Sus heces fertilizan el fitoplancton, el cual produce más del 50% del oxígeno del planeta.",
        dato: "🌍 Impacto Global: Una sola ballena captura en promedio 33 toneladas de CO2 a lo largo de su vida, ayudando a frenar el cambio climático."
    }
];

// ==========================================
// CLASES DE AGENTES VECTORIALES
// ==========================================

class Plancton {
    constructor(x, y) {
        this.x = x !== undefined ? x : Math.random() * canvas.width;
        this.y = y !== undefined ? y : Math.random() * (canvas.height - 50);
    }
    actualizar() {
        this.y -= 0.3;
        if (this.y < 0) this.y = canvas.height;
    }
    dibujar() {
        ctx.fillStyle = '#64ffda';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

class BasuraVectorial {
    constructor(x, y) {
        this.x = x || Math.random() * (canvas.width - 60) + 30;
        this.y = y || Math.random() * (canvas.height - 180) + 40;
        this.tipo = Math.floor(Math.random() * 3);
        this.wobble = Math.random() * Math.PI;
    }
    actualizar() {
        this.wobble += 0.03;
        this.y += Math.sin(this.wobble) * 0.15;
    }
    dibujar() {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.tipo === 0) {
            ctx.fillStyle = 'rgba(220, 240, 255, 0.8)';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.fillRect(-10, -12, 20, 24);
            ctx.strokeRect(-10, -12, 20, 24);
        } else if (this.tipo === 1) {
            ctx.fillStyle = 'rgba(100, 220, 200, 0.85)';
            ctx.fillRect(-5, -15, 10, 24);
            ctx.fillStyle = '#ff3333';
            ctx.fillRect(-3, -19, 6, 4);
        } else {
            ctx.strokeStyle = '#e0a96d';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-12, -12, 24, 24);
            ctx.beginPath();
            ctx.moveTo(-12, -12); ctx.lineTo(12, 12);
            ctx.moveTo(12, -12); ctx.lineTo(-12, 12);
            ctx.stroke();
        }
        ctx.restore();
    }
}

class DuctoDañado {
    constructor(x) {
        this.x = x;
        this.y = canvas.height - 35;
        this.clicsRestantes = 3;
    }
    dibujar() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#495057';
        ctx.fillRect(-18, -10, 36, 20);
        ctx.fillStyle = '#adb5bd';
        ctx.fillRect(-20, -15, 40, 6);
        ctx.font = "20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🛢️", 0, -18);
        
        ctx.fillStyle = '#ff4d4d';
        ctx.font = "bold 11px sans-serif";
        ctx.fillText(`Clics: ${this.clicsRestantes}`, 0, 18);
        ctx.restore();
    }
}

class BuzoVectorial {
    constructor(x, y) {
        this.x = x || Math.random() * canvas.width;
        this.y = y || Math.random() * (canvas.height - 100);
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.maxSpeed = 1.8;
    }

    actualizar(tiburonesLista) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 30) this.vx += 0.1;
        if (this.x > canvas.width - 30) this.vx -= 0.1;
        if (this.y < 30) this.vy += 0.1;
        if (this.y > canvas.height - 50) this.vy -= 0.1;

        if (tiburonesLista.length > 0) {
            let tiburonCercano = tiburonesLista.reduce((prev, curr) => 
                Math.hypot(this.x - curr.x, this.y - curr.y) < Math.hypot(this.x - prev.x, this.y - prev.y) ? curr : prev
            );
            let dist = Math.hypot(this.x - tiburonCercano.x, this.y - tiburonCercano.y);
            if (dist < 300) {
                this.vx += (tiburonCercano.x - this.x) / dist * 0.12;
                this.vy += (tiburonCercano.y - this.y) / dist * 0.12;
            }
        }

        let speed = Math.hypot(this.vx, this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }
    }

    dibujar() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.font = "22px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🤿", 0, 0);
        ctx.restore();
    }
}

class PezVectorial {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2.5;
        this.vy = (Math.random() - 0.5) * 2.5;
        this.maxSpeed = 2.8;
        this.tailPhase = Math.random() * Math.PI * 2;
        this.hue = 170 + Math.random() * 40;
        this.scale = 0.85 + Math.random() * 0.3;
        this.atrapado = false;
        
        if (Math.random() < 0.20) {
            this.especial = true;
            this.info = animalesEspeciales[Math.floor(Math.random() * animalesEspeciales.length)];
        } else {
            this.especial = false;
        }
    }

    actualizar(pecesLista, planctonLista, tiburonesLista) {
        if (this.atrapado) return;

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 30) this.vx += 0.2;
        if (this.x > canvas.width - 30) this.vx -= 0.2;
        if (this.y < 30) this.vy += 0.2;
        if (this.y > canvas.height - 50) this.vy -= 0.2;

        let sepX = 0, sepY = 0, count = 0;
        for (let otro of pecesLista) {
            let dist = Math.hypot(this.x - otro.x, this.y - otro.y);
            if (dist > 0 && dist < 25) {
                sepX += (this.x - otro.x) / (dist * dist);
                sepY += (this.y - otro.y) / (dist * dist);
                count++;
            }
        }
        if (count > 0) {
            this.vx += sepX * 0.4;
            this.vy += sepY * 0.4;
        }

        for (let tiburon of tiburonesLista) {
            let distTiburon = Math.hypot(this.x - tiburon.x, this.y - tiburon.y);
            if (distTiburon < 160) {
                this.vx += (this.x - tiburon.x) / distTiburon * 0.5;
                this.vy += (this.y - tiburon.y) / distTiburon * 0.5;
            }
        }

        if (planctonLista.length > 0) {
            let cercano = planctonLista.reduce((prev, curr) => 
                Math.hypot(this.x - curr.x, this.y - curr.y) < Math.hypot(this.x - prev.x, this.y - prev.y) ? curr : prev
            );
            let distCercano = Math.hypot(this.x - cercano.x, this.y - cercano.y);
            if (distCercano < 140) {
                this.vx += (cercano.x - this.x) / distCercano * 0.18;
                this.vy += (cercano.y - this.y) / distCercano * 0.18;

                if (distCercano < 12) {
                    let index = planctonLista.indexOf(cercano);
                    if (index > -1) planctonLista.splice(index, 1);
                }
            }
        }

        let speed = Math.hypot(this.vx, this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }
        this.tailPhase += speed * 0.15;
    }

    dibujar() {
        let angle = Math.atan2(this.vy, this.vx);
        let tailSwing = this.atrapado ? Math.sin(Date.now() * 0.02) * 4 : Math.sin(this.tailPhase) * 6;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        ctx.scale(this.scale, this.scale);

        if (this.atrapado) {
            ctx.globalAlpha = 0.4;
        }

        if (this.especial) {
            ctx.fillStyle = '#ffb703';
            ctx.beginPath();
            ctx.arc(0, 0, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = "14px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.info.emoji, 0, 1);
        } else {
            ctx.fillStyle = `hsl(${this.hue}, 90%, 45%)`;
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(-20, -7 + tailSwing);
            ctx.quadraticCurveTo(-14, tailSwing, -20, 7 + tailSwing);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = `hsl(${this.hue}, 85%, 55%)`;
            ctx.beginPath();
            ctx.moveTo(14, 0);
            ctx.bezierCurveTo(4, -9, -9, -7, -12, 0);
            ctx.bezierCurveTo(-9, 7, 4, 9, 14, 0);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(8, -2.5, 2.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(8.6, -2.5, 1, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

class TiburonVectorial {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.maxSpeed = 2.2;
        this.tailPhase = Math.random() * Math.PI * 2;
    }

    actualizar(pecesLista, buzosLista) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 50) this.vx += 0.15;
        if (this.x > canvas.width - 50) this.vx -= 0.15;
        if (this.y < 50) this.vy += 0.15;
        if (this.y > canvas.height - 60) this.vy -= 0.15;

        for (let buzo of buzosLista) {
            let distBuzo = Math.hypot(this.x - buzo.x, this.y - buzo.y);
            if (distBuzo < 200) {
                this.vx += (this.x - buzo.x) / distBuzo * 0.25;
                this.vy += (this.y - buzo.y) / distBuzo * 0.25;
            }
        }

        let pecesLibres = pecesLista.filter(p => !p.atrapado);
        if (pecesLibres.length > 0) {
            let presa = pecesLibres.reduce((prev, curr) => 
                Math.hypot(this.x - curr.x, this.y - curr.y) < Math.hypot(this.x - prev.x, this.y - prev.y) ? curr : prev
            );
            let distPresa = Math.hypot(this.x - presa.x, this.y - presa.y);
            if (distPresa < 260) {
                this.vx += (presa.x - this.x) / distPresa * 0.16;
                this.vy += (presa.y - this.y) / distPresa * 0.16;

                if (distPresa < 18) {
                    let index = pecesLista.indexOf(presa);
                    if (index > -1) {
                        pecesLista.splice(index, 1);
                        pecesLista.push(new PezVectorial(Math.random() * canvas.width, Math.random() * canvas.height));
                    }
                }
            }
        }

        let speed = Math.hypot(this.vx, this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }
        this.tailPhase += speed * 0.12;
    }

    dibujar() {
        let angle = Math.atan2(this.vy, this.vx);
        let tailSwing = Math.sin(this.tailPhase) * 8;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);

        ctx.fillStyle = '#3a4b5c';
        ctx.beginPath();
        ctx.moveTo(-28, 0);
        ctx.lineTo(-48, -18 + tailSwing);
        ctx.quadraticCurveTo(-38, tailSwing, -44, 12 + tailSwing);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-2, -12);
        ctx.quadraticCurveTo(-12, -30, -22, -22);
        ctx.lineTo(-15, -8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#4f6378';
        ctx.beginPath();
        ctx.moveTo(35, 0);
        ctx.bezierCurveTo(18, -16, -18, -14, -30, 0);
        ctx.bezierCurveTo(-18, 14, 18, 16, 35, 0);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#bfcedb';
        ctx.beginPath();
        ctx.moveTo(35, 0);
        ctx.bezierCurveTo(15, 2, -10, 4, -30, 0);
        ctx.bezierCurveTo(-18, 12, 18, 14, 35, 0);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(22, -4, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ==========================================
// COMENZAR JUEGO
// ==========================================

function comenzarJuego() {
    const inicioEl = document.getElementById("inicio");
    if (inicioEl) inicioEl.style.display = "none";
    
    ajustarCanvas();
    initWebGL();
    generarFondoCorales();
    
    ductos.push(new DuctoDañado(Math.random() * (canvas.width - 150) + 75));
    
    juegoIniciado = true;

    for (let i = 0; i < 22; i++) {
        peces.push(new PezVectorial(Math.random() * canvas.width, Math.random() * canvas.height));
    }
    for (let i = 0; i < 2; i++) {
        tiburones.push(new TiburonVectorial(Math.random() * canvas.width, Math.random() * canvas.height));
    }
    for (let i = 0; i < 2; i++) {
        buzos.push(new BuzoVectorial(Math.random() * canvas.width, Math.random() * canvas.height));
    }
    for (let i = 0; i < 25; i++) {
        planctons.push(new Plancton());
    }

    setInterval(function () {
        if (juegoIniciado && basuras.length < 18) {
            basuras.push(new BasuraVectorial());
        }
    }, 2500);

    setInterval(function () {
        if (juegoIniciado && ductos.length > 0) {
            ductos.forEach(d => {
                basuras.push(new BasuraVectorial(d.x + (Math.random() * 40 - 20), d.y - 20));
            });
        }
    }, 4000);

    setInterval(function () {
        if (juegoIniciado && buzos.length < 3) {
            buzos.push(new BuzoVectorial(Math.random() * canvas.width, 50));
            mostrarMensaje("⚠️ ¡Un buzo cazador ha entrado al océano!");
        }
    }, 15000);

    animar(0);
}

// ==========================================
// INTERACCIÓN DE CLIC
// ==========================================

canvas.addEventListener('click', (e) => {
    if (!juegoIniciado) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let buzoEliminado = false;
    buzos.forEach((buzo, index) => {
        let dist = Math.hypot(mouseX - buzo.x, mouseY - buzo.y);
        if (dist < 28) {
            buzoEliminado = true;
            buzos.splice(index, 1);
            puntos += 30;
            actualizarHUD();
            mostrarMensaje("🤿 ¡Buzo cazador alejado! +30 ⭐");
        }
    });
    if (buzoEliminado) return;

    let ductoClickeado = false;
    ductos.forEach((ducto, index) => {
        let dist = Math.hypot(mouseX - ducto.x, mouseY - ducto.y);
        if (dist < 35) {
            ductoClickeado = true;
            ducto.clicsRestantes--;
            if (ducto.clicsRestantes > 0) {
                mostrarMensaje(`⚠️ ¡Reparando derrame! Faltan ${ducto.clicsRestantes} clics.`);
            } else {
                ductos.splice(index, 1);
                puntos += 100;
                actualizarHUD();
                mostrarMensaje("✅ ¡Ducto sellado con éxito! +100 ⭐");
            }
        }
    });
    if (ductoClickeado) return;

    let basuraEliminada = false;
    basuras.forEach((basura, index) => {
        let dist = Math.hypot(mouseX - basura.x, mouseY - basura.y);
        if (dist < 28) {
            basuraEliminada = true;
            liberarPezCercano(basura.x, basura.y);
            basuras.splice(index, 1);

            basuraRetirada++;
            puntos += 10;
            actualizarHUD();
            mostrarMensaje("🗑️ ¡Basura retirada! +10 ⭐");
        }
    });
    if (basuraEliminada) return;

    for (let i = 0; i < 8; i++) {
        let offsetX = (Math.random() - 0.5) * 40;
        let offsetY = (Math.random() - 0.5) * 40;
        planctons.push(new Plancton(mouseX + offsetX, mouseY + offsetY));
    }
});

// ==========================================
// COMPROBAR COLISIONES
// ==========================================

setInterval(function () {
    if (!juegoIniciado) return;

    peces.forEach(function (pez) {
        if (pez.atrapado) return;

        basuras.forEach(function (basura) {
            let dist = Math.hypot(pez.x - basura.x, pez.y - basura.y);
            if (dist < 25) {
                pez.atrapado = true;
                mostrarMensaje("😢 ¡Un pez quedó atrapado en la basura!");
            }
        });
    });
}, 150);

// ==========================================
// LIBERAR PEZ
// ==========================================

function liberarPezCercano(bx, by) {
    peces.forEach(function (pez) {
        if (!pez.atrapado) return;

        let dist = Math.hypot(pez.x - bx, pez.y - by);
        if (dist < 90) {
            pez.atrapado = false;
            pez.vx = (Math.random() - 0.5) * 3;
            pez.vy = (Math.random() - 0.5) * 3;

            pecesRescatados++;
            puntos += 50;
            actualizarHUD();

            if (pez.especial) {
                mostrarInformacion(pez.info);
            } else {
                mostrarMensaje("🐟 ¡Pez rescatado! +50 ⭐");
            }
        }
    });
}

// ==========================================
// BUCLE PRINCIPAL DE ANIMACIÓN
// ==========================================

function animar(timestamp) {
    if (!juegoIniciado) return;

    if (gl) {
        renderShader(timestamp);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.drawImage(fondoCanvas, 0, 0);

    for (let p of planctons) {
        p.actualizar();
        p.dibujar();
    }

    for (let b of basuras) {
        b.actualizar();
        b.dibujar();
    }

    for (let d of ductos) {
        d.dibujar();
    }

    for (let buzo of buzos) {
        buzo.actualizar(tiburones);
        buzo.dibujar();
    }

    for (let pez of peces) {
        pez.actualizar(peces, planctons, tiburones);
        pez.dibujar();
    }

    for (let tiburon of tiburones) {
        tiburon.actualizar(peces, buzos);
        tiburon.dibujar();
    }

    if (autoGeneracion) {
        if (planctons.length < 35 && Math.random() < 0.12) {
            planctons.push(new Plancton());
        }
    }

    if (peces.length < 15) {
        peces.push(new PezVectorial(Math.random() * canvas.width, Math.random() * canvas.height));
    }

    requestAnimationFrame(animar);
}

// ==========================================
// UTILIDADES Y MODALES
// ==========================================

function actualizarHUD() {
    const rEl = document.getElementById("rescatados");
    const bEl = document.getElementById("basura");
    const pEl = document.getElementById("puntos");
    if (rEl) rEl.textContent = pecesRescatados;
    if (bEl) bEl.textContent = basuraRetirada;
    if (pEl) pEl.textContent = puntos;
}

function mostrarMensaje(texto) {
    const mensaje = document.getElementById("mensaje");
    if (!mensaje) return;
    mensaje.textContent = texto;
    mensaje.style.display = "block";

    clearTimeout(mensaje.temporizador);
    mensaje.temporizador = setTimeout(function () {
        mensaje.style.display = "none";
    }, 2000);
}

function mostrarInformacion(info) {
    const emojiEl = document.getElementById("infoEmoji");
    const tituloEl = document.getElementById("infoTitulo");
    const textoEl = document.getElementById("infoTexto");
    const datoEl = document.getElementById("infoDato");
    const especialEl = document.getElementById("infoEspecial");

    if (emojiEl) emojiEl.textContent = info.emoji;
    if (tituloEl) tituloEl.textContent = info.nombre;
    if (textoEl) textoEl.textContent = info.texto;
    if (datoEl) datoEl.textContent = info.dato;
    if (especialEl) especialEl.style.display = "flex";
}

function cerrarInformacion() {
    const especialEl = document.getElementById("infoEspecial");
    if (especialEl) especialEl.style.display = "none";
}
