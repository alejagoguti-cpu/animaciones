# Animaciones Bitaxus

Videos promocionales hechos con [Remotion](https://www.remotion.dev/) (React → MP4), con el look de [bitaxus.com](https://www.bitaxus.com/): fondo negro, resplandores rojos, rejilla de puntos y botones de vidrio.

## Ver en la web

- **Editor (Remotion Studio):** https://alejagoguti-cpu.github.io/animaciones/
- **Reproductor simple:** https://alejagoguti-cpu.github.io/animaciones/player/

Ambos se publican solos cada vez que se sube un cambio a `main` (ver `.github/workflows/pages.yml`).

## Editar desde la web

1. Abre el editor y despliega el panel derecho (botón arriba a la derecha) → pestaña **Props**.
2. Cambia textos, mensajes del chat, montos, color de acento o la duración de cada escena. El video se actualiza en vivo.
3. Para descargar el MP4: botón **Render in browser** (o tecla `R`) → **Render video**.

Los cambios hechos en la web no se guardan en el repo. Para dejarlos fijos, copia el contenido de la pestaña **JSON** del panel Props y pégalo en `defaultPromoProps` de `src/schema.ts`.

## Uso

```bash
npm install        # solo la primera vez
npm run dev        # abre Remotion Studio en el navegador para ver el video
npm run render     # exporta out/bitaxus-promo.mp4 (1080x1920, Reels/Stories)
npm run render:square  # exporta out/bitaxus-promo-square.mp4 (1080x1350, feed)
```

## Estructura

| Archivo | Qué es |
| --- | --- |
| `src/schema.ts` | Campos editables (textos, color, duraciones) y sus valores por defecto |
| `src/theme.ts` | Colores y fuentes de la marca |
| `src/BitaxusPromo.tsx` | Orden de las escenas y transiciones |
| `src/scenes/` | Cada escena del video (hook, chat, beneficios, global, cierre) |
| `src/components/` | Piezas reutilizables: fondo, pastilla de vidrio, texto animado, teléfono, burbujas de chat |

Textos y duraciones (en segundos) viven en `defaultPromoProps` de `src/schema.ts`.

## Marca

- **Titulares:** fuente Belamor (`public/fonts/`), cargada en `src/theme.ts`. Texto corrido: Montserrat.
- **Logo:** `public/logo.png`, usado desde `src/components/Logo.tsx`.
