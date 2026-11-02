import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * App configuration (name, icons, permissions, native plugins).
 *
 * The map uses OpenStreetMap through Leaflet (see `src/components/map/`), so no
 * Google Maps key is needed.
 *
 * ⚠️ Keep `slug` and `extra.eas.projectId` — they link the app to your EAS project.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Geonote',
  slug: 'geonote',
  version: '2.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'geonote',
  userInterfaceStyle: 'automatic',
  platforms: ['ios', 'android'],
  ios: {
    bundleIdentifier: 'com.geonote.app',
    supportsTablet: false,
    infoPlist: {
      UIBackgroundModes: ['location', 'fetch', 'remote-notification'],
    },
  },
  android: {
    package: 'com.geonote.app',
    adaptiveIcon: {
      backgroundColor: '#EAF1FD',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'POST_NOTIFICATIONS',
      'RECEIVE_BOOT_COMPLETED',
    ],
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    'expo-dev-client',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#3370EA',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Geonote uses your location, also when the app is closed, to remind you when you enter or leave one of your zones.',
        locationWhenInUsePermission: 'Geonote uses your location to show the map and your zones.',
        isIosBackgroundLocationEnabled: true,
        isAndroidBackgroundLocationEnabled: true,
      },
    ],
    [
      'expo-notifications',
      {
        color: '#3370EA',
        // Sounds bundled into the build, usable by notifications (alarm reminders).
        sounds: ['./assets/sounds/alarm.wav'],
      },
    ],
    [
      // Plays the in-app alarm. Only playback is used — no microphone.
      'expo-audio',
      {
        microphonePermission: false,
        recordAudioAndroid: false,
        enableBackgroundPlayback: false,
      },
    ],
    [
      // Android build settings.
      //
      // Code shrinking (R8) is off: in version 1.x it removed classes that a
      // library created by name and the APK crashed on start ("WorkDatabase").
      // That library (react-native-maps) is gone, but the keep-rules stay as a
      // safety net in case shrinking is turned on later (e.g. for the Play Store).
      'expo-build-properties',
      {
        android: {
          enableMinifyInReleaseBuilds: false,
          extraProguardRules: [
            '# Room / WorkManager: database classes are created by name — keep them.',
            '-keep class * extends androidx.room.RoomDatabase { <init>(); }',
            '-keep class androidx.work.impl.** { *; }',
          ].join('\n'),
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  owner: 'gasa4210',
  extra: {
    eas: {
      projectId: '92ee97f9-f245-426b-b202-853e10828e67',
    },
  },
});
