// Temporary mock — use this until @react-native-google-signin/google-signin is installed
// Replace the import in LoginScreen.js and SignupScreen.js with the real package when ready

export const GoogleSignin = {
  configure: () => {},
  hasPlayServices: async () => true,
  signIn: async () => ({ idToken: 'mock-google-id-token' }),
  signOut: async () => {},
};