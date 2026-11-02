/**
 * Builds the HTML page that draws the map inside a WebView.
 *
 * Why a WebView map?
 * - **No API key.** The map uses Leaflet (open source) with OpenStreetMap data,
 *   so there is no Google key to configure and nothing to go "black".
 * - Works the same in Expo Go and in the real build (APK).
 * - Leaflet is bundled into the app (`generated/leafletAssets.ts`), only map
 *   tiles (images) are downloaded.
 *
 * The page exposes one function, `window.updateMap(data)`, which the app calls
 * with zones, the user position, an optional pin and the wanted view.
 * The page sends messages back: `ready`, `press` (map tapped) and `zone` (marker tapped).
 *
 * ### Map tiles (the images of the map) — see {@link getTileLayer}
 * - **With a CARTO key** (`EXPO_PUBLIC_CARTO_KEY` in `.env`): the clean light/dark
 *   CARTO look from the design. Free key: https://carto.com/basemaps/apikey/
 *   (non-commercial up to 5M, commercial up to 1M tile requests a month).
 *   Since August 2026 CARTO tiles without a key show "API key required".
 * - **Without a key**: standard OpenStreetMap tiles (darkened by a filter in dark
 *   mode). Fine for testing; for a published app use a key.
 *
 * @module components/map/mapHtml
 * @category Map
 */
import { LEAFLET_CSS, LEAFLET_JS } from './generated/leafletAssets';
import { MAP_ICONS } from './generated/mapIcons';

/** CARTO key from `.env` (`EXPO_PUBLIC_CARTO_KEY=...`), or empty. Read when the app is built. */
const CARTO_KEY = process.env.EXPO_PUBLIC_CARTO_KEY ?? '';

/** One tile source for Leaflet. */
export interface TileLayer {
  url: string;
  attribution: string;
  subdomains: string;
  /** CSS filter for the tiles (used to darken OpenStreetMap tiles in dark mode). */
  filter: string;
}

/** Picks the tile source: CARTO when a key is set, otherwise OpenStreetMap. */
export function getTileLayer(dark: boolean): TileLayer {
  if (CARTO_KEY) {
    const style = dark ? 'dark_all' : 'light_all';
    return {
      url: `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(CARTO_KEY)}`,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      filter: 'none',
    };
  }
  return {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abc',
    filter: dark ? 'invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.9) saturate(0.4)' : 'saturate(0.55) brightness(1.03)',
  };
}

/** Colors the page needs (taken from the app theme). */
export interface MapColors {
  primary: string;
  text: string;
  surface: string;
}

/** Returns the full HTML page for the map. */
export function buildMapHtml(dark: boolean, colors: MapColors): string {
  const tiles = getTileLayer(dark);
  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>${LEAFLET_CSS}
html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: ${dark ? '#1b2230' : '#eef0f3'}; }
.leaflet-control-attribution { font: 10px -apple-system, Roboto, sans-serif; background: transparent !important; color: ${dark ? '#8b95a7' : '#6b7280'}; }
.leaflet-control-attribution a { color: inherit; }
.leaflet-tile-pane { filter: ${tiles.filter}; }
.zone-marker { display: flex; flex-direction: column; align-items: center; }
.zone-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
  border: 3px solid #fff; box-shadow: 0 4px 12px rgba(15,23,42,.25); color: #fff; box-sizing: border-box; }
.zone-icon svg { width: 20px; height: 20px; fill: currentColor; }
.zone-icon.paused { opacity: .55; }
.zone-label { margin-top: 6px; padding: 3px 8px; border-radius: 8px; white-space: nowrap; font: 600 12px -apple-system, Roboto, sans-serif;
  background: ${dark ? 'rgba(20,27,38,.92)' : 'rgba(255,255,255,.95)'}; color: ${colors.text}; box-shadow: 0 2px 6px rgba(15,23,42,.15); }
