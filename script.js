// ==========================================
// RESCATE DEL OCÉANO: ECOSISTEMA VECTORIAL
// ==========================================

const oceano = document.getElementById("oceano");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d');
const toggleBtn = document.getElementById('autoPlanctonToggle');
const modeLabel = document.getElementById('mode-label');

let autoGeneracion = true;
let juegoIniciado = false;

let pecesRescatados = 0;
let basuraRetirada = 0;
let puntos = 0;

// Listas de agentes en la simulación
let peces = [];
let tiburones = [];
let planctons = [];

toggleBtn.addEventListener('change', (e) => {
    autoGeneracion = e.target.checked;
    modeLabel.innerText = autoGeneracion ? "Auto" : "Manual";
    modeLabel.style.color = autoGeneracion ? "#00c8ff" : "#ff9696";
});

function ajustarCanvas() {
    canvas.width = oceano.clientWidth;
    canvas.height = oceano.clientHeight;
}
window.addEventListener('resize', () => {
    ajustarCanvas();
    generarFondoCorales();
});

// --- FONDO FRACTAL (Corales recursivos) ---
const fondoCanvas = document.createElement('canvas');
const fCtx = fondoCanvas.getContext('2d');

function generarFondoCorales() {
    fondoCanvas.width = oceano.clientWidth;
    fondoCanvas.height = oceano.clientHeight;
    
    let gradient = fCtx.createLinearGradient(0, 0, 0, fondoCanvas.height);
    gradient.addColorStop(0, '#020617');
    gradient.addColorStop(0.6, '#051126');
    gradient.addColorStop(1, '#020914');
    fCtx.fillStyle = gradient;
    fCtx.fillRect(0, 0, fondoCanvas.width, fondoCanvas.height);

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
        ctx.fillStyle = '#96ff96';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

class PezVectorial {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2.5;
        this.vy = (Math.random() - 0.5) * 2.5;
        this.maxSpeed = 2.8;
        this.energia = 100;
        this.tailPhase = Math.random() * Math.PI * 2;
        this.hue = 170 + Math.random() * 40;
        this.scale = 0.85 + Math.random() * 0.3;
        this.atrapado = false;
        
        // 20% de probabilidad de ser pez especial
        if (Math.random() < 0.20) {
            this.especial = true;
            this.info = animalesEspeciales[Math.floor(Math.random() * animalesEspeciales.length)];
        } else {
            this.especial = false;
        }
    }

    actualizar(pecesLista, planctonLista, tiburonesLista) {
        if (this.atrapado) return; // Si está atrapado en basura, no se mueve

        this.x += this.vx;
        this.y += this.vy;
        this.energia -= 0.03;

        if (this.x < 30) this.vx += 0.2;
        if (this.x > canvas.width - 30) this.vx -= 0.2;
        if (this.y < 30) this.vy += 0.2;
        if (this.y > canvas.height - 50) this.vy -= 0.2;

        // Comportamiento Boids (Separación)
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

        // Huida de tiburones
        for (let tiburon of tiburonesLista) {
            let distTiburon = Math.hypot(this.x - tiburon.x, this.y - tiburon.y);
            if (distTiburon < 160) {
                this.vx += (this.x - tiburon.x) / distTiburon * 0.5;
                this.vy += (this.y - tiburon.y) / distTiburon * 0.5;
            }
        }

        // Buscar Plancton
        if (planctonLista.length > 0) {
            let cercano = planctonLista.reduce((prev, curr) => 
                Math.hypot(this.x - curr.x, this.y - curr.y) < Math.hypot(this.x - prev.x, this.y - prev.y) ? curr : prev
            );
            let distCercano = Math.hypot(this.x - cercano.x, this.y - cercano.y);
            if (distCercano < 140) {
                this.vx += (cercano.x - this.x) / distCercano * 0.18;
                this.vy += (cercano.y - this.y) / distCercano * 0.18;

                if (distCercano < 12) {
                    this.energia = Math.min(150, this.energia + 40);
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
            ctx.filter = 'grayscale(85%) opacity(0.5)';
        }

        if (this.especial) {
            // Dibujar distintivo para pez especial con icono/emoji central
            ctx.fillStyle = '#ffb703';
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = "16px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.info.emoji, 0, 1);
        } else {
            // Aleta Caudal
            ctx.fillStyle = `hsl(${this.hue}, 90%, 45%)`;
            ctx.beginPath();
            ctx.moveTo(-12, 0);
            ctx.lineTo(-22, -8 + tailSwing);
            ctx.quadraticCurveTo(-16, tailSwing, -22, 8 + tailSwing);
            ctx.closePath();
            ctx.fill();

            // Cuerpo del pez
            ctx.fillStyle = `hsl(${this.hue}, 85%, 55%)`;
            ctx.beginPath();
            ctx.moveTo(15, 0);
            ctx.bezierCurveTo(5, -10, -10, -8, -14, 0);
            ctx.bezierCurveTo(-10, 8, 5, 10, 15, 0);
            ctx.closePath();
            ctx.fill();

            // Ojo
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(9, -3, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(9.8, -3, 1.2, 0, Math.PI * 2);
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
        this.energia = 180;
        this.tailPhase = Math.random() * Math.PI * 2;
    }

    actualizar(pecesLista) {
        this.x += this.vx;
        this.y += this.vy;
        this.energia -= 0.06;

        if (this.x < 50) this.vx += 0.15;
        if (this.x > canvas.width - 50) this.vx -= 0.15;
        if (this.y < 50) this.vy += 0.15;
        if (this.y > canvas.height - 60) this.vy -= 0.15;

        // Cazar peces libres
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
                    this.energia = Math.min(220, this.energia + 60);
                    let index = pecesLista.indexOf(presa);
                    if (index > -1) {
                        pecesLista.splice(index, 1);
                        // Reemplazar pez cazado para mantener equilibrio
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

        // Aleta Caudal
        ctx.fillStyle = '#3a4b5c';
        ctx.beginPath();
        ctx.moveTo(-28, 0);
        ctx.lineTo(-48, -18 + tailSwing);
        ctx.quadraticCurveTo(-38, tailSwing, -44, 12 + tailSwing);
        ctx.closePath();
        ctx.fill();

        // Aleta Dorsal
        ctx.beginPath();
        ctx.moveTo(-2, -12);
        ctx.quadraticCurveTo(-12, -30, -22, -22);
        ctx.lineTo(-15, -8);
        ctx.closePath();
        ctx.fill();

        // Cuerpo Principal
        ctx.fillStyle = '#4f6378';
        ctx.beginPath();
        ctx.moveTo(35, 0);
        ctx.bezierCurveTo(18, -16, -18, -14, -30, 0);
        ctx.bezierCurveTo(-18, 14, 18, 16, 35, 0);
        ctx.closePath();
        ctx.fill();

        // Vientre Claro
        ctx.fillStyle = '#bfcedb';
        ctx.beginPath();
        ctx.moveTo(35, 0);
        ctx.bezierCurveTo(15, 2, -10, 4, -30, 0);
        ctx.bezierCurveTo(-18, 12, 18, 14, 35, 0);
        ctx.closePath();
        ctx.fill();

        // Ojo
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
    ajustarCanvas();
    generarFondoCorales();
    crearDuctoDañado();
    
    document.getElementById("inicio").style.display = "none";
    juegoIniciado = true;

    // Crear agentes iniciales
    for (let i = 0; i < 22; i++) {
        peces.push(new PezVectorial(Math.random() * canvas.width, Math.random() * canvas.height));
    }
    for (let i = 0; i < 2; i++) {
        tiburones.push(new TiburonVectorial(Math.random() * canvas.width, Math.random() * canvas.height));
    }
    for (let i = 0; i < 25; i++) {
        planctons.push(new Plancton());
    }

    // Generar basura periódicamente
    setInterval(function () {
        if (juegoIniciado) crearBasura();
    }, 2000);

    // Bucle principal de animación
    animar();
}

// ==========================================
// CREAR BASURA (Elementos DOM Interactivos)
// ==========================================

function crearBasura() {
    const cantidad = document.querySelectorAll(".basuraObjeto").length;
    if (cantidad >= 20) return;

    const objetos = [
        "imagenes/bolsa.png",
        "imagenes/botella.png",
        "imagenes/lata.png",
        "imagenes/red.png"
    ];

    const basura = document.createElement("div");
    basura.className = "basuraObjeto";

    const imagenBasura = objetos[Math.floor(Math.random() * objetos.length)];
    basura.innerHTML = `<img src="${imagenBasura}" class="imagenBasura" alt="Contaminante">`;

    const ancho = oceano.clientWidth;
    const alto = oceano.clientHeight;

    let posX = Math.random() * (ancho - 60);
    let posY = Math.random() * (alto - 180) + 20;

    basura.style.left = posX + "px";
    basura.style.top = posY + "px";

    basura.addEventListener("click", function (e) {
        e.stopPropagation();
        liberarPezCercano(posX, posY);
        basura.remove();

        basuraRetirada++;
        puntos += 10;
        actualizarHUD();
        mostrarMensaje("🗑️ ¡Basura retirada! +10 ⭐");
    });

    oceano.appendChild(basura);
}

// ==========================================
// COMPROBAR COLISIONES (Peces con Basura)
// ==========================================

setInterval(function () {
    if (!juegoIniciado) return;

    const basuras = document.querySelectorAll(".basuraObjeto");

    peces.forEach(function (pez) {
        if (pez.atrapado) return;

        basuras.forEach(function (basura) {
            const bRect = basura.getBoundingClientRect();
            const oRect = oceano.getBoundingClientRect();

            // Posición relativa dentro del océano
            let bX = bRect.left - oRect.left + bRect.width / 2;
            let bY = bRect.top - oRect.top + bRect.height / 2;

            let dist = Math.hypot(pez.x - bX, pez.y - bY);
            if (dist < 28) {
                pez.atrapado = true;
                mostrarMensaje("😢 ¡Un pez quedó atrapado en la basura!");
            }
        });
    });
}, 150);

// ==========================================
// LIBERAR PEZ AL RETIRAR BASURA
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
// DUCTO PETROLERO DAÑADO
// ==========================================

function crearDuctoDañado() {
    const ducto = document.createElement("div");
    ducto.className = "ductoDañado";
    ducto.innerHTML = "🛢️";
    ducto.style.bottom = "20px";
    ducto.style.left = (Math.random() * (oceano.clientWidth - 100)) + "px";

    let clicsParaReparar = 3;

    ducto.addEventListener("click", function (e) {
        e.stopPropagation();
        clicsParaReparar--;

        if (clicsParaReparar > 0) {
            mostrarMensaje(`⚠️ ¡Reparando derrame! Faltan ${clicsParaReparar} clics.`);
        } else {
            ducto.remove();
            puntos += 100;
            actualizarHUD();
            mostrarMensaje("✅ ¡Ducto sellado! Evitaste el derrame. +100 ⭐");
        }
    });

    const intervaloFuga = setInterval(function () {
        if (!ducto.isConnected) {
            clearInterval(intervaloFuga);
            return;
        }
        crearBasura();
    }, 5000);

    oceano.appendChild(ducto);
}

// ==========================================
// INTERACCIÓN CLIC EN EL OCÉANO (Plancton / Alimento)
// ==========================================

window.addEventListener('click', (e) => {
    if (!juegoIniciado) return;
    if (e.target.closest('#ui-panel') || e.target.closest('header') || e.target.closest('#infoEspecial')) return;

    // Añadir plancton al hacer clic en el lienzo del océano
    const rect = oceano.getBoundingClientRect();
    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        for (let i = 0; i < 8; i++) {
            let offsetX = (Math.random() - 0.5) * 40;
            let offsetY = (Math.random() - 0.5) * 40;
            planctons.push(new Plancton(e.clientX - rect.left + offsetX, e.clientY - rect.top + offsetY));
        }
    }
});

// ==========================================
// BUCLE PRINCIPAL DE ANIMACIÓN
// ==========================================

function animar() {
    if (!juegoIniciado) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar fondo fractal precargado
    ctx.drawImage(fondoCanvas, 0, 0);

    // Actualizar y dibujar Plancton
    for (let p of planctons) {
        p.actualizar();
        p.dibujar();
    }

    // Actualizar y dibujar Peces Vectoriales
    for (let pez of peces) {
        pez.comportamientos(peces, planctons, tiburones);
        pez.actualizar(peces, planctons, tiburones);
        pez.dibujar();
    }

    // Actualizar y dibujar Tiburones Vectoriales
    for (let tiburon of tiburones) {
        tiburon.actualizar(peces);
        tiburon.dibujar();
    }

    // Generación automática de plancton si está activa
    if (autoGeneracion) {
        if (planctons.length < 30 && Math.random() < 0.1) {
            planctons.push(new Plancton());
        }
    }

    // Mantener población mínima de peces
    if (peces.length < 15) {
        peces.push(new PezVectorial(Math.random() * canvas.width, Math.random() * canvas.height));
    }

    requestAnimationFrame(animar);
}

// ==========================================
// UTILIDADES Y MODALES
// ==========================================

function actualizarHUD() {
    document.getElementById("rescatados").textContent = pecesRescatados;
    document.getElementById("basura").textContent = basuraRetirada;
    document.getElementById("puntos").textContent = puntos;
}

function mostrarMensaje(texto) {
    const mensaje = document.getElementById("mensaje");
    mensaje.textContent = texto;
    mensaje.style.display = "block";

    clearTimeout(mensaje.temporizador);
    mensaje.temporizador = setTimeout(function () {
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
