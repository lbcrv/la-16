(function (La16) {
  const CLAVE_SIM = "la16.simulacion.apertura2026";
  const CLAVE_EQUIPO = "la16.equipo";
  const VISTAS = ["tabla", "jornadas", "equipo"];
  const TOTAL_JORNADAS = Math.max(...La16.partidos.map((p) => p.j));

  const equipos = new Map(La16.equipos.map((e) => [e.id, e]));
  const $ = (id) => document.getElementById(id);

  const estado = {
    grupo: "todos",
    jornada: primeraJornadaPendiente(),
    equipo: leer(CLAVE_EQUIPO),
    simulados: leerJSON(CLAVE_SIM) || {},
  };

  // --- Almacenamiento local (puede no estar disponible) ---
  function leer(clave) {
    try {
      return localStorage.getItem(clave);
    } catch {
      return null;
    }
  }

  function leerJSON(clave) {
    try {
      return JSON.parse(leer(clave));
    } catch {
      return null;
    }
  }

  function guardar(clave, valor) {
    try {
      if (valor == null) localStorage.removeItem(clave);
      else localStorage.setItem(clave, typeof valor === "string" ? valor : JSON.stringify(valor));
    } catch {
      /* sin almacenamiento: la simulación dura hasta recargar */
    }
  }

  // --- Datos derivados ---
  function primeraJornadaPendiente() {
    const pendiente = La16.partidos.find((p) => !La16.jugado(p));
    return pendiente ? pendiente.j : TOTAL_JORNADAS;
  }

  function partidosEfectivos() {
    return La16.partidos.map((p) => {
      const sim = estado.simulados[La16.idPartido(p)];
      if (La16.jugado(p) || !sim) return p;
      return { ...p, gl: sim.gl, gv: sim.gv, simulado: true };
    });
  }

  function cantidadSimulados() {
    return La16.partidos.filter((p) => !La16.jugado(p) && estado.simulados[La16.idPartido(p)]).length;
  }

  function zonaDe(pos) {
    return La16.torneo.zonas.find((z) => pos >= z.desde && pos <= z.hasta);
  }

  // --- Formato ---
  const formatoFecha = new Intl.DateTimeFormat("es-HN", { weekday: "short", day: "numeric", month: "short" });

  function fecha(texto) {
    const [a, m, d] = texto.split("-").map(Number);
    return formatoFecha.format(new Date(a, m - 1, d));
  }

  function hora(texto) {
    const [h, m] = texto.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`;
  }

  function cuando(p) {
    if (!p.fecha) return p.nota || "Fecha por confirmar";
    return p.hora ? `${fecha(p.fecha)} · ${hora(p.hora)}` : fecha(p.fecha);
  }

  function signo(n) {
    return n > 0 ? `+${n}` : String(n);
  }

  function escudo(e) {
    return `<span class="escudo" data-equipo="${e.id}" aria-hidden="true">${e.id}</span>`;
  }

  // Los colores se aplican con el CSSOM y no con atributos style, para que la
  // política de seguridad (CSP) pueda prohibir los estilos en línea.
  function pintarEscudos() {
    document.querySelectorAll(".escudo[data-equipo]").forEach((el) => {
      const e = equipos.get(el.dataset.equipo);
      if (!e || !e.color) return;
      el.style.background = e.color;
      el.style.color = e.texto;
      if (e.borde) el.style.boxShadow = `inset 0 0 0 2px ${e.borde}`;
    });
  }

  // --- Barra superior y aviso ---
  function renderBug(tabla) {
    const lider = tabla[0];
    $("bug").innerHTML = `
      <span class="bug__etiqueta">Líder</span>
      <span class="bug__equipo">${escudo(lider.equipo)}${lider.equipo.nombre}</span>
      <span class="bug__pts">${lider.pts} PTS</span>`;
  }

  function renderAviso() {
    const n = cantidadSimulados();
    $("aviso-sim").hidden = n === 0;
    $("aviso-sim-texto").textContent =
      n === 1 ? "La tabla incluye 1 resultado inventado por ti." : `La tabla incluye ${n} resultados inventados por ti.`;
  }

  // --- Vista: tabla ---
  function renderTabla(tabla, tablaReal) {
    const posReal = new Map(tablaReal.map((f) => [f.equipo.id, f.pos]));
    const hayMovimiento = cantidadSimulados() > 0;
    const visibles = estado.grupo === "todos" ? tabla : tabla.filter((f) => f.equipo.grupo === estado.grupo);

    $("cuerpo-tabla").innerHTML = visibles
      .map((f) => {
        const zona = zonaDe(f.pos);
        const delta = posReal.get(f.equipo.id) - f.pos;
        let movimiento = "";
        if (hayMovimiento && delta !== 0) {
          const sube = delta > 0;
          const texto = `${sube ? "Sube" : "Baja"} ${Math.abs(delta)}`;
          movimiento = `<span class="movimiento movimiento--${sube ? "sube" : "baja"}" aria-label="${texto}" title="${texto} respecto a la tabla real">${sube ? "▲" : "▼"}${Math.abs(delta)}</span>`;
        }
        const nombres = { G: "ganó", E: "empató", P: "perdió" };
        const forma = f.forma
          .map((r) => `<span class="forma__item forma__item--${r}" aria-hidden="true">${r}</span>`)
          .join("");
        return `
          <tr class="${zona ? `fila--${zona.clave}` : ""}">
            <td class="c-pos">${f.pos}</td>
            <td class="c-equipo">
              <span class="equipo">${escudo(f.equipo)}<span>${f.equipo.nombre}</span><span class="equipo__grupo" title="Grupo ${La16.grupos[f.equipo.grupo]}">${f.equipo.grupo}</span>${movimiento}</span>
            </td>
            <td>${f.pj}</td>
            <td class="c-extra">${f.g}</td>
            <td class="c-extra">${f.e}</td>
            <td class="c-extra">${f.p}</td>
            <td class="c-extra">${f.gf}</td>
            <td class="c-extra">${f.gc}</td>
            <td>${signo(f.dg)}</td>
            <td class="c-pts">${f.pts}</td>
            <td class="c-forma"><span class="forma" aria-label="Últimos resultados: ${f.forma.map((r) => nombres[r]).join(", ")}">${forma}</span></td>
          </tr>`;
      })
      .join("");

    document.querySelectorAll("[data-grupo]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.grupo === estado.grupo));
    });
    $("nota-grupo").hidden = estado.grupo === "todos";

    $("leyenda").innerHTML = La16.torneo.zonas
      .map((z) => {
        const rango = z.desde === z.hasta ? `${z.desde}.°` : `${z.desde}.° a ${z.hasta}.°`;
        return `<li><span class="leyenda__marca leyenda__marca--${z.clave}"></span>${z.nombre} (${rango})</li>`;
      })
      .join("");
  }

  // --- Vista: jornadas ---
  function renderJornadas(partidos) {
    const lista = partidos.filter((p) => p.j === estado.jornada);

    $("titulo-jornada").textContent = `Jornada ${estado.jornada}`;
    $("jornada-texto").textContent = `${estado.jornada} de ${TOTAL_JORNADAS}`;
    $("jornada-ant").disabled = estado.jornada <= 1;
    $("jornada-sig").disabled = estado.jornada >= TOTAL_JORNADAS;

    $("lista-partidos").innerHTML = lista
      .map((p) => {
        const local = equipos.get(p.local);
        const visita = equipos.get(p.visita);
        const id = La16.idPartido(p);
        const real = La16.partidos.find((o) => La16.idPartido(o) === id);
        let marcador;
        if (La16.jugado(real)) {
          marcador = `
            <div class="marcador" aria-label="${local.nombre} ${p.gl}, ${visita.nombre} ${p.gv}">
              <span class="marcador__gol">${p.gl}</span><span class="marcador__sep"></span><span class="marcador__gol">${p.gv}</span>
            </div>`;
        } else {
          const sim = estado.simulados[id] || {};
          marcador = `
            <div class="marcador${p.simulado ? " marcador--sim" : ""}">
              <input type="number" inputmode="numeric" min="0" max="20" placeholder="–" data-partido="${id}" data-lado="gl" value="${sim.gl ?? ""}" aria-label="Goles de ${local.nombre}">
              <span class="marcador__sep"></span>
              <input type="number" inputmode="numeric" min="0" max="20" placeholder="–" data-partido="${id}" data-lado="gv" value="${sim.gv ?? ""}" aria-label="Goles de ${visita.nombre}">
            </div>`;
        }
        return `
          <li class="partido${p.simulado ? " partido--sim" : ""}" data-id="${id}">
            <div class="partido__meta">
              <span>${cuando(p)}</span>
              <span class="partido__etiqueta-sim" ${p.simulado ? "" : "hidden"}>Simulado</span>
            </div>
            <div class="partido__cuerpo">
              <span class="partido__equipo partido__equipo--local"><span class="partido__nombre">${local.nombre}</span>${escudo(local)}</span>
              ${marcador}
              <span class="partido__equipo">${escudo(visita)}<span class="partido__nombre">${visita.nombre}</span></span>
            </div>
          </li>`;
      })
      .join("");
  }

  function alEscribirMarcador(evento) {
    const input = evento.target.closest("input[data-partido]");
    if (!input) return;
    const id = input.dataset.partido;
    const tarjeta = input.closest(".partido");
    const [gl, gv] = [...tarjeta.querySelectorAll("input")].map((i) => i.value.trim());
    const valido = (v) => /^\d{1,2}$/.test(v);

    if (valido(gl) && valido(gv)) estado.simulados[id] = { gl: Number(gl), gv: Number(gv) };
    else delete estado.simulados[id];
    guardar(CLAVE_SIM, Object.keys(estado.simulados).length ? estado.simulados : null);

    const simulado = Boolean(estado.simulados[id]);
    tarjeta.classList.toggle("partido--sim", simulado);
    tarjeta.querySelector(".marcador").classList.toggle("marcador--sim", simulado);
    tarjeta.querySelector(".partido__etiqueta-sim").hidden = !simulado;
    renderGlobal();
  }

  // --- Vista: ¿qué necesita? ---
  const TEXTOS = {
    semis: {
      nombre: "Semifinal directa",
      meta: "Terminar 1.° o 2.°",
      asegurado: "Ya tiene asegurado un lugar entre los dos primeros.",
      eliminado: "Ya no puede terminar entre los dos primeros.",
    },
    liguilla: {
      nombre: "Liguilla",
      meta: "Terminar entre los 6 primeros",
      asegurado: "Ya tiene asegurado su lugar en la liguilla.",
      eliminado: "Ya no puede entrar a la liguilla.",
    },
    noUltimo: {
      nombre: "Evitar el último lugar",
      meta: "No jugar el repechaje de descenso",
      asegurado: "Ya no puede terminar último.",
      eliminado: "Terminará último pase lo que pase.",
    },
  };

  const ETIQUETAS = { asegurado: "Asegurado", eliminado: "Eliminado", depende: "En sus manos", ajeno: "Necesita ayuda" };

  function detalle(clave, r) {
    if (r.estado === "depende") {
      return `Si suma ${r.puntos} de los ${r.posibles} puntos que le quedan, lo consigue sin importar los demás resultados.`;
    }
    if (r.estado === "ajeno") {
      if (r.posibles === 0) return "Ya jugó todos sus partidos: ahora depende de los resultados de los demás.";
      return `Aunque gane los ${r.posibles / 3} partidos que le quedan, necesita que otros resultados lo ayuden.`;
    }
    return TEXTOS[clave][r.estado];
  }

  function renderEquipo(tabla, partidos) {
    const selector = $("selector-equipo");
    if (!selector.options.length) {
      selector.innerHTML = [...La16.equipos]
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
        .map((e) => `<option value="${e.id}">${e.nombre}</option>`)
        .join("");
    }
    if (!equipos.has(estado.equipo)) estado.equipo = tabla[0].equipo.id;
    selector.value = estado.equipo;

    const a = La16.analizarEquipo(tabla, partidos, estado.equipo);
    const objetivos = ["semis", "liguilla", "noUltimo"]
      .map((clave) => {
        const r = a[clave];
        const etiqueta = clave === "noUltimo" && r.estado === "eliminado" ? "Condenado" : ETIQUETAS[r.estado];
        return `
          <li class="objetivo objetivo--${r.estado}">
            <div>
              <div class="objetivo__nombre">${TEXTOS[clave].nombre}</div>
              <div class="resumen__etiqueta">${TEXTOS[clave].meta}</div>
            </div>
            <span class="estado">${etiqueta}</span>
            <p class="objetivo__detalle">${detalle(clave, r)}</p>
          </li>`;
      })
      .join("");

    const pendientes = partidos
      .filter((p) => !La16.jugado(p) && (p.local === estado.equipo || p.visita === estado.equipo))
      .map((p) => {
        const esLocal = p.local === estado.equipo;
        const rival = equipos.get(esLocal ? p.visita : p.local);
        return `
          <li>
            <span class="pendientes__j">J${p.j}</span>
            <span class="pendientes__rival">${escudo(rival)}${esLocal ? "vs" : "en"} ${rival.nombre}</span>
            <span class="pendientes__cond">${cuando(p)}</span>
          </li>`;
      })
      .join("");

    const simulacion = cantidadSimulados()
      ? `<p class="nota">Este análisis incluye tus resultados simulados.</p>`
      : "";

    $("analisis").innerHTML = `
      <div class="resumen">
        <div class="resumen__dato"><span class="resumen__valor">${a.fila.pos}.°</span><span class="resumen__etiqueta">Posición</span></div>
        <div class="resumen__dato"><span class="resumen__valor">${a.fila.pts}</span><span class="resumen__etiqueta">Puntos</span></div>
        <div class="resumen__dato"><span class="resumen__valor">${a.maximo}</span><span class="resumen__etiqueta">Máximo posible</span></div>
        <div class="resumen__dato"><span class="resumen__valor">${a.restantes}</span><span class="resumen__etiqueta">Partidos por jugar</span></div>
      </div>
      <ul class="objetivos">${objetivos}</ul>
      <p class="nota">Cálculo conservador: si puede terminar empatado en puntos con otro equipo, se asume que el desempate le sale en contra.</p>
      ${simulacion}
      ${pendientes ? `<h2 class="subtitulo">Le queda por jugar</h2><ul class="pendientes">${pendientes}</ul>` : ""}`;
  }

  // --- Navegación y render ---
  function vistaActual() {
    const hash = location.hash.slice(1);
    return VISTAS.includes(hash) ? hash : "tabla";
  }

  function renderGlobal() {
    const tabla = La16.calcularTabla(La16.equipos, partidosEfectivos(), La16.torneo.desempate);
    renderBug(tabla);
    renderAviso();
    pintarEscudos();
    return tabla;
  }

  function render() {
    const partidos = partidosEfectivos();
    const tabla = renderGlobal();
    const vista = vistaActual();

    VISTAS.forEach((v) => {
      $(`vista-${v}`).hidden = v !== vista;
      const tab = $(`tab-${v}`);
      tab.setAttribute("aria-selected", String(v === vista));
      tab.tabIndex = v === vista ? 0 : -1;
    });

    if (vista === "tabla") {
      const tablaReal = La16.calcularTabla(La16.equipos, La16.partidos, La16.torneo.desempate);
      renderTabla(tabla, tablaReal);
    } else if (vista === "jornadas") {
      renderJornadas(partidos);
    } else {
      renderEquipo(tabla, partidos);
    }
    pintarEscudos();
  }

  function cambiarJornada(delta) {
    estado.jornada = Math.min(TOTAL_JORNADAS, Math.max(1, estado.jornada + delta));
    render();
  }

  // --- Eventos ---
  document.querySelector(".pestanas").addEventListener("click", (e) => {
    const tab = e.target.closest("[data-vista]");
    if (tab) location.hash = tab.dataset.vista;
  });

  document.querySelector(".pestanas").addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = VISTAS.indexOf(vistaActual());
    const siguiente = VISTAS[(i + (e.key === "ArrowRight" ? 1 : VISTAS.length - 1)) % VISTAS.length];
    location.hash = siguiente;
    $(`tab-${siguiente}`).focus();
  });

  document.querySelector(".filtros").addEventListener("click", (e) => {
    const chip = e.target.closest("[data-grupo]");
    if (!chip) return;
    estado.grupo = chip.dataset.grupo;
    render();
  });

  $("jornada-ant").addEventListener("click", () => cambiarJornada(-1));
  $("jornada-sig").addEventListener("click", () => cambiarJornada(1));
  $("lista-partidos").addEventListener("input", alEscribirMarcador);

  $("selector-equipo").addEventListener("change", (e) => {
    estado.equipo = e.target.value;
    guardar(CLAVE_EQUIPO, estado.equipo);
    render();
  });

  $("borrar-sim").addEventListener("click", () => {
    estado.simulados = {};
    guardar(CLAVE_SIM, null);
    render();
  });

  window.addEventListener("hashchange", render);

  const [a, m, d] = La16.torneo.actualizado.split("-").map(Number);
  const actualizado = new Intl.DateTimeFormat("es-HN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(a, m - 1, d));
  $("pie-actualizado").textContent = `Resultados actualizados al ${actualizado}.`;
  render();
})(window.La16);
