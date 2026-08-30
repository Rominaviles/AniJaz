/* ============================================================
   ANIDEX — Capa de datos (api.js)
   ------------------------------------------------------------
   Este archivo centraliza TODO el acceso a datos de anime.
   Ahora mismo cada función devuelve datos locales de
   js/mock-data.js, simulando una llamada de red con un pequeño
   retraso. La firma de cada función (parámetros y forma del
   dato que devuelve) ya está pensada para no tener que tocar
   nada del resto del sitio cuando conectes tu API real:
   solo reemplazá el cuerpo marcado con "TODO".

   Convención esperada en cada anime que devuelvas:
   {
     id, numero, titulo, tituloOriginal, generos: [],
     estudio, anio, temporada, episodios, duracionMin,
     rating, estado, sinopsis, colorA, colorB
   }
   Si tu API usa nombres de campo distintos, lo más simple es
   "mapear" la respuesta a esta forma dentro de cada función,
   así el resto del código (utils.js, catalogo.js, detalle.js...)
   no necesita cambiar.
   ============================================================ */

const ANIDEX_CONFIG = {
  // TODO: reemplazar por la URL base real de tu API cuando la tengas.
  BASE_URL: "https://TU-API.example.com/v1",
  API_KEY: "" // TODO: si tu API requiere key, ponerla acá (o mejor, en una variable de entorno del lado servidor)
};

