// Icon names lucide has since renamed. It still exports the old name from its barrel
// (`exports.AlertTriangle = triangleAlert`), so code importing the old name works — but
// the per-icon file on disk only exists under the new name. Rewriting `AlertTriangle` to
// `alert-triangle.js` would resolve to nothing, so these are mapped by hand.
//
// To check this list after a lucide upgrade:
//   node -e "…" over src/ collecting every imported name, kebab-case it, and assert
//   node_modules/lucide-react-native/dist/cjs/icons/<name>.js exists. Anything missing is
//   a new alias and belongs here.
const LUCIDE_ALIASES = {
  AlertTriangle: 'triangle-alert',
  ArrowUpCircle: 'circle-arrow-up',
  BarChart3: 'chart-column',
  CheckCircle2: 'circle-check',
  CircleHelp: 'circle-question-mark',
  HelpCircle: 'circle-question-mark',
  Home: 'house',
  MessageCircleQuestion: 'message-circle-question-mark',
  MoreVertical: 'ellipsis-vertical',
  Unlock: 'lock-open',
};

// ArrowLeft → arrow-left, Trash2 → trash-2, CircleCheckBig → circle-check-big.
const kebab = (name) => name
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
  .replace(/([a-zA-Z])([0-9])/g, '$1-$2')
  .toLowerCase();

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
      }],
      // `import { ArrowLeft } from 'lucide-react-native'` pulls the whole barrel, and the
      // barrel requires every icon in the library. Metro does not tree-shake, so all 3,490
      // of them shipped: 3,599 of the bundle's 3,787 modules were lucide, and the Android
      // bundle reached 52 MB — big enough that EAS Update's asset processing timed out and
      // no OTA could go out at all.
      //
      // This rewrites each named import to the single icon file it actually needs, at build
      // time, so no source file has to change. Deep paths like
      // `lucide-react-native/dist/cjs/icons/arrow-left.js` are outside the package's
      // `exports` map and only resolve because metro.config.js sets
      // `unstable_enablePackageExports = false` — the two settings are a pair, so do not
      // re-enable package exports without reworking this.
      //
      // CJS rather than ESM: with package exports off Metro resolves the `main` field, which
      // is the CJS build, and each CJS icon is a plain `module.exports = Icon`.
      ['transform-imports', {
        'lucide-react-native': {
          transform: (importName) =>
            `lucide-react-native/dist/cjs/icons/${LUCIDE_ALIASES[importName] || kebab(importName)}`,
          preventFullImport: true,
        },
      }],
      // Reanimated 4 moved the worklets transform into react-native-worklets.
      // It MUST be the last plugin in the list.
      'react-native-worklets/plugin',
    ],
  };
};
