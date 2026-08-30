// ==========================================
// 1. FETCH (Peticiones a la API de Kitsu)
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


// ==========================================
// 2. MAPEO (Transformación de datos crudos)
// ==========================================

function mapearAnime(item) {
  const attr = item.attributes || {};
  const rating = attr.averageRating
    ? (parseFloat(attr.averageRating) / 10).toFixed(1)
    : "N/A";

  let sinopsisTexto = attr.synopsis || "Sin sinopsis disponible.";
  sinopsisTexto = sinopsisTexto.replace(/\[Written by.*?\]/g, "").replace(/\(Fuente:.*?\)/g, "").trim();

  return {
    id: String(item.id),
    titulo: attr.canonicalTitle || attr.titles?.en || "Sin título",
    poster: attr.posterImage?.small || attr.posterImage?.medium || attr.posterImage?.original || "",
    posterGrande: attr.posterImage?.large || attr.posterImage?.original || "",
    rating: rating,
    estado: attr.status === "current" ? "En emisión" : "Finalizado",
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


// ==========================================
// 3. MÉTODOS (Filtros, Favoritos e Historial en LocalStorage)
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

// --- Favoritos ---
function obtenerFavoritos() {
  return JSON.parse(localStorage.getItem("anidrex_favoritos")) || [];
}

function esFavorito(id) {
  const favs = obtenerFavoritos();
  return favs.some((item) => String(item.id) === String(id));
}

function guardarEnFavoritos(animeData) {
  let favs = obtenerFavoritos();
  const index = favs.findIndex((item) => String(item.id) === String(animeData.id));

  if (index >= 0) {
    favs[index] = animeData;
  } else {
    favs.push(animeData);
  }

  localStorage.setItem("anidrex_favoritos", JSON.stringify(favs));
}

function eliminarDeFavoritos(id) {
  let favs = obtenerFavoritos();
  favs = favs.filter((item) => String(item.id) !== String(id));
  localStorage.setItem("anidrex_favoritos", JSON.stringify(favs));
}

// --- Historial ---
function obtenerHistorial() {
  return JSON.parse(localStorage.getItem("anidrex_historial")) || [];
}

function guardarEnHistorial(anime) {
  let historial = obtenerHistorial();

  // Si ya existía, lo sacamos para moverlo al principio (evita duplicados)
  historial = historial.filter((item) => String(item.id) !== String(anime.id));

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
  localStorage.setItem("anidrex_historial", JSON.stringify(historial));
}


// ==========================================
// 4. SERVICIOS
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

async function searchAnimes(query) {
  try {
    const res = await fetchAnimeBusqueda(query);
    const mapeados = mapearListaAnimes(res.data || []);
    return query ? filtrarPorTituloExacto(mapeados, query) : mapeados;
  } catch (error) {
    console.error("Error en searchAnimes:", error);
    return [];
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


// ==========================================
// 5. INICIALIZACIÓN Y RENDERIZADO (DOM/UI)
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  setupSearchForms();

  const gridHome = document.getElementById("grid-emision") || document.getElementById("grid-destacados");
  const gridCatalogo = document.getElementById("grid-catalogo");
  const contenedorDetalle = document.getElementById("detalle-contenido");
  const gridFavoritos = document.getElementById("grid-favoritos");
  const gridHistorial = document.getElementById("grid-historial");
  const btnLimpiarHistorial = document.getElementById("btn-limpiar-historial");
  if (btnLimpiarHistorial) {
    btnLimpiarHistorial.addEventListener("click", () => {
      limpiarHistorial();
    });
  }

  const contenedorHistorial = document.getElementById("contenedor-historial");
  if (contenedorHistorial) {
    initHistorial();
  }

  if (gridHome) initHome();
  if (gridCatalogo) {
    initCatalogo();
    poblarFiltrosEstaticos();
    cargarGenerosEnSelect();
  }
  if (contenedorDetalle) initDetalle();
  if (gridFavoritos) initFavoritos();
  if (gridHistorial) initHistorial(); 
});

async function initHome() {
  const gridEmision = document.getElementById("grid-emision");
  const gridDestacados = document.getElementById("grid-destacados");

  if (gridEmision) gridEmision.innerHTML = "<div class='loading'>Cargando emisión...</div>";
  if (gridDestacados) gridDestacados.innerHTML = "<div class='loading'>Cargando destacados...</div>";

  const { emision, destacados } = await getHomeData();

  if (gridEmision) renderCards(gridEmision, emision);
  if (gridDestacados) renderCards(gridDestacados, destacados);
}

async function initCatalogo() {
  const container = document.getElementById("grid-catalogo");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const query = params.get("q") || "";

  const inputSearch = document.querySelector('.nav-search input[name="q"]');
  if (inputSearch && query) inputSearch.value = query;

  container.innerHTML = "<div class='loading'>Consultando el archivo…</div>";
  const animes = await searchAnimes(query);
  renderCards(container, animes);
}

// ==========================================
// 6. RENDERIZADO DE DETALLE (Página detalle.html)
// ==========================================

async function initDetalle() {
  const container = document.getElementById("detalle-contenido");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const animeId = params.get("id");

  if (!animeId) {
    container.innerHTML = "<p class='empty-history'>No se proporcionó un ID de anime.</p>";
    return;
  }

  container.innerHTML = "<div class='loading'>Consultando el archivo…</div>";

  try {
    const anime = await getAnimeDetalle(animeId);

    if (!anime) {
      container.innerHTML = "<p class='empty-history'>No se encontró la información de este anime.</p>";
      return;
    }

    // Guardar en el historial automáticamente al visitar la ficha
    guardarEnHistorial(anime);

    // Renderizar la información completa en el HTML de detalle
    renderDetalle(container, anime);

    // Configurar el botón y modal de favoritos para este anime
    setupModalFavoritos(anime);

  } catch (error) {
    console.error("Error al inicializar el detalle:", error);
    container.innerHTML = "<p class='empty-history'>Ocurrió un error al cargar los datos del anime.</p>";
  }
}

function renderDetalle(container, anime) {
  const esEmision = anime.estado === "En emisión";
  const claseEstado = esEmision ? "emision" : "finalizada";
  const imagenHTML = anime.posterGrande || anime.poster
    ? `<img src="${anime.posterGrande || anime.poster}" alt="${anime.titulo}">`
    : `<span class="inicial">${anime.titulo.charAt(0)}</span>`;

  const yaEsFav = esFavorito(String(anime.id));
  const textoBtnFav = yaEsFav ? "♥ Quitar de Favoritos" : "♡ Agregar a Favoritos";
  const estiloBtnFav = yaEsFav ? "background: #e63946; border: none;" : "background: #2a2d3e; border: 1px solid #4a4d68;";

  container.innerHTML = `
    <div class="detalle-grid" style="display: flex; gap: 2rem; flex-wrap: wrap; align-items: flex-start;">
      <div class="detalle-poster" style="flex: 0 0 280px;">
        <div class="poster" style="position: relative;">
          ${imagenHTML}
          <span class="estado ${claseEstado}" style="position: absolute; top: 10px; left: 10px;">${anime.estado}</span>
        </div>
        <button id="btn-fav" style="width: 100%; margin-top: 1rem; padding: 10px; color: white; border-radius: 6px; cursor: pointer; font-weight: bold; ${estiloBtnFav}">
          ${textoBtnFav}
        </button>
      </div>
      <div class="detalle-info" style="flex: 1; min-width: 280px;">
        <h1 style="margin-bottom: 0.5rem;">${anime.titulo}</h1>
        <div class="card-meta" style="margin-bottom: 1rem; font-size: 1.1rem;">
          <span class="stars" style="color: #ffd166;">★ ${anime.rating}</span>
          <span style="margin-left: 15px;">Episodios: ${anime.episodios}</span>
          <span style="margin-left: 15px;">Duración: ${anime.duracionMin} min</span>
          <span style="margin-left: 15px;">Tipo: ${anime.showType}</span>
        </div>
        <h3>Sinopsis</h3>
        <p style="line-height: 1.6; margin-top: 0.5rem; opacity: 0.9;">${anime.sinopsis}</p>
      </div>
    </div>
  `;
}


function initFavoritos() {
  const container = document.getElementById("grid-favoritos");
  if (!container) return;

  const favoritos = obtenerFavoritos();
  renderCards(container, favoritos, true);
}

function initHistorial() {
  const container = document.getElementById("contenedor-historial");
  if (!container) return;

  const historial = obtenerHistorial();

  if (!historial || historial.length === 0) {
    container.innerHTML = `<p class="empty-history">Aún no consultaste ninguna ficha.</p>`;
    return;
  }

  container.innerHTML = "";

  // Renderizado adaptado a una lista lateral (history-list)
  historial.forEach((anime) => {
    const itemLink = document.createElement("a");
    itemLink.href = `detalle.html?id=${anime.id}`;
    itemLink.classList.add("history-item"); // Asegurate de darle estilos CSS si ya los tenías definidos
    itemLink.style.cssText = "display: flex; align-items: center; gap: 10px; text-decoration: none; color: inherit; margin-bottom: 10px;";

    const imagenHTML = anime.poster
      ? `<img src="${anime.poster}" alt="${anime.titulo}" style="width: 45px; height: 60px; object-fit: cover; border-radius: 4px;">`
      : `<span style="width: 45px; height: 60px; background: #2a2d3e; display: flex; align-items: center; justify-content: center; border-radius: 4px;">${anime.titulo ? anime.titulo.charAt(0) : "A"}</span>`;

    itemLink.innerHTML = `
      ${imagenHTML}
      <div style="overflow: hidden;">
        <h4 style="font-size: 0.9rem; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${anime.titulo}</h4>
        <span style="font-size: 0.75rem; opacity: 0.7;">★ ${anime.rating || '-'} • ${anime.duracionMin || 24} min</span>
      </div>
    `;

    container.appendChild(itemLink);
  });
}

// --- Historial ---
function obtenerHistorial() {
  return JSON.parse(localStorage.getItem("anidrex_historial")) || [];
}

function guardarEnHistorial(anime) {
  let historial = obtenerHistorial();

  // Si ya existía, lo sacamos para moverlo al principio (evita duplicados)
  historial = historial.filter((item) => String(item.id) !== String(anime.id));

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
  localStorage.setItem("anidrex_historial", JSON.stringify(historial));
}

function limpiarHistorial() {
  localStorage.removeItem("anidrex_historial");
  initHistorial();
}

function renderCards(container, list) {
  container.innerHTML = "";
  if (!list || !list.length) {
    container.innerHTML = "<p class='empty-history'>No hay animes disponibles.</p>";
    return;
  }

  list.forEach((anime) => {
    const card = document.createElement("article");
    card.classList.add("anime-card");

    const esEmision = anime.estado === "En emisión";
    const claseEstado = esEmision ? "emision" : "finalizada";
    const imagenHTML = anime.poster
      ? `<img src="${anime.poster}" alt="${anime.titulo}" loading="lazy">`
      : `<span class="inicial">${anime.titulo ? anime.titulo.charAt(0) : "A"}</span>`;

    const extraInfoHTML = anime.etiqueta ? `
      <div style="font-size: 0.75rem; background: #2a2d3e; padding: 4px 8px; border-radius: 4px; margin-top: 6px;">
        <strong>[${anime.estadoSeguimiento || 'Para ver'}]</strong> ${anime.etiqueta} (Prio: ${anime.prioridad})
      </div>
    ` : "";

    card.innerHTML = `
      <a href="detalle.html?id=${anime.id}" class="card-link" style="text-decoration:none; color:inherit; display:block;">
        <div class="poster">
          ${imagenHTML}
          <span class="estado ${claseEstado}">${anime.estado || 'Finalizado'}</span>
        </div>
        <div class="card-body">
          <h3>${anime.titulo}</h3>
          <div class="card-meta">
            <span class="stars">★ ${anime.rating || '-'}</span>
            <span>${anime.duracionMin ? anime.duracionMin + ' min' : ''}</span>
          </div>
          ${extraInfoHTML}
        </div>
      </a>
    `;

    container.appendChild(card);
  });
}

function setupModalFavoritos(anime) {
  const btnFav = document.getElementById("btn-fav");
  const modal = document.getElementById("modal-favoritos");
  const btnCerrar = document.getElementById("btn-cerrar-modal");
  const formFav = document.getElementById("form-favorito");

  if (!btnFav) {
    console.error("No se encontró el botón #btn-fav en el DOM.");
    return;
  }

  btnFav.addEventListener("click", (e) => {
    e.preventDefault();

    const yaEsFav = esFavorito(String(anime.id));

    if (yaEsFav) {
      eliminarDeFavoritos(String(anime.id));
      btnFav.textContent = "♡ Agregar a Favoritos";
      btnFav.style.background = "#2a2d3e";
      btnFav.style.border = "1px solid #4a4d68";
      alert("Anime quitado de tus favoritos.");
    } else {
      if (modal) {
        modal.style.display = "flex";
      } else {
        console.error("No se encontró el elemento #modal-favoritos en el HTML.");
      }
    }
  });

  if (btnCerrar && modal) {
    btnCerrar.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  if (formFav) {
    formFav.addEventListener("submit", (e) => {
      e.preventDefault();

      const favoritoData = {
        id: String(anime.id),
        titulo: anime.titulo,
        poster: anime.poster,
        rating: anime.rating,
        duracionMin: anime.duracionMin,
        estado: anime.estado,
        estadoSeguimiento: document.getElementById("fav-estado-seguimiento").value,
        prioridad: parseInt(document.getElementById("fav-prioridad").value, 10),
        etiqueta: document.getElementById("fav-etiqueta").value.trim(),
        nota: document.getElementById("fav-nota").value.trim()
      };

      guardarEnFavoritos(favoritoData);

      if (modal) modal.style.display = "none";
      btnFav.textContent = "♥ Quitar de Favoritos";
      btnFav.style.background = "#e63946";
      btnFav.style.border = "none";

      alert("¡Anime agregado a favoritos!");
    });
  }
}

function poblarFiltrosEstaticos() {
  const selectTemporada = document.querySelector(".select-temporada");
  const selectEstado = document.querySelector(".select-estado");
  const selectOrden = document.querySelector(".select-orden");

  if (selectTemporada && selectTemporada.options.length <= 1) {
    selectTemporada.innerHTML = `
      <option value="">Todas</option>
      <option value="winter">Invierno</option>
      <option value="spring">Primavera</option>
      <option value="summer">Verano</option>
      <option value="fall">Otoño</option>
    `;
  }

  if (selectEstado && selectEstado.options.length <= 1) {
    selectEstado.innerHTML = `
      <option value="">Todos</option>
      <option value="current">En emisión</option>
      <option value="finished">Finalizada</option>
    `;
  }

  if (selectOrden && selectOrden.options.length <= 1) {
    selectOrden.innerHTML = `
      <option value="-userCount">Más populares</option>
      <option value="-averageRating">Mejor valorados</option>
      <option value="-startDate">Más nuevos</option>
      <option value="startDate">Más antiguos</option>
    `;
  }
}

async function cargarGenerosEnSelect() {
  const selectGenero = document.querySelector(".select-genero");
  if (!selectGenero) return;

  try {
    const res = await fetchGeneros();
    const generos = res.data || [];

    generos.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.attributes.slug;
      option.textContent = cat.attributes.title;
      selectGenero.appendChild(option);
    });
  } catch (err) {
    console.error("Error cargando categorías:", err);
  }
}

function renderCards(container, list, esVistaFavoritos = false) {
  container.innerHTML = "";
  if (!list || !list.length) {
    container.innerHTML = "<p class='empty-history'>No hay animes disponibles.</p>";
    return;
  }

  list.forEach((anime) => {
    const card = document.createElement("article");
    card.classList.add("anime-card");
    card.style.position = "relative";

    const esEmision = anime.estado === "En emisión";
    const claseEstado = esEmision ? "emision" : "finalizada";
    const imagenHTML = anime.poster
      ? `<img src="${anime.poster}" alt="${anime.titulo}" loading="lazy">`
      : `<span class="inicial">${anime.titulo ? anime.titulo.charAt(0) : "A"}</span>`;

    const extraInfoHTML = anime.etiqueta ? `
      <div style="font-size: 0.75rem; background: #2a2d3e; padding: 4px 8px; border-radius: 4px; margin-top: 6px;">
        <strong>[${anime.estadoSeguimiento || 'Para ver'}]</strong> ${anime.etiqueta} (Prio: ${anime.prioridad})
      </div>
    ` : "";

    const btnEliminarHTML = esVistaFavoritos ? `
      <button class="btn-eliminar-fav" data-id="${anime.id}" style="position: absolute; top: 8px; right: 8px; z-index: 10; background: rgba(230, 57, 70, 0.9); color: white; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; font-weight: bold;">✕</button>
    ` : "";

    card.innerHTML = `
      ${btnEliminarHTML}
      <a href="detalle.html?id=${anime.id}" class="card-link" style="text-decoration:none; color:inherit; display:block;">
        <div class="poster">
          ${imagenHTML}
          <span class="estado ${claseEstado}">${anime.estado || 'Finalizado'}</span>
        </div>
        <div class="card-body">
          <h3>${anime.titulo}</h3>
          <div class="card-meta">
            <span class="stars">★ ${anime.rating || '-'}</span>
            <span>${anime.duracionMin ? anime.duracionMin + ' min' : ''}</span>
          </div>
          ${extraInfoHTML}
        </div>
      </a>
    `;

    container.appendChild(card);
  });

  if (esVistaFavoritos) {
    container.querySelectorAll(".btn-eliminar-fav").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        eliminarDeFavoritos(id);
        initFavoritos();
      });
    });
  }
}

function setupSearchForms() {
  document.querySelectorAll("[data-nav-search]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = form.querySelector('input[name="q"]')?.value.trim();
      if (q) window.location.href = `catalogo.html?q=${encodeURIComponent(q)}`;
    });
  });
}