/** Simula la latencia de una petición de red real. */
function _retrasoSimulado(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Busca animes por texto libre (título).
 * @param {string} query
 * @returns {Promise<Array>}
 */
async function buscarAnimes(query) {
  // === TODO: INTEGRACIÓN CON API EXTERNA ===
  // Reemplazar por algo como:
  //
  // const params = new URLSearchParams({ q: query });
  // const res = await fetch(`${ANIDEX_CONFIG.BASE_URL}/animes/buscar?${params}`, {
  //   headers: { Authorization: `Bearer ${ANIDEX_CONFIG.API_KEY}` }
  // });
  // if (!res.ok) throw new Error(`Error ${res.status} al buscar animes`);
  // const data = await res.json();
  // return data.resultados.map(mapearAnimeDesdeApi); // ver mapearAnimeDesdeApi() más abajo
  //
  // --- Implementación actual con datos locales ---
  await _retrasoSimulado();
  const q = (query || "").trim().toLowerCase();
  if (!q) return [...MOCK_ANIMES];
  return MOCK_ANIMES.filter((a) =>
    a.titulo.toLowerCase().includes(q) ||
    a.tituloOriginal.toLowerCase().includes(q) ||
    a.generos.some((g) => g.toLowerCase().includes(q))
  );
}

/**
 * Obtiene el catálogo completo, opcionalmente filtrado.
 * @param {{genero?:string, temporada?:string, estado?:string, orden?:string, q?:string}} filtros
 * @returns {Promise<Array>}
 */
async function obtenerCatalogo(filtros = {}) {
  // === TODO: INTEGRACIÓN CON API EXTERNA ===
  // Reemplazar por algo como:
  //
  // const params = new URLSearchParams(filtros);
  // const res = await fetch(`${ANIDEX_CONFIG.BASE_URL}/animes?${params}`);
  // if (!res.ok) throw new Error(`Error ${res.status} al obtener el catálogo`);
  // const data = await res.json();
  // return data.resultados.map(mapearAnimeDesdeApi);
  //
  // --- Implementación actual con datos locales ---
  await _retrasoSimulado();
  let lista = [...MOCK_ANIMES];

  if (filtros.q) {
    const q = filtros.q.toLowerCase();
    lista = lista.filter((a) => a.titulo.toLowerCase().includes(q));
  }
  if (filtros.genero) {
    lista = lista.filter((a) => a.generos.includes(filtros.genero));
  }
  if (filtros.temporada) {
    lista = lista.filter((a) => a.temporada === filtros.temporada);
  }
  if (filtros.estado) {
    lista = lista.filter((a) => a.estado === filtros.estado);
  }

  switch (filtros.orden) {
    case "rating-desc":
      lista.sort((a, b) => b.rating - a.rating);
      break;
    case "anio-desc":
      lista.sort((a, b) => b.anio - a.anio);
      break;
    case "anio-asc":
      lista.sort((a, b) => a.anio - b.anio);
      break;
    default:
      lista.sort((a, b) => a.numero.localeCompare(b.numero));
  }

  return lista;
}

/**
 * Obtiene un anime puntual por id (para la página de detalle).
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
async function obtenerAnimePorId(id) {
  // === TODO: INTEGRACIÓN CON API EXTERNA ===
  // Reemplazar por algo como:
  //
  // const res = await fetch(`${ANIDEX_CONFIG.BASE_URL}/animes/${encodeURIComponent(id)}`);
  // if (res.status === 404) return null;
  // if (!res.ok) throw new Error(`Error ${res.status} al obtener el anime`);
  // const data = await res.json();
  // return mapearAnimeDesdeApi(data);
  //
  // --- Implementación actual con datos locales ---
  await _retrasoSimulado();
  return MOCK_ANIMES.find((a) => a.id === id) || null;
}

/**
 * Devuelve una selección de animes destacados para el inicio.
 * @returns {Promise<Array>}
 */
async function obtenerDestacados() {
  // === TODO: INTEGRACIÓN CON API EXTERNA ===
  // Reemplazar por algo como:
  //
  // const res = await fetch(`${ANIDEX_CONFIG.BASE_URL}/animes/destacados`);
  // if (!res.ok) throw new Error(`Error ${res.status} al obtener destacados`);
  // const data = await res.json();
  // return data.resultados.map(mapearAnimeDesdeApi);
  //
  // --- Implementación actual con datos locales ---
  await _retrasoSimulado();
  return [...MOCK_ANIMES].sort((a, b) => b.rating - a.rating).slice(0, 4);
}

/**
 * Devuelve animes emparentados por género, excluyendo el propio id.
 * Útil para la sección "También te puede interesar" del detalle.
 * @param {string} id
 * @param {string[]} generos
 * @returns {Promise<Array>}
 */
async function obtenerRelacionados(id, generos) {
  // Esta función puede quedarse resolviéndose en el cliente
  // (sobre el resultado de obtenerCatalogo) incluso con la API real,
  // o reemplazarse por un endpoint dedicado tipo /animes/:id/relacionados.
  await _retrasoSimulado(150);
  return MOCK_ANIMES
    .filter((a) => a.id !== id && a.generos.some((g) => generos.includes(g)))
    .slice(0, 3);
}

/**
 * Ejemplo de función "mapeadora": traduce la forma de la respuesta
 * de tu API futura a la forma que usa el resto del sitio.
 * Ajustá los nombres de campo de la izquierda según tu API real.
 */
function mapearAnimeDesdeApi(item) {
  return {
    id: item.id ?? item.slug,
    numero: item.numero ?? String(item.mal_id ?? "").padStart(3, "0"),
    titulo: item.titulo ?? item.title,
    tituloOriginal: item.tituloOriginal ?? item.title_japanese ?? "",
    generos: item.generos ?? (item.genres || []).map((g) => g.name),
    estudio: item.estudio ?? (item.studios?.[0]?.name || "—"),
    anio: item.anio ?? item.year,
    temporada: item.temporada ?? item.season,
    episodios: item.episodios ?? item.episodes,
    duracionMin: item.duracionMin ?? 24,
    rating: item.rating ?? item.score,
    estado: item.estado ?? item.status,
    sinopsis: item.sinopsis ?? item.synopsis,
    colorA: item.colorA ?? "#e63384",
    colorB: item.colorB ?? "#161d38"
  };
}
