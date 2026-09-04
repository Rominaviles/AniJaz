document.addEventListener("DOMContentLoaded", () => {
  
  if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then((reg) => console.log("SW registrado:", reg.scope))
      .catch((err) => console.error("Error al registrar SW:", err));
  });
  }
  setupSearchForms();

  const gridHome = document.getElementById("grid-emision") || document.getElementById("grid-destacados") || document.getElementById("grid-proximos");
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
  const gridProximos = document.getElementById("grid-proximos");

  if (gridEmision) gridEmision.innerHTML = "<div class='loading'>Cargando emisión...</div>";
  if (gridDestacados) gridDestacados.innerHTML = "<div class='loading'>Cargando destacados...</div>";
  if (gridProximos) gridProximos.innerHTML = "<div class='loading'>Cargando proximos...</div>";

  try {
    const { emision, destacados, proximos } = await fetchDatosIndex();

    const emisionMapeada = mapearListaAnimes(emision);
    const destacadosMapeados = mapearListaAnimes(destacados);
    const proximosMapeados = mapearListaAnimes(proximos);

    if (gridEmision) renderCards(gridEmision, emisionMapeada);
    if (gridDestacados) renderCards(gridDestacados, destacadosMapeados);
    if (gridProximos) renderCards(gridProximos, proximosMapeados);
} catch (error) {
    console.warn("Modo offline detectado:", error);

    const contenidoOffline = `
      <div class="offline-container" style="display: flex; align-items: center; gap: 20px; grid-column: 1 / -1; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 8px;">
        <img src="img/offline.png" alt="Sin conexión" style="width: 80px; height: 80px; opacity: 0.7;" onerror="this.style.display='none'">
        <div>
          <h3 style="margin: 0 0 5px 0; color: #fff;">Sin conexión a la red</h3>
          <p style="margin: 0; color: #aaa;">Ups, acá trabajamos con conexión.</p>
        </div>
      </div>
    `;

    if (gridEmision) gridEmision.innerHTML = contenidoOffline;
    if (gridDestacados) gridDestacados.innerHTML = contenidoOffline;
    if (gridProximos) gridProximos.innerHTML = contenidoOffline;
  }
}
document.addEventListener("DOMContentLoaded", () => {
  initHome();
});

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

  container.innerHTML = "<div class='loading'>Buscando el anime…</div>";

  try {
      const { animes, total } = await getCatalogoData(filtros);

      if (!animes || animes.length === 0) {
        throw new Error("No hay datos disponibles sin conexión");
      }
      
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
      if (selectOrden) {
        selectOrden.value = filtros.orden || "-userCount";
      }
      const totalPaginas = Math.max(1, Math.ceil(total / 10));
      renderPaginacion(filtros.pagina, totalPaginas);
    
  } catch (error) {
        console.warn("Modo offline detectado:", error);

    const contenidoOffline = `
      <div class="offline-container" style="display: flex; align-items: center; gap: 20px; grid-column: 1 / -1; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 8px;">
        <img src="img/offline.png" alt="Sin conexión" style="width: 80px; height: 80px; opacity: 0.7;" onerror="this.style.display='none'">
        <div>
          <h3 style="margin: 0 0 5px 0; color: #fff;">Sin conexión a la red</h3>
          <p style="margin: 0; color: #aaa;">Ups, acá trabajamos con conexión.</p>
        </div>
      </div>
    `;

    container.innerHTML = contenidoOffline;   
  }
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

    if (genero) nuevosParams.set("genero", genero);
    if (temporada) nuevosParams.set("temporada", temporada);
    if (estado) nuevosParams.set("estado", estado);
    if (orden) nuevosParams.set("orden", orden);
    if (anio) nuevosParams.set("anio", anio);

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

// ============================================================
// DETALLE
// ============================================================

