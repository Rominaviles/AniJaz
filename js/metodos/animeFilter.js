// ==========================================
// FILTROS (sobre listas ya mapeadas, en memoria)
// ==========================================

function filtrarSoloSeriesEnEmision(listaMapeada) {
  return listaMapeada.filter((anime) => anime.estado === "En emisión");
}

function filtrarMejorValorados(listaMapeada) {
  return listaMapeada.filter((anime) => anime.rating !== "N/A");
}

function filtrarPorTituloExacto(listaMapeada, busqueda) {
  if (!busqueda) return listaMapeada;
  const qLower = busqueda.toLowerCase();
  return listaMapeada.filter((anime) =>
    anime.titulo.toLowerCase().includes(qLower)
  );
}