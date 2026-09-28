# Animaciones Bitaxus

Videos promocionales hechos con [Remotion](https://www.remotion.dev/) (React → MP4), con el look de [bitaxus.com](https://www.bitaxus.com/): fondo negro, resplandores rojos, rejilla de puntos y botones de vidrio.

## Ver en la web

La página con el reproductor (`web/`) se publica sola en **https://alejagoguti-cpu.github.io/animaciones/** cada vez que se sube un cambio a `main` (ver `.github/workflows/pages.yml`).

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
| `src/theme.ts` | Colores y fuentes de la marca |
| `src/BitaxusPromo.tsx` | Orden y duración de las escenas, transiciones |
| `src/scenes/` | Cada escena del video (hook, chat, beneficios, global, cierre) |
| `src/components/` | Piezas reutilizables: fondo, pastilla de vidrio, texto animado, teléfono, burbujas de chat |

Para cambiar un texto, edita la escena correspondiente. Para cambiar cuánto dura una escena, cambia `SCENES` en `src/BitaxusPromo.tsx` (30 frames = 1 segundo).

## Marca

- **Titulares:** fuente Belamor (`public/fonts/`), cargada en `src/theme.ts`. Texto corrido: Montserrat.
- **Logo:** `public/logo.png`, usado desde `src/components/Logo.tsx`.
