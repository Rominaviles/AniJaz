// ==========================================
// MAPEO (Transformación de datos crudos de la API)
// ==========================================

function mapearAnime(item) {
  const attr = item.attributes || {};
  const rating = attr.averageRating
    ? (parseFloat(attr.averageRating) / 10).toFixed(1)
    : "N/A";

  let sinopsisTexto = attr.synopsis || "Sin sinopsis disponible.";
  sinopsisTexto = sinopsisTexto
    .replace(/\[Written by.*?\]/g, "")
    .replace(/\(Fuente:.*?\)/g, "")
    .trim();

  let estadoFormateado = "Finalizado";
  if (attr.status === "current") {
    estadoFormateado = "En emisión";
  } else if (attr.status === "upcoming") {
    estadoFormateado = "Próximamente";
  }

  return {
    id: String(item.id),
    titulo: attr.canonicalTitle || attr.titles?.en || "Sin título",
    poster: attr.posterImage?.small || attr.posterImage?.medium || attr.posterImage?.original || "",
    posterGrande: attr.posterImage?.large || attr.posterImage?.original || "",
    rating: rating,
    estado: estadoFormateado,
    duracionMin: attr.episodeLength || 24,
    sinopsis: sinopsisTexto,
    episodios: attr.episodeCount || "N/C",
    startDate: attr.startDate || null,
    endDate: attr.endDate || null,
    showType: (attr.showType || attr.subtype || "").toUpperCase()
  };
}


function mapearListaAnimes(lista = []) {
  return lista.map(mapearAnime);
}