async function initDetalle() {
  const container = document.getElementById("detalle-contenido");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const animeId = params.get("id");

  if (!animeId) {
    container.innerHTML = "<p class='empty-history'>No se proporcionó un ID de anime.</p>";
    return;
  }

  container.innerHTML = "<div class='loading'>Consultando…</div>";

  try {
    // Intenta buscar el anime online mediante el service / API
    const anime = await getAnimeDetalle(animeId);

    if (!anime) {
      throw new Error("No se encontró en la API");
    }

    const sinopsisGuardada = obtenerSinopsisGuardada(animeId);
    if (sinopsisGuardada && !anime.sinopsis) {
      anime.sinopsis = sinopsisGuardada;
    }

    guardarEnHistorial(anime);
    renderDetalle(container, anime);
    
    requestAnimationFrame(() => {
      setupFavoritoPanel(anime);
    });

  } catch (error) {
    console.warn("Modo offline detectado o error de red. Buscando en almacenamiento local...", error);

    const favoritos = obtenerFavoritos();
    let animeLocal = favoritos.find(f => String(f.id) === String(animeId));

    if (!animeLocal) {
      const historial = obtenerHistorial();
      animeLocal = historial.find(h => String(h.id) === String(animeId));
    }

    if (animeLocal) {
      renderDetalle(container, animeLocal);
      requestAnimationFrame(() => {
        setupFavoritoPanel(animeLocal);
      });
    } else {
      container.innerHTML = "<p class='empty-history'>Estás sin conexión y este anime no está guardado en tus favoritos o historial previo.</p>";
    }
  }
}

