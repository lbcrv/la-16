// Datos del torneo. Para actualizar resultados, llena gl (goles del local)
// y gv (goles de la visita) del partido correspondiente y cambia `actualizado`.
window.La16 = window.La16 || {};

La16.torneo = {
  nombre: "Apertura 2026",
  actualizado: "2026-09-20",
  // Criterios tras los puntos, en orden. Tomados de las bases 2025-26 (coinciden
  // con las tablas publicadas). Confirmar con las bases 2026-27.
  desempate: ["dg", "gf", "h2hPts", "h2hDg", "h2hGolesVisita"],
  zonas: [
    { clave: "semis", desde: 1, hasta: 2, nombre: "Semifinal directa" },
    { clave: "repechaje", desde: 3, hasta: 6, nombre: "Repechaje" },
    { clave: "descenso", desde: 12, hasta: 12, nombre: "Repechaje de descenso" },
  ],
};

La16.grupos = { N: "Norte", CO: "Centro-Oriente" };

// color / texto: colores del distintivo. Los que usan el tono neutro están
// pendientes de definir.
La16.equipos = [
  { id: "RE", nombre: "Real España", ciudad: "San Pedro Sula", grupo: "N", color: "#FFD100", texto: "#111111" },
  { id: "MAR", nombre: "Marathón", ciudad: "San Pedro Sula", grupo: "N", color: "#0B7A3E", texto: "#FFFFFF" },
  { id: "PLA", nombre: "Platense", ciudad: "Puerto Cortés", grupo: "N" },
  { id: "CHO", nombre: "Choloma", ciudad: "Choloma", grupo: "N" },
  { id: "IND", nombre: "Independiente", ciudad: "Siguatepeque", grupo: "N" },
  { id: "GEN", nombre: "Génesis PN", ciudad: "La Paz", grupo: "N" },
  { id: "OLI", nombre: "Olimpia", ciudad: "Tegucigalpa", grupo: "CO", color: "#FFFFFF", texto: "#0A1F5C" },
  { id: "MOT", nombre: "Motagua", ciudad: "Tegucigalpa", grupo: "CO", color: "#0A2E8A", texto: "#FFFFFF" },
  { id: "UPN", nombre: "UPNFM", ciudad: "Tegucigalpa", grupo: "CO" },
  { id: "OLA", nombre: "Olancho", ciudad: "Juticalpa", grupo: "CO" },
  { id: "JUT", nombre: "Juticalpa", ciudad: "Juticalpa", grupo: "CO" },
  { id: "EST", nombre: "Estrella Roja", ciudad: "Danlí", grupo: "CO", color: "#C8102E", texto: "#FFFFFF" },
];

