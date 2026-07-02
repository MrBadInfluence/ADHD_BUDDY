import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import { Routes } from '../navigation/Routes';
import { MindfulTopBar, AppBottomNav, useRealtimeClock, getGreeting } from '../components/SharedComponents';

const initialBigThree = [
  { id: 1, category: 'Deep Work', title: 'Complete the Quarterly Strategic Plan Draft', duration: '90 min', energyLevel: 'High Energy', isCompleted: false },
  { id: 2, category: 'Creative', title: 'Review Moodboards', duration: '30 min', energyLevel: '', isCompleted: false },
  { id: 3, category: 'Life Admin', title: 'Book Dental Cleaning', duration: '10 min', energyLevel: '', isCompleted: false }
];

const initialReminders = [
  { id: 1, title: 'Water the indoor ferns', category: 'Daily Routine', isCompleted: false },
  { id: 2, title: "Reply to Sarah's email", category: 'Communication', isCompleted: false },
  { id: 3, title: 'Morning meditation', category: 'Completed', isCompleted: true }
];

export function DailyFocusWithAlertsScreen({ navigation }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [showNotification, setShowNotification] = useState(true);
  const [bigThreeTasks, setBigThreeTasks] = useState(initialBigThree);
  const [reminderTasks, setReminderTasks] = useState(initialReminders);
  const now = useRealtimeClock();
  const toastOpacity = useState(new Animated.Value(showNotification ? 1 : 0))[0];

  const onNavigate = (route) => navigation.navigate(route);

  const dismissNotification = () => {
    Animated.timing(toastOpacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setShowNotification(false));
  };

  return (
    <SafeAreaView style={styles.container}>
      <MindfulTopBar />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroRow}>
          <Text style={styles.largeTitle}>{getGreeting(now)}</Text>
          <Text style={styles.subtitle}>Gentle reminders make it easier to stay anchored during the day.</Text>
        </View>
        <View style={{ marginBottom: 32 }}>
          <Text style={styles.sectionTitle}>The Big Three</Text>
        </View>
        {bigThreeTasks.map((task) => (
          <View key={task.id} style={styles.taskItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.secondaryCategory}>{task.category.toUpperCase()}</Text>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskInfoText}>{task.duration}</Text>
            </View>
            <TouchableOpacity style={[styles.taskToggle, task.isCompleted ? styles.taskToggleActive : styles.taskToggleInactive]} onPress={() => setBigThreeTasks(bigThreeTasks.map((t) => (t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t)))}>
              <MaterialIcons name="check" size={18} color={task.isCompleted ? colors.OnPrimary : colors.Outline} />
            </TouchableOpacity>
          </View>
        ))}
        <View style={styles.sectionSpace} />
        {reminderTasks.map((task) => (
          <TouchableOpacity key={task.id} style={[styles.reminderRow, task.isCompleted ? { opacity: 0.6 } : null]} onPress={() => setReminderTasks(reminderTasks.map((t) => (t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t)))} disabled={task.isCompleted}>
            <View style={[styles.reminderCheckbox, task.isCompleted && styles.reminderCheckboxCompleted]}>{task.isCompleted ? <MaterialIcons name="check" size={18} color={colors.OnSurface} /> : null}</View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.reminderText, task.isCompleted && styles.reminderTextCompleted]}>{task.title}</Text>
              <Text style={styles.reminderCategory}>{task.category.toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <AppBottomNav
        tabs={[
          { label: 'Focus', icon: 'track-changes', isActive: true },
          { label: 'Brainstorm', icon: 'lightbulb' },
          { label: 'Routines', icon: 'sync' },
          { label: 'Detail', icon: 'format-list-bulleted' }
        ]}
        onTabSelected={(index) => onNavigate([Routes.DAILY_FOCUS, Routes.TASK_BRAINSTORMING, Routes.ROUTINE_TRACKER, Routes.TASK_DETAIL][index])}
      />
      {showNotification ? (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <MaterialIcons name="notifications" size={20} color={colors.Primary} />
          <Text style={styles.toastText}>Gentle Reminder: Time for your 30-min deep work session</Text>
          <TouchableOpacity onPress={dismissNotification}>
            <MaterialIcons name="close" size={20} color={colors.Outline} />
          </TouchableOpacity>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.Surface },
  content: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 110 },
  heroRow: { marginBottom: 24 },
  largeTitle: { fontSize: 40, fontWeight: '800', color: colors.Primary, lineHeight: 44 },
  subtitle: { marginTop: 8, fontSize: 16, color: colors.OnSurfaceVariant, lineHeight: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.OnSurface },
  taskItem: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: colors.SurfaceContainerLowest,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  secondaryCategory: { fontSize: 9, letterSpacing: 1.5, fontWeight: '600', color: colors.Outline },
  taskTitle: { marginTop: 4, fontSize: 15, fontWeight: '700', color: colors.OnSurface },
  taskInfoText: { marginTop: 6, fontSize: 12, color: colors.OnSurfaceVariant },
  taskToggle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  taskToggleActive: { backgroundColor: colors.PrimaryContainer },
  taskToggleInactive: { backgroundColor: colors.SurfaceContainerHigh },
  sectionSpace: { height: 24 },
  reminderRow: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: colors.SurfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8
  },
  reminderCheckbox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: `${colors.OutlineVariant}66`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  reminderCheckboxCompleted: { backgroundColor: `${colors.OutlineVariant}33`, borderWidth: 0 },
  reminderText: { fontSize: 15, fontWeight: '600', color: colors.OnSurface },
  reminderTextCompleted: { color: `${colors.OnSurface}80`, textDecorationLine: 'line-through' },
  reminderCategory: { marginTop: 2, fontSize: 10, letterSpacing: 1, fontWeight: '600', color: colors.Outline },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 72,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.SurfaceContainerHighest,
    borderRadius: 24,
    elevation: 4
  },
  toastText: { flex: 1, marginHorizontal: 10, color: colors.OnSurface, fontSize: 13 }
  });
}
