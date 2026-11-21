// ==========================================
// RESCATE DEL OCÉANO: MOTOR VECTORIAL MEJORADO
// ==========================================

const oceano = document.getElementById("oceano");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const toggleBtn = document.getElementById("autoPlanctonToggle");
const modeLabel = document.getElementById("mode-label");

let autoGeneracion = true;
let juegoIniciado = false;
let pausado = false;
let animFrameId = null;
let intervalosActivos = [];

let pecesRescatados = 0;
let basuraRetirada = 0;
let puntos = 0;
let nivelActual = 1;

let peces = [];
let tiburones = [];
let planctons = [];
let basuras = [];
let ductos = [];
let buzos = [];
let particulas = [];

toggleBtn.addEventListener("change", (e) => {
    autoGeneracion = e.target.checked;
    modeLabel.innerText = autoGeneracion ? "Auto" : "Manual";
    modeLabel.style.color = autoGeneracion ? "#00c8ff" : "#ff9696";
});

function ajustarCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = Math.max(200, window.innerHeight - 55);
}

window.addEventListener("resize", () => {
    ajustarCanvas();
    generarFondoCorales();
    for (let d of ductos) {
        d.y = canvas.height - 35;
        d.x = Math.min(Math.max(75, d.x), canvas.width - 75);
    }
});

// --- FONDO FRACTAL (Corales recursivos) ---
const fondoCanvas = document.createElement("canvas");
const fCtx = fondoCanvas.getContext("2d");

