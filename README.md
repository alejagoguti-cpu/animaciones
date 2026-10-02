# Animaciones Bitaxus

Videos promocionales hechos con [Remotion](https://www.remotion.dev/) (React → MP4), con el look de [bitaxus.com](https://www.bitaxus.com/): fondo negro, resplandores rojos, rejilla de puntos y botones de vidrio.

## En la web

- **Editor de animaciones (tipo Canva):** https://alejagoguti-cpu.github.io/animaciones/
- **Remotion Studio (video original):** https://alejagoguti-cpu.github.io/animaciones/studio/

Se publican solos cada vez que se sube un cambio a `main` (ver `.github/workflows/pages.yml`).

## Editor de animaciones

Código en `web/` (la app) y `src/editor/` (formato de los diseños y cómo se dibujan en video).

- **Acceso libre:** sin inicio de sesión. Cualquiera con el enlace puede crear, editar y borrar diseños (proyecto Supabase `bitaxus-animaciones`).
- **Guardado:** cada diseño se guarda solo en la tabla `designs`; los archivos subidos van al bucket `uploads`.
- **Lienzo:** arrastrar, redimensionar (Shift mantiene proporción), rotar, imanes al centro y a los bordes (Alt los desactiva).
- **Elementos:** textos (Belamor / Montserrat), logo, botón de vidrio, tarjeta, teléfono con chat, contador, formas, imágenes y videos.
- **Vectores:** pluma para dibujar (clic = punto, arrastrar = curva), 16 formas e íconos, relleno/degradado/borde, y edición de puntos con doble clic.
- **Doble clic:** en textos, botones y tarjetas se escribe directo sobre el lienzo (en la tarjeta: ícono, título y texto; Enter pasa de uno al siguiente); en vectores, edita los puntos.
- **Animaciones:** entrada, salida y movimiento continuo por elemento; cuándo aparece y se va se ajusta en la línea de tiempo.
- **Escenas:** varias escenas con transición y duración propias; formatos 9:16, 4:5, 1:1 y 16:9.
- **Exportar:** el MP4 se genera en el navegador (Chrome o Edge).
- **Assets de marca:** `public/assets/` con su lista en `public/assets/manifest.json`.
- **Selección múltiple:** Shift o Ctrl + clic suma o quita elementos, arrastrar sobre una zona vacía dibuja un recuadro de selección, Ctrl+A selecciona todo. Mover, copiar, cortar, pegar, duplicar y eliminar funcionan con todos a la vez.
- **Atajos:** Ctrl+Z / Ctrl+Y deshacer y rehacer, Ctrl+C / Ctrl+X / Ctrl+V copiar, cortar y pegar (entre escenas, diseños y pestañas; si pegas texto o una imagen del portapapeles, crea un texto o una imagen), Ctrl+D duplicar, Supr eliminar, clic derecho sobre el lienzo para el menú (copiar, cortar, pegar, duplicar, capas, eliminar), Ctrl+] / Ctrl+[ subir y bajar capa (con Shift, al frente o al fondo), Tab y Shift+Tab cambiar de elemento, Inicio / Fin ir al principio o final de la escena, flechas mover (Shift = 10 px), Espacio reproducir.
- **Modo prueba sin guardar:** `#/demo` al final de la dirección.

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
