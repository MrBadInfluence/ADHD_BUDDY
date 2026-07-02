package com.anonymous.BestBuddyADHD.wear

import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService

/**
 * Receives messages from the phone when the watch app is not in the foreground.
 * The ViewModel handles the same events when the app IS in the foreground via
 * its own DataClient listener.
 */
class WearDataListenerService : WearableListenerService() {

    override fun onMessageReceived(event: MessageEvent) {
        // Future: handle background push notifications (e.g. urgent reminders)
        // from the phone even when the watch app is closed.
        when (event.path) {
            "/adhd/tasks" -> {
                // Data Layer already syncs via DataItem; no extra action needed.
            }
        }
    }
}
