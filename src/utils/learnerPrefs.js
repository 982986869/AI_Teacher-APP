// The student's stated LEARNING PREFERENCES — how they like to be taught (distinct
// from mastery, which is what they know). Stored on-device and sent along with each
// lesson request, where the server folds them into the personalization prompt
// (server/src/prompts/lessonGeneration.prompt.js → preferenceLine). No PII; all
// optional. Kept client-owned so no DB migration is needed to start adapting.
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@ailernova_learner_prefs';

export const EXPLANATION_STYLES = [
  { key: 'balanced', label: 'Balanced' },
  { key: 'visual', label: 'Visual' },
  { key: 'story', label: 'Story' },
  { key: 'practical', label: 'Practical' },
];
export const PACES = [
  { key: 'slow', label: 'Take it slow' },
  { key: 'average', label: 'Average' },
  { key: 'fast', label: 'Fast' },
];

export const DEFAULT_PREFS = { explanationStyle: 'balanced', pace: 'average', goal: '', examDate: '' };

export async function loadLearnerPrefs() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function saveLearnerPrefs(prefs) {
  try { await AsyncStorage.setItem(KEY, JSON.stringify({ ...DEFAULT_PREFS, ...(prefs || {}) })); } catch {}
}

// Only the fields worth sending (drop the neutral defaults so the prompt stays clean).
export function prefsForRequest(prefs) {
  if (!prefs) return undefined;
  const out = {};
  if (prefs.explanationStyle && prefs.explanationStyle !== 'balanced') out.explanationStyle = prefs.explanationStyle;
  if (prefs.pace && prefs.pace !== 'average') out.pace = prefs.pace;
  if (prefs.goal && String(prefs.goal).trim()) out.goal = String(prefs.goal).trim();
  if (prefs.examDate && String(prefs.examDate).trim()) out.examDate = String(prefs.examDate).trim();
  return Object.keys(out).length ? out : undefined;
}
