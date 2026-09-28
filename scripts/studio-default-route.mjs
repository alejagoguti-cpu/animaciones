// El Remotion Studio publicado en la web usa rutas "?/Composición".
// Si se abre la página sin ninguna, se abre el video principal.
import { readFileSync, writeFileSync } from "node:fs";

const file = "build/studio/index.html";
const script =
  '<script>if(!location.search.startsWith("?/"))' +
  'history.replaceState(null,"",location.pathname+"?/BitaxusPromo")</script>';

writeFileSync(file, readFileSync(file, "utf8").replace("<head>", `<head>${script}`));
