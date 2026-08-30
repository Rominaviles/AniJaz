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

async function fetchAnimeBusqueda(query) {
  const endpoint = query
    ? `/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=20`
    : `/anime?sort=-userCount&page[limit]=20`;
  return fetchFromApi(endpoint);
}

async function fetchAnimePorId(id) {
  return fetchFromApi(`/anime/${id}`);
}

async function fetchGeneros() {
  return fetchFromApi(`/categories?page[limit]=40&sort=title`);
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