function generarFondoCorales() {
    fondoCanvas.width = canvas.width;
    fondoCanvas.height = canvas.height;

    const gradient = fCtx.createLinearGradient(0, 0, 0, fondoCanvas.height);
    gradient.addColorStop(0, "#04132b");
    gradient.addColorStop(0.55, "#051a36");
    gradient.addColorStop(1, "#020a17");
    fCtx.fillStyle = gradient;
    fCtx.fillRect(0, 0, fondoCanvas.width, fondoCanvas.height);

    // Rayos de luz sutiles en Canvas 2D
    fCtx.save();
    fCtx.globalAlpha = 0.045;
    fCtx.fillStyle = "#90e0ef";
    for (let r = 0; r < 5; r++) {
        const baseRayX = (fondoCanvas.width / 5) * r + 40;
        fCtx.beginPath();
        fCtx.moveTo(baseRayX, 0);
        fCtx.lineTo(baseRayX + 90, 0);
        fCtx.lineTo(baseRayX + 210, fondoCanvas.height);
        fCtx.lineTo(baseRayX + 95, fondoCanvas.height);
        fCtx.closePath();
        fCtx.fill();
    }
    fCtx.restore();

    function dibujarCoral(x, y, longitud, angulo, profundidad) {
        if (profundidad === 0) return;
        const xFin = x + Math.cos(angulo) * longitud;
        const yFin = y + Math.sin(angulo) * longitud;

        fCtx.strokeStyle = `rgb(${220 - profundidad * 15}, ${80 + profundidad * 12}, ${130 + profundidad * 10})`;
        fCtx.lineWidth = Math.max(1, profundidad * 1.2);
        fCtx.lineCap = "round";
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
        const baseX = espacio * i + espacio / 2 + (Math.random() * 40 - 20);
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
// CLASES DE AGENTES VECTORIALES Y EFECTOS
// ==========================================

class ParticulaVectorial {
    constructor(x, y, color = "#90e0ef", radio = 3.5) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2.4;
        this.vy = -0.6 - Math.random() * 1.8;
        this.color = color;
        this.radio = radio;
        this.vida = 1.0;
    }

    actualizar() {
        this.x += this.vx;
        this.y += this.vy;
        this.vida -= 0.025;
    }

    dibujar() {
        if (this.vida <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.vida);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

class Plancton {
    constructor(x, y) {
        this.x = x !== undefined ? x : Math.random() * canvas.width;
        this.y = y !== undefined ? y : Math.random() * (canvas.height - 50);
    }

    actualizar() {
        this.y -= 0.32;
        this.x += Math.sin(this.y * 0.03) * 0.25;
        if (this.y < 0) this.y = canvas.height;
    }

    dibujar() {
        ctx.fillStyle = "#64ffda";
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

class BasuraVectorial {
    constructor(x, y) {
        this.x = x || Math.random() * (canvas.width - 80) + 40;
        this.y = y || Math.random() * (canvas.height - 190) + 45;
        this.tipo = Math.floor(Math.random() * 3);
        this.wobble = Math.random() * Math.PI * 2;
    }

    actualizar() {
        this.wobble += 0.03;
        this.y += Math.sin(this.wobble) * 0.18;
    }

    dibujar() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.sin(this.wobble) * 0.12);
        if (this.tipo === 0) {
            ctx.fillStyle = "rgba(220, 240, 255, 0.8)";
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.2;
            ctx.fillRect(-10, -12, 20, 24);
            ctx.strokeRect(-10, -12, 20, 24);
        } else if (this.tipo === 1) {
            ctx.fillStyle = "rgba(100, 220, 200, 0.85)";
            ctx.fillRect(-5, -15, 10, 24);
            ctx.fillStyle = "#ff4d4d";
            ctx.fillRect(-3, -19, 6, 4);
        } else {
            ctx.strokeStyle = "#e0a96d";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-12, -12, 24, 24);
            ctx.beginPath();
            ctx.moveTo(-12, -12);
            ctx.lineTo(12, 12);
            ctx.moveTo(12, -12);
            ctx.lineTo(-12, 12);
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
        ctx.fillStyle = "#495057";
        ctx.fillRect(-18, -10, 36, 20);
        ctx.fillStyle = "#adb5bd";
        ctx.fillRect(-20, -15, 40, 6);
        ctx.font = "20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🛢️", 0, -18);

        ctx.fillStyle = "#ff6b6b";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText(`Clics: ${this.clicsRestantes}`, 0, 18);
        ctx.restore();
    }
}

class BuzoVectorial {
    constructor(x, y) {
        this.x = x || Math.random() * canvas.width;
        this.y = y || Math.random() * (canvas.height - 120) + 40;
        this.vx = (Math.random() - 0.5) * 1.6;
        this.vy = (Math.random() - 0.5) * 1.6;
        this.maxSpeed = 1.85 + (nivelActual - 1) * 0.12;
    }

    actualizar(tiburonesLista) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 30) this.vx += 0.12;
        if (this.x > canvas.width - 30) this.vx -= 0.12;
        if (this.y < 30) this.vy += 0.12;
        if (this.y > canvas.height - 55) this.vy -= 0.12;

        if (tiburonesLista.length > 0) {
            const tiburonCercano = tiburonesLista.reduce((prev, curr) =>
                Math.hypot(this.x - curr.x, this.y - curr.y) < Math.hypot(this.x - prev.x, this.y - prev.y) ? curr : prev
            );
            const dist = Math.hypot(this.x - tiburonCercano.x, this.y - tiburonCercano.y);
            if (dist < 320 && dist > 1) {
                this.vx += ((tiburonCercano.x - this.x) / dist) * 0.13;
                this.vy += ((tiburonCercano.y - this.y) / dist) * 0.13;
            }
        }

        const speed = Math.hypot(this.vx, this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }
    }

    dibujar() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.strokeStyle = "rgba(255, 107, 107, 0.35)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.stroke();

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
        this.hue = 170 + Math.random() * 45;
        this.scale = 0.85 + Math.random() * 0.3;
        this.atrapado = false;

        if (Math.random() < 0.22) {
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
            const dist = Math.hypot(this.x - otro.x, this.y - otro.y);
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
            const distTiburon = Math.hypot(this.x - tiburon.x, this.y - tiburon.y);
            if (distTiburon < 160 && distTiburon > 1) {
                this.vx += ((this.x - tiburon.x) / distTiburon) * 0.5;
                this.vy += ((this.y - tiburon.y) / distTiburon) * 0.5;
            }
        }

        if (planctonLista.length > 0) {
            const cercano = planctonLista.reduce((prev, curr) =>
                Math.hypot(this.x - curr.x, this.y - curr.y) < Math.hypot(this.x - prev.x, this.y - prev.y) ? curr : prev
            );
            const distCercano = Math.hypot(this.x - cercano.x, this.y - cercano.y);
            if (distCercano < 145 && distCercano > 0.1) {
                this.vx += ((cercano.x - this.x) / distCercano) * 0.18;
                this.vy += ((cercano.y - this.y) / distCercano) * 0.18;

                if (distCercano < 12) {
                    const index = planctonLista.indexOf(cercano);
                    if (index > -1) planctonLista.splice(index, 1);
                }
            }
        }

        const speed = Math.hypot(this.vx, this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }
        this.tailPhase += speed * 0.15;
    }

    dibujar() {
        const angle = Math.atan2(this.vy, this.vx);
        const tailSwing = this.atrapado ? Math.sin(Date.now() * 0.02) * 4 : Math.sin(this.tailPhase) * 6;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        ctx.scale(this.scale, this.scale);

        if (this.atrapado) {
            ctx.globalAlpha = 0.45;
        }

        if (this.especial) {
            ctx.fillStyle = "#ffb703";
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

            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(8, -2.5, 2.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#000000";
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
            const distBuzo = Math.hypot(this.x - buzo.x, this.y - buzo.y);
            if (distBuzo < 200 && distBuzo > 1) {
                this.vx += ((this.x - buzo.x) / distBuzo) * 0.25;
                this.vy += ((this.y - buzo.y) / distBuzo) * 0.25;
            }
        }

        const pecesLibres = pecesLista.filter((p) => !p.atrapado);
        if (pecesLibres.length > 0) {
            const presa = pecesLibres.reduce((prev, curr) =>
                Math.hypot(this.x - curr.x, this.y - curr.y) < Math.hypot(this.x - prev.x, this.y - prev.y) ? curr : prev
            );
            const distPresa = Math.hypot(this.x - presa.x, this.y - presa.y);
            if (distPresa < 260 && distPresa > 1) {
                this.vx += ((presa.x - this.x) / distPresa) * 0.16;
                this.vy += ((presa.y - this.y) / distPresa) * 0.16;

                if (distPresa < 18) {
                    const index = pecesLista.indexOf(presa);
                    if (index > -1) {
                        pecesLista.splice(index, 1);
                        pecesLista.push(new PezVectorial(Math.random() * canvas.width, Math.random() * canvas.height));
                    }
                }
            }
        }

        const speed = Math.hypot(this.vx, this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }
        this.tailPhase += speed * 0.12;
    }

    dibujar() {
        const angle = Math.atan2(this.vy, this.vx);
        const tailSwing = Math.sin(this.tailPhase) * 8;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);

        ctx.fillStyle = "#3a4b5c";
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

        ctx.fillStyle = "#4f6378";
        ctx.beginPath();
        ctx.moveTo(35, 0);
        ctx.bezierCurveTo(18, -16, -18, -14, -30, 0);
        ctx.bezierCurveTo(-18, 14, 18, 16, 35, 0);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#bfcedb";
        ctx.beginPath();
        ctx.moveTo(35, 0);
        ctx.bezierCurveTo(15, 2, -10, 4, -30, 0);
        ctx.bezierCurveTo(-18, 12, 18, 14, 35, 0);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#111111";
        ctx.beginPath();
        ctx.arc(22, -4, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ==========================================
// GESTIÓN DE PARTIDAS, PAUSA Y REINICIO
// ==========================================

function limpiarIntervalos() {
    intervalosActivos.forEach((id) => clearInterval(id));
    intervalosActivos = [];
}

function crearRafagaBurbujas(x, y, cantidad = 10, color = "#90e0ef") {
    for (let i = 0; i < cantidad; i++) {
        particulas.push(new ParticulaVectorial(x, y, color, 2 + Math.random() * 3.5));
    }
}

function evaluarNivel() {
    const nuevoNivel = Math.floor(puntos / 250) + 1;
    if (nuevoNivel > nivelActual) {
        nivelActual = nuevoNivel;
        actualizarHUD();
        mostrarMensaje(`📈 ¡Subiste al Nivel ${nivelActual}!`);
    }
}

function comenzarJuego() {
    document.getElementById("inicio").style.display = "none";
    limpiarIntervalos();
    if (animFrameId) cancelAnimationFrame(animFrameId);

    pecesRescatados = 0;
    basuraRetirada = 0;
    puntos = 0;
    nivelActual = 1;
    pausado = false;
    document.getElementById("btnPausa").textContent = "⏸️ Pausar";
    actualizarHUD();

    peces = [];
    tiburones = [];
    planctons = [];
    basuras = [];
    ductos = [];
    buzos = [];
    particulas = [];

    ajustarCanvas();
    generarFondoCorales();

    ductos.push(new DuctoDañado(Math.random() * Math.max(150, canvas.width - 150) + 75));

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

    juegoIniciado = true;

    intervalosActivos.push(
        setInterval(() => {
            if (!juegoIniciado || pausado) return;
            const maxBasura = Math.min(24, 16 + nivelActual * 2);
            if (basuras.length < maxBasura) {
                basuras.push(new BasuraVectorial());
            }
        }, 2500)
    );

    intervalosActivos.push(
        setInterval(() => {
            if (!juegoIniciado || pausado) return;
            ductos.forEach((d) => {
                if (basuras.length < 24) {
                    basuras.push(new BasuraVectorial(d.x + (Math.random() * 40 - 20), d.y - 22));
                }
            });
            if (ductos.length === 0 && Math.random() < 0.45) {
                ductos.push(new DuctoDañado(Math.random() * Math.max(150, canvas.width - 150) + 75));
                mostrarMensaje("🛢️ ¡Se abrió un nuevo ducto petrolero!");
            }
        }, 4500)
    );

    intervalosActivos.push(
        setInterval(() => {
            if (!juegoIniciado || pausado) return;
            const maxBuzos = Math.min(5, 2 + Math.floor(nivelActual / 2));
            if (buzos.length < maxBuzos) {
                buzos.push(new BuzoVectorial(Math.random() * canvas.width, 45));
                mostrarMensaje("⚠️ ¡Un buzo cazador ha entrado al océano!");
            }
        }, 14000)
    );

    intervalosActivos.push(
        setInterval(() => {
            if (!juegoIniciado || pausado) return;
            peces.forEach((pez) => {
                if (pez.atrapado) return;
                for (let basura of basuras) {
                    const dist = Math.hypot(pez.x - basura.x, pez.y - basura.y);
                    if (dist < 25) {
                        pez.atrapado = true;
                        mostrarMensaje("😢 ¡Un pez quedó atrapado en la basura!");
                        break;
                    }
                }
            });
        }, 180)
    );

    animar();
}

function alternarPausa() {
    if (!juegoIniciado) return;
    pausado = !pausado;
    const btn = document.getElementById("btnPausa");
    btn.textContent = pausado ? "▶️ Reanudar" : "⏸️ Pausar";
    mostrarMensaje(pausado ? "⏸️ Simulación pausada" : "▶️ Simulación reanudada");
    if (!pausado) animar();
}

function reiniciarJuego() {
    comenzarJuego();
    mostrarMensaje("🔄 Ecosistema reiniciado");
}

// ==========================================
// INTERACCIÓN DE CLIC
// ==========================================

canvas.addEventListener("click", (e) => {
    if (!juegoIniciado || pausado) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 1. Buzos cazadores
    for (let i = 0; i < buzos.length; i++) {
        const buzo = buzos[i];
        if (Math.hypot(mouseX - buzo.x, mouseY - buzo.y) < 28) {
            crearRafagaBurbujas(buzo.x, buzo.y, 12, "#ff6b6b");
            buzos.splice(i, 1);
            puntos += 30;
            evaluarNivel();
            actualizarHUD();
            mostrarMensaje("🤿 ¡Buzo cazador alejado! +30 ⭐");
            return;
        }
    }

    // 2. Ductos dañados
    for (let i = 0; i < ductos.length; i++) {
        const ducto = ductos[i];
        if (Math.hypot(mouseX - ducto.x, mouseY - ducto.y) < 35) {
            ducto.clicsRestantes--;
            crearRafagaBurbujas(ducto.x, ducto.y - 10, 8, "#ffd166");
            if (ducto.clicsRestantes > 0) {
                mostrarMensaje(`⚠️ ¡Reparando ducto! Faltan ${ducto.clicsRestantes} clics.`);
            } else {
                crearRafagaBurbujas(ducto.x, ducto.y - 10, 18, "#06d6a0");
                ductos.splice(i, 1);
                puntos += 100;
                evaluarNivel();
                actualizarHUD();
                mostrarMensaje("✅ ¡Ducto sellado con éxito! +100 ⭐");
            }
            return;
        }
    }

    // 3. Basura
    for (let i = 0; i < basuras.length; i++) {
        const basura = basuras[i];
        if (Math.hypot(mouseX - basura.x, mouseY - basura.y) < 28) {
            crearRafagaBurbujas(basura.x, basura.y, 10, "#90e0ef");
            liberarPezCercano(basura.x, basura.y);
            basuras.splice(i, 1);

            basuraRetirada++;
            puntos += 10;
            evaluarNivel();
            actualizarHUD();
            mostrarMensaje("🗑️ ¡Basura retirada! +10 ⭐");
            return;
        }
    }

    // 4. Plancton manual
    crearRafagaBurbujas(mouseX, mouseY, 5, "#64ffda");
    for (let i = 0; i < 8; i++) {
        const offsetX = (Math.random() - 0.5) * 40;
        const offsetY = (Math.random() - 0.5) * 40;
        planctons.push(new Plancton(mouseX + offsetX, mouseY + offsetY));
    }
});

// ==========================================
// LIBERAR PEZ
// ==========================================

function liberarPezCercano(bx, by) {
    peces.forEach((pez) => {
        if (!pez.atrapado) return;

        const dist = Math.hypot(pez.x - bx, pez.y - by);
        if (dist < 95) {
            pez.atrapado = false;
            pez.vx = (Math.random() - 0.5) * 3;
            pez.vy = (Math.random() - 0.5) * 3;

            crearRafagaBurbujas(pez.x, pez.y, 14, "#ffb703");
            pecesRescatados++;
            puntos += 50;
            evaluarNivel();
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

function animar() {
    if (!juegoIniciado || pausado) return;

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

    for (let i = particulas.length - 1; i >= 0; i--) {
        particulas[i].actualizar();
        particulas[i].dibujar();
        if (particulas[i].vida <= 0) {
            particulas.splice(i, 1);
        }
    }

    if (autoGeneracion) {
        if (planctons.length < 35 && Math.random() < 0.12) {
            planctons.push(new Plancton());
        }
    }

    if (peces.length < 16) {
        peces.push(new PezVectorial(Math.random() * canvas.width, Math.random() * canvas.height));
    }

    animFrameId = requestAnimationFrame(animar);
}

// ==========================================
// UTILIDADES Y MODALES
// ==========================================

function actualizarHUD() {
    document.getElementById("rescatados").textContent = pecesRescatados;
    document.getElementById("basura").textContent = basuraRetirada;
    document.getElementById("puntos").textContent = puntos;
    document.getElementById("nivel").textContent = nivelActual;
}

function mostrarMensaje(texto) {
    const mensaje = document.getElementById("mensaje");
    mensaje.textContent = texto;
    mensaje.style.display = "block";

    clearTimeout(mensaje.temporizador);
    mensaje.temporizador = setTimeout(() => {
        mensaje.style.display = "none";
    }, 2000);
}

function mostrarInformacion(info) {
    document.getElementById("infoEmoji").textContent = info.emoji;
    document.getElementById("infoTitulo").textContent = info.nombre;
    document.getElementById("infoTexto").textContent = info.texto;
    document.getElementById("infoDato").textContent = info.dato;

    document.getElementById("infoEspecial").style.display = "flex";
}

function cerrarInformacion() {
    document.getElementById("infoEspecial").style.display = "none";
}
