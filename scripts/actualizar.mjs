// Trae los resultados de TheSportsDB y los escribe en js/data.js.
//
// Reglas:
// - Solo llena marcadores vacíos: nunca sobrescribe un resultado ya capturado.
// - Solo acepta partidos terminados y goles enteros; de la API no se copia texto.
// - En partidos pendientes, actualiza fecha y hora si la liga las cambió.
//
// Uso: node scripts/actualizar.mjs   (clave opcional en THESPORTSDB_KEY)

import { readFile, writeFile } from "node:fs/promises";

const LIGA = 4818;
const TEMPORADA = "2026-2027";
const JORNADAS = 16;
const CLAVE = process.env.THESPORTSDB_KEY || "123";
const ARCHIVO = new URL("../js/data.js", import.meta.url);
const TERMINADO = new Set(["FT", "AET", "PEN", "Match Finished"]);
const HORAS_HONDURAS = -6; // UTC-6, sin horario de verano

// idTeam de TheSportsDB -> id de La 16
const EQUIPOS = {
  139699: "RE",
  139106: "MAR",
  139697: "PLA",
  152546: "CHO",
  156273: "IND",
  147542: "GEN",
  139008: "OLI",
  139007: "MOT",
  139701: "UPN",
  146533: "OLA",
  149030: "JUT",
  156274: "EST",
};

const LINEA =
  /^(\s*\{ j: \d+, fecha: )(null|"\d{4}-\d{2}-\d{2}"), hora: (null|"\d{2}:\d{2}"), local: "(\w+)", visita: "(\w+)", gl: (null|\d+), gv: (null|\d+)(, nota: "[^"]*")?( \},?)$/;

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// La clave gratuita admite pocas peticiones por minuto: se espera entre
// jornadas y, si la API responde 429, se espera más antes de reintentar.
async function traerJornada(n, intentos = 4) {
  const url = `https://www.thesportsdb.com/api/v1/json/${CLAVE}/eventsround.php?id=${LIGA}&r=${n}&s=${TEMPORADA}`;
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "la-16 (github.com/lbcrv/la-16)" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const datos = await res.json();
      return datos.events || [];
    } catch (error) {
      if (i >= intentos) throw new Error(`Jornada ${n}: ${error.message}`);
      await esperar(error.message === "HTTP 429" ? 30000 * i : 3000 * i);
    }
  }
}

function gol(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = Number(valor);
  return Number.isInteger(n) && n >= 0 && n <= 30 ? n : null;
}

function aHoraHonduras(timestamp) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(timestamp || "");
  if (!m) return null;
  const utc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const local = new Date(utc + HORAS_HONDURAS * 3600 * 1000).toISOString();
  return { fecha: local.slice(0, 10), hora: local.slice(11, 16) };
}

const texto = await readFile(ARCHIVO, "utf8");
const eol = texto.includes("\r\n") ? "\r\n" : "\n";
const lineas = texto.split(/\r?\n/);
const indice = new Map();
lineas.forEach((linea, i) => {
  const m = LINEA.exec(linea);
  if (m) indice.set(`${m[4]}-${m[5]}`, i);
});
if (indice.size === 0) throw new Error("No se reconoció ningún partido en js/data.js");

const cambios = [];
const avisos = [];

// Solo se consultan jornadas con algún marcador u hora por llenar.
const porRevisar = new Set();
for (const linea of lineas) {
  const m = LINEA.exec(linea);
  if (m && (m[6] === "null" || m[3] === "null")) porRevisar.add(Number(/j: (\d+)/.exec(linea)[1]));
}

let primera = true;
for (let n = 1; n <= JORNADAS; n++) {
  if (!porRevisar.has(n)) continue;
  if (!primera) await esperar(2500);
  primera = false;
  const eventos = await traerJornada(n);

  // Si varios partidos traen exactamente la misma hora, es un horario provisional.
  const repetidas = new Map();
  for (const ev of eventos) repetidas.set(ev.strTimestamp, (repetidas.get(ev.strTimestamp) || 0) + 1);
  const horarioProvisional = [...repetidas.values()].some((c) => c >= 3);
  if (horarioProvisional) avisos.push(`Jornada ${n}: horario provisional en la API, se ignora`);

  for (const ev of eventos) {
    const local = EQUIPOS[ev.idHomeTeam];
    const visita = EQUIPOS[ev.idAwayTeam];
    if (!local || !visita) {
      avisos.push(`Jornada ${n}: equipo desconocido (${ev.idHomeTeam} vs ${ev.idAwayTeam})`);
      continue;
    }
    const clave = `${local}-${visita}`;
    if (!indice.has(clave)) {
      const invertido = indice.has(`${visita}-${local}`);
      avisos.push(`Jornada ${n}: ${clave} no existe${invertido ? " (la localía está invertida en data.js)" : ""}`);
      continue;
    }

    const i = indice.get(clave);
    const m = LINEA.exec(lineas[i]);
    let [, inicio, fecha, hora, , , gl, gv, nota, fin] = m;
    const antes = lineas[i];

    const gLocal = gol(ev.intHomeScore);
    const gVisita = gol(ev.intAwayScore);
    const terminado = TERMINADO.has(ev.strStatus) && gLocal !== null && gVisita !== null;
    const pendiente = gl === "null" || gv === "null";

    if (pendiente && terminado) {
      gl = String(gLocal);
      gv = String(gVisita);
    }

    const cuando = horarioProvisional ? null : aHoraHonduras(ev.strTimestamp);
    if (cuando) {
      if (pendiente) {
        fecha = `"${cuando.fecha}"`;
        hora = `"${cuando.hora}"`;
        nota = undefined;
      } else if (hora === "null") {
        hora = `"${cuando.hora}"`;
      }
    }

    const despues = `${inicio}${fecha}, hora: ${hora}, local: "${local}", visita: "${visita}", gl: ${gl}, gv: ${gv}${nota || ""}${fin}`;
    if (despues !== antes) {
      lineas[i] = despues;
      cambios.push(`J${n} ${clave}: ${antes.trim()}  ->  ${despues.trim()}`);
    }
  }
}

// La fecha de "actualizado" es la del último partido con resultado.
let ultima = null;
for (const linea of lineas) {
  const m = LINEA.exec(linea);
  if (m && m[6] !== "null" && m[2] !== "null" && (!ultima || m[2] > ultima)) ultima = m[2];
}
let salida = lineas.join(eol);
if (ultima) salida = salida.replace(/actualizado: "\d{4}-\d{2}-\d{2}"/, `actualizado: ${ultima}`);

for (const a of avisos) console.warn(`Aviso: ${a}`);
if (salida === texto) {
  console.log("Sin cambios.");
} else {
  await writeFile(ARCHIVO, salida);
  console.log(`${cambios.length} partido(s) actualizados:`);
  for (const c of cambios) console.log(`  ${c}`);
}
