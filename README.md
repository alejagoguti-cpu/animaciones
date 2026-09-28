# Animaciones Bitaxus

Videos promocionales hechos con [Remotion](https://www.remotion.dev/) (React → MP4), con el look de [bitaxus.com](https://www.bitaxus.com/): fondo negro, resplandores rojos, rejilla de puntos y botones de vidrio.

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

## Fuente de titulares

La web usa **Belamor** para los titulares. Aquí se usa **Audiowide** (Google Fonts), que se le parece y es libre. Si tienes la licencia comercial de Belamor:

1. Copia el archivo a `public/fonts/Belamor.ttf`.
2. En `src/theme.ts`, cambia la fuente `display` por una carga local con `@remotion/fonts`.

## Logo

`src/components/Logo.tsx` dibuja el wordmark con texto. Para usar el logo real, pon el archivo en `public/logo.png` y usa `<Img src={staticFile("logo.png")} />`.
