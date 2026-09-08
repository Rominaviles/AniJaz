# ANIJAZ — Tu Guía y Organizador de Anime

Plataforma web para descubrir, organizar y hacer seguimiento de series de anime. Permite explorar un catálogo con filtros avanzados, guardar favoritos con notas y puntuación personal, y consultar fichas detalladas de cada serie, con soporte offline básico.

**Integrantes:**
- Romina — [@Rominaviles](https://github.com/Rominaviles)
- Damián — [@damianluna1995](https://github.com/damianluna1995 )

**Demo (Netlify):** https://anijaz.netlify.app

---

## Tabla de contenidos

- [Cómo levantar el proyecto en local](#cómo-levantar-el-proyecto-en-local)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Funcionalidades principales](#funcionalidades-principales)
- [Enfoque del trabajo integrador](#enfoque-del-trabajo-integrador)
- [Limitaciones conocidas](#limitaciones-conocidas)

---

## Cómo levantar el proyecto en local

### Pasos

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/Rominaviles/AniJaz.git
   ```

2. Levantar un servidor local:

   **Extensión Live Server de VS Code:**
   Clic derecho sobre `index.html` → *Open with Live Server*.


3. Abrir el navegador en la dirección que indique la herramienta elegida, por ejemplo:
   ```
   http://localhost:5500
   ```

4. Navegar desde `index.html`. No requiere variables de entorno ni claves de API: la API de Kitsu utilizada es pública y no exige autenticación.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Estructura | HTML5 semántico |
| Estilos | CSS3 puro (variables/custom properties, Flexbox, Grid, `@media` queries) |
| Lógica | JavaScript , sin frameworks |
| Datos remotos | [Kitsu API](https://kitsu.docs.apiary.io/) (REST, JSON) |
| Persistencia local | `localStorage` (favoritos, historial de vistos) |
| Offline / instalable | Service Worker + `manifest.json` (enfoque PWA) |
| Tipografías | Google Fonts (Bebas Neue, Inter, Space Mono) vía `<link>` |
| Reset de estilos | Normalize.css (CDN) |

No se utilizó ningún framework de frontend (React, Vue, etc.) ni bundlers (Webpack, Vite): todo el código corre en el navegador tal cual está escrito.

---

## Estructura del proyecto

```
anijaz/
├── index.html              # Home: destacados, en emisión, próximos estrenos, historial
├── catalogo.html            # Catálogo con filtros, búsqueda y paginación
├── favoritos.html           # Lista de favoritos guardados por el usuario
├── detalle.html             # Ficha individual de un anime
├── contacto.html            # Información de contacto / institucional
├── manifest.json            # Metadatos de instalación como PWA
├── sw.js                    # Service Worker (cacheo básico / modo offline)
├── css/
│   └── styles.css           # Hoja de estilos única, organizada por secciones
└── js/
    ├── fetchs/
    │   └── animeFetch.js     # Llamadas crudas a la API de Kitsu
    ├── mapeos/
    │   └── animeMapper.js    # Transforma la respuesta de la API a un modelo interno simple
    ├── metodos/
    │   ├── animeFilter.js    # Lógica de filtrado en memoria
    │   ├── animeStorage.js   # Lectura/escritura de favoritos e historial en localStorage
    │   └── animeText.js      # Utilidades de texto/traducción de sinopsis
    ├── services/
    │   └── animeService.js   # Orquesta fetch + mapeo + filtros para cada pantalla
    └── prueba.js             # Punto de entrada: inicializa cada página según su contenido
```

La separación por carpetas (`fetchs` / `mapeos` / `metodos` / `services`) busca aislar responsabilidades: quién habla con la API, quién transforma esos datos, quién los filtra y quién orquesta todo para pintarlo en pantalla — sin depender de un framework para lograr esa organización.

---

## Funcionalidades principales

- **Catálogo con filtros combinables**: género, temporada, año, estado de emisión y orden (populares, mejor valorados, más nuevos/antiguos), con paginación.
- **Buscador** de animes por texto, accesible desde cualquier página.
- **Ficha de detalle** con sinopsis, estadísticas (duración, episodios, tipo, estado), géneros y backdrop dinámico generado a partir del póster.
- **Favoritos personalizados**: cada anime guardado admite una puntuación propia (0–10), un estado de seguimiento (viendo, completado, en pausa, etc.) y una nota personal, todo editable desde un panel desplegable.
- **Historial de vistos recientemente**, persistido en el navegador.
- **Soporte offline básico**: si no hay conexión, se muestran mensajes claros y, cuando es posible, se recurre a los datos ya guardados en `localStorage` en vez de dejar la pantalla vacía.
- **Diseño responsive** (desktop-first), con breakpoints para tablet y mobile, incluyendo un menú de navegación colapsable.
- **Accesibilidad**: uso de `aria-live`, `aria-current`, `aria-label`, foco visible y estructura semántica en toda la aplicación.

---

## Enfoque del trabajo integrador

Encaramos el proyecto con la premisa de resolverlo con las herramientas base del desarrollo web (HTML, CSS y JavaScript sin frameworks), priorizando entender a fondo el DOM, la manipulación de datos asíncronos y el manejo de estado en el navegador antes que apoyarnos en abstracciones de terceros.

La arquitectura del JavaScript separa claramente cuatro responsabilidades — **fetch** (comunicación cruda con la API), **mapeo** (adaptar la respuesta externa a un modelo propio y estable), **filtros/almacenamiento** (lógica de negocio y persistencia) y **servicios** (orquestación) — de modo que un cambio en la API externa (por ejemplo, si Kitsu cambiara su formato de respuesta) sólo requeriría tocar la capa de mapeo, sin afectar el resto de la aplicación. Esta idea está tomada de patrones de arquitectura en capas usados en frameworks más grandes, pero implementada de forma liviana con funciones y módulos de script simples.

Para el diseño visual se construyó un sistema de variables CSS (`:root`) con la paleta de colores, tipografías, radios de borde y anchos de borde centralizados, evitando "números mágicos" repetidos por todo el archivo y facilitando ajustes globales de estilo. El layout es *desktop-first*: se definieron los estilos base para pantallas grandes y luego se fueron acotando con `@media (max-width: ...)` para tablet y mobile, todos agrupados al final de la hoja de estilos para que el comportamiento responsive sea fácil de auditar de un vistazo.

Finalmente, se sumó una capa de resiliencia offline (Service Worker + `manifest.json`) para que la aplicación degrade con elegancia cuando no hay conexión: prioriza mostrar datos ya guardados localmente (favoritos e historial) antes que una pantalla en blanco o un error críptico.

---

## Limitaciones conocidas

- La sinopsis se traduce mediante un endpoint público de MyMemory; puede fallar o cambiar sin aviso, en cuyo caso se muestra la sinopsis en su idioma original.
- El modo offline muestra datos guardados localmente, pero no permite navegar contenido nunca antes visitado sin conexión.
