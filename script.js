// ==========================================
// RESCATE DEL OCÉANO
// ==========================================

const oceano = document.getElementById("oceano");

let peces = [];
let pecesRescatados = 0;
let basuraRetirada = 0;
let puntos = 0;
let juegoIniciado = false;


// ==========================================
// PECES ESPECIALES - CONCIENCIA MARINA
// ==========================================

const animalesEspeciales = [
    {
        emoji: "🐬",
        nombre: "Delfín",
        imagen: "imagenes/delfin.png",
        texto: "Los delfines son mamíferos marinos vitales para mantener el equilibrio de las poblaciones oceánicas.",
        dato: "🌊 Impacto Ambiental: Múltiples delfines mueren al año atrapados en redes de pesca abandonadas y por ingerir plásticos flotantes."
    },
    {
        emoji: "🐢",
        nombre: "Tortuga marina",
        imagen: "imagenes/tortuga.png",
        texto: "Navegan miles de kilómetros y ayudan a mantener sanos los arrecifes de coral y los pastos marinos.",
        dato: "⚠️ Conciencia Marina: Más del 52% de las tortugas marinas del mundo han ingerido residuos plásticos al confundir las bolsas con medusas."
    },
    {
        emoji: "🐙",
        nombre: "Pulpo",
        imagen: "imagenes/pulpo.png",
        texto: "Son depredadores esenciales en el bentos marino y destacan por su altísima inteligencia.",
        dato: "🚫 Alerta Ecológica: La acidificación del agua y la microcontaminación alteran seriamente el desarrollo de sus crías."
    },
    {
        emoji: "🦈",
        nombre: "Tiburón",
        imagen: "imagenes/tiburon.png",
        texto: "Como superdepredadores, regulan la salud del ecosistema eliminando peces enfermos o débiles.",
        dato: "🛡️ Protección Marina: La sobrepesca elimina más de 100 millones de tiburones al año, lo que causa el colapso de las redes tróficas del océano."
    },
    {
        emoji: "🐳",
        nombre: "Ballena",
        imagen: "imagenes/ballena.png",
        texto: "Sus heces fertilizan el fitoplancton, el cual produce más del 50% del oxígeno del planeta.",
        dato: "🌍 Impacto Global: Una sola ballena captura en promedio 33 toneladas de CO2 a lo largo de su vida, ayudando a frenar el cambio climático."
    }
];


// ==========================================
// COMENZAR JUEGO
// ==========================================

function comenzarJuego() {
    crearDuctoDañado();
    document.getElementById("inicio").style.display = "none";
    juegoIniciado = true;

    // Crear peces
    for (let i = 0; i < 25; i++) {
        crearPez();
    }

    // Crear basura inicial
    for (let i = 0; i < 8; i++) {
        crearBasura();
    }

    // Aparece basura constantemente
    setInterval(function () {
        crearBasura();
    }, 1500);

    // Iniciar movimiento
    requestAnimationFrame(moverPeces);
}


// ==========================================
// CREAR PEZ
// ==========================================

function crearPez() {
    const pez = document.createElement("div");
    pez.className = "pez";

    const ancho = oceano.clientWidth;
    const alto = oceano.clientHeight;

    let x = Math.random() * (ancho - 100);
    let y = Math.random() * (alto - 180) + 20;

    pez.style.left = x + "px";
    pez.style.top = y + "px";

    let velocidad = 1 + Math.random() * 1.5;
    let direccion = Math.random() < 0.5 ? -1 : 1;

    pez.x = x;
    pez.y = y;
    pez.velocidad = velocidad;
    pez.direccion = direccion;
    pez.atrapado = false;

    // 20% de probabilidad de ser un animal especial
    if (Math.random() < 0.20) {
        const especial = animalesEspeciales[Math.floor(Math.random() * animalesEspeciales.length)];
        pez.especial = true;
        pez.info = especial;

        pez.innerHTML = `
            <img src="${especial.imagen}" class="imagenPez especialImagen" alt="${especial.nombre}">
        `;
    } else {
        pez.especial = false;

        const imagenesPeces = [
            "imagenes/pez1.png",
            "imagenes/pez2.png",
            "imagenes/pez3.png"
        ];

        const imagen = imagenesPeces[Math.floor(Math.random() * imagenesPeces.length)];

        pez.innerHTML = `
            <img src="${imagen}" class="imagenPez" alt="Pez">
        `;
    }

    oceano.appendChild(pez);
    peces.push(pez);
}


// ==========================================
// MOVER PECES
// ==========================================

