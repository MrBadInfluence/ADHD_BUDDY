import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import { Routes } from '../navigation/Routes';
import { MindfulTopBar, AppBottomNav } from '../components/SharedComponents';

const initialSubtasks = [];

export function TaskDetailScreen({ navigation }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [subtasks, setSubtasks] = useState(initialSubtasks);

  const toggleSubtask = (id) => {
    setSubtasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      if (t.status === 'done') return { ...t, status: t.id === 2 ? 'current' : 'next' };
      return { ...t, status: 'done' };
    }));
  };

  const doneCount = subtasks.filter(t => t.status === 'done').length;
  const progressPercent = subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0;

  const callPhone = (phone) => {
    const url = `tel:${phone.replace(/\s/g, '')}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Phone', phone);
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <MindfulTopBar />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <View style={styles.topLine}>
            <Text style={styles.smallLabel}>TASK DETAIL</Text>
          </View>
          <Text style={styles.pageTitle}>Task Breakdown</Text>
          <Text style={styles.pageSubtitle}>Break your task into steps and work through them one at a time.</Text>
        </View>

        {subtasks.length > 0 ? (
          <View style={[styles.card, { backgroundColor: colors.SurfaceContainerLow }]}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.progressNumber}>{progressPercent}%</Text>
                <Text style={styles.progressLabel}>COMPLETION FLOW</Text>
              </View>
              <MaterialIcons name="waves" size={40} color={`${colors.Primary}66`} />
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressSub}>{doneCount} of {subtasks.length} steps complete</Text>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.SurfaceContainerLow, alignItems: 'center', paddingVertical: 32 }]}>
            <MaterialIcons name="format-list-bulleted" size={36} color={colors.OutlineVariant} />
            <Text style={[styles.progressSub, { textAlign: 'center', marginTop: 12 }]}>No steps yet. Come back here from a specific task to see its breakdown.</Text>
          </View>
        )}

        <View style={styles.subtaskList}>
          {subtasks.map(task => (
            <TouchableOpacity
              key={task.id}
              style={[styles.subtaskCard, task.status === 'current' && styles.subtaskCardCurrent, task.status === 'done' && styles.subtaskCardDone]}
              onPress={() => toggleSubtask(task.id)}
              activeOpacity={0.8}
            >
              <View style={styles.subtaskHeader}>
                <View style={[styles.circleIcon, task.status === 'done' && styles.circleIconDone, task.status === 'current' && styles.circleIconCurrent, task.status === 'next' && styles.circleIconNext, task.status === 'followup' && styles.circleIconFollowup]}>
                  <MaterialIcons
                    name={task.status === 'done' ? 'check' : task.status === 'current' ? 'track-changes' : task.status === 'followup' ? 'phone' : 'radio-button-unchecked'}
                    size={18}
                    color={task.status === 'done' || task.status === 'current' ? colors.OnPrimary : colors.Outline}
                  />
                </View>
                <Text style={[styles.subtaskStatusLabel, { color: task.status === 'done' ? colors.Primary : task.status === 'current' ? colors.OnPrimaryContainer : colors.Outline }]}>
                  {task.status === 'done' ? 'DONE' : task.status === 'current' ? 'CURRENT FOCUS' : task.status === 'next' ? 'NEXT UP' : 'FOLLOW UP'}
                </Text>
              </View>
              <Text style={[styles.subtaskTitle, task.status === 'done' && styles.subtaskTitleDone]}>{task.title}</Text>
              <Text style={[styles.subtaskBody, task.status === 'current' && { color: colors.OnPrimaryContainer, opacity: 0.85 }]}>{task.body}</Text>
              {task.phone ? (
                <TouchableOpacity style={styles.phoneRow} onPress={() => callPhone(task.phone)}>
                  <MaterialIcons name="call" size={16} color={colors.Primary} />
                  <Text style={styles.phoneText}>{task.phone}</Text>
                </TouchableOpacity>
              ) : null}
              {task.status !== 'done' && task.status !== 'followup' ? (
                <View style={styles.tapHint}>
                  <MaterialIcons name="touch-app" size={13} color={task.status === 'current' ? colors.OnPrimaryContainer : colors.Outline} style={{ opacity: 0.6 }} />
                  <Text style={[styles.tapHintText, task.status === 'current' && { color: colors.OnPrimaryContainer }]}>TAP TO MARK DONE</Text>
                </View>
              ) : null}
              {task.status === 'done' ? (
                <View style={styles.tapHint}>
                  <Text style={styles.tapHintText}>TAP TO UNDO</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: colors.SecondaryContainer, marginTop: 0 }]}>
          <View style={styles.adhdTipRow}>
            <View style={[styles.circleIcon, { backgroundColor: `${colors.SurfaceContainerLowest}66` }]}>
              <MaterialIcons name="lightbulb" size={20} color={colors.Secondary} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.smallLabel, { color: colors.OnSecondaryContainer }]}>ADHD TIP</Text>
              <Text style={[styles.subtaskBody, { color: colors.OnSecondaryContainer }]}>Try the "Body Doubling" method â€” listen to a workspace ambiance track while you sort.</Text>
            </View>
          </View>
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
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.Surface },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 130 },
  headerBlock: { marginBottom: 24 },
  topLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  smallLabel: { fontSize: 10, letterSpacing: 2, fontWeight: '700', color: colors.OnSurfaceVariant },
  pageTitle: { fontSize: 28, fontWeight: '800', color: colors.OnSurface, lineHeight: 34, marginBottom: 12 },
  pageSubtitle: { fontSize: 16, color: colors.OnSurfaceVariant, lineHeight: 24 },
  card: { width: '100%', borderRadius: 24, padding: 18, marginBottom: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  progressNumber: { fontSize: 44, fontWeight: '800', color: colors.Primary },
  progressLabel: { fontSize: 10, letterSpacing: 1.5, fontWeight: '700', color: colors.OnSurfaceVariant },
  progressBarTrack: { width: '100%', height: 12, borderRadius: 6, backgroundColor: colors.SurfaceContainerHigh, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.Primary },
  progressSub: { marginTop: 10, fontSize: 12, color: colors.OnSurfaceVariant },
  subtaskList: { gap: 12, marginBottom: 24 },
  subtaskCard: { width: '100%', borderRadius: 20, backgroundColor: colors.SurfaceContainerLowest, padding: 18 },
  subtaskCardCurrent: { backgroundColor: colors.PrimaryContainer },
  subtaskCardDone: { backgroundColor: `${colors.SurfaceDim}99`, opacity: 0.75 },
  subtaskHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  circleIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${colors.OutlineVariant}20`, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  circleIconDone: { backgroundColor: colors.Primary },
  circleIconCurrent: { backgroundColor: colors.Primary },
  circleIconNext: { backgroundColor: `${colors.OutlineVariant}20` },
  circleIconFollowup: { backgroundColor: `${colors.OutlineVariant}20` },
  subtaskStatusLabel: { fontSize: 9, letterSpacing: 1.5, fontWeight: '700' },
  subtaskTitle: { fontSize: 16, fontWeight: '700', color: colors.OnSurface, marginBottom: 6 },
  subtaskTitleDone: { textDecorationLine: 'line-through', color: `${colors.OnSurface}80` },
  subtaskBody: { fontSize: 13, color: colors.OnSurfaceVariant, lineHeight: 20 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  phoneText: { marginLeft: 6, fontSize: 14, fontWeight: '700', color: colors.Primary },
  tapHint: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  tapHintText: { marginLeft: 4, fontSize: 9, letterSpacing: 1.5, fontWeight: '700', color: colors.Outline },
  adhdTipRow: { flexDirection: 'row', alignItems: 'flex-start' }
  });
}
