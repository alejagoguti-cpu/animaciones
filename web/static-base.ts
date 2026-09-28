// staticFile() arma las rutas de public/ con esta base. En GitHub Pages el
// sitio vive en /animaciones/, así que hay que decírselo antes de cargar
// cualquier composición.
declare global {
  interface Window {
    remotion_staticBase: string;
  }
}

window.remotion_staticBase = import.meta.env.BASE_URL.replace(/\/$/, "");

export {};
