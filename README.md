# Hoy Dormimos Poco — web del podcast

Web estática para **GitHub Pages**, con 195 episodios reales incluidos como catálogo inicial, portadas originales, búsqueda, filtros, fichas y recomendaciones **exclusivamente desde la temporada 4**.

## Publicar en GitHub Pages

1. Crea un repositorio público en GitHub (por ejemplo `hdp-web`).
2. Sube **el contenido de esta carpeta**, no la carpeta contenedora, a la rama `main` (incluye `.github/workflows/pages.yml`).
3. En **Settings → Pages → Build and deployment**, selecciona **GitHub Actions**.
4. En la pestaña **Actions**, ejecuta `Actualizar podcast y publicar web` con **Run workflow**, o espera al primer despliegue tras subir los archivos.
5. GitHub mostrará la URL pública en **Settings → Pages**. Para un repositorio `hdp-web` será normalmente `https://USUARIO.github.io/hdp-web/`.

El workflow consulta el RSS de iVoox **cada 6 horas**, y también al hacer push a `main` o al pulsar **Run workflow**. GitHub puede retrasar ejecuciones programadas; no es una actualización instantánea. Si falla la descarga, usa el XML inicial incluido en `data/catalogo-inicial.xml` (véase advertencia).

## Editar la web

- `index.html`: textos, diseño, buscador y fichas.
- `assets/logo-hdp.jpg`: logo del podcast.
- `config.json`: enlaces a plataformas y redes, correcciones manuales de categoría y episodios destacados.
- `scripts/build.py`: transforma el RSS en `episodes.json` durante cada despliegue.
- `episodes.json`: catálogo generado; no hace falta modificarlo manualmente.

### Plataformas

El RSS de iVoox aporta **enlaces individuales de iVoox** y archivos de audio, pero **no proporciona URLs individuales verificadas de Spotify, Apple Podcasts u otras plataformas**. Para añadir enlaces generales al podcast, completa `platforms` en `config.json` con direcciones reales, por ejemplo:

```json
"platforms": {"Spotify": "https://open.spotify.com/show/URL_REAL"}
```

Los botones adicionales indicarán **“Podcast en Spotify”**, no fingirán llevar al episodio concreto. La ficha de cada programa incluye un enlace directo a su episodio de iVoox.

### Recomendaciones y categorías

La recomendación aleatoria nunca incluye temporadas 1, 2 o 3. Para seleccionar manualmente episodios recomendables, añade sus valores `id` (en `episodes.json`) a `featuredIds` en `config.json`. Solo se tendrán en cuenta si son de temporada 4+. `excludedRecommendationIds` permite excluir episodios concretos. `categoryOverrides` permite corregir la clasificación automática, p. ej. `"https://www.ivoox.com/182956021": "Cine"`.

Las categorías son una **clasificación automática aproximada**, no etiquetas oficiales de iVoox; conviene revisar casos dudosos.

## Probar en el ordenador

Puedes abrir `index.html` directamente con doble clic: carga `data/catalogo-local.js` como respaldo, sin depender de `fetch`. En GitHub Pages se utiliza `episodes.json` actualizado automáticamente.

También puedes usar un servidor local desde esta carpeta:

```bash
python scripts/build.py
python -m http.server 8000
```

Abre `http://localhost:8000`. Para probar descarga del RSS en vez de instantánea:

```bash
HDP_FETCH_RSS=1 python scripts/build.py
```

En PowerShell: `$env:HDP_FETCH_RSS='1'; python scripts/build.py`.

## Aviso sobre actualización

Si iVoox no responde, el workflow conserva los episodios del catálogo disponible en el repositorio y usa la instantánea incluida como respaldo. En cada actualización se fusionan los episodios nuevos con los anteriores para no perder los antiguos cuando el RSS sea más corto. Para un sitio de producción más robusto, se puede conservar el último `episodes.json` válido como respaldo, en lugar de la instantánea inicial. Los archivos de audio se reproducen en iVoox; esta web no aloja ni redistribuye audio.


## Criterio editorial
La portada conserva la presentación original del podcast y los nombres de secciones acordados. No se incluye la sección «Sobre nosotros». Los cambios automáticos del RSS afectan a los episodios, no a los textos de presentación.

## Cómo se actualiza el feed

El navegador no descarga directamente el RSS de iVoox: la actualización la realiza GitHub Actions en cada despliegue y cada seis horas. En local se muestra la copia incluida; para actualizarla manualmente ejecuta `HDP_FETCH_RSS=1 python scripts/build.py` (en PowerShell, `$env:HDP_FETCH_RSS='1'; python scripts/build.py`). La ejecución en GitHub requiere que el workflow tenga permiso para publicar Pages.
