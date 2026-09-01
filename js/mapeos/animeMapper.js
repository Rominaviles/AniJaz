// ==========================================
// MAPEO (Transformación de datos crudos de la API)
// ==========================================

function mapearAnime(item, included = []) {
  if (!item) return {};

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

  let generos = [];
  if (Array.isArray(included) && included.length > 0) {
    const idsCategorias = (item.relationships?.categories?.data || []).map((c) => String(c.id));
    generos = included
      .filter((inc) => inc && inc.type === "categories" && idsCategorias.includes(String(inc.id)))
      .map((cat) => cat.attributes?.title || "")
      .filter((title) => title !== "")
      .slice(0, 4);
  }

  return {
    id: String(item.id || ""),
    titulo: attr.canonicalTitle || attr.titles?.en || "Sin título",
    tituloOriginal: attr.titles?.en_jp || attr.titles?.ja_jp || "",
    poster: attr.posterImage?.small || attr.posterImage?.medium || attr.posterImage?.original || "",
    posterGrande: attr.posterImage?.large || attr.posterImage?.original || "",
    rating: rating,
    estado: estadoFormateado,
    duracionMin: attr.episodeLength || 24,
    sinopsis: sinopsisTexto,
    episodios: attr.episodeCount || "N/C",
    startDate: attr.startDate || null,
    endDate: attr.endDate || null,
    showType: (attr.showType || attr.subtype || "").toUpperCase(),
    generos: generos
  };
}

function mapearListaAnimes(input) {
  if (!input) return [];

  let datosReales = [];
  let included = [];

  if (input.data && Array.isArray(input.data)) {
    datosReales = input.data;
    included = input.included || [];
  } else if (Array.isArray(input)) {
    datosReales = input;
  }

  return datosReales.map((item) => mapearAnime(item, included));
}