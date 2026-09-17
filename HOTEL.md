# Valdoria Hotel – Resumen de trabajo

## Estructura actual
- Carpeta del proyecto en `/var/www/valdoriahotel/` con subdirectorios `assets/css`, `assets/js`, `assets/brand`, `assets/resort`, `assets/experiencias`, `assets/villas`, `assets/wellness`.
- Archivos principales: `index.html`, `resort.html`, `experiencias.html`, `villas.html`, `wellness.html`, `contacto.html`, `assets/css/style.css`.

## Landing principal (`index.html`)
- Hero con imagen cenital optimizada (`assets/resort/images/Hotel Cenital.webp`), overlay oscuro y logo oficial; CTA primario “Ver Resort”.
- Copy introductorio breve, mantiene el claim principal y enlaza a la página de resort.
- Overlay de bienvenida con vídeo legal (HeyGen) que informa que el hotel es conceptual; el visitante controla audio/play sin salir de la página.
- Navbar incluye selector de idioma con banderas (ES/EN), conservando el esquema bilingüe en todo el sitio.
- Ajustes responsive para conservar jerarquía tipográfica y centrado en pantallas menores a 960 px.

## Página del resort (`resort.html`)
- Navbar sticky en escritorio y menú hamburguesa accesible en móvil con enlaces a Resort, Experiencias, Villas, Wellness & Gastro y Contacto.
- Hero con vídeo de dron en autoplay (`assets/resort/videos/valdoria-drone.mp4`), overlay ligero y CTA flotante centrado sobre el borde inferior.
- Secciones internas (Experiencias, Villas, Wellness & Gastro, CTA) con tarjetas descriptivas y botones hacia páginas dedicadas.

## Experiencias (`experiencias.html`)
- Hero con copy alineado a la meseta conquense y navegación consolidada mediante el mismo menú hamburguesa.
- Grid de tarjetas temáticas (Suites, Spa & Wellness, Gastronomía) con imágenes WebP optimizadas y visor lightbox con captions bilingües.
- Copy actualizado: ocho residencias y referencias a Cuenca; se eliminan menciones al Mediterráneo.
- No incluye CTA intermedio para favorecer lectura continua antes del contacto.

## Villas (`villas.html`)
- Meta title/description orientados a SEO.
- Hero con claim “El arte de habitar el silencio”, tipografía escalada manualmente para móvil/tablet.
- Galería estática con tres renders en línea (`Suite1.webp`, `Suite2.webp`, `suite3.webp`) enlazados al visor lightbox con captions ES/EN.
- Secciones narrativas: refugio sensorial, tecnología invisible y servicio personalizado, con CTA final “Reservar experiencia privada →” apuntando a `contacto.html`.

## Wellness y Contacto
- Wellness integra fotografía propia en las tarjetas del Ritual Spa, Gastronomía Sensorial y nuevo Wine & Cocktail Bar (`Spa.webp`, `Restaurant.webp`, `Bar.webp`) destacando vinos, coctelería y atmósfera serena.
- Fotografías accesibles mediante lightbox con captions bilingües.
- Contacto mantiene CTA `mailto` institucional y enlaces a canales de comunicación existentes.

## Estilos (`assets/css/style.css`)
- Variables de color y tipografías alineadas con el manual de identidad.
- Componentes compartidos: hero, cards, navbar sticky + hamburguesa, bloques CTA, media-roll y versiones responsive para <960 px y <640 px.
- Ajustes recientes: overlay del hero, soporte para vídeo de fondo (`.hero-video`) con autoplay, menú bilingüe con iconos de bandera, visor lightbox reutilizable, tarjetas horizontales con fallback vertical, CTA flotante en resort y control de overflow lateral en móviles.

## Biblioteca visual y medios
- `assets/brand/`: logos, favicons definitivos (`favicon.ico`, variaciones PNG 16–512 px) y manual de identidad.
- `assets/resort/images` y `assets/resort/videos`: hero principal, renders y material audiovisual (vídeo `valdoria-drone.mp4` optimizado a 8 s — 1920×1080 con copia original en `valdoria-drone.original.mp4`).
- `assets/experiencias/images`: recursos gastronómicos y de ocio.
- `assets/villas/images`: renders de suites y residencias.
- `assets/wellness/images`: material del spa y wellness.
- Conversión general a WebP sin pérdida y actualización de referencias HTML/CSS; recursos originales en PNG se conservan donde el diseño los requiere.

## Infraestructura
- Nginx sirve `/var/www/valdoriahotel` en `0.0.0.0:9085`.
- Traefik con proveedor de fichero (`/root/traefik/dynamic/valdoria.yaml`) enruta al host via `172.17.0.1:9085`.
- Subdominio `valdoria.nomadprompters.es` gestionado en Cloudflare y redirigido por Traefik.

## Avatar “Habla con Val”

- La integración se centraliza en `assets/js/heygen-embed.js` y se carga desde las páginas principales mediante el atributo `data-heygen-trigger`.
- La integración antigua de HeyGen Streaming/Interactive Avatar ha quedado sustituida por un modo demo local mientras LiveAvatar requiere activar un plan.
- Avatar LiveAvatar reservado para Val: `394470da-7d4f-4b77-bffe-14d69964d9e1`.
- Actualmente no se realizan llamadas a HeyGen/LiveAvatar. Al abrir el panel se muestra el mensaje: “Hasta que no me contrate alguien, ¡no trabajo! 😌”. El panel incluye una `X` accesible para cerrarlo.
- Para activar LiveAvatar, editar `LIVE_AVATAR_CONFIG` en `assets/js/heygen-embed.js`, pegar el `EMBED_URL` generado desde el panel de LiveAvatar y cambiar `ENABLED` a `true`. No guardar claves API en el frontend.
- La API oficial de sesiones utiliza `https://api.liveavatar.com/v1/sessions/token`; si se necesita una integración programática, la clave debe permanecer en backend.

## Pendientes
- Generar o copiar el embed de LiveAvatar cuando haya plan, probarlo en sandbox y activar `LIVE_AVATAR_CONFIG`.
- Sustituir imágenes temporales por renders oficiales definitivos.
- Ajustar contenido final de `resort.html` (menú, copy, datos de contacto).
- Confirmar emisión del certificado Let’s Encrypt en Traefik.
- Validar comportamiento móvil del hero tras la optimización de `valdoria-drone.mp4` (autoplay, consumo de datos).
