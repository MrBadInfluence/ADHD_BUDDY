import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import { Routes } from '../navigation/Routes';
import { MindfulTopBar, AppBottomNav, SectionHeader } from '../components/SharedComponents';

const initialWins = [
  { id: 1, title: 'Completed all Big Three tasks', subtitle: 'First full day this week!', icon: 'stars', iconBg: '#E8EDD5', iconTint: '#7A8C4A', celebrated: true },
  { id: 2, title: 'Kept a 4-day streak', subtitle: 'Routines checked off 4 days running', icon: 'local-fire-department', iconBg: '#DDE3C4', iconTint: '#A8B870', celebrated: false },
  { id: 3, title: 'Took medication on time', subtitle: '7 days in a row', icon: 'medical-services', iconBg: '#F5EDD5', iconTint: '#C4A96C', celebrated: false },
  { id: 4, title: 'Submitted the project proposal', subtitle: 'That one was sitting there for weeks!', icon: 'assignment-turned-in', iconBg: '#E8EDD5', iconTint: '#7A8C4A', celebrated: false },
  { id: 5, title: 'Called the insurance company', subtitle: 'Avoided it for a month — you did it!', icon: 'phone-in-talk', iconBg: '#DDE3C4', iconTint: '#A8B870', celebrated: false },
];

const QUOTES = [
  '"Growth is not about the speed, but the direction."',
  '"Progress, not perfection."',
  '"Every small win builds momentum."',
  '"You showed up â€” that matters."'
];

