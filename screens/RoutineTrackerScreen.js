import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Animated, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import { Routes } from '../navigation/Routes';
import { MindfulTopBar, AppBottomNav, GreenFab, SpeechTextInput, hapticLight, hapticMedium, hapticSuccess } from '../components/SharedComponents';

const ROUTINE_ICONS = ['medical-services', 'invert-colors', 'mail', 'wb-sunny', 'bed', 'fitness-center', 'menu-book', 'self-improvement'];
const SORT_ROW_H = 64;

const initialRoutines = [
  { id: 1, title: 'Take morning medication', subtitle: 'With a full glass of water', icon: 'medical-services', isCompleted: true,  tags: [] },
  { id: 2, title: 'Drink 500ml water',       subtitle: 'Hydrate before coffee',       icon: 'invert-colors',   isCompleted: true,  tags: [] },
  { id: 3, title: 'Morning stretch — 10 mins', subtitle: 'Gentle movement to wake up', icon: 'fitness-center', isCompleted: false, tags: [] },
  { id: 4, title: "Review today's Big Three", subtitle: 'Set intention for the day',  icon: 'wb-sunny',        isCompleted: false, tags: [] },
  { id: 5, title: 'Evening wind-down',        subtitle: 'Dim lights & put phone down', icon: 'bed',            isCompleted: false, tags: [] },
  { id: 6, title: "Write tomorrow's plan",    subtitle: 'Brain-dump before sleep',    icon: 'menu-book',       isCompleted: false, tags: [] },
];

