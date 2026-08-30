// ==========================================
// INICIALIZACIÓN Y RENDERIZADO (DOM/UI)
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  setupSearchForms();

  const gridHome = document.getElementById("grid-emision") || document.getElementById("grid-destacados");
  const gridCatalogo = document.getElementById("grid-catalogo");
  const contenedorDetalle = document.getElementById("detalle-contenido");
  const gridFavoritos = document.getElementById("grid-favoritos");
  const contenedorHistorial = document.getElementById("contenedor-historial");
  const btnLimpiarHistorial = document.getElementById("btn-limpiar-historial");

  if (btnLimpiarHistorial) {
    btnLimpiarHistorial.addEventListener("click", () => {
      limpiarHistorial();
      initHistorial();
    });
  }

  if (contenedorHistorial) initHistorial();
  if (gridHome) initHome();
  if (gridCatalogo) {
    initCatalogo();
    poblarFiltrosEstaticos();
    cargarGenerosEnSelect();
    setupFiltrosForm();
    setupLimpiarFiltros();
  }
  if (contenedorDetalle) initDetalle();
  if (gridFavoritos) initFavoritos();
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
  const filtros = {
    busqueda: params.get("busqueda") || "",
    genero: params.get("genero") || "",
    temporada: params.get("temporada") || "",
    estado: params.get("estado") || "",
    orden: params.get("orden") || "",
    pagina: parseInt(params.get("pagina"), 10) || 1,
    anio: params.get("anio") || ""
  };
  

  const inputSearch = document.querySelector('.nav-search input[name="busqueda"]');
  if (inputSearch && filtros.busqueda) inputSearch.value = filtros.busqueda;

  container.innerHTML = "<div class='loading'>Consultando el archivo…</div>";
  const { animes, total } = await getCatalogoData(filtros);
  renderCards(container, animes);

  const selectGenero = document.querySelector(".select-genero");
  const selectTemporada = document.querySelector(".select-temporada");
  const selectAnio = document.querySelector(".select-anio");
  const selectEstado = document.querySelector(".select-estado");
  const selectOrden = document.querySelector(".select-orden");

  if (selectAnio) selectAnio.value = filtros.anio;
  if (selectGenero) selectGenero.value = filtros.genero;
  if (selectTemporada) selectTemporada.value = filtros.temporada;
  if (selectEstado) selectEstado.value = filtros.estado;
  if (selectOrden) selectOrden.value = filtros.orden;

  const totalPaginas = Math.max(1, Math.ceil(total / 20));
  renderPaginacion(filtros.pagina, totalPaginas);
}

function setupFiltrosForm() {
  const form = document.querySelector(".filters");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const busquedaActual = params.get("busqueda") || "";

    const nuevosParams = new URLSearchParams();
    if (busquedaActual) nuevosParams.set("busqueda", busquedaActual);

    const genero = form.querySelector(".select-genero")?.value;
    const temporada = form.querySelector(".select-temporada")?.value;
    const estado = form.querySelector(".select-estado")?.value;
    const orden = form.querySelector(".select-orden")?.value;
    const anio = form.querySelector(".select-anio")?.value;

    if (anio) nuevosParams.set("anio", anio);
    if (genero) nuevosParams.set("genero", genero);
    if (temporada) nuevosParams.set("temporada", temporada);
    if (estado) nuevosParams.set("estado", estado);
    if (orden) nuevosParams.set("orden", orden);
    // pagina se omite a propósito: toda búsqueda nueva arranca en la página 1

    window.location.href = `catalogo.html?${nuevosParams.toString()}`;
  });
}

function setupLimpiarFiltros() {
  const btn = document.getElementById("btn-limpiar-filtros");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const params = new URLSearchParams(window.location.search);
    const busqueda = params.get("busqueda") || "";

    const nuevosParams = new URLSearchParams();
    if (busqueda) nuevosParams.set("busqueda", busqueda);

    window.location.href = `catalogo.html?${nuevosParams.toString()}`;
  });
}

