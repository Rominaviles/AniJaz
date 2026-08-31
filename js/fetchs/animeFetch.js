// ==========================================
// FETCH (Peticiones a la API de Kitsu)
// ==========================================

const BASE_URL = "https://kitsu.io/api/edge";

async function fetchFromApi(endpoint) {
  const response = await fetch(`${BASE_URL}${endpoint}`);
  if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
  return await response.json();
}

async function fetchAnimeEmision() {
  return fetchFromApi(`/anime?filter[status]=current&sort=-userCount&page[limit]=20`);
}

async function fetchAnimeDestacados() {
  return fetchFromApi(`/anime?sort=-averageRating&page[limit]=20`);
}

async function fetchAnimeProximos() {
  return fetchFromApi(`/anime?filter[status]=upcoming&sort=-userCount&page[limit]=20`);
}

async function fetchAnimePorId(id) {
  return fetchFromApi(`/anime/${id}`);
}

async function fetchGeneros() {
  return fetchFromApi(`/categories?page[limit]=40&sort=title`);
}

function fetchAnimeCatalogo({ busqueda = "", genero = "", estado = "", temporada = "", anio = "", orden = "", pagina = 1 } = {}) {
  const LIMITE = 20;
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

// De Google
async function traducirTexto(texto) {
  if (!texto || texto === "Sin sinopsis disponible.") return texto;
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=es&dt=t&q=${encodeURIComponent(texto)}`
    );
    const data = await res.json();
    return data[0].map((item) => item[0]).join("");
  } catch (error) {
    console.error("Error al traducir sinopsis:", error);
    return texto;
  }
}