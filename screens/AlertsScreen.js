import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useColors } from '../context/ThemeContext';
import { Routes } from '../navigation/Routes';
import { BackTopBar, AppBottomNav, GreenFab, StyledToggle, SpeechTextInput } from '../components/SharedComponents';

const initialReminders = [
  { id: 1, time: '8:00 AM', title: 'Take morning medication', repeatLabel: 'Daily', isCalendar: false, enabled: true },
  { id: 2, time: '12:30 PM', title: 'Lunch break — step away from screen', repeatLabel: 'Mon – Fri', isCalendar: false, enabled: true },
  { id: 3, time: '3:00 PM', title: 'Afternoon hydration check', repeatLabel: 'Daily', isCalendar: false, enabled: false },
  { id: 4, time: '9:00 PM', title: 'Begin wind-down routine', repeatLabel: 'Daily', isCalendar: false, enabled: true },
];

const REPEAT_OPTIONS = ['Daily', 'Mon – Fri', 'Weekends', 'Once'];

export function AlertsScreen({ navigation }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [volume, setVolume] = useState(0.65);
  const [masterMute, setMasterMute] = useState(false);
  const [reminders, setReminders] = useState(initialReminders);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalTime, setModalTime] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalRepeat, setModalRepeat] = useState('Daily');

  const openAdd = () => {
    setEditingId(null);
    setModalTime('');
    setModalTitle('');
    setModalRepeat('Daily');
    setModalVisible(true);
  };

  const openEdit = (reminder) => {
    setEditingId(reminder.id);
    setModalTime(reminder.time);
    setModalTitle(reminder.title);
    setModalRepeat(reminder.repeatLabel);
    setModalVisible(true);
  };

  const saveReminder = () => {
    if (!modalTitle.trim() || !modalTime.trim()) return;
    if (editingId !== null) {
      setReminders(prev => prev.map(r => r.id === editingId ? { ...r, time: modalTime.trim(), title: modalTitle.trim(), repeatLabel: modalRepeat } : r));
    } else {
      setReminders(prev => [...prev, { id: Date.now(), time: modalTime.trim(), title: modalTitle.trim(), repeatLabel: modalRepeat, isCalendar: false, enabled: true }]);
    }
    setModalVisible(false);
  };

  const deleteReminder = (id) => {
    Alert.alert('Remove Reminder', 'Delete this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setReminders(prev => prev.filter(r => r.id !== id)) }
    ]);
  };

  const toggleReminder = (id) => setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));

  return (
    <SafeAreaView style={styles.container}>
      <BackTopBar title="Serenity Focus" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Alerts</Text>
        <Text style={styles.pageSubtitle}>Gentle nudges to keep your mind balanced and your day on track.</Text>

        <View style={styles.quickSettingsRow}>
          <View style={styles.quickCard}>
            <View style={styles.quickHeading}>
              <MaterialIcons name="volume-up" size={20} color={colors.Primary} />
              <Text style={styles.quickTitle}>Global Volume</Text>
            </View>
            <Text style={styles.quickValue}>{Math.round(volume * 100)}%</Text>
            <Slider
              style={{ width: '100%', height: 40 }}
              value={volume}
              onValueChange={setVolume}
              minimumValue={0}
              maximumValue={1}
              minimumTrackTintColor={colors.Primary}
              maximumTrackTintColor={colors.SurfaceContainerHighest}
              thumbTintColor={colors.Primary}
            />
          </View>
          <View style={styles.quickCard}>
            <View style={styles.quickHeading}>
              <MaterialIcons name="notifications-paused" size={20} color={colors.Primary} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.quickTitle}>Master Mute</Text>
                <Text style={styles.quickSubTitle}>{masterMute ? 'All alerts silenced' : 'Silence all 1 hr'}</Text>
              </View>
            </View>
            <StyledToggle checked={masterMute} onCheckedChange={setMasterMute} />
          </View>
        </View>

        <View style={styles.remindersHeader}>
          <Text style={styles.sectionTitle}>Active Reminders</Text>
          <Text style={styles.smallLabel}>{reminders.filter(r => r.enabled).length} ACTIVE</Text>
        </View>
        {reminders.map((reminder) => (
          <View key={reminder.id} style={[styles.reminderCard, !reminder.enabled && { opacity: 0.5 }]}>
            <View style={styles.reminderInfo}>
              <Text style={styles.reminderTime}>{reminder.time}</Text>
              <Text style={styles.reminderTitle}>{reminder.title}</Text>
              <View style={styles.reminderMetaRow}>
                <MaterialIcons name={reminder.isCalendar ? 'calendar-today' : 'repeat'} size={14} color={colors.OnSurfaceVariant} />
                <Text style={styles.reminderMetaText}>{reminder.repeatLabel}</Text>
              </View>
            </View>
            <View style={styles.reminderActions}>
              <TouchableOpacity style={styles.iconButton} onPress={() => openEdit(reminder)}>
                <MaterialIcons name="edit" size={20} color={colors.OnSurfaceVariant} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => deleteReminder(reminder.id)}>
                <MaterialIcons name="delete-outline" size={20} color={colors.OnSurfaceVariant} />
              </TouchableOpacity>
              <StyledToggle checked={reminder.enabled} onCheckedChange={() => toggleReminder(reminder.id)} />
            </View>
          </View>
        ))}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>The Serenity Hack</Text>
          <Text style={styles.infoBody}>
            Research shows that consistent time-blocking and sensory cues reduce ADHD decision fatigue. Use these alerts as anchors for your focus.
          </Text>
        </View>
      </ScrollView>
      <AppBottomNav
        tabs={[
          { label: 'Focus', icon: 'track-changes' },
          { label: 'Brainstorm', icon: 'lightbulb' },
          { label: 'Routines', icon: 'sync' },
          { label: 'Calendar', icon: 'calendar-today' },
          { label: 'Progress', icon: 'leaderboard' }
        ]}
        onTabSelected={(index) => navigation.navigate([Routes.DAILY_FOCUS, Routes.TASK_BRAINSTORMING, Routes.ROUTINE_TRACKER, Routes.WEEKLY_OVERVIEW, Routes.PROGRESS_WINS][index])}
      />
      <GreenFab onPress={openAdd} />

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <TouchableOpacity style={styles.modalSheet} activeOpacity={1}>
            <Text style={styles.modalTitle}>{editingId !== null ? 'Edit Reminder' : 'New Reminder'}</Text>
            <Text style={styles.modalLabel}>TIME (HH:MM)</Text>
            <SpeechTextInput
              style={styles.modalInput}
              value={modalTime}
              onChangeText={setModalTime}
              placeholder="e.g. 09:30"
              keyboardType="numbers-and-punctuation"
            />
            <Text style={styles.modalLabel}>TITLE</Text>
            <SpeechTextInput
              style={styles.modalInput}
              value={modalTitle}
              onChangeText={setModalTitle}
              placeholder="e.g. Hydration Break"
            />
            <Text style={styles.modalLabel}>REPEAT</Text>
            <View style={styles.repeatRow}>
              {REPEAT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.repeatChip, modalRepeat === opt && styles.repeatChipSelected]}
                  onPress={() => setModalRepeat(opt)}
                >
                  <Text style={[styles.repeatChipText, modalRepeat === opt && styles.repeatChipTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveReminder} style={styles.modalSaveBtn}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.Surface },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 140 },
  pageTitle: { fontSize: 36, fontWeight: '800', color: colors.OnSurface, lineHeight: 40 },
  pageSubtitle: { marginTop: 8, fontSize: 16, color: colors.OnSurfaceVariant, lineHeight: 24 },
  quickSettingsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 28 },
  quickCard: { flex: 1, borderRadius: 20, backgroundColor: colors.SurfaceContainerLow, padding: 20, marginRight: 12 },
  quickHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  quickTitle: { marginLeft: 8, fontSize: 14, fontWeight: '700', color: colors.OnSurface },
  quickSubTitle: { fontSize: 11, color: colors.OnSurfaceVariant },
  quickValue: { marginTop: 8, marginBottom: 8, fontSize: 14, fontWeight: '700', color: colors.Primary },
  remindersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.OnSurface },
  smallLabel: { fontSize: 10, letterSpacing: 1, color: colors.OnSurfaceVariant },
  reminderCard: { width: '100%', borderRadius: 20, backgroundColor: colors.SurfaceContainerLowest, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reminderInfo: { flex: 1, paddingRight: 12 },
  reminderTime: { fontSize: 22, fontWeight: '700', color: colors.Primary },
  reminderTitle: { marginTop: 4, fontSize: 16, fontWeight: '600', color: colors.OnSurface },
  reminderMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  reminderMetaText: { marginLeft: 4, fontSize: 13, color: colors.OnSurfaceVariant },
  reminderActions: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { padding: 8 },
  infoCard: { width: '100%', borderRadius: 20, backgroundColor: `${colors.SecondaryContainer}80`, padding: 24, marginTop: 20 },
  infoTitle: { fontSize: 18, fontWeight: '700', color: colors.OnSurface, marginBottom: 8 },
  infoBody: { fontSize: 13, color: colors.OnSurfaceVariant, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.Surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: colors.OnSurface, marginBottom: 24 },
  modalLabel: { fontSize: 10, letterSpacing: 1.5, fontWeight: '700', color: colors.OnSurfaceVariant, marginBottom: 8 },
  modalInput: { width: '100%', borderRadius: 16, backgroundColor: colors.SurfaceContainerLow, padding: 16, fontSize: 16, fontWeight: '600', color: colors.OnSurface, marginBottom: 20 },
  repeatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
  repeatChip: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.SurfaceContainerLow },
  repeatChipSelected: { backgroundColor: colors.PrimaryContainer },
  repeatChipText: { fontSize: 13, fontWeight: '600', color: colors.OnSurfaceVariant },
  repeatChipTextSelected: { color: colors.OnPrimaryContainer },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999 },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: colors.OnSurfaceVariant },
  modalSaveBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, backgroundColor: colors.Primary },
  modalSaveText: { fontSize: 15, fontWeight: '700', color: colors.OnPrimary }
  });
}
