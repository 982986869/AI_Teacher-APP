 module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',          // ← keep existing
      ['module:react-native-dotenv', {            // ← add this
        moduleName: '@env',
        path: '.env',
      }]
    ],
  };
};
