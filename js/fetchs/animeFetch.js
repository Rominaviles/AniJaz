
const BASE_URL = "https://kitsu.io/api/edge";

async function fetchFromApi(endpoint) {
  const response = await fetch(`${BASE_URL}${endpoint}`);
  if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
  return await response.json();
}

async function fetchAnimeEmision() {
  return fetchFromApi(`/anime?filter[status]=current&sort=-userCount&page[limit]=4`);
}

async function fetchAnimeDestacados() {
  return fetchFromApi(`/anime?sort=-averageRating&page[limit]=4`);
}

async function fetchAnimeProximos() {
  return fetchFromApi(`/anime?filter[status]=upcoming&sort=-userCount&page[limit]=4`);
}

async function fetchDatosIndex() {
  const [emision, destacados, proximos] = await Promise.all([
    fetchAnimeEmision(),
    fetchAnimeDestacados(),
    fetchAnimeProximos()
  ]);
  return { emision, destacados, proximos };
}

async function fetchAnimePorId(id) {
  return fetchFromApi(`/anime/${id}?include=categories`);
}

let _cacheGeneros = null;

async function fetchGeneros() {
  if (_cacheGeneros) return _cacheGeneros;
  _cacheGeneros = await fetchFromApi(`/categories?page[limit]=10000&sort=title`);
  return _cacheGeneros;
}

function fetchAnimeCatalogo({ busqueda = "", genero = "", estado = "", temporada = "", anio = "", orden = "", pagina = 1 } = {}) {
  const LIMITE = 10;
  const offset = (pagina - 1) * LIMITE;
  const params = new URLSearchParams();

  if (busqueda) {
    params.set("filter[text]", busqueda);
  } else {
    if (genero) params.set("filter[categories]", genero);
    if (estado) params.set("filter[status]", estado);
    if (temporada) params.set("filter[season]", temporada);
    if (anio) params.set("filter[seasonYear]", anio);
  }

  params.set("sort", orden || "-userCount");
  params.set("page[limit]", String(LIMITE));
  params.set("page[offset]", String(offset));

  return fetchFromApi(`/anime?${params.toString()}`);
}

// Mymemory
const _cacheTraducciones = new Map();

async function traducirChunk(chunk) {
  const res = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|es`
  );
  if (!res.ok) throw new Error(`Traducción falló: ${res.status}`);
  const data = await res.json();
  return data.responseData?.translatedText ?? chunk;
}

async function traducirTexto(texto) {
  if (!texto || texto === "Sin sinopsis disponible.") return texto;
  if (_cacheTraducciones.has(texto)) return _cacheTraducciones.get(texto);

  try {
    const chunks = splitTextForTranslation(texto); 
    const traducidos = [];
    for (const chunk of chunks) {
      traducidos.push(await traducirChunk(chunk));
    }
    const traducido = traducidos.join(" ");
    _cacheTraducciones.set(texto, traducido);
    return traducido;
  } catch (error) {
    console.error("Error al traducir sinopsis:", error);
    return texto;
  }
}