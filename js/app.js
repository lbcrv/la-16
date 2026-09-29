(function (La16) {
  const CLAVE_SIM = "la16.simulacion.apertura2026";
  const CLAVE_EQUIPO = "la16.equipo";
  const CLAVE_MIO = "la16.miEquipo";
  const VISTAS = ["tabla", "jornadas", "equipo"];
  const TOTAL_JORNADAS = Math.max(...La16.partidos.map((p) => p.j));

  const equipos = new Map(La16.equipos.map((e) => [e.id, e]));
  const $ = (id) => document.getElementById(id);

  const estado = {
    grupo: "todos",
    jornada: primeraJornadaPendiente(),
    equipo: leer(CLAVE_EQUIPO),
    miEquipo: leer(CLAVE_MIO),
    simulados: leerJSON(CLAVE_SIM) || {},
  };
  if (!equipos.has(estado.miEquipo)) estado.miEquipo = null;
  if (estado.miEquipo && !equipos.has(estado.equipo)) estado.equipo = estado.miEquipo;

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

  function porcentaje(p) {
    if (p == null) return "…";
    if (p === 0) return "0 %";
    if (p === 1) return "100 %";
    if (p < 0.005) return "<1 %";
    if (p > 0.995) return ">99 %";
    return `${Math.round(p * 100)} %`;
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

  // El ancho de las barras de probabilidad también va por CSSOM (ver pintarEscudos).
  function pintarMedidores() {
    document.querySelectorAll(".medidor__valor[data-valor]").forEach((el) => {
      el.style.width = `${Math.round(Number(el.dataset.valor) * 1000) / 10}%`;
    });
  }

  // --- Probabilidades (se calculan por partes para no trabar la página) ---
  const prob = { clave: null, resultado: null, turno: 0 };

  function probabilidades(partidos) {
    const clave = JSON.stringify(partidos.map((p) => [p.gl, p.gv]));
    if (prob.clave === clave) return prob.resultado;

    prob.clave = clave;
    prob.resultado = null;
    const turno = ++prob.turno;
    const sim = La16.crearSimulacion(La16.equipos, partidos, La16.torneo.desempate);

    function trabajar() {
      if (turno !== prob.turno) return;
      const inicio = performance.now();
      let listo = false;
      while (!listo && performance.now() - inicio < 12) listo = sim.paso(25);
      if (!listo) {
        setTimeout(trabajar, 0);
        return;
      }
      prob.resultado = sim.resultado();
      if (vistaActual().vista !== "jornadas") render();
    }
    setTimeout(trabajar, 0);
    return null;
  }

  // --- Barra superior y avisos ---
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

  let temporizadorAviso;

  function avisar(texto) {
    const aviso = $("aviso-datos");
    aviso.textContent = texto;
    aviso.hidden = false;
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => (aviso.hidden = true), 5000);
  }

  // --- Vista: tabla ---
  function renderTabla(tabla, tablaReal, partidos) {
    const posReal = new Map(tablaReal.map((f) => [f.equipo.id, f.pos]));
    const hayMovimiento = cantidadSimulados() > 0;
    const visibles = estado.grupo === "todos" ? tabla : tabla.filter((f) => f.equipo.grupo === estado.grupo);
    const p = probabilidades(partidos);

    $("cuerpo-tabla").innerHTML = visibles
      .map((f) => {
        const zona = zonaDe(f.pos);
        const mia = f.equipo.id === estado.miEquipo;
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
        const clases = [zona ? `fila--${zona.clave}` : "", mia ? "fila--mia" : ""].join(" ").trim();
        return `
          <tr class="${clases}">
            <td class="c-pos">${f.pos}</td>
            <td class="c-equipo">
              <a class="equipo" href="#equipo/${f.equipo.id}">${escudo(f.equipo)}<span>${f.equipo.nombre}</span>${mia ? '<span class="solo-lectores">(tu equipo)</span>' : ""}<span class="equipo__grupo" title="Grupo ${La16.grupos[f.equipo.grupo]}">${f.equipo.grupo}</span>${movimiento}</a>
            </td>
            <td class="c-pj">${f.pj}</td>
            <td class="c-extra">${f.g}</td>
            <td class="c-extra">${f.e}</td>
            <td class="c-extra">${f.p}</td>
            <td class="c-extra">${f.gf}</td>
            <td class="c-extra">${f.gc}</td>
            <td>${signo(f.dg)}</td>
            <td class="c-pts">${f.pts}</td>
            <td class="c-prob">${porcentaje(p && p.get(f.equipo.id).liguilla)}</td>
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
        const mio = estado.miEquipo === p.local || estado.miEquipo === p.visita;
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
          <li class="partido${p.simulado ? " partido--sim" : ""}${mio ? " partido--mio" : ""}" data-id="${id}">
            <div class="partido__meta">
              <span>${cuando(p)}</span>
              <span class="partido__etiquetas">
                ${mio ? '<span class="partido__etiqueta-mio">Tu equipo</span>' : ""}
                <span class="partido__etiqueta-sim" ${p.simulado ? "" : "hidden"}>Simulado</span>
              </span>
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

  function probabilidadDe(clave, p) {
    if (!p) return null;
    return clave === "noUltimo" ? 1 - p.ultimo : p[clave];
  }

  function urlDelSitio() {
    return location.href.split("#")[0].split("?")[0];
  }

  function enlacesCalendario(id) {
    const base = urlDelSitio().replace(/index\.html$/, "");
    const archivo = `calendario/${id}.ics`;
    const webcal = `${base}${archivo}`.replace(/^https?:/, "webcal:");
    const google = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`;
    return `
      <div class="calendario">
        <span class="calendario__titulo">Agregar sus partidos al calendario:</span>
        <a class="boton boton--linea" href="${google}" target="_blank" rel="noopener">Google Calendar</a>
        <a class="boton boton--linea" href="${webcal}">iPhone o Outlook</a>
        <a class="boton boton--linea" href="${archivo}" download="${id}-la16.ics">Descargar .ics</a>
      </div>
      <p class="nota">Con Google Calendar o iPhone quedas suscrito: si la liga cambia un horario, tu calendario se actualiza solo.</p>`;
  }

  // Texto para compartir: siempre con datos reales, nunca con resultados simulados.
  function textoParaCompartir(id) {
    const tabla = La16.calcularTabla(La16.equipos, La16.partidos, La16.torneo.desempate);
    const a = La16.analizarEquipo(tabla, La16.partidos, id);
    const nombre = a.fila.equipo.nombre;
    const liguilla = {
      asegurado: "Ya aseguró la liguilla.",
      eliminado: "Ya no puede entrar a la liguilla.",
      depende: `Con ${a.liguilla.puntos} de los ${a.liguilla.posibles} puntos que le quedan asegura la liguilla.`,
      ajeno: "Para la liguilla necesita que otros resultados lo ayuden.",
    }[a.liguilla.estado];
    const p = cantidadSimulados() === 0 ? prob.resultado : null;
    const extra = p && !["asegurado", "eliminado"].includes(a.liguilla.estado)
      ? ` Probabilidad estimada de liguilla: ${porcentaje(p.get(id).liguilla)}.`
      : "";
    return `${nombre} va ${a.fila.pos}.° con ${a.fila.pts} puntos en el Apertura 2026. ${liguilla}${extra}`;
  }

  async function compartir(id) {
    const texto = textoParaCompartir(id);
    const url = `${urlDelSitio()}#equipo/${id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "La 16", text: texto, url });
        return;
      } catch (error) {
        if (error && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${texto} ${url}`);
      avisar("Texto copiado, listo para pegar");
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${texto} ${url}`)}`, "_blank", "noopener");
    }
  }

  // --- Gráfico: posición jornada a jornada (solo resultados reales) ---
  const G = { ancho: 640, alto: 300, izq: 40, der: 48, arriba: 14, abajo: 34 };
  let historial = { clave: null, datos: [] };

  function historialPosiciones() {
    const jugados = La16.partidos.filter(La16.jugado);
    const clave = JSON.stringify(jugados.map((p) => [p.j, p.local, p.gl, p.gv]));
    if (historial.clave === clave) return historial.datos;
    const ultima = Math.max(0, ...jugados.map((p) => p.j));
    const datos = [];
    for (let k = 1; k <= ultima; k++) {
      const t = La16.calcularTabla(La16.equipos, jugados.filter((p) => p.j <= k), La16.torneo.desempate);
      datos.push(new Map(t.map((f) => [f.equipo.id, { pos: f.pos, pts: f.pts }])));
    }
    historial = { clave, datos };
    return datos;
  }

  const gx = (i, n) => G.izq + (i * (G.ancho - G.izq - G.der)) / Math.max(1, n - 1);
  const gy = (pos) => G.arriba + ((pos - 1) * (G.alto - G.arriba - G.abajo)) / (La16.equipos.length - 1);

  function graficoEvolucion(id) {
    const datos = historialPosiciones();
    const n = datos.length;
    if (n < 2) return "";
    const nombre = equipos.get(id).nombre;
    const linea = (eq) =>
      datos.map((m, i) => `${i ? "L" : "M"}${gx(i, n).toFixed(1)} ${gy(m.get(eq).pos).toFixed(1)}`).join(" ");

    let rejilla = "";
    for (let pos = 1; pos <= La16.equipos.length; pos++) {
      rejilla += `<line class="grafico__rejilla" x1="${G.izq}" x2="${G.ancho - G.der}" y1="${gy(pos)}" y2="${gy(pos)}"/>`;
      rejilla += `<text class="grafico__eje" x="${G.izq - 12}" y="${gy(pos)}" text-anchor="end" dominant-baseline="middle">${pos}</text>`;
    }
    const ejeX = datos
      .map((_, i) => `<text class="grafico__eje" x="${gx(i, n)}" y="${G.alto - 10}" text-anchor="middle">J${i + 1}</text>`)
      .join("");
    const otras = La16.equipos
      .filter((e) => e.id !== id)
      .map((e) => `<path class="grafico__otra" d="${linea(e.id)}"/>`)
      .join("");
    const puntos = datos
      .map((m, i) => `<circle class="grafico__punto" data-i="${i}" cx="${gx(i, n)}" cy="${gy(m.get(id).pos)}" r="4.5"/>`)
      .join("");
    const final = datos[n - 1].get(id).pos;
    const resumen = datos.map((m, i) => `jornada ${i + 1}: ${m.get(id).pos}.°`).join(", ");
    const filas = datos
      .map((m, i) => `<tr><td>J${i + 1}</td><td>${m.get(id).pos}.°</td><td>${m.get(id).pts}</td></tr>`)
      .join("");

    return `
      <figure class="grafico">
        <figcaption class="subtitulo">Posición jornada a jornada</figcaption>
        <div class="grafico__lienzo">
          <svg viewBox="0 0 ${G.ancho} ${G.alto}" role="img" aria-label="Posición de ${nombre} por jornada: ${resumen}." data-equipo="${id}" data-n="${n}">
            ${rejilla}${ejeX}${otras}
            <line class="grafico__guia" x1="0" x2="0" y1="${G.arriba}" y2="${G.alto - G.abajo}" visibility="hidden"/>
            <path class="grafico__mia" d="${linea(id)}"/>
            ${puntos}
            <text class="grafico__fin" x="${gx(n - 1, n) + 12}" y="${gy(final)}" dominant-baseline="middle">${final}.°</text>
          </svg>
          <div class="grafico__tip" hidden></div>
        </div>
        <p class="nota">${nombre} en color; los demás equipos en gris. Solo resultados reales.</p>
        <details class="grafico__tabla">
          <summary>Ver como tabla</summary>
          <table class="tabla tabla--simple">
            <thead><tr><th scope="col">Jornada</th><th scope="col">Posición</th><th scope="col">Puntos</th></tr></thead>
            <tbody>${filas}</tbody>
          </table>
        </details>
      </figure>`;
  }

  function alMoverSobreGrafico(evento) {
    const svg = evento.target.closest(".grafico svg");
    if (!svg) return;
    const datos = historialPosiciones();
    const n = Number(svg.dataset.n);
    const id = svg.dataset.equipo;
    const caja = svg.getBoundingClientRect();
    const x = ((evento.clientX - caja.left) * G.ancho) / caja.width;
    const i = Math.min(n - 1, Math.max(0, Math.round(((x - G.izq) * (n - 1)) / (G.ancho - G.izq - G.der))));
    const dato = datos[i].get(id);

    const guia = svg.querySelector(".grafico__guia");
    guia.setAttribute("x1", gx(i, n));
    guia.setAttribute("x2", gx(i, n));
    guia.setAttribute("visibility", "visible");
    svg.querySelectorAll(".grafico__punto").forEach((c) => c.classList.toggle("activo", Number(c.dataset.i) === i));

    const tip = svg.parentElement.querySelector(".grafico__tip");
    tip.textContent = `Jornada ${i + 1}: ${dato.pos}.° · ${dato.pts} pts`;
    tip.hidden = false;
    tip.style.left = `${(gx(i, n) / G.ancho) * caja.width}px`;
    tip.style.top = `${(gy(dato.pos) / G.alto) * caja.height}px`;
  }

  function alSalirDelGrafico(evento) {
    const svg = evento.target.closest(".grafico svg");
    if (!svg) return;
    svg.querySelector(".grafico__guia").setAttribute("visibility", "hidden");
    svg.querySelectorAll(".grafico__punto.activo").forEach((c) => c.classList.remove("activo"));
    svg.parentElement.querySelector(".grafico__tip").hidden = true;
  }

  function renderEquipo(tabla, partidos) {
    const selector = $("selector-equipo");
    if (!selector.options.length) {
      selector.innerHTML = [...La16.equipos]
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
        .map((e) => `<option value="${e.id}">${e.nombre}</option>`)
        .join("");
    }
    if (!equipos.has(estado.equipo)) estado.equipo = estado.miEquipo || tabla[0].equipo.id;
    selector.value = estado.equipo;

    const id = estado.equipo;
    const a = La16.analizarEquipo(tabla, partidos, id);
    const p = probabilidades(partidos);
    const esMio = estado.miEquipo === id;

    const objetivos = ["semis", "liguilla", "noUltimo"]
      .map((clave) => {
        const r = a[clave];
        const etiqueta = clave === "noUltimo" && r.estado === "eliminado" ? "Condenado" : ETIQUETAS[r.estado];
        const pr = probabilidadDe(clave, p && p.get(id));
        return `
          <li class="objetivo objetivo--${r.estado}">
            <div>
              <div class="objetivo__nombre">${TEXTOS[clave].nombre}</div>
              <div class="resumen__etiqueta">${TEXTOS[clave].meta}</div>
            </div>
            <div class="objetivo__cifra">
              <span class="objetivo__porcentaje">${porcentaje(pr)}</span>
              <span class="objetivo__cifra-etiqueta">probabilidad</span>
            </div>
            <div class="medidor" aria-hidden="true"><span class="medidor__valor" data-valor="${pr ?? 0}"></span></div>
            <p class="objetivo__detalle"><span class="estado">${etiqueta}</span>${detalle(clave, r)}</p>
          </li>`;
      })
      .join("");

    const pendientes = partidos
      .filter((x) => !La16.jugado(x) && (x.local === id || x.visita === id))
      .map((x) => {
        const esLocal = x.local === id;
        const rival = equipos.get(esLocal ? x.visita : x.local);
        return `
          <li>
            <span class="pendientes__j">J${x.j}</span>
            <span class="pendientes__rival">${escudo(rival)}${esLocal ? "vs" : "en"} ${rival.nombre}</span>
            <span class="pendientes__cond">${cuando(x)}</span>
          </li>`;
      })
      .join("");

    const simulacion = cantidadSimulados()
      ? `<p class="nota">Este análisis incluye tus resultados simulados.</p>`
      : "";

    $("analisis").innerHTML = `
      <div class="acciones">
        <button class="boton boton--linea" type="button" id="boton-mio" aria-pressed="${esMio}">${esMio ? "Es tu equipo" : "Marcar como mi equipo"}</button>
        <button class="boton boton--solido" type="button" id="boton-compartir">Compartir</button>
      </div>
      <div class="resumen">
        <div class="resumen__dato"><span class="resumen__valor">${a.fila.pos}.°</span><span class="resumen__etiqueta">Posición</span></div>
        <div class="resumen__dato"><span class="resumen__valor">${a.fila.pts}</span><span class="resumen__etiqueta">Puntos</span></div>
        <div class="resumen__dato"><span class="resumen__valor">${a.maximo}</span><span class="resumen__etiqueta">Máximo posible</span></div>
        <div class="resumen__dato"><span class="resumen__valor">${a.restantes}</span><span class="resumen__etiqueta">Partidos por jugar</span></div>
      </div>
      <ul class="objetivos">${objetivos}</ul>
      <p class="nota">Cálculo conservador: si puede terminar empatado en puntos con otro equipo, se asume que el desempate le sale en contra.</p>
      <p class="nota">Probabilidad estimada: se simula 4000 veces el resto del torneo según los goles a favor y en contra de cada equipo y la ventaja de jugar en casa. No toma en cuenta lesiones, fichajes ni rachas.</p>
      ${simulacion}
      ${graficoEvolucion(id)}
      ${pendientes ? `<h2 class="subtitulo">Le queda por jugar</h2><ul class="pendientes">${pendientes}</ul>${enlacesCalendario(id)}` : ""}`;
  }

  // --- Navegación y render ---
  // Rutas: #tabla, #jornadas, #equipo y #equipo/MOT (enlace directo a un equipo).
  function vistaActual() {
    const [vista, param] = location.hash.slice(1).split("/");
    return { vista: VISTAS.includes(vista) ? vista : "tabla", param };
  }

  function renderGlobal() {
    const tabla = La16.calcularTabla(La16.equipos, partidosEfectivos(), La16.torneo.desempate);
    renderBug(tabla);
    renderAviso();
    pintarEscudos();
    return tabla;
  }

  function render() {
    const { vista, param } = vistaActual();
    if (vista === "equipo" && equipos.has(param)) estado.equipo = param;

    const partidos = partidosEfectivos();
    const tabla = renderGlobal();

    VISTAS.forEach((v) => {
      $(`vista-${v}`).hidden = v !== vista;
      const tab = $(`tab-${v}`);
      tab.setAttribute("aria-selected", String(v === vista));
      tab.tabIndex = v === vista ? 0 : -1;
    });

    if (vista === "tabla") {
      const tablaReal = La16.calcularTabla(La16.equipos, La16.partidos, La16.torneo.desempate);
      renderTabla(tabla, tablaReal, partidos);
    } else if (vista === "jornadas") {
      renderJornadas(partidos);
    } else {
      renderEquipo(tabla, partidos);
    }
    pintarEscudos();
    pintarMedidores();
  }

  function cambiarJornada(delta) {
    estado.jornada = Math.min(TOTAL_JORNADAS, Math.max(1, estado.jornada + delta));
    render();
  }

  // --- Eventos ---
  document.querySelector(".pestanas").addEventListener("click", (e) => {
    const tab = e.target.closest("[data-vista]");
    if (!tab) return;
    location.hash = tab.dataset.vista === "equipo" && estado.equipo ? `equipo/${estado.equipo}` : tab.dataset.vista;
  });

  document.querySelector(".pestanas").addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = VISTAS.indexOf(vistaActual().vista);
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
    history.replaceState(null, "", `#equipo/${estado.equipo}`);
    render();
  });

  $("analisis").addEventListener("click", (e) => {
    if (e.target.closest("#boton-compartir")) compartir(estado.equipo);
    if (e.target.closest("#boton-mio")) {
      estado.miEquipo = estado.miEquipo === estado.equipo ? null : estado.equipo;
      guardar(CLAVE_MIO, estado.miEquipo);
      render();
      $("boton-mio").focus();
      avisar(estado.miEquipo ? `${equipos.get(estado.miEquipo).nombre} es tu equipo` : "Ya no sigues a ningún equipo");
    }
  });
  $("analisis").addEventListener("pointermove", alMoverSobreGrafico);
  $("analisis").addEventListener("pointerdown", alMoverSobreGrafico);
  $("analisis").addEventListener("pointerleave", alSalirDelGrafico, true);

  $("borrar-sim").addEventListener("click", () => {
    estado.simulados = {};
    guardar(CLAVE_SIM, null);
    render();
  });

  window.addEventListener("hashchange", render);

  function renderPie() {
    const [a, m, d] = La16.torneo.actualizado.split("-").map(Number);
    const actualizado = new Intl.DateTimeFormat("es-HN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(a, m - 1, d));
    $("pie-actualizado").textContent = `Resultados actualizados al ${actualizado}.`;
  }

  // --- Datos nuevos sin recargar la página ---
  const CADA = 5 * 60 * 1000;
  let ultimaRevision = Date.now();

  // Vuelve a cargar js/data.js (se permite por la CSP porque es del mismo sitio)
  // y recalcula todo si cambió algún resultado, fecha u hora.
  function buscarDatosNuevos() {
    if (document.visibilityState !== "visible" || !navigator.onLine) return;
    if (document.activeElement && document.activeElement.matches("input, select")) return;
    ultimaRevision = Date.now();
    const antes = JSON.stringify(La16.partidos);
    const script = document.createElement("script");
    script.src = `js/data.js?t=${Date.now()}`;
    script.onload = () => {
      script.remove();
      if (JSON.stringify(La16.partidos) === antes) return;
      renderPie();
      render();
      avisar("Resultados actualizados");
    };
    script.onerror = () => script.remove();
    document.head.appendChild(script);
  }

  setInterval(buscarDatosNuevos, CADA);
  document.addEventListener("visibilitychange", () => {
    if (Date.now() - ultimaRevision > 60 * 1000) buscarDatosNuevos();
  });

  // --- Sin conexión ---
  function renderConexion() {
    $("aviso-conexion").hidden = navigator.onLine;
  }
  window.addEventListener("online", () => {
    renderConexion();
    buscarDatosNuevos();
  });
  window.addEventListener("offline", renderConexion);

  const local = ["localhost", "127.0.0.1"].includes(location.hostname);
  if ("serviceWorker" in navigator && (location.protocol === "https:" || local)) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  renderConexion();
  renderPie();
  render();
})(window.La16);
