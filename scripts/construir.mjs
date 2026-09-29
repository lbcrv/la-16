// Arma el sitio en _site para Cloudflare Pages (comando de build: node scripts/construir.mjs).
// Copia los archivos públicos y genera los calendarios por equipo, robots.txt y sitemap.xml.

import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import vm from "node:vm";

const SITIO = "https://la-16.pages.dev";
const RAIZ = new URL("../", import.meta.url);
const SALIDA = new URL("_site/", RAIZ);
const PUBLICOS = [
  "index.html",
  "manifest.webmanifest",
  "_headers",
  "sw.js",
  "css",
  "js",
  "assets",
  "_redirects",
  "google-verificacion.txt", // verificación de Google Search Console (ver _redirects)
];
const HORAS_HONDURAS = -6;
const DURACION_HORAS = 2;

// Se vacía el contenido en vez de borrar la carpeta: en Windows no se puede
// borrar una carpeta que otro proceso tiene abierta (por ejemplo un servidor local).
await mkdir(SALIDA, { recursive: true });
for (const nombre of await readdir(SALIDA)) {
  await rm(new URL(nombre, SALIDA), { recursive: true, force: true });
}
for (const ruta of PUBLICOS) {
  await cp(new URL(ruta, RAIZ), new URL(ruta, SALIDA), { recursive: true });
}

// Lee js/data.js tal como lo haría el navegador.
// En el navegador "window" es el objeto global: aquí se imita igual.
const contexto = {};
contexto.window = contexto;
vm.createContext(contexto);
vm.runInContext(await readFile(new URL("js/data.js", RAIZ), "utf8"), contexto);
const { torneo, equipos, partidos } = contexto.window.La16;
const nombre = new Map(equipos.map((e) => [e.id, e.nombre]));

// --- Calendarios (RFC 5545) ---
const dos = (n) => String(n).padStart(2, "0");

function escapar(texto) {
  return texto.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

// Parte las líneas de más de 75 bytes, como pide el formato.
function plegar(linea) {
  const bytes = Buffer.from(linea, "utf8");
  if (bytes.length <= 75) return linea;
  const partes = [];
  let inicio = 0;
  let limite = 75;
  while (inicio < bytes.length) {
    let fin = Math.min(inicio + limite, bytes.length);
    while (fin < bytes.length && (bytes[fin] & 0xc0) === 0x80) fin--;
    partes.push(bytes.subarray(inicio, fin).toString("utf8"));
    inicio = fin;
    limite = 74;
  }
  return partes.join("\r\n ");
}

function utc(fecha, hora, sumarHoras = 0) {
  const [a, m, d] = fecha.split("-").map(Number);
  const [h, min] = hora.split(":").map(Number);
  const t = new Date(Date.UTC(a, m - 1, d, h - HORAS_HONDURAS + sumarHoras, min));
  return `${t.getUTCFullYear()}${dos(t.getUTCMonth() + 1)}${dos(t.getUTCDate())}T${dos(t.getUTCHours())}${dos(t.getUTCMinutes())}00Z`;
}

function diaSiguiente(fecha) {
  const [a, m, d] = fecha.split("-").map(Number);
  const t = new Date(Date.UTC(a, m - 1, d + 1));
  return `${t.getUTCFullYear()}${dos(t.getUTCMonth() + 1)}${dos(t.getUTCDate())}`;
}

const sello = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");

function evento(p) {
  const jugado = p.gl != null && p.gv != null;
  const titulo = jugado
    ? `${nombre.get(p.local)} ${p.gl}-${p.gv} ${nombre.get(p.visita)}`
    : `${nombre.get(p.local)} vs ${nombre.get(p.visita)}`;
  const lineas = [
    "BEGIN:VEVENT",
    `UID:${p.local}-${p.visita}-apertura2026@la-16.pages.dev`,
    `DTSTAMP:${sello}`,
  ];
  if (p.hora) {
    lineas.push(`DTSTART:${utc(p.fecha, p.hora)}`, `DTEND:${utc(p.fecha, p.hora, DURACION_HORAS)}`);
  } else {
    lineas.push(`DTSTART;VALUE=DATE:${p.fecha.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${diaSiguiente(p.fecha)}`);
  }
  lineas.push(
    `SUMMARY:${escapar(titulo)}`,
    `DESCRIPTION:${escapar(`Jornada ${p.j} · ${torneo.nombre} · Liga Nacional de Honduras. Tabla y simulador en ${SITIO}`)}`,
    `URL:${SITIO}/#jornadas`,
    "END:VEVENT",
  );
  return lineas;
}

function calendario(titulo, lista) {
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//La 16//Apertura 2026//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapar(titulo)}`,
    "X-WR-TIMEZONE:America/Tegucigalpa",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
    ...lista.filter((p) => p.fecha).flatMap(evento),
    "END:VCALENDAR",
  ];
  return lineas.map(plegar).join("\r\n") + "\r\n";
}

await mkdir(new URL("calendario/", SALIDA), { recursive: true });
for (const e of equipos) {
  const suyos = partidos.filter((p) => p.local === e.id || p.visita === e.id);
  await writeFile(new URL(`calendario/${e.id}.ics`, SALIDA), calendario(`${e.nombre} · La 16`, suyos));
}
await writeFile(new URL("calendario/todos.ics", SALIDA), calendario("Liga Nacional · La 16", partidos));

// --- Para buscadores ---
await writeFile(
  new URL("robots.txt", SALIDA),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITIO}/sitemap.xml\n`,
);
await writeFile(
  new URL("sitemap.xml", SALIDA),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITIO}/</loc>
    <lastmod>${torneo.actualizado}</lastmod>
    <changefreq>daily</changefreq>
  </url>
</urlset>
`,
);

console.log(`Sitio listo en _site: ${equipos.length + 1} calendarios, robots.txt y sitemap.xml.`);
