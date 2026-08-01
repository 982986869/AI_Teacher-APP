module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
      }],
      // Reanimated 4 moved the worklets transform into react-native-worklets.
      // It MUST be the last plugin in the list.
      'react-native-worklets/plugin',
    ],
  };
};
