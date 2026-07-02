package com.anonymous.BestBuddyADHD.wearbridge

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.tasks.Tasks
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable

class WearBridgeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "WearBridge"

    @ReactMethod
    fun syncTasks(tasksJson: String, promise: Promise) {
        try {
            val request = PutDataMapRequest.create("/adhd/tasks").apply {
                dataMap.putString("tasks_json", tasksJson)
                dataMap.putLong("timestamp", System.currentTimeMillis())
            }
            val putRequest = request.asPutDataRequest().setUrgent()
            Tasks.await(Wearable.getDataClient(reactApplicationContext).putDataItem(putRequest))
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("WEAR_SYNC_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun startListening(promise: Promise) {
        try {
            val emitterClass = DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
            Wearable.getMessageClient(reactApplicationContext).addListener { event ->
                val taskId = String(event.data)
                val emitter = reactApplicationContext.getJSModule(emitterClass)
                when (event.path) {
                    "/adhd/done" -> emitter.emit("WearTaskDone", taskId)
                    "/adhd/snooze" -> emitter.emit("WearTaskSnoozed", taskId)
                }
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("WEAR_LISTEN_ERROR", e.message, e)
        }
    }
}
