package com.anonymous.BestBuddyADHD.wear

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.material.*

// Brand colours matching the phone app's dark theme
private val BrandPurple = Color(0xFF7C3AED)
private val BrandBackground = Color(0xFF1A1A2E)
private val BrandSurface = Color(0xFF16213E)
private val BrandGreen = Color(0xFF4CAF50)
private val BrandAmber = Color(0xFFFFA726)
private val TextPrimary = Color(0xFFE0E0FF)
private val TextSecondary = Color(0xFF9E9EC8)

@Composable
fun WearApp(vm: WearViewModel) {
    val state by vm.uiState.collectAsState()

    MaterialTheme(
        colors = MaterialTheme.colors.copy(
            primary = BrandPurple,
            background = BrandBackground,
            surface = BrandSurface,
            onPrimary = Color.White,
            onBackground = TextPrimary,
            onSurface = TextPrimary,
        )
    ) {
        when {
            state.isSyncing -> SyncingScreen()
            state.tasks.isEmpty() -> EmptyScreen()
            else -> TaskListScreen(
                tasks = state.tasks,
                onDone = { vm.markDone(it) },
                onSnooze = { vm.snoozeReminder(it) },
            )
        }
    }
}

@Composable
private fun SyncingScreen() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BrandBackground),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(
                indicatorColor = BrandPurple,
                trackColor = BrandSurface,
            )
            Spacer(Modifier.height(8.dp))
            Text("Syncing…", color = TextSecondary, fontSize = 13.sp)
        }
    }
}

@Composable
private fun EmptyScreen() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BrandBackground),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(16.dp),
        ) {
            Text("✓", color = BrandGreen, fontSize = 32.sp)
            Spacer(Modifier.height(6.dp))
            Text(
                "No tasks today",
                color = TextPrimary,
                fontSize = 14.sp,
                textAlign = TextAlign.Center,
            )
            Text(
                "Open the phone app\nto add tasks",
                color = TextSecondary,
                fontSize = 11.sp,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
private fun TaskListScreen(
    tasks: List<WearTask>,
    onDone: (String) -> Unit,
    onSnooze: (String) -> Unit,
) {
    val bigThree = tasks.filter { !it.isReminder }
    val reminders = tasks.filter { it.isReminder }

    ScalingLazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BrandBackground),
        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        if (bigThree.isNotEmpty()) {
            item {
                SectionLabel("Today's Focus")
            }
            items(bigThree) { task ->
                TaskCard(task = task, onDone = { onDone(task.id) })
            }
        }

        if (reminders.isNotEmpty()) {
            item {
                SectionLabel("Reminders")
            }
            items(reminders) { task ->
                ReminderCard(
                    task = task,
                    onDone = { onDone(task.id) },
                    onSnooze = { onSnooze(task.id) },
                )
            }
        }
    }
}

@Composable
private fun SectionLabel(text: String) {
    Text(
        text = text,
        color = BrandPurple,
        fontSize = 11.sp,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 4.dp),
    )
}

@Composable
private fun TaskCard(task: WearTask, onDone: () -> Unit) {
    Chip(
        modifier = Modifier.fillMaxWidth(),
        onClick = onDone,
        colors = ChipDefaults.chipColors(
            backgroundColor = if (task.isDone) BrandSurface else BrandSurface,
            contentColor = if (task.isDone) TextSecondary else TextPrimary,
        ),
        border = ChipDefaults.chipBorder(),
        label = {
            Text(
                text = task.title,
                fontSize = 13.sp,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                color = if (task.isDone) TextSecondary else TextPrimary,
            )
        },
        secondaryLabel = if (task.isDone) ({
            Text("Done ✓", fontSize = 10.sp, color = BrandGreen)
        }) else null,
        icon = {
            Text(
                text = if (task.isDone) "✓" else "○",
                color = if (task.isDone) BrandGreen else BrandPurple,
                fontSize = 16.sp,
            )
        },
    )
}

@Composable
private fun ReminderCard(
    task: WearTask,
    onDone: () -> Unit,
    onSnooze: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(BrandSurface, shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp))
            .padding(8.dp),
    ) {
        Text(
            text = "⏰ ${task.title}",
            color = BrandAmber,
            fontSize = 12.sp,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
        )
        Spacer(Modifier.height(6.dp))
        Row(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            CompactChip(
                modifier = Modifier.weight(1f),
                onClick = onDone,
                colors = ChipDefaults.primaryChipColors(backgroundColor = BrandGreen),
                label = { Text("Done", fontSize = 10.sp, color = Color.White) },
            )
            CompactChip(
                modifier = Modifier.weight(1f),
                onClick = onSnooze,
                colors = ChipDefaults.chipColors(backgroundColor = BrandSurface),
                label = { Text("Snooze 5m", fontSize = 10.sp, color = TextSecondary) },
            )
        }
    }
}
