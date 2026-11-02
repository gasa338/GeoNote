// Learn more: https://docs.expo.dev/guides/customizing-metro
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/**
 * FIX za Expo Go na Androidu:
 * expo-notifications pri importu traži native modul `ExpoTopicSubscriptionModule`
 * (FCM "topic" push), koji Expo Go nema → "Cannot find native module".
 *
 * Aplikacija koristi samo LOKALNE notifikacije, pa Android verziju tog modula
 * zamenjujemo praznom (istom onom koju paket koristi na iOS-u / webu).
 * Ako jednog dana budeš koristio subscribeToTopicAsync, obriši ovaj blok.
 */
const topicStub = path.join(
  path.dirname(require.resolve('expo-notifications/package.json')),
  'build',
  'TopicSubscriptionModule.js',
);

const defaultResolve = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'android' &&
    moduleName === './TopicSubscriptionModule' &&
    context.originModulePath.includes(`${path.sep}expo-notifications${path.sep}`)
  ) {
    return { type: 'sourceFile', filePath: topicStub };
  }
  return defaultResolve
    ? defaultResolve(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
