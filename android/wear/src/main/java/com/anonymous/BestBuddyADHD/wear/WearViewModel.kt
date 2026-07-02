package com.anonymous.BestBuddyADHD.wear

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.android.gms.wearable.DataClient
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.Wearable
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import org.json.JSONArray

data class WearTask(
    val id: String,
    val title: String,
    val isDone: Boolean,
    val isReminder: Boolean,
)

data class WearUiState(
    val tasks: List<WearTask> = emptyList(),
    val isSyncing: Boolean = true,
)

class WearViewModel(app: Application) : AndroidViewModel(app),
    DataClient.OnDataChangedListener {

    private val dataClient = Wearable.getDataClient(app)

    private val _uiState = MutableStateFlow(WearUiState())
    val uiState: StateFlow<WearUiState> = _uiState

    init {
        dataClient.addListener(this)
        loadCachedData()
    }

    override fun onCleared() {
        dataClient.removeListener(this)
        super.onCleared()
    }

    // Called when the phone pushes a data update
    override fun onDataChanged(events: DataEventBuffer) {
        for (event in events) {
            if (event.type == DataEvent.TYPE_CHANGED &&
                event.dataItem.uri.path == "/adhd/tasks"
            ) {
                val dataMap = DataMapItem.fromDataItem(event.dataItem).dataMap
                val json = dataMap.getString("tasks_json") ?: continue
                parseTasks(json)
            }
        }
        events.release()
    }

    fun markDone(taskId: String) {
        _uiState.value = _uiState.value.copy(
            tasks = _uiState.value.tasks.map {
                if (it.id == taskId) it.copy(isDone = true) else it
            }
        )
        viewModelScope.launch { sendDoneMessage(taskId) }
    }

    fun snoozeReminder(taskId: String) {
        // Locally hide the reminder; phone will re-push it after snooze period
        _uiState.value = _uiState.value.copy(
            tasks = _uiState.value.tasks.filter { it.id != taskId }
        )
        viewModelScope.launch { sendSnoozeMessage(taskId) }
    }

    private fun loadCachedData() {
        viewModelScope.launch {
            try {
                val items = dataClient.getDataItems().await()
                for (item in items) {
                    if (item.uri.path == "/adhd/tasks") {
                        val dataMap = DataMapItem.fromDataItem(item).dataMap
                        val json = dataMap.getString("tasks_json") ?: continue
                        parseTasks(json)
                    }
                }
                items.release()
            } finally {
                if (_uiState.value.tasks.isEmpty()) injectDemoTasks()
                _uiState.value = _uiState.value.copy(isSyncing = false)
            }
        }
    }

    private fun injectDemoTasks() {
        _uiState.value = WearUiState(isSyncing = false, tasks = listOf(
            WearTask("demo1", "Finish the report", isDone = false, isReminder = false),
            WearTask("demo2", "Team standup", isDone = true, isReminder = false),
            WearTask("demo3", "Hydration Break", isDone = false, isReminder = true),
        ))
    }

    private fun parseTasks(json: String) {
        val arr = JSONArray(json)
        val tasks = (0 until arr.length()).map { i ->
            val obj = arr.getJSONObject(i)
            WearTask(
                id = obj.getString("id"),
                title = obj.getString("title"),
                isDone = obj.optBoolean("isDone", false),
                isReminder = obj.optBoolean("isReminder", false),
            )
        }
        _uiState.value = WearUiState(tasks = tasks, isSyncing = false)
    }

    private suspend fun sendDoneMessage(taskId: String) {
        val nodes = Wearable.getNodeClient(getApplication()).connectedNodes.await()
        nodes.forEach { node ->
            Wearable.getMessageClient(getApplication())
                .sendMessage(node.id, "/adhd/done", taskId.toByteArray())
                .await()
        }
    }

    private suspend fun sendSnoozeMessage(taskId: String) {
        val nodes = Wearable.getNodeClient(getApplication()).connectedNodes.await()
        nodes.forEach { node ->
            Wearable.getMessageClient(getApplication())
                .sendMessage(node.id, "/adhd/snooze", taskId.toByteArray())
                .await()
        }
    }
}
