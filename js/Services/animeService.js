// ==========================================
// SERVICIOS (orquestan fetch + mapeo + filtros)
// ==========================================

async function getHomeData() {
  try {
    const [emisionRes, destacadosRes] = await Promise.all([
      fetchAnimeEmision(),
      fetchAnimeDestacados()
    ]);

    const emisionRaw = mapearListaAnimes(emisionRes.data || []);
    const destacadosRaw = mapearListaAnimes(destacadosRes.data || []);

    return {
      emision: emisionRaw.slice(0, 4),
      destacados: destacadosRaw.slice(0, 4)
    };
  } catch (error) {
    console.error("Error en getHomeData:", error);
    return { emision: [], destacados: [] };
  }
}

async function getCatalogoData(filtros) {
  try {
    const res = await fetchAnimeCatalogo(filtros);
    return {
      animes: mapearListaAnimes(res.data || []),
      total: res.meta?.count ?? (res.data ? res.data.length : 0)
    };
  } catch (error) {
    console.error("Error en getCatalogoData:", error);
    return { animes: [], total: 0 };
  }
}

async function getAnimeDetalle(id) {
  try {
    const res = await fetchAnimePorId(id);
    if (!res || !res.data) return null;

    const anime = mapearAnime(res.data);
    anime.sinopsis = await traducirTexto(anime.sinopsis);

    return anime;
  } catch (error) {
    console.error("Error en getAnimeDetalle:", error);
    return null;
  }
}