export function ProgressWinsScreen({ navigation }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [wins, setWins] = useState(initialWins);
  const [tasksCompleted, setTasksCompleted] = useState(18);
  const [streakDays, setStreakDays] = useState(4);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const celebrateWin = (id) => {
    setWins(prev => prev.map(w => w.id === id ? { ...w, celebrated: !w.celebrated } : w));
  };

  const addTask = () => setTasksCompleted(v => v + 1);
  const addStreak = () => setStreakDays(v => Math.min(v + 1, 7));
  const nextQuote = () => setQuoteIndex(v => (v + 1) % QUOTES.length);

  const celebratedCount = wins.filter(w => w.celebrated).length;

  return (
    <SafeAreaView style={styles.container}>
      <MindfulTopBar />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>You're doing great</Text>
          <Text style={styles.pageSubtitle}>Focusing one step at a time. Here is your week at a glance.</Text>
        </View>

        <View style={styles.bentoRow}>
          <TouchableOpacity style={[styles.bentoCard, { backgroundColor: colors.PrimaryContainer }]} onPress={addTask} activeOpacity={0.8}>
            <MaterialIcons name="stars" size={32} color={colors.Primary} />
            <Text style={styles.bentoNumber}>{tasksCompleted}</Text>
            <Text style={styles.bentoLabel}>TASKS COMPLETED</Text>
            <Text style={styles.bentoSubText}>Tap to log one more!</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.bentoCard, { backgroundColor: colors.SecondaryContainer }]} onPress={addStreak} activeOpacity={0.8}>
            <MaterialIcons name="local-fire-department" size={32} color={colors.Secondary} />
            <Text style={[styles.bentoNumber, { color: colors.OnSecondaryContainer }]}>{streakDays}</Text>
            <Text style={[styles.bentoLabel, { color: colors.OnSecondaryContainer }]}>DAY ROUTINE STREAK</Text>
            <View style={styles.streakDotsRow}>
              {Array.from({ length: 7 }, (_, i) => (
                <View key={i} style={i < streakDays ? styles.activeDot : styles.inactiveDot} />
              ))}
            </View>
            <Text style={[styles.bentoSubText, { color: colors.OnSecondaryContainer }]}>
              {streakDays === 7 ? 'Full week streak!' : 'Keep the momentum going.'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Watch Companion */}
        <View style={[styles.card, { backgroundColor: colors.SurfaceContainerLow, marginTop: 24 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Text style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: '700', color: colors.Outline }}>WATCH COMPANION</Text>
              <Text style={{ marginTop: 4, fontSize: 18, fontWeight: '700', color: colors.OnSurface }}>Calm, focused, ready.</Text>
            </View>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.Primary, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="watch" size={20} color={colors.OnPrimary} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: colors.Primary }}>68%</Text>
              <Text style={{ marginTop: 4, fontSize: 10, letterSpacing: 1, fontWeight: '600', color: colors.OnSurfaceVariant }}>Focus pulse</Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.SurfaceContainerHigh }} />
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: colors.Primary }}>2</Text>
              <Text style={{ marginTop: 4, fontSize: 10, letterSpacing: 1, fontWeight: '600', color: colors.OnSurfaceVariant }}>Done today</Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.SurfaceContainerHigh }} />
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: colors.Primary }}>3</Text>
              <Text style={{ marginTop: 4, fontSize: 10, letterSpacing: 1, fontWeight: '600', color: colors.OnSurfaceVariant }}>Open tasks</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Focus Distribution" trailing="Last 7 Days" />
          <View style={[styles.card, { backgroundColor: colors.SurfaceContainerLow }]}>
            <View style={styles.distributionRow}>
              <View style={styles.circleProgress}>
                <View style={styles.circleTrack} />
                <View style={[styles.circleFill, { transform: [{ rotate: '245deg' }] }]} />
                <View style={styles.circleCenter}>
                  <Text style={styles.circleText}>68%</Text>
                  <Text style={styles.circleLabel}>FOCUS SCORE</Text>
                </View>
              </View>
              <View style={styles.focusBars}>
                <FocusBar label="Deep Work" hours="12h" progress={0.75} color={colors.Primary} />
                <FocusBar label="Routines" hours="8h" progress={0.5} color={colors.SecondaryFixedDim} />
                <FocusBar label="Brainstorm" hours="4h" progress={0.25} color={colors.TertiaryFixedDim} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.winsHeaderRow}>
            <Text style={styles.sectionTitle}>Hall of Wins</Text>
            {celebratedCount > 0 ? (
              <View style={styles.celebratedBadge}>
                <Text style={styles.celebratedBadgeText}>{celebratedCount} CELEBRATED</Text>
              </View>
            ) : null}
          </View>
          {wins.map((win) => (
            <TouchableOpacity
              key={win.id}
              style={[styles.winCard, win.celebrated && styles.winCardCelebrated]}
              onPress={() => celebrateWin(win.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBadge, { backgroundColor: win.celebrated ? `${colors.Primary}22` : win.iconBg }]}>
                <MaterialIcons name={win.celebrated ? 'celebration' : win.icon} size={24} color={win.celebrated ? colors.Primary : win.iconTint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.winTitle}>{win.title}</Text>
                <Text style={styles.winSubtitle}>{win.celebrated ? 'ðŸŽ‰ Celebrated!' : win.subtitle}</Text>
              </View>
              <MaterialIcons name={win.celebrated ? 'star' : 'star-outline'} size={22} color={win.celebrated ? colors.Primary : colors.OutlineVariant} />
            </TouchableOpacity>
          ))}
          <Text style={styles.winHint}>TAP A WIN TO CELEBRATE IT</Text>
        </View>

        <TouchableOpacity style={[styles.quoteCard, { backgroundColor: `${colors.PrimaryDim}1F` }]} onPress={nextQuote} activeOpacity={0.8}>
          <Text style={styles.quoteText}>{QUOTES[quoteIndex]}</Text>
          <Text style={styles.quoteHint}>TAP FOR NEXT QUOTE</Text>
        </TouchableOpacity>
      </ScrollView>
      <AppBottomNav
        tabs={[
          { label: 'Focus', icon: 'track-changes' },
          { label: 'Brainstorm', icon: 'lightbulb' },
          { label: 'Routines', icon: 'sync' },
          { label: 'Calendar', icon: 'calendar-today' },
          { label: 'Progress', icon: 'leaderboard', isActive: true }
        ]}
        onTabSelected={(index) => navigation.navigate([Routes.DAILY_FOCUS, Routes.TASK_BRAINSTORMING, Routes.ROUTINE_TRACKER, Routes.WEEKLY_OVERVIEW, Routes.PROGRESS_WINS][index])}
      />
    </SafeAreaView>
  );
}