function formatearFecha(fechaISO) {
  if (!fechaISO) return "Sin confirmar";
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

function renderDetalle(container, anime) {
  const esEmision = anime.estado === "En emisión";
  const claseEstado = esEmision ? "emision" : "finalizada";
  const imagenPoster = anime.posterGrande || anime.poster;
  const imagenHTML = imagenPoster
    ? `<img src="${imagenPoster}" alt="${anime.titulo}">`
    : `<span class="inicial">${anime.titulo.charAt(0)}</span>`;

  const yaEsFav = esFavorito(String(anime.id));
  const claseBtnFav = yaEsFav ? "btn-fav-detalle is-favorito" : "btn-fav-detalle";
  const textoBtnFav = yaEsFav ? "♥ Quitar de Favoritos" : "♡ Agregar a Favoritos";

  const anio = anime.startDate ? anime.startDate.slice(0, 4) : "N/C";

  const tagsGeneroHTML = anime.generos.length
    ? anime.generos.map((g) => `<span class="tag">${g}</span>`).join("")
    : "";

  container.innerHTML = `
    <div class="detalle-backdrop" style="background-image:url('${imagenPoster}')"></div>

    <a href="catalogo.html" class="btn-volver-backdrop">
      <span class="flecha">«</span> Volver al catálogo
    </a>

    <div class="detalle-hero">
      <div class="detalle-hero-info">
        <div class="detalle-badges">
          <span class="badge">${anio}</span>
          <span class="badge">${anime.estado}</span>
          <span class="badge badge-tipo">${anime.showType.toLowerCase()}</span>
        </div>

        <h1>${anime.titulo}</h1>
        ${anime.tituloOriginal ? `<p class="detalle-titulo-original">${anime.tituloOriginal}</p>` : ""}

        <div class="detalle-meta-row">
          <span>${anime.duracionMin} min por ep</span>
          <span class="meta-dot">•</span>
          <span>${anime.episodios} episodios</span>
          <span class="meta-dot">•</span>
          <span class="stars">★ ${anime.rating}</span>
        </div>

        ${tagsGeneroHTML ? `<div class="detalle-tags">${tagsGeneroHTML}</div>` : ""}

        <div class="favorito-actions-wrapper">
          <button id="btn-fav" class="${claseBtnFav}">${textoBtnFav}</button>
          <button id="btn-toggle-panel" class="btn-toggle-panel" aria-label="Abrir detalles" title="Detalles del favorito">
            ▼
          </button>
        </div>

        <!-- PANEL DESPLEGABLE -->
        <div id="panel-favorito" class="favorito-panel" style="display: none;">
          <div class="favorito-panel-content">
            <div class="panel-header">
              <h3>⭐ Personalizar</h3>
              <button type="button" id="btn-cerrar-panel" class="panel-close">✕</button>
            </div>
            <p class="panel-sub">Guarda tus propios comentarios sobre este anime</p>

            <form id="form-favorito" class="favorito-form" novalidate>
              <!-- Puntuación -->
              <div class="form-group">
                <label for="fav-puntuacion" class="form-label">🎯 Tu puntuación</label>
                <div class="puntuacion-container">
                  <input type="range" id="fav-puntuacion" name="puntuacion" min="0" max="10" step="0.5" value="0" 
                         class="puntuacion-slider">
                  <span id="puntuacion-valor" class="puntuacion-valor">—</span>
                </div>
                <div class="puntuacion-labels">
                  <span>No sé</span>
                  <span>😐</span>
                  <span>🤩</span>
                  <span>🔥</span>
                </div>
              </div>

              <!-- Estado de seguimiento -->
              <div class="form-group">
                <label for="fav-estado-seguimiento" class="form-label">📌 Estado de seguimiento</label>
                <select id="fav-estado-seguimiento" name="estado-seguimiento" class="form-control">
                  <option value="">Seleccioná una opción</option>
                  <option value="Para ver">📋 Para ver</option>
                  <option value="Viendo">▶️ Viendo ahora</option>
                  <option value="Completado">✅ Ya lo vi</option>
                  <option value="Abandonado">⏸️ Lo dejé</option>
                  <option value="Esperando">⏳ Esperando nueva temporada</option>
                </select>
              </div>

              <!-- Nota personal -->
              <div class="form-group form-group-last">
                <label for="fav-nota" class="form-label">✍️ Nota personal</label>
                <textarea id="fav-nota" name="nota" maxlength="300" rows="3" 
                          placeholder="¿Qué te pareció? ¿Qué destacarías?" 
                          class="form-control form-textarea"></textarea>
                <small class="form-help"><span id="contador-nota">0</span>/300 caracteres</small>
              </div>

              <div class="form-actions">
                <button type="button" id="btn-cerrar-panel-2" class="btn btn-outline">Cancelar</button>
                <button type="submit" class="btn btn-primary"> Guardar</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div class="detalle-poster-col">
        <div class="poster">
          ${imagenHTML}
          <span class="estado ${claseEstado}">${anime.estado}</span>
        </div>
      </div>
    </div>

    <!-- BLOQUES DE INFORMACIÓN -->
    <div class="detalle-stats-grid">
      <div class="stat-card">
        <span class="stat-label">Fecha de estreno</span>
        <span class="stat-value">${formatearFecha(anime.startDate)}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Duración por episodio</span>
        <span class="stat-value">${anime.duracionMin} min</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Tipo</span>
        <span class="stat-value">${anime.showType || "N/C"}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Estado</span>
        <span class="stat-value">${anime.estado}</span>
      </div>
    </div>

    <div class="detalle-sinopsis-box">
      <h2>Sinopsis</h2>
      <p class="detalle-sinopsis">${anime.sinopsis}</p>
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

    let claseEstado = "finalizada";
    if (anime.estado === "En emisión") {
      claseEstado = "emision";
    } else if (anime.estado === "Próximamente") {
      claseEstado = "proximamente";
    }

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

// ============================================================
// PANEL DESPLEGABLE 
// ============================================================

let animeActual = null;
let feedbackTimeout = null;

function setupFavoritoPanel(anime) {
  animeActual = anime;
  
  const panel = document.getElementById('panel-favorito');
  const btnToggle = document.getElementById('btn-toggle-panel');
  const btnFav = document.getElementById('btn-fav');
  const btnCerrar1 = document.getElementById('btn-cerrar-panel');
  const btnCerrar2 = document.getElementById('btn-cerrar-panel-2');
  const form = document.getElementById('form-favorito');
  
  if (!panel || !btnFav) {
    console.warn('Panel o botón no encontrado');
    return;
  }
  
  configurarBotonFavorito(anime, panel);
  
  if (btnToggle) {
    btnToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePanel(panel, btnToggle);
    });
  }
  
  if (btnCerrar1) btnCerrar1.addEventListener('click', () => cerrarPanel(panel, btnToggle));
  if (btnCerrar2) btnCerrar2.addEventListener('click', () => cerrarPanel(panel, btnToggle));
  
  document.addEventListener('click', (e) => {
    const target = e.target;
    const isPanel = target.closest('#panel-favorito');
    const isButton = target.closest('#btn-fav');
    const isToggle = target.closest('#btn-toggle-panel');
    if (!isPanel && !isButton && !isToggle && panel && panel.style.display === 'block') {
      cerrarPanel(panel, btnToggle);
    }
  });
  
  configurarInteraccionesFormulario();
  
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      guardarFavoritoDesdePanel(anime, panel, btnToggle);
    });
  }
}

function togglePanel(panel, btnToggle) {
  const isOpen = panel.style.display === 'block';
  if (isOpen) {
    cerrarPanel(panel, btnToggle);
  } else {
    cargarDatosExistentes(animeActual);
    abrirPanel(panel, btnToggle);
  }
}

function abrirPanel(panel, btnToggle) {
  if (!panel) return;
  panel.style.display = 'block';
  panel.classList.add('open');
  if (btnToggle) btnToggle.classList.add('open');
}

function cerrarPanel(panel, btnToggle) {
  if (!panel) return;
  panel.style.display = 'none';
  panel.classList.remove('open');
  if (btnToggle) btnToggle.classList.remove('open');
}

function mostrarFeedback(btn, mensaje, clase) {
  if (feedbackTimeout) {
    clearTimeout(feedbackTimeout);
    feedbackTimeout = null;
  }
  
  const textoOriginal = btn.textContent;
  
  btn.textContent = mensaje;
  btn.classList.remove('feedback-success', 'feedback-error', 'feedback');
  btn.classList.add('feedback', clase);
  
  feedbackTimeout = setTimeout(() => {
    btn.textContent = textoOriginal;
    btn.classList.remove('feedback', 'feedback-success', 'feedback-error');
    feedbackTimeout = null;
  }, 700);
}

function configurarBotonFavorito(anime, panel) {
  const btnFav = document.getElementById('btn-fav');
  const btnToggle = document.getElementById('btn-toggle-panel');
  if (!btnFav) return;
  
  btnFav.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const yaEsFav = esFavorito(String(anime.id));
    
    if (yaEsFav) {
      eliminarDeFavoritos(String(anime.id));
      btnFav.textContent = '♡ Agregar a Favoritos';
      btnFav.classList.remove('is-favorito');
      mostrarFeedback(btnFav, 'ELIMINADO', 'feedback-error');
    } else {
      const data = {
        id: String(anime.id),
        titulo: anime.titulo,
        poster: anime.poster,
        rating: anime.rating,
        duracionMin: anime.duracionMin,
        estado: anime.estado,
        puntuacion: '0',
        estadoSeguimiento: '',
        nota: '',
        prioridad: 1,
        fecha: new Date().toISOString()
      };
      guardarEnFavoritos(data);
      
      btnFav.textContent = '♥ Quitar de Favoritos';
      btnFav.classList.add('is-favorito');
      mostrarFeedback(btnFav, 'AGREGADO', 'feedback-success');
      
      cargarDatosExistentes(anime);
      abrirPanel(panel, btnToggle);
    }
  });
}

function configurarInteraccionesFormulario() {
  const slider = document.getElementById('fav-puntuacion');
  const valor = document.getElementById('puntuacion-valor');
  if (slider && valor) {
    slider.addEventListener('input', () => {
      valor.textContent = slider.value === '0' ? '—' : slider.value;
    });
  }
  
  const textarea = document.getElementById('fav-nota');
  const contador = document.getElementById('contador-nota');
  if (textarea && contador) {
    textarea.addEventListener('input', () => {
      contador.textContent = textarea.value.length;
    });
  }
}

function cargarDatosExistentes(anime) {
  const favoritos = obtenerFavoritos();
  const data = favoritos.find(f => String(f.id) === String(anime.id));
  if (!data) return;
  
  const slider = document.getElementById('fav-puntuacion');
  const valor = document.getElementById('puntuacion-valor');
  if (slider && data.puntuacion) {
    slider.value = data.puntuacion;
    valor.textContent = data.puntuacion === '0' ? '—' : data.puntuacion;
  }
  
  const select = document.getElementById('fav-estado-seguimiento');
  if (select && data.estadoSeguimiento) {
    select.value = data.estadoSeguimiento;
  }
  
  const textarea = document.getElementById('fav-nota');
  const contador = document.getElementById('contador-nota');
  if (textarea && data.nota) {
    textarea.value = data.nota;
    contador.textContent = data.nota.length;
  }
}

function guardarFavoritoDesdePanel(anime, panel, btnToggle) {
  const favoritos = obtenerFavoritos();
  const existente = favoritos.find(f => String(f.id) === String(anime.id)) || {};
  
  const data = {
    id: String(anime.id),
    titulo: anime.titulo,
    poster: anime.poster,
    rating: anime.rating,
    duracionMin: anime.duracionMin,
    estado: anime.estado,
    puntuacion: document.getElementById('fav-puntuacion').value || '0',
    estadoSeguimiento: document.getElementById('fav-estado-seguimiento').value || '',
    nota: document.getElementById('fav-nota').value.trim() || '',
    prioridad: existente.prioridad || 1,
    fecha: new Date().toISOString()
  };
  
  guardarEnFavoritos(data);
  
  const btnFav = document.getElementById('btn-fav');
  if (btnFav) {
    btnFav.textContent = '♥ Quitar de Favoritos';
    btnFav.classList.add('is-favorito');
    mostrarFeedback(btnFav, '✅ Guardado', 'feedback-success');
  }
  
  cerrarPanel(panel, btnToggle);
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