.user-dot { width: 16px; height: 16px; border-radius: 8px; background: ${colors.primary}; border: 3px solid #fff; box-shadow: 0 0 0 10px ${colors.primary}2e; box-sizing: border-box; }
</style>
<script>${LEAFLET_JS}</script>
</head><body><div id="map"></div>
<script>
(function () {
  var ICONS = ${JSON.stringify(MAP_ICONS)};
  var PRIMARY = ${JSON.stringify(colors.primary)};

  // Send a message to the app (React Native WebView, or the parent page in a browser preview).
  function send(message) {
    var text = JSON.stringify(message);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(text);
    else if (window.parent !== window) window.parent.postMessage(text, '*');
  }

  var map = L.map('map', { zoomControl: false, attributionControl: true }).setView([44.8, 20.46], 14);
  L.tileLayer(${JSON.stringify(tiles.url)}, {
    attribution: ${JSON.stringify(tiles.attribution)},
    subdomains: ${JSON.stringify(tiles.subdomains)}, maxZoom: 19
  }).addTo(map);
  map.attributionControl.setPrefix(false);

  var layers = L.layerGroup().addTo(map);
  var lastViewKey = null;

  function iconHtml(name, color, paused, label) {
    return '<div class="zone-marker"><div class="zone-icon' + (paused ? ' paused' : '') + '" style="background:' + color + '">' +
      (ICONS[name] || ICONS['location']) + '</div>' + (label ? '<div class="zone-label">' + label + '</div>' : '') + '</div>';
  }

  function escapeHtml(text) {
    return String(text || '').replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; });
  }

  // Draws everything again from the data the app sends.
  window.updateMap = function (data) {
    layers.clearLayers();
    var interactive = data.interactive !== false;
    [map.dragging, map.touchZoom, map.doubleClickZoom, map.scrollWheelZoom, map.boxZoom, map.keyboard].forEach(function (h) {
      if (h) interactive ? h.enable() : h.disable();
    });

    (data.zones || []).forEach(function (z) {
      var color = z.color || PRIMARY;
      L.circle([z.lat, z.lng], { radius: z.radius, color: color, weight: 2, opacity: z.active ? 0.9 : 0.4, fillColor: color, fillOpacity: z.active ? 0.12 : 0.05, interactive: false }).addTo(layers);
      L.circle([z.lat, z.lng], { radius: z.radius * 0.62, color: color, weight: 1, opacity: 0.35, fill: false, interactive: false }).addTo(layers);
      var marker = L.marker([z.lat, z.lng], {
        icon: L.divIcon({ className: '', html: iconHtml(z.icon, color, !z.active, data.showLabels ? escapeHtml(z.label) : ''), iconSize: [160, 70], iconAnchor: [80, 20] })
      }).addTo(layers);
      marker.on('click', function () { send({ type: 'zone', id: z.id }); });
    });

    if (data.pin) {
      var p = data.pin;
      var pinCircle = L.circle([p.lat, p.lng], { radius: p.radius, color: PRIMARY, weight: 2, fillColor: PRIMARY, fillOpacity: 0.12, interactive: false }).addTo(layers);
      var pinMarker = L.marker([p.lat, p.lng], {
        icon: L.divIcon({ className: '', html: iconHtml(p.icon, PRIMARY, false, ''), iconSize: [160, 70], iconAnchor: [80, 20] }),
        interactive: !!p.draggable, draggable: !!p.draggable, autoPan: true
      }).addTo(layers);
      if (p.draggable) {
        // The circle follows the finger; on release the app gets the new place.
        pinMarker.on('drag', function (e) { pinCircle.setLatLng(e.target.getLatLng()); });
        pinMarker.on('dragend', function (e) { var ll = e.target.getLatLng(); send({ type: 'press', lat: ll.lat, lng: ll.lng }); });
      }
    }

    if (data.user) {
      L.marker([data.user.lat, data.user.lng], { icon: L.divIcon({ className: '', html: '<div class="user-dot"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }), interactive: false }).addTo(layers);
    }

    // Move the camera only when the app asks for a new view.
    var view = data.view;
    if (view && view.key !== lastViewKey) {
      lastViewKey = view.key;
      var pad = view.padding || { top: 0, bottom: 0 };
      if (view.fit && view.fit.length > 1) {
        map.fitBounds(L.latLngBounds(view.fit), {
          paddingTopLeft: [48, pad.top + 48], paddingBottomRight: [48, pad.bottom + 48], maxZoom: 16, animate: false
        });
      } else if (view.center) {
        map.setView([view.center.lat, view.center.lng], view.zoom || 15, { animate: false });
        // Move the point into the middle of the free (uncovered) area.
        if (pad.top || pad.bottom) map.panBy([0, (pad.bottom - pad.top) / 2], { animate: false });
      }
    }
  };

  map.on('click', function (e) { send({ type: 'press', lat: e.latlng.lat, lng: e.latlng.lng }); });
  send({ type: 'ready' });
})();
</script></body></html>`;
}
