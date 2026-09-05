const STORAGE_KEY_FAVORITOS = "anidrex_favoritos";
const STORAGE_KEY_HISTORIAL = "anidrex_historial";

function _leerJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    console.error(`Error al leer "${key}" de localStorage:`, error);
    return [];
  }
}

// --- Favoritos ---
function obtenerFavoritos() {
  return _leerJSON(STORAGE_KEY_FAVORITOS);
}

function esFavorito(id) {
  const favs = obtenerFavoritos();
  return favs.some((item) => String(item.id) === String(id));
}

function guardarEnFavoritos(animeData) {
  const favs = obtenerFavoritos();
  const index = favs.findIndex((item) => String(item.id) === String(animeData.id));

  if (index >= 0) {
    favs[index] = animeData;
  } else {
    favs.push(animeData);
  }

  localStorage.setItem(STORAGE_KEY_FAVORITOS, JSON.stringify(favs));
}

function eliminarDeFavoritos(id) {
  const favs = obtenerFavoritos().filter((item) => String(item.id) !== String(id));
  localStorage.setItem(STORAGE_KEY_FAVORITOS, JSON.stringify(favs));
}

// --- Historial ---
function obtenerHistorial() {
  return _leerJSON(STORAGE_KEY_HISTORIAL);
}

function guardarEnHistorial(anime) {
  const historial = obtenerHistorial().filter((item) => String(item.id) !== String(anime.id));

  const itemHistorial = {
    id: String(anime.id),
    titulo: anime.titulo,
    poster: anime.poster,
    rating: anime.rating,
    duracionMin: anime.duracionMin,
    estado: anime.estado,
    visitadoEn: new Date().toISOString()
  };

  historial.unshift(itemHistorial);
  localStorage.setItem(STORAGE_KEY_HISTORIAL, JSON.stringify(historial));
}

function limpiarHistorial() {
  localStorage.removeItem(STORAGE_KEY_HISTORIAL);
}

// --- Sinopsis ---
function obtenerSinopsisGuardada(id) {
  const favs = obtenerFavoritos();
  const fav = favs.find((item) => String(item.id) === String(id));
  if (fav && fav.sinopsis) return fav.sinopsis;

  const historial = obtenerHistorial();
  const hist = historial.find((item) => String(item.id) === String(id));
  if (hist && hist.sinopsis) return hist.sinopsis;

  return null; 
}