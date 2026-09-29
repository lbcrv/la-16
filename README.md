# La 16

Tabla de posiciones, jornadas y simulador del Apertura 2026 de la Liga Nacional de Honduras. El nombre viene de las 16 jornadas del formato nuevo.

Proyecto independiente de aficionados, sin afiliación con la Liga Nacional de Fútbol Profesional de Honduras ni con los clubes. No usa escudos, logos ni marcas oficiales.

## Qué hace

- **Tabla:** se calcula a partir de los resultados, con las zonas de semifinal directa (1.° y 2.°), repechaje (3.° a 6.°) y repechaje de descenso (12.°), los últimos 5 resultados y un filtro por grupo.
- **Jornadas:** resultados de cada jornada. En los partidos pendientes puedes escribir un marcador y la tabla se recalcula, con flechas que muestran quién sube y quién baja. La simulación se guarda solo en el navegador.
- **¿Qué necesita?:** para cada equipo, indica si ya aseguró o perdió la semifinal directa, la liguilla o la permanencia fuera del último lugar, o cuántos puntos necesita para conseguirlo sin depender de nadie.

## Cómo abrirlo

Abre `index.html` en el navegador. No tiene dependencias ni paso de compilación. Para servirlo en local:

```bash
python -m http.server 8716
```

Se puede publicar tal cual en GitHub Pages, Netlify o Cloudflare Pages.

## Cómo actualizar resultados

Todo está en `js/data.js`:

1. Busca el partido y llena `gl` (goles del local) y `gv` (goles de la visita).
2. Cambia `La16.torneo.actualizado` a la fecha del último partido capturado.

## Pendiente de verificar

- **Desempates:** el orden en `La16.torneo.desempate` sale de las bases de la temporada 2025-26 (diferencia de goles, goles a favor y luego la serie particular), y coincide con las tablas publicadas. Hay que confirmarlo con las bases 2026-27. Si cambia, basta con reordenar ese arreglo.
- **Jornada 9:** no se encontró ni la fecha ni la localía. Los cruces salen del calendario completo (es la única ronda que falta) y la localía se dedujo del reparto de partidos en casa de cada equipo.
- **Jornada 16:** falta la hora de los partidos (se juegan el 21 o 22 de noviembre).
- **Colores:** siete equipos usan el color neutro porque sus colores no están confirmados. Se editan con `color` y `texto` en `La16.equipos`.
- **Excepción del descenso:** las fuentes no coinciden en qué pasa si el último del Apertura clasifica a la liguilla del Clausura, así que la app no la aplica.

## Fuentes de los datos

- Resultados de las jornadas 1 a 8: Wikipedia, "Torneo Apertura 2026 (Honduras)". Se comprobaron contra la tabla de aquehorajuegan.com y coinciden.
- Calendario de las jornadas 10 a 16: Deportes TVC y Radio HRN (26 de septiembre de 2026). Las dos fuentes coinciden.