export function RoutineTrackerScreen({ navigation }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [routines, setRoutines] = useState(initialRoutines);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newIcon, setNewIcon] = useState('self-improvement');

  // ── Sort mode ──────────────────────────────────────────────────────────────
  const scrollViewRef = useRef(null);
  const [sortMode, setSortMode] = useState(false);
  const [activeDragId, setActiveDragId] = useState(null);
  const sortModeRef = useRef(false);
  const activeDragIdRef = useRef(null);
  const dragInitialIdxRef = useRef(null);
  const lastPlacedIdxRef = useRef(null);
  const routinesRef = useRef(routines);
  const panResponders = useRef({});
  const jiggle = useRef(new Animated.Value(0)).current;
  const jiggleLoopRef = useRef(null);

  useEffect(() => { routinesRef.current = routines; }, [routines]);

  const jiggleDeg = useMemo(() =>
    jiggle.interpolate({ inputRange: [-1.2, 1.2], outputRange: ['-1.2deg', '1.2deg'] }), []);

  const activateSortMode = useCallback(() => {
    hapticMedium();
    scrollViewRef.current?.setNativeProps({ scrollEnabled: false });
    setSortMode(true);
    sortModeRef.current = true;
    jiggleLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(jiggle, { toValue: 1.2, duration: 70, useNativeDriver: true }),
        Animated.timing(jiggle, { toValue: -1.2, duration: 140, useNativeDriver: true }),
        Animated.timing(jiggle, { toValue: 1.2, duration: 140, useNativeDriver: true }),
        Animated.timing(jiggle, { toValue: 0, duration: 70, useNativeDriver: true }),
        Animated.delay(900),
      ])
    );
    jiggleLoopRef.current.start();
  }, []);

  const deactivateSortMode = useCallback(() => {
    scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
    setSortMode(false);
    sortModeRef.current = false;
    setActiveDragId(null);
    activeDragIdRef.current = null;
    jiggleLoopRef.current?.stop();
    Animated.timing(jiggle, { toValue: 0, duration: 100, useNativeDriver: true }).start();
  }, []);

  const getRoutinePanResponder = useCallback((id) => {
    if (!panResponders.current[id]) {
      panResponders.current[id] = PanResponder.create({
        onStartShouldSetPanResponder: () => sortModeRef.current,
        onMoveShouldSetPanResponder: () => sortModeRef.current,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: () => {
          if (activeDragIdRef.current && activeDragIdRef.current !== id) return;
          hapticLight();
          dragInitialIdxRef.current = routinesRef.current.findIndex(r => r.id === id);
          lastPlacedIdxRef.current = dragInitialIdxRef.current;
          activeDragIdRef.current = id;
          setActiveDragId(id);
        },
        onPanResponderMove: (_, gs) => {
          if (activeDragIdRef.current !== id) return;
          const len = routinesRef.current.length;
          const targetIdx = Math.max(0, Math.min(
            len - 1,
            dragInitialIdxRef.current + Math.round(gs.dy / SORT_ROW_H)
          ));
          if (targetIdx !== lastPlacedIdxRef.current) {
            lastPlacedIdxRef.current = targetIdx;
            hapticLight();
            setRoutines(prev => {
              const arr = [...prev];
              const from = arr.findIndex(r => r.id === id);
              if (from === -1 || from === targetIdx) return prev;
              const [item] = arr.splice(from, 1);
              arr.splice(targetIdx, 0, item);
              routinesRef.current = arr;
              return arr;
            });
          }
        },
        onPanResponderRelease: () => {
          activeDragIdRef.current = null;
          dragInitialIdxRef.current = null;
          lastPlacedIdxRef.current = null;
          setActiveDragId(null);
          hapticLight();
        },
        onPanResponderTerminate: () => {
          activeDragIdRef.current = null;
          dragInitialIdxRef.current = null;
          lastPlacedIdxRef.current = null;
          setActiveDragId(null);
        },
      });
    }
    return panResponders.current[id];
  }, []);

  const completedCount = routines.filter(item => item.isCompleted).length;

  const toggleRoutine = (id) => {
    hapticLight();
    setRoutines(prev => {
      const next = prev.map(item => item.id === id ? { ...item, isCompleted: !item.isCompleted } : item);
      if (next.find(i => i.id === id)?.isCompleted) hapticSuccess();
      return next;
    });
  };

  const addRoutine = () => {
    if (!newTitle.trim()) return;
    setRoutines(prev => [...prev, {
      id: Date.now(),
      icon: newIcon,
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || 'Daily habit',
      tags: [],
      isCompleted: false,
      isWide: false
    }]);
    setNewTitle('');
    setNewSubtitle('');
    setNewIcon('self-improvement');
    setModalVisible(false);
  };

  const resetAll = () => {
    setRoutines(prev => prev.map(item => ({ ...item, isCompleted: false })));
  };

  return (
    <SafeAreaView style={styles.container}>
      <MindfulTopBar />
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <Text style={styles.label}>DAILY FLOW</Text>
          <Text style={styles.pageTitle}>Your Routines</Text>
          <Text style={styles.pageSubtitle}>Take a breath. One small step at a time is all you need today.</Text>
        </View>
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <View>
              <Text style={styles.progressCount}>{completedCount} of {routines.length} completed</Text>
              <Text style={styles.progressSubtitle}>
                {completedCount === routines.length ? "All done — incredible!" : "You're doing great."}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {sortMode ? (
                <TouchableOpacity style={styles.resetButton} onPress={deactivateSortMode}>
                  <MaterialIcons name="check" size={18} color={colors.Primary} />
                  <Text style={styles.resetLabel}>DONE</Text>
                </TouchableOpacity>
              ) : (
                <>
                  {routines.length > 1 ? (
                    <TouchableOpacity style={styles.resetButton} onPress={activateSortMode}>
                      <MaterialIcons name="reorder" size={18} color={colors.Primary} />
                      <Text style={styles.resetLabel}>SORT</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity style={styles.resetButton} onPress={resetAll}>
                    <MaterialIcons name="refresh" size={18} color={colors.Primary} />
                    <Text style={styles.resetLabel}>RESET</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: routines.length > 0 ? `${(completedCount / routines.length) * 100}%` : '0%' }]} />
          </View>
        </View>
        <View style={styles.grid}>
          {routines.map((routine) => {
            const isActive = activeDragId === routine.id;
            const itemTransform = isActive
              ? [{ scale: 1.04 }]
              : sortMode ? [{ rotate: jiggleDeg }] : [];

            if (sortMode) {
              return (
                <View key={routine.id} {...getRoutinePanResponder(routine.id).panHandlers}>
                  <Animated.View style={{ transform: itemTransform, zIndex: isActive ? 10 : 1 }}>
                    <View style={[styles.sortRow, isActive && styles.sortRowActive]}>
                      <View style={styles.sortHandle}>
                        <MaterialIcons name="reorder" size={22} color={isActive ? colors.Primary : colors.Outline} />
                      </View>
                      <MaterialIcons name={routine.icon} size={22} color={colors.OnSurfaceVariant} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.sortRowText}>{routine.title}</Text>
                        <Text style={styles.sortRowSubtext}>{routine.subtitle}</Text>
                      </View>
                    </View>
                  </Animated.View>
                </View>
              );
            }

            return (
              <Animated.View key={routine.id} style={{ transform: itemTransform }}>
                <RoutineCard
                  routine={routine}
                  onToggle={() => toggleRoutine(routine.id)}
                  onLongPress={activateSortMode}
                />
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
      <AppBottomNav
        tabs={[
          { label: 'Focus', icon: 'track-changes' },
          { label: 'Brainstorm', icon: 'lightbulb' },
          { label: 'Routines', icon: 'sync', isActive: true },
          { label: 'Calendar', icon: 'calendar-today' },
          { label: 'Progress', icon: 'leaderboard' }
        ]}
        onTabSelected={(index) => navigation.navigate([Routes.DAILY_FOCUS, Routes.TASK_BRAINSTORMING, Routes.ROUTINE_TRACKER, Routes.WEEKLY_OVERVIEW, Routes.PROGRESS_WINS][index])}
      />
      <GreenFab onPress={() => setModalVisible(true)} />

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <TouchableOpacity style={styles.modalSheet} activeOpacity={1}>
            <Text style={styles.modalTitle}>New Routine</Text>
            <Text style={styles.modalLabel}>ROUTINE NAME</Text>
            <SpeechTextInput
              style={styles.modalInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="e.g. Morning Stretch"
              autoFocus
            />
            <Text style={styles.modalLabel}>DESCRIPTION (OPTIONAL)</Text>
            <SpeechTextInput
              style={styles.modalInput}
              value={newSubtitle}
              onChangeText={setNewSubtitle}
              placeholder="e.g. 10 minutes"
            />
            <Text style={styles.modalLabel}>ICON</Text>
            <View style={styles.iconGrid}>
              {ROUTINE_ICONS.map(icon => (
                <TouchableOpacity
                  key={icon}
                  style={[styles.iconOption, newIcon === icon && styles.iconOptionSelected]}
                  onPress={() => setNewIcon(icon)}
                >
                  <MaterialIcons name={icon} size={24} color={newIcon === icon ? colors.OnPrimaryContainer : colors.OnSurfaceVariant} />
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addRoutine} style={styles.modalSaveBtn}>
                <Text style={styles.modalSaveText}>Add Routine</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function RoutineCard({ routine, onToggle, onLongPress }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <TouchableOpacity
      style={[styles.routineCard, routine.isWide ? styles.routineCardWide : {}, routine.isCompleted ? styles.routineCardDone : {}]}
      onPress={onToggle}
      onLongPress={onLongPress}
      delayLongPress={500}
      activeOpacity={0.8}
    >
      <View style={styles.routineTopRow}>
        <MaterialIcons name={routine.icon} size={28} color={routine.isCompleted ? colors.Primary : colors.Outline} />
        <View style={[styles.routineCheck, routine.isCompleted ? styles.routineCheckDone : null]}>
          {routine.isCompleted ? <MaterialIcons name="check" size={20} color={colors.OnPrimary} /> : null}
        </View>
      </View>
      <View style={styles.routineBody}>
        <Text style={[styles.routineTitle, routine.isCompleted ? styles.textLineThrough : null]}>{routine.title}</Text>
        <Text style={styles.routineSubtitle}>{routine.subtitle}</Text>
        {routine.tags?.length > 0 ? (
          <View style={styles.tagRow}>
            {routine.tags.map((tag) => (
              <View key={tag} style={styles.tagBadge}>
                <Text style={styles.tagText}>{tag.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.Surface },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 130 },
  headerBlock: { marginBottom: 28 },
  label: { fontSize: 11, letterSpacing: 2, fontWeight: '600', color: colors.OnSurfaceVariant },
  pageTitle: { marginTop: 4, fontSize: 40, fontWeight: '800', color: colors.OnSurface, lineHeight: 44 },
  pageSubtitle: { marginTop: 8, fontSize: 16, color: colors.OnSurfaceVariant, lineHeight: 24 },
  progressCard: { width: '100%', borderRadius: 24, backgroundColor: colors.SurfaceContainerLow, padding: 24, marginBottom: 24 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  progressCount: { fontSize: 20, fontWeight: '700', color: colors.OnPrimaryContainer },
  progressSubtitle: { marginTop: 4, fontSize: 14, color: colors.OnSurfaceVariant },
  progressBar: { width: '100%', height: 8, borderRadius: 4, backgroundColor: colors.SurfaceContainerHigh, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.Primary, borderRadius: 4 },
  resetButton: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  resetLabel: { marginLeft: 4, fontSize: 10, letterSpacing: 1.5, fontWeight: '700', color: colors.Primary },
  grid: { width: '100%' },
  routineCard: { width: '100%', borderRadius: 20, backgroundColor: colors.SurfaceContainerLowest, padding: 20, marginBottom: 12 },
  routineCardWide: { minHeight: 120 },
  routineCardDone: { opacity: 0.65 },
  routineTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  routineCheck: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.SurfaceContainerLowest, borderWidth: 3, borderColor: `${colors.OutlineVariant}33`, alignItems: 'center', justifyContent: 'center' },
  routineCheckDone: { backgroundColor: colors.Primary, borderWidth: 0 },
  routineBody: { marginTop: 20 },
  routineTitle: { fontSize: 17, fontWeight: '700', color: colors.OnSurface },
  routineSubtitle: { marginTop: 6, fontSize: 12, color: colors.OnSurfaceVariant },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  tagBadge: { borderRadius: 999, backgroundColor: colors.SurfaceContainerHigh, paddingHorizontal: 10, paddingVertical: 3, marginRight: 8, marginBottom: 8 },
  tagText: { fontSize: 9, letterSpacing: 1, fontWeight: '700', color: colors.Outline },
  textLineThrough: { textDecorationLine: 'line-through', color: `${colors.OnSurface}80` },
  sortRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, backgroundColor: colors.SurfaceContainerLowest, paddingVertical: 14, paddingHorizontal: 12, marginBottom: 8, height: SORT_ROW_H },
  sortRowActive: { backgroundColor: colors.SurfaceContainerHigh, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 6 },
  sortHandle: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  sortRowText: { fontSize: 15, fontWeight: '700', color: colors.OnSurface },
  sortRowSubtext: { marginTop: 2, fontSize: 12, color: colors.OnSurfaceVariant },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.Surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: colors.OnSurface, marginBottom: 24 },
  modalLabel: { fontSize: 10, letterSpacing: 1.5, fontWeight: '700', color: colors.OnSurfaceVariant, marginBottom: 8 },
  modalInput: { width: '100%', borderRadius: 16, backgroundColor: colors.SurfaceContainerLow, padding: 16, fontSize: 16, fontWeight: '600', color: colors.OnSurface, marginBottom: 20 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  iconOption: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.SurfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  iconOptionSelected: { backgroundColor: colors.PrimaryContainer },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999 },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: colors.OnSurfaceVariant },
  modalSaveBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, backgroundColor: colors.Primary },
  modalSaveText: { fontSize: 15, fontWeight: '700', color: colors.OnPrimary }
  });
}
