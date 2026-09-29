# La 16

Tabla de posiciones, jornadas y simulador del Apertura 2026 de la Liga Nacional de Honduras. El nombre viene de las 16 jornadas del formato nuevo.

**En vivo:** https://lbcrv.github.io/la-16/

Proyecto independiente de aficionados, sin afiliación con la Liga Nacional de Fútbol Profesional de Honduras ni con los clubes. No usa escudos, logos ni marcas oficiales.

## Qué hace

- **Tabla:** se calcula a partir de los resultados. Marca las zonas de semifinal directa (1.° y 2.°), repechaje (3.° a 6.°) y repechaje de descenso (12.°), muestra los últimos 5 resultados de cada equipo y tiene un filtro por grupo.
- **Jornadas:** resultados de cada jornada. En los partidos pendientes puedes escribir un marcador y la tabla se recalcula, con flechas que muestran quién sube y quién baja. La simulación se guarda solo en el navegador.
- **¿Qué necesita?:** para cada equipo indica si ya aseguró o perdió la semifinal directa, la liguilla o la permanencia fuera del último lugar, o cuántos puntos necesita para conseguirlo sin depender de nadie.

## Cómo abrirlo en local

Sin dependencias ni paso de compilación:

```bash
python -m http.server 8716
```

Luego abre http://localhost:8716. También funciona con doble clic en `index.html`, aunque en ese caso la consola muestra avisos inofensivos sobre la precarga de fuentes.

## Actualización automática

La tarea `.github/workflows/publicar.yml` hace dos cosas:

1. **Actualizar**, tres veces al día (10 p. m., 1 a. m. y 8 a. m. hora de Honduras). Ejecuta `scripts/actualizar.mjs`, que consulta TheSportsDB y escribe en `js/data.js`. Si hubo cambios, hace commit y publica.
2. **Publicar** el sitio en GitHub Pages en cada push a `main`.

Reglas del script:

- Solo llena marcadores vacíos. Nunca sobrescribe un resultado ya capturado, así que una corrección hecha a mano se respeta.
- Solo acepta partidos marcados como terminados y goles enteros entre 0 y 30. De la API no se copia ningún texto a la página.
- En partidos pendientes actualiza la fecha y la hora si la liga las cambió. Si varios partidos de una jornada traen exactamente la misma hora, la toma como provisional y la ignora.
- Solo consulta las jornadas que tienen algo por llenar, con pausas para no pasar el límite de la API gratuita.

Para correrlo a mano: `node scripts/actualizar.mjs`. En GitHub también se puede lanzar desde **Actions → Actualizar y publicar → Run workflow**.

La clave gratuita de TheSportsDB (`123`) es para pruebas y tiene límites. Si se contrata un plan, la clave se guarda como secreto del repo con el nombre `THESPORTSDB_KEY` y el script la usa sola.

Si el script no reconoce un equipo o un partido, lo deja como aviso en el registro de la tarea sin tocar los datos.

## Cómo corregir un resultado a mano

Todo está en `js/data.js`. Cada partido ocupa una línea con el mismo formato, que el script necesita para reconocerla:

1. Busca el partido y llena `gl` (goles del local) y `gv` (goles de la visita).
2. Cambia `La16.torneo.actualizado` a la fecha del último partido capturado.

## Seguridad

- Política de seguridad de contenido (CSP) estricta: solo se cargan scripts, estilos, fuentes e imágenes del propio sitio. No hay estilos ni scripts en línea.
- Sin dependencias externas en tiempo de ejecución: las fuentes se sirven desde el propio sitio, sin Google Fonts.
- La tarea de GitHub corre con permisos mínimos y las acciones están fijadas por hash de commit.
- GitHub Pages sirve el sitio por HTTPS.

## Pendiente de verificar

- **Desempates:** el orden en `La16.torneo.desempate` sale de las bases de la temporada 2025-26 (diferencia de goles, goles a favor y luego la serie particular), y coincide con las tablas publicadas. Hay que confirmarlo con las bases 2026-27. Si cambia, basta con reordenar ese arreglo.
- **Independiente–Marathón (J11):** TVC y HRN lo ponen a las 7:30 p. m. y TheSportsDB a las 6:30 p. m. Se usa el dato de la API.
- **Excepción del descenso:** las fuentes no coinciden en qué pasa si el último del Apertura clasifica a la liguilla del Clausura, así que la app no la aplica.

## Fuentes de los datos

- Resultados de las jornadas 1 a 8: Wikipedia, "Torneo Apertura 2026 (Honduras)". Se comprobaron contra la tabla de aquehorajuegan.com y contra TheSportsDB, y los tres coinciden.
- Calendario de las jornadas 10 a 16: Deportes TVC y Radio HRN (26 de septiembre de 2026).
- Actualizaciones: API de TheSportsDB (liga 4818, temporada 2026-2027). Las horas vienen en UTC y se pasan a la hora de Honduras (UTC−6).

## Créditos

Tipografías Barlow y Barlow Condensed, de The Barlow Project Authors, con licencia SIL Open Font License 1.1 (ver `assets/fonts/OFL.txt`).
