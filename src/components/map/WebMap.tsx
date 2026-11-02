/**
 * The app's **map component** (Leaflet + OpenStreetMap inside a WebView).
 *
 * You describe what to show (zones, user position, pin, view) and the map draws
 * it. Whenever the props change, the new data is sent to the page.
 *
 * @example
 * ```tsx
 * <WebMap
 *   zones={[{ id: 'a', lat: 44.8, lng: 20.47, radius: 200, label: 'Market', icon: 'basket-outline', active: true }]}
 *   user={{ latitude: 44.8, longitude: 20.46 }}
 *   view={{ key: 'start', center: { lat: 44.8, lng: 20.46 }, zoom: 15 }}
 *   onZonePress={(id) => router.push(`/zones/${id}`)}
 * />
 * ```
 *
 * @module components/map/WebMap
 * @category Map
 */
import { useEffect, useMemo, useRef, type ComponentType, type Ref } from 'react';
import { Linking, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { useTheme } from '@/theme';
import type { LatLng } from '@/utils/geo';

import { buildMapHtml } from './mapHtml';

/**
 * react-native-webview 14 ships TypeScript types that do not match React Native
 * 0.88 yet (its props resolve to `never`). The component itself works, so we
 * use it through a loosely typed alias. Remove this when the package updates.
 */
const BrowserView = WebView as unknown as ComponentType<Record<string, unknown> & { ref?: Ref<WebView> }>;

/** One zone (circle + marker) on the map. */
export interface MapZone {
  id: string;
  lat: number;
  lng: number;
  /** Radius in meters. */
  radius: number;
  /** Text under the marker (shown when `showLabels` is true). */
  label: string;
  /** Icon name from `generated/mapIcons.ts`, e.g. `basket-outline`. */
  icon: string;
  /** Marker and circle color (default: theme primary). */
  color?: string;
  /** Paused zones are drawn lighter. */
  active: boolean;
}

/** A single pin with a circle (used in the zone editor). */
export interface MapPin {
  lat: number;
  lng: number;
  radius: number;
  icon: string;
  /** The pin can be dragged with a finger; the new place comes back through `onPress`. */
  draggable?: boolean;
}

/**
 * Where the camera should look. The map moves only when `key` changes, so the
 * user can pan freely without the map jumping back.
 */
export interface MapView {
  key: string;
  /** Show all these points (`[lat, lng]` pairs). */
  fit?: [number, number][];
  /** Or center on this point. */
  center?: { lat: number; lng: number };
  zoom?: number;
  /**
   * Parts of the map covered by other things (header, bottom sheet), in points.
   * The camera keeps the zones inside the free area.
   */
  padding?: { top: number; bottom: number };
}

/** Props of {@link WebMap}. */
export interface WebMapProps {
  zones?: MapZone[];
  user?: LatLng | null;
  pin?: MapPin | null;
  view?: MapView;
  /** Show zone names under markers. */
  showLabels?: boolean;
  /** `false` = a still background map (no panning, no taps). Default true. */
  interactive?: boolean;
  onPress?: (point: LatLng) => void;
  onZonePress?: (zoneId: string) => void;
  style?: StyleProp<ViewStyle>;
}

/** Map for the whole app. */
export function WebMap({
  zones = [],
  user,
  pin,
  view,
  showLabels = true,
  interactive = true,
  onPress,
  onZonePress,
  style,
}: WebMapProps) {
  const { colors, isDark } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const isReady = useRef(false);

  // The page is built once per look (light/dark) and accent color.
  const html = useMemo(
    () => buildMapHtml(isDark, { primary: colors.primary, text: colors.text, surface: colors.surface }),
    [isDark, colors.primary, colors.text, colors.surface],
  );

  // Everything the page needs to draw, as one object.
  const data = {
    zones,
    user: user ? { lat: user.latitude, lng: user.longitude } : null,
    pin,
    view,
    showLabels,
    interactive,
  };
  const script = `window.updateMap && window.updateMap(${JSON.stringify(data)}); true;`;

  // Send new data whenever it changes (once the page is ready).
  useEffect(() => {
    if (isReady.current) webViewRef.current?.injectJavaScript(script);
  }, [script]);

  function handleMessage(event: WebViewMessageEvent) {
    let message: { type: string; lat?: number; lng?: number; id?: string };
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (message.type === 'ready') {
      isReady.current = true;
      webViewRef.current?.injectJavaScript(script);
    } else if (message.type === 'press' && message.lat !== undefined && message.lng !== undefined) {
      onPress?.({ latitude: message.lat, longitude: message.lng });
    } else if (message.type === 'zone' && message.id) {
      onZonePress?.(message.id);
    }
  }

  return (
    <View
      style={[styles.wrapper, { backgroundColor: isDark ? '#1b2230' : '#eef0f3' }, style]}
      pointerEvents={interactive ? 'auto' : 'none'}>
      <BrowserView
        key={html.length + (isDark ? 'd' : 'l') + colors.primary}
        ref={webViewRef}
        source={{ html }}
        originWhitelist={['*']}
        onMessage={handleMessage}
        // Links in the page (e.g. "© OpenStreetMap") open in the phone's browser, not inside the map.
        onShouldStartLoadWithRequest={(request: { url: string }) => {
          if (request.url.startsWith('http')) {
            void Linking.openURL(request.url);
            return false;
          }
          return true;
        }}
        onLoadStart={() => {
          isReady.current = false;
        }}
        style={styles.webView}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        setSupportMultipleWindows={false}
        javaScriptEnabled
        // Identifies the app to tile servers (OpenStreetMap asks for this).
        applicationNameForUserAgent="GeoNote/2.0 (com.geonote.app)"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { overflow: 'hidden' },
  webView: { flex: 1, backgroundColor: 'transparent' },
});