// ==========================================
// DETALLE (Página detalle.html)
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

    guardarEnHistorial(anime);
    renderDetalle(container, anime);
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
  const claseBtnFav = yaEsFav ? "btn-fav-detalle is-favorito" : "btn-fav-detalle";
  const textoBtnFav = yaEsFav ? "♥ Quitar de Favoritos" : "♡ Agregar a Favoritos";

  container.innerHTML = `
    <div class="detalle-grid">
      <div class="detalle-poster-col">
        <div class="poster">
          ${imagenHTML}
          <span class="estado ${claseEstado}">${anime.estado}</span>
        </div>
        <button id="btn-fav" class="${claseBtnFav}">${textoBtnFav}</button>
      </div>
      <div class="detalle-info">
        <h1>${anime.titulo}</h1>
        <div class="card-meta detalle-meta">
          <span class="stars">★ ${anime.rating}</span>
          <span>Episodios: ${anime.episodios}</span>
          <span>Duración: ${anime.duracionMin} min</span>
          <span>Tipo: ${anime.showType}</span>
        </div>
        <h3>Sinopsis</h3>
        <p class="detalle-sinopsis">${anime.sinopsis}</p>
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

  historial.forEach((anime) => {
    const itemLink = document.createElement("a");
    itemLink.href = `detalle.html?id=${anime.id}`;
    itemLink.classList.add("history-item");

    const imagenHTML = anime.poster
      ? `<img src="${anime.poster}" alt="${anime.titulo}">`
      : `<span class="history-item-fallback">${anime.titulo ? anime.titulo.charAt(0) : "A"}</span>`;

    itemLink.innerHTML = `
      ${imagenHTML}
      <div class="history-info">
        <h4>${anime.titulo}</h4>
        <span>★ ${anime.rating || '-'} • ${anime.duracionMin || 24} min</span>
      </div>
    `;

    container.appendChild(itemLink);
  });
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

    const esEmision = anime.estado === "En emisión";
    const claseEstado = esEmision ? "emision" : "finalizada";
    const imagenHTML = anime.poster
      ? `<img src="${anime.poster}" alt="${anime.titulo}" loading="lazy">`
      : `<span class="inicial">${anime.titulo ? anime.titulo.charAt(0) : "A"}</span>`;

    const extraInfoHTML = anime.etiqueta ? `
      <div class="card-tag-extra">
        <strong>[${anime.estadoSeguimiento || 'Para ver'}]</strong> ${anime.etiqueta} (Prio: ${anime.prioridad})
      </div>
    ` : "";

    const btnEliminarHTML = esVistaFavoritos
      ? `<button class="btn-eliminar-fav" data-id="${anime.id}">✕</button>`
      : "";

    card.innerHTML = `
      ${btnEliminarHTML}
      <a href="detalle.html?id=${anime.id}" class="card-link">
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
      btnFav.classList.remove("is-favorito");
      alert("Anime quitado de tus favoritos.");
    } else {
      if (modal) {
        modal.classList.add("is-open");
      } else {
        console.error("No se encontró el elemento #modal-favoritos en el HTML.");
      }
    }
  });

  if (btnCerrar && modal) {
    btnCerrar.addEventListener("click", () => {
      modal.classList.remove("is-open");
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

      modal.classList.remove("is-open");
      btnFav.textContent = "♥ Quitar de Favoritos";
      btnFav.classList.add("is-favorito");

      alert("¡Anime agregado a favoritos!");
    });
  }
}

function poblarFiltrosEstaticos() {
  const selectTemporada = document.querySelector(".select-temporada");
  const selectEstado = document.querySelector(".select-estado");
  const selectOrden = document.querySelector(".select-orden");
  const selectAnio = document.querySelector(".select-anio");
  if (selectAnio && selectAnio.options.length <= 1) {
    const anioActual = new Date().getFullYear();
    let opciones = `<option value="">Todos</option>`;
    for (let anio = anioActual; anio >= 2000; anio--) {
      opciones += `<option value="${anio}">${anio}</option>`;
    }
    selectAnio.innerHTML = opciones;
  }

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

function setupSearchForms() {
  document.querySelectorAll("[data-nav-search]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const busqueda = form.querySelector('input[name="busqueda"]')?.value.trim();
      if (busqueda) window.location.href = `catalogo.html?busqueda=${encodeURIComponent(busqueda)}`;
      else window.location.href = "catalogo.html";
    });
  });
}

function generarRangoPaginas(paginaActual, totalPaginas) {
  const delta = 1;
  const rango = [];

  for (let i = 1; i <= totalPaginas; i++) {
    if (i === 1 || i === totalPaginas || (i >= paginaActual - delta && i <= paginaActual + delta)) {
      rango.push(i);
    }
  }

  const conElipsis = [];
  let anterior = null;
  rango.forEach((pagina) => {
    if (anterior !== null && pagina - anterior > 1) {
      conElipsis.push("...");
    }
    conElipsis.push(pagina);
    anterior = pagina;
  });

  return conElipsis;
}

function construirUrlConPagina(pagina) {
  const params = new URLSearchParams(window.location.search);
  params.set("pagina", pagina);
  return `catalogo.html?${params.toString()}`;
}

function renderPaginacion(paginaActual, totalPaginas) {
  const contenedor = document.getElementById("paginacion-catalogo");
  if (!contenedor) return;

  if (totalPaginas <= 1) {
    contenedor.innerHTML = "";
    return;
  }

  const paginas = generarRangoPaginas(paginaActual, totalPaginas);

  const botonAnterior = `
    <a href="${paginaActual > 1 ? construirUrlConPagina(paginaActual - 1) : '#'}"
       class="pagina-btn pagina-nav ${paginaActual === 1 ? 'is-disabled' : ''}"
       aria-label="Página anterior">«</a>
  `;

  const botonSiguiente = `
    <a href="${paginaActual < totalPaginas ? construirUrlConPagina(paginaActual + 1) : '#'}"
       class="pagina-btn pagina-nav ${paginaActual === totalPaginas ? 'is-disabled' : ''}"
       aria-label="Página siguiente">»</a>
  `;

  const numeros = paginas.map((p) => {
    if (p === "...") return `<span class="pagina-elipsis">…</span>`;
    const esActual = p === paginaActual;
    return `
      <a href="${esActual ? '#' : construirUrlConPagina(p)}"
         class="pagina-btn ${esActual ? 'is-active' : ''}"
         aria-current="${esActual ? 'page' : 'false'}">${p}</a>
    `;
  }).join("");

  contenedor.innerHTML = `${botonAnterior}${numeros}${botonSiguiente}`;
}