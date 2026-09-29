// Cálculo de la tabla y de lo que necesita cada equipo. Sin acceso al DOM.
window.La16 = window.La16 || {};

(function (La16) {
  function jugado(p) {
    return p.gl != null && p.gv != null;
  }

  function idPartido(p) {
    return p.local + "-" + p.visita;
  }

  function filaVacia(equipo) {
    return { equipo, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0, forma: [] };
  }

  function sumar(fila, favor, contra) {
    fila.pj++;
    fila.gf += favor;
    fila.gc += contra;
    fila.dg = fila.gf - fila.gc;
    if (favor > contra) {
      fila.g++;
      fila.pts += 3;
      fila.forma.push("G");
    } else if (favor === contra) {
      fila.e++;
      fila.pts += 1;
      fila.forma.push("E");
    } else {
      fila.p++;
      fila.forma.push("P");
    }
  }

  // Mini tabla con solo los partidos entre los equipos empatados.
  function serieParticular(ids, partidos) {
    const stats = new Map(ids.map((id) => [id, { pts: 0, dg: 0, golesVisita: 0 }]));
    for (const p of partidos) {
      if (!stats.has(p.local) || !stats.has(p.visita)) continue;
      const l = stats.get(p.local);
      const v = stats.get(p.visita);
      l.dg += p.gl - p.gv;
      v.dg += p.gv - p.gl;
      v.golesVisita += p.gv;
      if (p.gl > p.gv) l.pts += 3;
      else if (p.gl < p.gv) v.pts += 3;
      else {
        l.pts += 1;
        v.pts += 1;
      }
    }
    return stats;
  }

  const criterios = {
    dg: (a, b) => b.dg - a.dg,
    gf: (a, b) => b.gf - a.gf,
    h2hPts: (a, b, h) => h.get(b.equipo.id).pts - h.get(a.equipo.id).pts,
    h2hDg: (a, b, h) => h.get(b.equipo.id).dg - h.get(a.equipo.id).dg,
    h2hGolesVisita: (a, b, h) => h.get(b.equipo.id).golesVisita - h.get(a.equipo.id).golesVisita,
  };

  function calcularTabla(equipos, partidos, ordenDesempate) {
    const filas = new Map(equipos.map((e) => [e.id, filaVacia(e)]));
    const jugados = partidos.filter(jugado).sort((a, b) => a.j - b.j);

    for (const p of jugados) {
      sumar(filas.get(p.local), p.gl, p.gv);
      sumar(filas.get(p.visita), p.gv, p.gl);
    }

    const lista = [...filas.values()].sort((a, b) => b.pts - a.pts);
    const tabla = [];
    let i = 0;
    while (i < lista.length) {
      let fin = i;
      while (fin < lista.length && lista[fin].pts === lista[i].pts) fin++;
      const empatados = lista.slice(i, fin);
      if (empatados.length > 1) {
        const h = serieParticular(empatados.map((f) => f.equipo.id), jugados);
        empatados.sort((a, b) => {
          for (const clave of ordenDesempate) {
            const r = criterios[clave](a, b, h);
            if (r !== 0) return r;
          }
          return a.equipo.nombre.localeCompare(b.equipo.nombre, "es");
        });
      }
      tabla.push(...empatados);
      i = fin;
    }

    tabla.forEach((fila, idx) => {
      fila.pos = idx + 1;
      fila.forma = fila.forma.slice(-5);
    });
    return tabla;
  }

  // Los puntos posibles con n partidos: cualquier valor de 0 a 3n salvo 3n - 1.
  function redondearAlcanzable(puntos, restantes) {
    return restantes > 0 && puntos === 3 * restantes - 1 ? 3 * restantes : puntos;
  }

  // Cálculo conservador: un empate en puntos se cuenta siempre en contra,
  // porque los desempates dependen de goles que aún no existen.
  function analizarEquipo(tabla, partidos, id) {
    const restantes = new Map(tabla.map((f) => [f.equipo.id, 0]));
    const contraMi = new Map(tabla.map((f) => [f.equipo.id, 0]));
    for (const p of partidos) {
      if (jugado(p)) continue;
      restantes.set(p.local, restantes.get(p.local) + 1);
      restantes.set(p.visita, restantes.get(p.visita) + 1);
      if (p.local === id) contraMi.set(p.visita, contraMi.get(p.visita) + 1);
      if (p.visita === id) contraMi.set(p.local, contraMi.get(p.local) + 1);
    }
    const maximo = (f) => f.pts + 3 * restantes.get(f.equipo.id);
    // Máximo de un rival si yo gano todos mis partidos, incluidos los que juego contra él.
    const maximoSiGanoTodo = (f) => maximo(f) - 3 * contraMi.get(f.equipo.id);

    const yo = tabla.find((f) => f.equipo.id === id);
    const otros = tabla.filter((f) => f !== yo);
    const misRestantes = restantes.get(id);
    const miMaximo = maximo(yo);
    const posibles = 3 * misRestantes;
    // Sin partidos pendientes la tabla ya es definitiva y los desempates son reales.
    const terminado = partidos.every(jugado);

    function entreLosPrimeros(n) {
      if (terminado) return { estado: yo.pos <= n ? "asegurado" : "eliminado" };
      const amenazas = (pts) => otros.filter((f) => maximo(f) >= pts).length;
      if (amenazas(yo.pts) < n) return { estado: "asegurado" };
      if (otros.filter((f) => f.pts > miMaximo).length >= n) return { estado: "eliminado" };
      for (let k = 1; k <= posibles; k++) {
        if (amenazas(yo.pts + k) < n) {
          return { estado: "depende", puntos: redondearAlcanzable(k, misRestantes), posibles };
        }
      }
      if (otros.filter((f) => maximoSiGanoTodo(f) >= miMaximo).length < n) {
        return { estado: "depende", puntos: posibles, posibles };
      }
      return { estado: "ajeno", posibles };
    }

    function evitarUltimo() {
      if (terminado) return { estado: yo.pos < tabla.length ? "asegurado" : "eliminado" };
      if (otros.some((f) => maximo(f) < yo.pts)) return { estado: "asegurado" };
      if (otros.every((f) => f.pts > miMaximo)) return { estado: "eliminado" };
      for (let k = 1; k <= posibles; k++) {
        if (otros.some((f) => maximo(f) < yo.pts + k)) {
          return { estado: "depende", puntos: redondearAlcanzable(k, misRestantes), posibles };
        }
      }
      if (otros.some((f) => maximoSiGanoTodo(f) < miMaximo)) {
        return { estado: "depende", puntos: posibles, posibles };
      }
      return { estado: "ajeno", posibles };
    }

    return {
      fila: yo,
      restantes: misRestantes,
      maximo: miMaximo,
      semis: entreLosPrimeros(2),
      liguilla: entreLosPrimeros(6),
      noUltimo: evitarUltimo(),
    };
  }

  // --- Probabilidades por simulación ---

  // Generador pseudoaleatorio con semilla (mulberry32): con los mismos datos,
  // las probabilidades salen iguales en cada visita.
  function generador(semilla) {
    let a = semilla >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function semillaDe(texto) {
    let h = 2166136261;
    for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619);
    return h >>> 0;
  }

  function poisson(lambda, azar) {
    const limite = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= azar();
    } while (p > limite);
    return k - 1;
  }

  // Goles esperados de cada lado: promedio de la liga como local o visita,
  // por el ataque de uno y la defensa del otro. Cada equipo suma PESO_LIGA
  // partidos "promedio" para que pocas jornadas no exageren las diferencias.
  const PESO_LIGA = 6;

  function golesEsperados(equipos, jugados) {
    const n = jugados.length;
    const local = n ? jugados.reduce((s, p) => s + p.gl, 0) / n : 1.3;
    const visita = n ? jugados.reduce((s, p) => s + p.gv, 0) / n : 1.0;
    const media = (local + visita) / 2 || 1;
    const st = new Map(equipos.map((e) => [e.id, { gf: 0, gc: 0, pj: 0 }]));
    for (const p of jugados) {
      const l = st.get(p.local);
      const v = st.get(p.visita);
      l.gf += p.gl;
      l.gc += p.gv;
      l.pj++;
      v.gf += p.gv;
      v.gc += p.gl;
      v.pj++;
    }
    const ataque = new Map();
    const defensa = new Map();
    for (const [id, s] of st) {
      ataque.set(id, (s.gf + PESO_LIGA * media) / ((s.pj + PESO_LIGA) * media));
      defensa.set(id, (s.gc + PESO_LIGA * media) / ((s.pj + PESO_LIGA) * media));
    }
    return (p) => [
      local * ataque.get(p.local) * defensa.get(p.visita),
      visita * ataque.get(p.visita) * defensa.get(p.local),
    ];
  }

  // Devuelve un objeto con paso(n): corre n simulaciones más y devuelve true al
  // terminar. Así la interfaz puede repartir el trabajo sin trabar la página.
  function crearSimulacion(equipos, partidos, ordenDesempate, total = 4000) {
    const jugados = partidos.filter(jugado);
    const pendientes = partidos.filter((p) => !jugado(p));
    const esperados = golesEsperados(equipos, jugados);
    const lambdas = pendientes.map(esperados);
    const azar = generador(semillaDe(JSON.stringify(partidos)));
    const ultimo = equipos.length;
    const conteo = new Map(equipos.map((e) => [e.id, { semis: 0, liguilla: 0, ultimo: 0 }]));
    const veces = pendientes.length ? total : 1;
    let hechas = 0;

    function sumar(tabla) {
      for (const f of tabla) {
        const c = conteo.get(f.equipo.id);
        if (f.pos <= 2) c.semis++;
        if (f.pos <= 6) c.liguilla++;
        if (f.pos === ultimo) c.ultimo++;
      }
    }

    return {
      total: veces,
      paso(n) {
        const hasta = Math.min(veces, hechas + n);
        for (; hechas < hasta; hechas++) {
          const simulados = pendientes.map((p, i) => ({
            ...p,
            gl: poisson(lambdas[i][0], azar),
            gv: poisson(lambdas[i][1], azar),
          }));
          sumar(calcularTabla(equipos, jugados.concat(simulados), ordenDesempate));
        }
        return hechas >= veces;
      },
      resultado() {
        const r = new Map();
        for (const [id, c] of conteo) {
          r.set(id, { semis: c.semis / veces, liguilla: c.liguilla / veces, ultimo: c.ultimo / veces });
        }
        return r;
      },
    };
  }

  La16.jugado = jugado;
  La16.idPartido = idPartido;
  La16.calcularTabla = calcularTabla;
  La16.analizarEquipo = analizarEquipo;
  La16.crearSimulacion = crearSimulacion;
})(window.La16);
