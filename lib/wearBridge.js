import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { WearBridge } = NativeModules;

const isAndroid = Platform.OS === 'android';

/**
 * Call once at app startup (App.js) to register the native Wearable
 * message listener so watch events are received app-wide.
 */
export function startWearBridge() {
  if (!isAndroid || !WearBridge) return;
  WearBridge.startListening().catch(() => {});
}

let emitter = null;

/**
 * Push current tasks to the paired Wear OS watch.
 *
 * @param {Array} bigThreeTasks  - Array of {id, title, isDone}
 * @param {Array} reminderTasks  - Array of {id, title, isDone}
 */
export async function syncTasksToWatch(bigThreeTasks = [], reminderTasks = []) {
  if (!isAndroid || !WearBridge) return;

  const payload = [
    ...bigThreeTasks.map(t => ({ ...t, isReminder: false })),
    ...reminderTasks.map(t => ({ ...t, isReminder: true })),
  ];

  try {
    await WearBridge.syncTasks(JSON.stringify(payload));
  } catch (_) {
    // Watch not paired or unavailable — silently ignore
  }
}

/**
 * Start listening for "Done" and "Snooze" events sent from the watch.
 * Call once at app startup (e.g. in App.js useEffect).
 *
 * @param {Function} onDone   - (taskId: string) => void
 * @param {Function} onSnooze - (taskId: string) => void
 * @returns unsubscribe function
 */
export function subscribeToWatchEvents({ onDone, onSnooze }) {
  if (!isAndroid || !WearBridge) return () => {};

  WearBridge.startListening().catch(() => {});

  emitter = emitter ?? new NativeEventEmitter(WearBridge);

  const doneSub = emitter.addListener('WearTaskDone', onDone);
  const snoozeSub = emitter.addListener('WearTaskSnoozed', onSnooze);

  return () => {
    doneSub.remove();
    snoozeSub.remove();
  };
}
