import { requireOptionalNativeModule } from 'expo';

// Returns the native ExpoSpeechRecognition module, or null if not built into the APK yet.
// Using requireOptionalNativeModule avoids the fatal dev-overlay crash that
// requireNativeModule throws when the native module is missing.
export const SpeechModule = requireOptionalNativeModule('ExpoSpeechRecognition');
