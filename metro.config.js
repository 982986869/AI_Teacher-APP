// Metro configuration for Expo (SDK 54).
// https://docs.expo.dev/guides/customizing-metro/
//
// Expo SDK 53+ enables Metro's "package exports" resolution by default. Some
// packages (e.g. lucide-react-native, whose `exports` map points at a large ESM
// icon barrel) fail to bundle under it. Turning it off reverts to the classic
// main/react-native field resolution that those libraries expect.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = false;

module.exports = config;
