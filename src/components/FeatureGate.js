import React from 'react';
import { useRuntimeConfig } from '../context/RuntimeConfigContext';

// Declarative feature gate. Renders `children` only when the feature flag is enabled;
// otherwise renders `fallback` (default null → hidden). Keeps flag checks out of screens.
//
//   <FeatureGate feature={FEATURE_KEYS.AI_TEACHER}>
//     <AskADoubtCard />
//   </FeatureGate>
export function FeatureGate({ feature, children, fallback = null }) {
  const { isFeatureEnabled } = useRuntimeConfig();
  return isFeatureEnabled(feature) ? children : fallback;
}

export default FeatureGate;
