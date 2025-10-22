# Valdoria Hotel – Resumen de trabajo

## Estructura actual
- Carpeta del proyecto en `/var/www/valdoriahotel/` con subdirectorios `assets/css`, `assets/js`, `assets/brand`, `assets/resort`, `assets/experiencias`, `assets/villas`, `assets/wellness`.
- Archivos principales: `index.html`, `resort.html`, `assets/css/style.css`.

## Landing principal (`index.html`)
- Hero con imagen cenital (`Hotel Cenital.webp`), overlay oscuro, logo oficial y CTA “Ver Resort”.
- Texto introductorio breve manteniendo claim y enlace a la página completa del resort.

## Página del resort (`resort.html`)
- Navbar sticky en escritorio y menú hamburguesa accesible en móvil con enlaces a Resort, Experiencias, Villas, Wellness & Gastro y Contacto.
- Hero con vídeo de dron (`assets/resort/videos/valdoria-drone.mp4`) y CTA fijo centrado sobre el borde inferior.
- Secciones derivadas en páginas dedicadas (Experiencias, Villas, Wellness, Contacto) accesibles desde el menú.

## Experiencias (`experiencias.html`)
- Hero con copy curado y navegación consolidada.
- Grid de tarjetas temáticas (Suites, Spa & Wellness, Gastronomía).
- Sin CTA intermedio para favorecer lectura del contenido.

## Villas (`villas.html`)
- Meta title/description optimizados para SEO.
- Hero con nuevo claim “El arte de habitar el silencio” con tipografía ajustada para móvil/tablet sin cortes forzados.
- Slideshow cuadrado (media-roll) que rota renders (`Suite1.png`, `Suite2.png`, `suite3.png`).
- Secciones narrativas: refugio sensorial, tecnología invisible, servicio personalizado.
- CTA final “Reservar experiencia privada →” enlazado a `contacto.html`.

## Wellness & Contacto
- Estructura de copy mantenida, navegación actualizada con enlace “Resort”.
- Contacto conserva CTA mailto institucional.

## Estilos (`assets/css/style.css`)
- Variables de color tipográficas acorde al manual de identidad.
- Componentes compartidos: hero, cards, nav, CTA blocks y media-roll responsive.
- Ajustes recientes: navbar sticky + hamburguesa, vídeo hero del resort sin filtros, CTA flotante, slideshow por crossfade, tipografías escaladas para móvil y hero de Villas con cortes manuales controlados.

## Optimización de recursos
- Conversión de imágenes a WebP sin pérdida (`assets/**.webp`) y actualización de referencias en HTML/CSS.
- Control de overflow lateral en móviles y centrado de contenidos tipográficos en héroes secundarios.

## Biblioteca visual
- `assets/brand/`: identidad (logos en varias versiones y manual PDF).
- `assets/resort/images` y `assets/resort/videos`: hero principal, renders del complejo y material audiovisual.
- `assets/experiencias/images`: recursos de experiencias gastronómicas y de ocio.
- `assets/villas/images`: renders de suites y residencias.
- `assets/wellness/images`: material del spa y wellness.

## Infraestructura
- Nginx instalado en host escuchando en `0.0.0.0:9085` sirviendo `/var/www/valdoriahotel`.
- Traefik configurado con proveedor de fichero (`/root/traefik/dynamic/valdoria.yaml`) apuntando al host vía `172.17.0.1:9085`.
- Subdominio `valdoria.nomadprompters.es` en DNS (Cloudflare) redirigido por Traefik.

## Pendiente / próximos pasos
- Sustituir imágenes temporales por renders oficiales.
- Ajustar contenido de `resort.html` (menú, copy final, datos de contacto).
- Confirmar emisión del certificado Let’s Encrypt en Traefik.
