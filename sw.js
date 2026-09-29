// Service worker: permite abrir La 16 sin conexión con los últimos datos vistos.
// Páginas, estilos y datos: primero la red (siempre lo más reciente) y, si no
// hay conexión, la copia guardada. Fuentes e imágenes: primero la copia.

const VERSION = "la16-v1";
const BASICOS = [
  "./",
  "index.html",
  "css/styles.css",
  "js/data.js",
  "js/tabla.js",
  "js/app.js",
  "manifest.webmanifest",
  "assets/icono.svg",
  "assets/fonts/barlow-400.woff2",
  "assets/fonts/barlow-600.woff2",
  "assets/fonts/barlow-condensed-700.woff2",
  "assets/fonts/barlow-condensed-800.woff2",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(BASICOS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== VERSION).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

// Guarda sin la parte "?t=..." para que js/data.js?t=123 reemplace a js/data.js.
function claveDe(url) {
  const u = new URL(url);
  u.search = "";
  return u.href;
}

async function primeroRed(peticion) {
  const cache = await caches.open(VERSION);
  try {
    const respuesta = await fetch(peticion);
    if (respuesta.ok) cache.put(claveDe(peticion.url), respuesta.clone());
    return respuesta;
  } catch (error) {
    const guardada =
      (await cache.match(claveDe(peticion.url))) ||
      (peticion.mode === "navigate" ? await cache.match(new URL("index.html", self.registration.scope).href) : null);
    if (guardada) return guardada;
    throw error;
  }
}

async function primeroCopia(peticion) {
  const cache = await caches.open(VERSION);
  const guardada = await cache.match(claveDe(peticion.url));
  if (guardada) return guardada;
  const respuesta = await fetch(peticion);
  if (respuesta.ok) cache.put(claveDe(peticion.url), respuesta.clone());
  return respuesta;
}

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;
  if (peticion.method !== "GET") return;
  const url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith(".ics")) return;

  const estatico = /\.(woff2|png|svg)$/.test(url.pathname);
  evento.respondWith(estatico ? primeroCopia(peticion) : primeroRed(peticion));
});