function moverPeces() {
    if (!juegoIniciado) {
        requestAnimationFrame(moverPeces);
        return;
    }

    const ancho = oceano.clientWidth;
    const alto = oceano.clientHeight;

    peces.forEach(function (pez) {
        if (!pez.isConnected || pez.atrapado) {
            return;
        }

        // Movimiento Horizontal
        pez.x += pez.velocidad * pez.direccion;

        // Movimiento Vertical Suave
        if (!pez.tiempo) {
            pez.tiempo = Math.random() * 100;
        }

        pez.tiempo += 0.02;
        const movimientoVertical = Math.sin(pez.tiempo) * 0.5;
        pez.y += movimientoVertical;

        // Rebotar en los bordes
        if (pez.x >= ancho - 90) {
            pez.x = ancho - 90;
            pez.direccion = -1;
        }

        if (pez.x <= 5) {
            pez.x = 5;
            pez.direccion = 1;
        }

        // Límites verticales
        if (pez.y > alto - 180) {
            pez.y = alto - 180;
        }

        if (pez.y < 10) {
            pez.y = 10;
        }

        // Aplicar posición y orientación según la dirección
        pez.style.left = pez.x + "px";
        pez.style.top = pez.y + "px";

        if (pez.direccion === 1) {
            pez.style.transform = "scaleX(1)";
        } else {
            pez.style.transform = "scaleX(-1)";
        }
    });

    requestAnimationFrame(moverPeces);
}


// ==========================================
// CREAR BASURA
// ==========================================

function crearBasura() {
    const cantidad = document.querySelectorAll(".basuraObjeto").length;

    if (cantidad >= 25) {
        return;
    }

    const objetos = [
        "imagenes/bolsa.png",
        "imagenes/botella.png",
        "imagenes/lata.png",
        "imagenes/red.png"
    ];

    const basura = document.createElement("div");
    basura.className = "basuraObjeto";

    const imagenBasura = objetos[Math.floor(Math.random() * objetos.length)];

    basura.innerHTML = `
        <img src="${imagenBasura}" class="imagenBasura" alt="Contaminante">
    `;

    const ancho = oceano.clientWidth;
    const alto = oceano.clientHeight;

    basura.style.left = Math.random() * (ancho - 60) + "px";
    basura.style.top = Math.random() * (alto - 180) + 20 + "px";

    basura.addEventListener("click", function () {
        liberarPez(basura);
        basura.remove();

        basuraRetirada++;
        puntos += 10;

        actualizar();
        mostrarMensaje("🗑️ ¡Basura retirada! +10 ⭐");
    });

    oceano.appendChild(basura);
}


// ==========================================
// COMPROBAR COLISIONES
// ==========================================

setInterval(function () {
    if (!juegoIniciado) {
        return;
    }

    const basuras = document.querySelectorAll(".basuraObjeto");

    peces.forEach(function (pez) {
        if (!pez.isConnected || pez.atrapado) {
            return;
        }

        const pezRect = pez.getBoundingClientRect();

        basuras.forEach(function (basura) {
            const basuraRect = basura.getBoundingClientRect();

            const colision =
                pezRect.left < basuraRect.right &&
                pezRect.right > basuraRect.left &&
                pezRect.top < basuraRect.bottom &&
                pezRect.bottom > basuraRect.top;

            if (colision) {
                pez.atrapado = true;
                pez.classList.add("atrapado");
                mostrarMensaje("😢 ¡Un pez quedó atrapado! Retira la basura.");
            }
        });
    });
}, 100);


// ==========================================
// LIBERAR PEZ
// ==========================================

function liberarPez(basura) {
    const basuraRect = basura.getBoundingClientRect();

    peces.forEach(function (pez) {
        if (!pez.isConnected || !pez.atrapado) {
            return;
        }

        const pezRect = pez.getBoundingClientRect();

        const distanciaX = Math.abs(pezRect.left - basuraRect.left);
        const distanciaY = Math.abs(pezRect.top - basuraRect.top);

        if (distanciaX < 100 && distanciaY < 100) {
            pez.atrapado = false;
            pez.classList.remove("atrapado");

            pecesRescatados++;
            puntos += 50;

            actualizar();

            if (pez.especial) {
                mostrarInformacion(pez.info);
            } else {
                mostrarMensaje("🐟 ¡Pez rescatado! +50 ⭐");
            }
        }
    });
}


// ==========================================
// UTILIDADES Y MODALES
// ==========================================

function actualizar() {
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
    }, 1800);
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

function crearDuctoDañado() {
    const ducto = document.createElement("div");
    ducto.className = "ductoDañado";
    ducto.innerHTML = "🛢️";
    ducto.style.position = "absolute";
    ducto.style.bottom = "30px";
    ducto.style.left = Math.random() * (oceano.clientWidth - 80) + "px";
    ducto.style.fontSize = "40px";
    ducto.style.cursor = "pointer";
    ducto.style.zIndex = "10";

    let clicsParaReparar = 3;

    ducto.addEventListener("click", function () {
        clicsParaReparar--;

        if (clicsParaReparar > 0) {
            mostrarMensaje(`⚠️ ¡Reparando derrame! Faltan ${clicsParaReparar} clics.`);
        } else {
            ducto.remove();
            puntos += 100;
            actualizar();
            mostrarMensaje("✅ ¡Ducto sellado con éxito! Evitaste un derrame. +100 ⭐");
        }
    });

    const intervaloFuga = setInterval(function () {
        if (!ducto.isConnected) {
            clearInterval(intervaloFuga);
            return;
        }
        crearBasura();
    }, 4000);

    oceano.appendChild(ducto);
}