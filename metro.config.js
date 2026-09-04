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

// Defer every require() to the first time the binding is actually read, instead of
// running all of a module's dependencies the moment it is imported.
//
// This is a tab-switch fix. ResourcesScreen statically imports 5.0 MB across 82
// modules — ~4 MB of it Class 11/12 exemplar question banks, several over 200 KB
// each — and with eager requires the JS thread parses and evaluates all of it
// before the tab can paint. That is the freeze when switching to Resources.
//
// With this on, a chapter's questions are evaluated when that chapter is opened,
// which is both later and usually never: a student reads one chapter, not eighty.
//
// Expo leaves this off by default because it changes WHEN module side effects run,
// which can break a module that depends on import order. Nothing here does — the
// heavy modules are all plain data exports.
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: true,
    inlineRequires: true,
  },
});

module.exports = config;