// j: jornada · fecha: AAAA-MM-DD · hora: 24 h · gl/gv: null si no se ha jugado
La16.partidos = [
  { j: 1, fecha: "2026-07-31", hora: null, local: "PLA", visita: "RE", gl: 0, gv: 3 },
  { j: 1, fecha: "2026-08-01", hora: null, local: "GEN", visita: "CHO", gl: 2, gv: 0 },
  { j: 1, fecha: "2026-08-02", hora: null, local: "JUT", visita: "MOT", gl: 0, gv: 3 },
  { j: 1, fecha: "2026-08-02", hora: null, local: "EST", visita: "OLA", gl: 0, gv: 1 },
  { j: 1, fecha: "2026-08-02", hora: null, local: "OLI", visita: "UPN", gl: 2, gv: 0 },
  { j: 1, fecha: "2026-08-03", hora: null, local: "MAR", visita: "IND", gl: 1, gv: 0 },

  { j: 2, fecha: "2026-08-08", hora: null, local: "PLA", visita: "MAR", gl: 1, gv: 1 },
  { j: 2, fecha: "2026-08-08", hora: null, local: "UPN", visita: "OLA", gl: 1, gv: 1 },
  { j: 2, fecha: "2026-08-08", hora: null, local: "RE", visita: "GEN", gl: 2, gv: 0 },
  { j: 2, fecha: "2026-08-09", hora: null, local: "JUT", visita: "OLI", gl: 1, gv: 3 },
  { j: 2, fecha: "2026-08-09", hora: null, local: "MOT", visita: "EST", gl: 0, gv: 2 },
  { j: 2, fecha: "2026-08-09", hora: null, local: "IND", visita: "CHO", gl: 2, gv: 1 },

  { j: 3, fecha: "2026-08-15", hora: null, local: "GEN", visita: "PLA", gl: 3, gv: 0 },
  { j: 3, fecha: "2026-08-15", hora: null, local: "UPN", visita: "EST", gl: 2, gv: 2 },
  { j: 3, fecha: "2026-08-15", hora: null, local: "RE", visita: "IND", gl: 1, gv: 1 },
  { j: 3, fecha: "2026-08-16", hora: null, local: "CHO", visita: "MAR", gl: 0, gv: 1 },
  { j: 3, fecha: "2026-08-16", hora: null, local: "OLI", visita: "MOT", gl: 3, gv: 1 },
  { j: 3, fecha: "2026-08-16", hora: null, local: "OLA", visita: "JUT", gl: 1, gv: 0 },

  { j: 4, fecha: "2026-08-21", hora: null, local: "MOT", visita: "UPN", gl: 4, gv: 1 },
  { j: 4, fecha: "2026-08-22", hora: null, local: "IND", visita: "GEN", gl: 1, gv: 1 },
  { j: 4, fecha: "2026-08-22", hora: null, local: "EST", visita: "JUT", gl: 5, gv: 2 },
  { j: 4, fecha: "2026-08-22", hora: null, local: "CHO", visita: "PLA", gl: 2, gv: 0 },
  { j: 4, fecha: "2026-08-23", hora: null, local: "MAR", visita: "RE", gl: 1, gv: 1 },
  { j: 4, fecha: "2026-08-23", hora: null, local: "OLA", visita: "OLI", gl: 1, gv: 1 },

  { j: 5, fecha: "2026-08-28", hora: null, local: "JUT", visita: "UPN", gl: 1, gv: 0 },
  { j: 5, fecha: "2026-08-29", hora: null, local: "GEN", visita: "MAR", gl: 1, gv: 2 },
  { j: 5, fecha: "2026-08-29", hora: null, local: "PLA", visita: "IND", gl: 2, gv: 1 },
  { j: 5, fecha: "2026-08-29", hora: null, local: "MOT", visita: "OLA", gl: 2, gv: 1 },
  { j: 5, fecha: "2026-08-30", hora: null, local: "EST", visita: "OLI", gl: 2, gv: 2 },
  { j: 5, fecha: "2026-08-30", hora: null, local: "RE", visita: "CHO", gl: 2, gv: 1 },

  { j: 6, fecha: "2026-09-03", hora: null, local: "OLI", visita: "PLA", gl: 4, gv: 1 },
  { j: 6, fecha: "2026-09-04", hora: null, local: "CHO", visita: "OLA", gl: 0, gv: 0 },
  { j: 6, fecha: "2026-09-05", hora: null, local: "IND", visita: "MOT", gl: 0, gv: 0 },
  { j: 6, fecha: "2026-09-05", hora: null, local: "MAR", visita: "EST", gl: 5, gv: 0 },
  { j: 6, fecha: "2026-09-06", hora: null, local: "RE", visita: "UPN", gl: 2, gv: 0 },
  { j: 6, fecha: "2026-09-06", hora: null, local: "JUT", visita: "GEN", gl: 0, gv: 3 },

  { j: 7, fecha: "2026-09-11", hora: null, local: "EST", visita: "PLA", gl: 2, gv: 2 },
  { j: 7, fecha: "2026-09-12", hora: null, local: "OLA", visita: "RE", gl: 1, gv: 1 },
  { j: 7, fecha: "2026-09-12", hora: null, local: "MOT", visita: "GEN", gl: 1, gv: 0 },
  { j: 7, fecha: "2026-09-13", hora: null, local: "UPN", visita: "CHO", gl: 1, gv: 0 },
  { j: 7, fecha: "2026-09-13", hora: null, local: "MAR", visita: "OLI", gl: 1, gv: 0 },
  { j: 7, fecha: "2026-09-13", hora: null, local: "IND", visita: "JUT", gl: 2, gv: 1 },

  { j: 8, fecha: "2026-09-18", hora: null, local: "PLA", visita: "UPN", gl: 0, gv: 2 },
  { j: 8, fecha: "2026-09-18", hora: null, local: "CHO", visita: "EST", gl: 2, gv: 0 },
  { j: 8, fecha: "2026-09-19", hora: null, local: "GEN", visita: "OLA", gl: 0, gv: 0 },
  { j: 8, fecha: "2026-09-19", hora: null, local: "RE", visita: "MOT", gl: 1, gv: 0 },
  { j: 8, fecha: "2026-09-20", hora: null, local: "OLI", visita: "IND", gl: 4, gv: 0 },
  { j: 8, fecha: "2026-09-20", hora: null, local: "JUT", visita: "MAR", gl: 3, gv: 2 },

  // Jornada 9: fecha sin confirmar. Localía deducida del reparto de partidos en casa.
  { j: 9, fecha: null, hora: null, local: "EST", visita: "RE", gl: null, gv: null, nota: "Fecha y localía por confirmar" },
  { j: 9, fecha: null, hora: null, local: "UPN", visita: "MAR", gl: null, gv: null, nota: "Fecha y localía por confirmar" },
  { j: 9, fecha: null, hora: null, local: "PLA", visita: "JUT", gl: null, gv: null, nota: "Fecha y localía por confirmar" },
  { j: 9, fecha: null, hora: null, local: "MOT", visita: "CHO", gl: null, gv: null, nota: "Fecha y localía por confirmar" },
  { j: 9, fecha: null, hora: null, local: "OLA", visita: "IND", gl: null, gv: null, nota: "Fecha y localía por confirmar" },
  { j: 9, fecha: null, hora: null, local: "GEN", visita: "OLI", gl: null, gv: null, nota: "Fecha y localía por confirmar" },

  { j: 10, fecha: "2026-10-15", hora: "17:15", local: "MAR", visita: "OLA", gl: null, gv: null },
  { j: 10, fecha: "2026-10-15", hora: "19:30", local: "OLI", visita: "RE", gl: null, gv: null },
  { j: 10, fecha: "2026-10-17", hora: "15:00", local: "PLA", visita: "MOT", gl: null, gv: null },
  { j: 10, fecha: "2026-10-17", hora: "17:15", local: "JUT", visita: "CHO", gl: null, gv: null },
  { j: 10, fecha: "2026-10-17", hora: "19:30", local: "IND", visita: "UPN", gl: null, gv: null },
  { j: 10, fecha: "2026-10-18", hora: "15:30", local: "GEN", visita: "EST", gl: null, gv: null },

  { j: 11, fecha: "2026-10-23", hora: "19:30", local: "OLA", visita: "EST", gl: null, gv: null },
  { j: 11, fecha: "2026-10-24", hora: "15:00", local: "CHO", visita: "GEN", gl: null, gv: null },
  { j: 11, fecha: "2026-10-24", hora: "17:15", local: "RE", visita: "PLA", gl: null, gv: null },
  { j: 11, fecha: "2026-10-24", hora: "19:30", local: "IND", visita: "MAR", gl: null, gv: null },
  { j: 11, fecha: "2026-10-25", hora: "15:00", local: "MOT", visita: "JUT", gl: null, gv: null },
  { j: 11, fecha: "2026-10-25", hora: "17:15", local: "UPN", visita: "OLI", gl: null, gv: null },

  { j: 12, fecha: "2026-10-30", hora: "19:00", local: "EST", visita: "IND", gl: null, gv: null },
  { j: 12, fecha: "2026-10-31", hora: "15:00", local: "UPN", visita: "GEN", gl: null, gv: null },
  { j: 12, fecha: "2026-10-31", hora: "17:15", local: "RE", visita: "JUT", gl: null, gv: null },
  { j: 12, fecha: "2026-10-31", hora: "19:30", local: "CHO", visita: "OLI", gl: null, gv: null },
  { j: 12, fecha: "2026-11-01", hora: "15:00", local: "OLA", visita: "PLA", gl: null, gv: null },
  { j: 12, fecha: "2026-11-01", hora: "17:15", local: "MOT", visita: "MAR", gl: null, gv: null },

  { j: 13, fecha: "2026-11-04", hora: "15:00", local: "OLA", visita: "UPN", gl: null, gv: null },
  { j: 13, fecha: "2026-11-04", hora: "17:15", local: "EST", visita: "MOT", gl: null, gv: null },
  { j: 13, fecha: "2026-11-04", hora: "19:30", local: "OLI", visita: "JUT", gl: null, gv: null },
  { j: 13, fecha: "2026-11-05", hora: "15:00", local: "GEN", visita: "RE", gl: null, gv: null },
  { j: 13, fecha: "2026-11-05", hora: "17:15", local: "CHO", visita: "IND", gl: null, gv: null },
  { j: 13, fecha: "2026-11-05", hora: "19:30", local: "MAR", visita: "PLA", gl: null, gv: null },

  { j: 14, fecha: "2026-11-07", hora: "15:00", local: "JUT", visita: "EST", gl: null, gv: null },
  { j: 14, fecha: "2026-11-07", hora: "17:15", local: "UPN", visita: "MOT", gl: null, gv: null },
  { j: 14, fecha: "2026-11-07", hora: "19:30", local: "OLI", visita: "OLA", gl: null, gv: null },
  { j: 14, fecha: "2026-11-08", hora: "15:00", local: "PLA", visita: "GEN", gl: null, gv: null },
  { j: 14, fecha: "2026-11-08", hora: "17:15", local: "IND", visita: "RE", gl: null, gv: null },
  { j: 14, fecha: "2026-11-08", hora: "19:30", local: "MAR", visita: "CHO", gl: null, gv: null },

  { j: 15, fecha: "2026-11-18", hora: "15:00", local: "PLA", visita: "CHO", gl: null, gv: null },
  { j: 15, fecha: "2026-11-18", hora: "17:15", local: "EST", visita: "UPN", gl: null, gv: null },
  { j: 15, fecha: "2026-11-18", hora: "19:30", local: "RE", visita: "MAR", gl: null, gv: null },
  { j: 15, fecha: "2026-11-19", hora: "15:00", local: "GEN", visita: "IND", gl: null, gv: null },
  { j: 15, fecha: "2026-11-19", hora: "17:15", local: "JUT", visita: "OLA", gl: null, gv: null },
  { j: 15, fecha: "2026-11-19", hora: "19:30", local: "MOT", visita: "OLI", gl: null, gv: null },

  { j: 16, fecha: null, hora: null, local: "MAR", visita: "GEN", gl: null, gv: null, nota: "21 o 22 de noviembre" },
  { j: 16, fecha: null, hora: null, local: "IND", visita: "PLA", gl: null, gv: null, nota: "21 o 22 de noviembre" },
  { j: 16, fecha: null, hora: null, local: "CHO", visita: "RE", gl: null, gv: null, nota: "21 o 22 de noviembre" },
  { j: 16, fecha: null, hora: null, local: "OLI", visita: "EST", gl: null, gv: null, nota: "21 o 22 de noviembre" },
  { j: 16, fecha: null, hora: null, local: "UPN", visita: "JUT", gl: null, gv: null, nota: "21 o 22 de noviembre" },
  { j: 16, fecha: null, hora: null, local: "OLA", visita: "MOT", gl: null, gv: null, nota: "21 o 22 de noviembre" },
];