function FocusBar({ label, hours, progress, color }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.focusBarRow}>
      <View style={styles.focusBarHeader}>
        <Text style={styles.focusBarLabel}>{label}</Text>
        <Text style={styles.focusBarHours}>{hours}</Text>
      </View>
      <View style={styles.focusBarTrack}>
        <View style={[styles.focusBarFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.Surface },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 130 },
  headerBlock: { marginBottom: 24 },
  pageTitle: { fontSize: 36, fontWeight: '800', color: colors.OnSurface, lineHeight: 40 },
  pageSubtitle: { marginTop: 8, fontSize: 16, color: colors.OnSurfaceVariant },
  bentoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  bentoCard: { flex: 1, height: 200, borderRadius: 24, padding: 24, marginRight: 12, justifyContent: 'space-between' },
  bentoNumber: { fontSize: 48, fontWeight: '800', color: colors.OnPrimaryContainer, marginTop: 12 },
  bentoLabel: { fontSize: 10, letterSpacing: 1, fontWeight: '700', color: colors.OnPrimaryContainer, marginTop: 4 },
  bentoSubText: { fontSize: 13, fontWeight: '600', color: colors.OnPrimaryContainer, marginTop: 12 },
  streakDotsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 8 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.Primary, marginRight: 6 },
  inactiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: `${colors.OutlineVariant}33`, marginRight: 6 },
  section: { marginTop: 32 },
  card: { borderRadius: 24, padding: 24, width: '100%', marginTop: 12 },
  distributionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  circleProgress: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  circleTrack: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 10, borderColor: colors.SurfaceContainerHigh },
  circleFill: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderTopWidth: 10, borderColor: colors.Primary, borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 0, borderBottomColor: 'transparent', transform: [{ rotate: '135deg' }] },
  circleCenter: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.SecondaryFixed, alignItems: 'center', justifyContent: 'center' },
  circleText: { fontSize: 28, fontWeight: '700', color: colors.OnSurface },
  circleLabel: { marginTop: 4, fontSize: 8, letterSpacing: 1, color: colors.OnSurfaceVariant },
  focusBars: { flex: 1, marginLeft: 24 },
  focusBarRow: { marginBottom: 12 },
  focusBarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  focusBarLabel: { fontSize: 12, fontWeight: '700', color: colors.OnSurface },
  focusBarHours: { fontSize: 12, fontWeight: '700', color: colors.OnSurface },
  focusBarTrack: { width: '100%', height: 10, borderRadius: 10, backgroundColor: colors.SurfaceContainerHigh, overflow: 'hidden' },
  focusBarFill: { height: '100%', borderRadius: 10 },
  winsHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: colors.OnSurface },
  celebratedBadge: { borderRadius: 999, backgroundColor: `${colors.Primary}1A`, paddingHorizontal: 10, paddingVertical: 4 },
  celebratedBadgeText: { fontSize: 9, letterSpacing: 1, fontWeight: '700', color: colors.Primary },
  winCard: { width: '100%', borderRadius: 20, backgroundColor: colors.SurfaceContainerLowest, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  winCardCelebrated: { backgroundColor: `${colors.PrimaryContainer}66` },
  iconBadge: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  winTitle: { fontSize: 16, fontWeight: '700', color: colors.OnSurface },
  winSubtitle: { marginTop: 4, fontSize: 12, color: colors.OnSurfaceVariant },
  winHint: { marginTop: 8, fontSize: 9, letterSpacing: 1.5, fontWeight: '700', color: colors.OutlineVariant, textAlign: 'center' },
  quoteCard: { width: '100%', minHeight: 120, borderRadius: 24, justifyContent: 'center', alignItems: 'center', padding: 24, marginTop: 24 },
  quoteText: { textAlign: 'center', fontSize: 16, fontStyle: 'italic', color: colors.PrimaryDim, lineHeight: 24 },
  quoteHint: { marginTop: 12, fontSize: 9, letterSpacing: 1.5, fontWeight: '700', color: `${colors.PrimaryDim}66` }
  });
}
