import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, Animated, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import { Routes } from '../navigation/Routes';
import { MindfulTopBar, AppBottomNav, hapticLight, hapticMedium } from '../components/SharedComponents';

const DAY_ABBRS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getCurrentWeek() {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { day: DAY_ABBRS[(d.getDay())], date: d.getDate(), isToday: d.toDateString() === today.toDateString() };
  });
}

const SORT_ROW_H = 72;

export function WeeklyOverviewScreen({ navigation }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const days = useMemo(() => getCurrentWeek(), []);
  const todayIndex = days.findIndex(d => d.isToday);
  const [selectedDay, setSelectedDay] = useState(todayIndex >= 0 ? todayIndex : 0);
  const [expandedZone, setExpandedZone] = useState(null);
  const [focusZones, setFocusZones] = useState([
    { id: 1, timeRange: '9:00 – 11:00 AM', title: 'Deep Work Block', description: 'Focused writing or coding — no notifications. Best cognitive window of the day.', tag: 'DEEP WORK', accentColor: '#7A8C4A', isCalendarImport: false },
    { id: 2, timeRange: '11:30 AM – 12:00 PM', title: 'Admin & Emails', description: 'Reply to messages, action quick tasks, clear inbox backlog.', tag: 'ADMIN', accentColor: '#A8B870', isCalendarImport: false },
    { id: 3, timeRange: '2:00 – 3:30 PM', title: 'Team Meeting', description: 'Weekly sync with the project team. Bring agenda notes.', tag: 'MEETING', accentColor: '#C4A96C', isCalendarImport: true },
  ]);
  const [deadlines, setDeadlines] = useState([
    { id: 1, title: 'Project proposal due', subtitle: 'Send to manager before EOD', dayLabel: 'Fri', done: false, isHighlighted: true },
    { id: 2, title: 'Dentist appointment', subtitle: 'Thursday 2:00 PM — confirm tomorrow', dayLabel: 'Thu', done: false, isHighlighted: false },
    { id: 3, title: 'Monthly budget review', subtitle: 'Review and update spreadsheet', dayLabel: 'Sun', done: false, isHighlighted: false },
    { id: 4, title: 'Call insurance company', subtitle: 'Claim reference #4821-B', dayLabel: 'Tue', done: true, isHighlighted: false },
  ]);

  const toggleDeadline = (id) => setDeadlines(prev => prev.map(d => d.id === id ? { ...d, done: !d.done } : d));

  // ── Sort mode (shared; sortSection tracks which list is active) ────────────
  const scrollViewRef = useRef(null);
  const [sortSection, setSortSection] = useState(null); // null | 'zones' | 'deadlines'
  const [activeDragId, setActiveDragId] = useState(null);
  const sortSectionRef = useRef(null);
  const activeDragIdRef = useRef(null);
  const dragInitialIdxRef = useRef(null);
  const lastPlacedIdxRef = useRef(null);
  const zonesRef = useRef(focusZones);
  const deadlinesRef = useRef(deadlines);
  const panRespondersZones = useRef({});
  const panRespondersDeadlines = useRef({});
  const jiggle = useRef(new Animated.Value(0)).current;
  const jiggleLoopRef = useRef(null);

  useEffect(() => { zonesRef.current = focusZones; }, [focusZones]);
  useEffect(() => { deadlinesRef.current = deadlines; }, [deadlines]);

  const jiggleDeg = useMemo(() =>
    jiggle.interpolate({ inputRange: [-1.2, 1.2], outputRange: ['-1.2deg', '1.2deg'] }), []);

  const activateSort = useCallback((section) => {
    hapticMedium();
    scrollViewRef.current?.setNativeProps({ scrollEnabled: false });
    setSortSection(section);
    sortSectionRef.current = section;
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

  const deactivateSort = useCallback(() => {
    scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
    setSortSection(null);
    sortSectionRef.current = null;
    setActiveDragId(null);
    activeDragIdRef.current = null;
    jiggleLoopRef.current?.stop();
    Animated.timing(jiggle, { toValue: 0, duration: 100, useNativeDriver: true }).start();
  }, []);

  const makePanResponder = useCallback((id, section, listRef, setList, panStore) => {
    if (!panStore.current[id]) {
      panStore.current[id] = PanResponder.create({
        onStartShouldSetPanResponder: () => sortSectionRef.current === section,
        onMoveShouldSetPanResponder: () => sortSectionRef.current === section,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: () => {
          if (activeDragIdRef.current && activeDragIdRef.current !== id) return;
          hapticLight();
          dragInitialIdxRef.current = listRef.current.findIndex(i => i.id === id);
          lastPlacedIdxRef.current = dragInitialIdxRef.current;
          activeDragIdRef.current = id;
          setActiveDragId(id);
        },
        onPanResponderMove: (_, gs) => {
          if (activeDragIdRef.current !== id) return;
          const len = listRef.current.length;
          const targetIdx = Math.max(0, Math.min(
            len - 1,
            dragInitialIdxRef.current + Math.round(gs.dy / SORT_ROW_H)
          ));
          if (targetIdx !== lastPlacedIdxRef.current) {
            lastPlacedIdxRef.current = targetIdx;
            hapticLight();
            setList(prev => {
              const arr = [...prev];
              const from = arr.findIndex(i => i.id === id);
              if (from === -1 || from === targetIdx) return prev;
              const [item] = arr.splice(from, 1);
              arr.splice(targetIdx, 0, item);
              listRef.current = arr;
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
    return panStore.current[id];
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <MindfulTopBar />
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <Text style={styles.smallLabel}>FOCUS FLOW</Text>
          <Text style={styles.pageTitle}>Weekly Overview</Text>
        </View>

        <View style={styles.datePicker}>
          <FlatList
            horizontal
            data={days}
            keyExtractor={(item) => item.day + item.date}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => {
              const isSelected = index === selectedDay;
              return (
                <TouchableOpacity onPress={() => setSelectedDay(index)} style={[styles.dateItem, isSelected ? styles.dateItemSelected : null, item.isToday && !isSelected ? styles.dateItemToday : null]}>
                  <Text style={[styles.dateDay, isSelected ? { color: colors.OnPrimary } : item.isToday ? { color: colors.Primary } : { color: colors.OnSurfaceVariant }]}>{item.day}</Text>
                  <Text style={[styles.dateNumber, isSelected ? { color: colors.OnPrimary } : item.isToday ? { color: colors.Primary, fontWeight: '800' } : { color: colors.OnSurface }]}>{item.date}</Text>
                  {isSelected ? <View style={styles.dateActiveDot} /> : null}
                  {item.isToday && !isSelected ? <View style={styles.dateTodayDot} /> : null}
                </TouchableOpacity>
              );
            }}
          />
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Focus Zones</Text>
            {sortSection === 'zones' ? (
              <TouchableOpacity onPress={deactivateSort} style={styles.sortDoneBtn}>
                <MaterialIcons name="check" size={16} color={colors.Primary} />
                <Text style={styles.sortDoneText}>DONE</Text>
              </TouchableOpacity>
            ) : focusZones.length > 1 ? (
              <TouchableOpacity onPress={() => activateSort('zones')} style={styles.sortDoneBtn}>
                <MaterialIcons name="reorder" size={16} color={colors.Primary} />
                <Text style={styles.sortDoneText}>SORT</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{focusZones.length} ZONES TODAY</Text>
              </View>
            )}
          </View>
          {focusZones.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="event-note" size={36} color={colors.OutlineVariant} />
              <Text style={styles.emptyText}>No focus zones planned yet.</Text>
            </View>
          ) : null}
          {focusZones.map((zone) => {
            const isActive = activeDragId === zone.id;
            const itemTransform = isActive
              ? [{ scale: 1.04 }]
              : sortSection === 'zones' ? [{ rotate: jiggleDeg }] : [];
            const isExpanded = expandedZone === zone.id;

            if (sortSection === 'zones') {
              return (
                <View key={zone.id} {...makePanResponder(zone.id, 'zones', zonesRef, setFocusZones, panRespondersZones).panHandlers}>
                  <Animated.View style={{ transform: itemTransform, zIndex: isActive ? 10 : 1 }}>
                    <View style={[styles.sortRow, isActive && styles.sortRowActive]}>
                      <View style={styles.sortHandle}>
                        <MaterialIcons name="reorder" size={22} color={isActive ? colors.Primary : colors.Outline} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.sortRowTime, { color: zone.accentColor }]}>{zone.timeRange}</Text>
                        <Text style={styles.sortRowText}>{zone.title}</Text>
                      </View>
                    </View>
                  </Animated.View>
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={zone.id}
                style={[styles.zoneCard, zone.isCalendarImport ? styles.zoneCardImport : null]}
                onPress={() => setExpandedZone(isExpanded ? null : zone.id)}
                onLongPress={() => activateSort('zones')}
                delayLongPress={500}
                activeOpacity={0.8}
              >
                <View style={styles.zoneHeader}>
                  <Text style={[styles.zoneTime, zone.isCalendarImport ? { color: colors.OnSurfaceVariant } : { color: zone.accentColor }]}>{zone.timeRange}</Text>
                  <View style={styles.zoneHeaderRight}>
                    {zone.isCalendarImport ? <MaterialIcons name="calendar-today" size={16} color={colors.OutlineVariant} /> : null}
                    <MaterialIcons name={isExpanded ? 'expand-less' : 'expand-more'} size={18} color={colors.Outline} style={{ marginLeft: 6 }} />
                  </View>
                </View>
                <Text style={styles.zoneTitle}>{zone.title}</Text>
                {isExpanded ? (
                  <>
                    <Text style={[styles.zoneDescription, { marginTop: 8 }]}>{zone.description}</Text>
                    {zone.tag ? <View style={[styles.zoneTag, { backgroundColor: zone.accentColor + '22' }]}><Text style={[styles.zoneTagText, { color: zone.accentColor }]}>{zone.tag}</Text></View> : null}
                  </>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sectionBlock}>
          <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
            <Text style={styles.sectionTitle}>Coming Up</Text>
            {sortSection === 'deadlines' ? (
              <TouchableOpacity onPress={deactivateSort} style={styles.sortDoneBtn}>
                <MaterialIcons name="check" size={16} color={colors.Primary} />
                <Text style={styles.sortDoneText}>DONE</Text>
              </TouchableOpacity>
            ) : deadlines.length > 1 ? (
              <TouchableOpacity onPress={() => activateSort('deadlines')} style={styles.sortDoneBtn}>
                <MaterialIcons name="reorder" size={16} color={colors.Primary} />
                <Text style={styles.sortDoneText}>SORT</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {deadlines.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="upcoming" size={36} color={colors.OutlineVariant} />
              <Text style={styles.emptyText}>No upcoming deadlines.</Text>
            </View>
          ) : null}
          {deadlines.map((deadline) => {
            const isActive = activeDragId === deadline.id;
            const itemTransform = isActive
              ? [{ scale: 1.04 }]
              : sortSection === 'deadlines' ? [{ rotate: jiggleDeg }] : [];

            if (sortSection === 'deadlines') {
              return (
                <View key={deadline.id} {...makePanResponder(deadline.id, 'deadlines', deadlinesRef, setDeadlines, panRespondersDeadlines).panHandlers}>
                  <Animated.View style={{ transform: itemTransform, zIndex: isActive ? 10 : 1 }}>
                    <View style={[styles.sortRow, isActive && styles.sortRowActive]}>
                      <View style={styles.sortHandle}>
                        <MaterialIcons name="reorder" size={22} color={isActive ? colors.Primary : colors.Outline} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sortRowText}>{deadline.title}</Text>
                        <Text style={styles.sortRowSubtext}>{deadline.subtitle}</Text>
                      </View>
                    </View>
                  </Animated.View>
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={deadline.id}
                style={[styles.deadlineCard, { backgroundColor: deadline.done ? colors.SurfaceContainerLow : deadline.isHighlighted ? `${colors.SecondaryContainer}80` : colors.SurfaceContainerHigh }, deadline.done && { opacity: 0.5 }]}
                onPress={() => toggleDeadline(deadline.id)}
                onLongPress={() => activateSort('deadlines')}
                delayLongPress={500}
                activeOpacity={0.8}
              >
                <View style={[styles.deadlineDot, { backgroundColor: deadline.done ? colors.SurfaceContainerHigh : deadline.isHighlighted ? colors.SecondaryContainer : colors.SurfaceVariant }]}>
                  {deadline.done
                    ? <MaterialIcons name="check" size={18} color={colors.Primary} />
                    : <Text style={[styles.deadlineDotText, { color: deadline.isHighlighted ? colors.OnSecondaryContainer : colors.OnSurfaceVariant }]}>{deadline.dayLabel}</Text>
                  }
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.deadlineTitle, { color: deadline.done ? colors.OnSurfaceVariant : deadline.isHighlighted ? colors.OnSecondaryContainer : colors.OnSurface, textDecorationLine: deadline.done ? 'line-through' : 'none' }]}>{deadline.title}</Text>
                  <Text style={styles.deadlineSubtitle}>{deadline.subtitle}</Text>
                </View>
                <MaterialIcons name={deadline.done ? 'check-circle' : 'radio-button-unchecked'} size={20} color={deadline.done ? colors.Primary : colors.OutlineVariant} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      <AppBottomNav
        tabs={[
          { label: 'Focus', icon: 'track-changes' },
          { label: 'Brainstorm', icon: 'lightbulb' },
          { label: 'Routines', icon: 'sync' },
          { label: 'Calendar', icon: 'calendar-today', isActive: true },
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
  content: { paddingBottom: 130 },
  headerBlock: { paddingHorizontal: 24, paddingTop: 24, marginBottom: 16 },
  smallLabel: { fontSize: 10, letterSpacing: 2, fontWeight: '700', color: colors.OnSurfaceVariant },
  pageTitle: { marginTop: 4, fontSize: 34, fontWeight: '800', color: colors.OnSurface, paddingRight: 24 },
  datePicker: { marginTop: 16, paddingLeft: 24, paddingBottom: 16 },
  dateItem: { width: 54, height: 92, borderRadius: 54, backgroundColor: colors.SurfaceContainerLow, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  dateItemSelected: { backgroundColor: colors.Primary, transform: [{ translateY: -6 }], width: 60, height: 108 },
  dateItemToday: { borderWidth: 2, borderColor: colors.Primary },
  dateDay: { fontSize: 10, letterSpacing: 1, fontWeight: '700', marginBottom: 10 },
  dateNumber: { fontSize: 17, fontWeight: '700' },
  dateActiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.OnPrimary, marginTop: 6 },
  dateTodayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.Primary, marginTop: 6 },
  sectionBlock: { paddingHorizontal: 24, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.OnSurface },
  badge: { borderRadius: 20, backgroundColor: colors.PrimaryContainer, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { fontSize: 10, letterSpacing: 1, fontWeight: '700', color: colors.OnPrimaryContainer },
  zoneCard: { width: '100%', borderRadius: 16, backgroundColor: colors.SurfaceContainerLowest, padding: 16, marginBottom: 12 },
  zoneCardImport: { backgroundColor: `${colors.Surface}80`, borderWidth: 1, borderColor: colors.SurfaceContainerHigh },
  zoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  zoneHeaderRight: { flexDirection: 'row', alignItems: 'center' },
  zoneTime: { fontSize: 10, letterSpacing: 1, fontWeight: '700' },
  zoneTitle: { fontSize: 16, fontWeight: '700', color: colors.OnSurface },
  zoneDescription: { fontSize: 13, color: colors.OnSurfaceVariant, lineHeight: 20 },
  zoneTag: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginTop: 10 },
  zoneTagText: { fontSize: 9, letterSpacing: 1, fontWeight: '700' },
  deadlineCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 18, marginBottom: 10 },
  deadlineDot: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  deadlineDotText: { fontSize: 14, fontWeight: '700' },
  deadlineTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  deadlineSubtitle: { fontSize: 12, color: colors.OnSurfaceVariant },
  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { marginTop: 10, fontSize: 13, color: colors.OutlineVariant, fontStyle: 'italic' },
  sortDoneBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortDoneText: { fontSize: 11, letterSpacing: 1.5, fontWeight: '700', color: colors.Primary },
  sortRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, backgroundColor: colors.SurfaceContainerLowest, paddingVertical: 14, paddingHorizontal: 12, marginBottom: 10, height: SORT_ROW_H },
  sortRowActive: { backgroundColor: colors.SurfaceContainerHigh, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 6 },
  sortHandle: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  sortRowTime: { fontSize: 10, letterSpacing: 1, fontWeight: '700', marginBottom: 2 },
  sortRowText: { fontSize: 15, fontWeight: '700', color: colors.OnSurface },
  sortRowSubtext: { marginTop: 2, fontSize: 12, color: colors.OnSurfaceVariant },
  });
}
