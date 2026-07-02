import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import { Routes } from '../navigation/Routes';
import { MindfulTopBar, AppBottomNav, SpeechTextInput } from '../components/SharedComponents';

const TAGS = ['Unsorted', 'Idea', 'Note', 'Action', 'Later'];

const initialCaptures = [
  { id: 1, tag: 'Idea', text: 'Create a colour-coded weekly planner on paper as a backup to the app', isWide: false },
  { id: 2, tag: 'Action', text: 'Email GP about referral for ADHD coaching sessions', isWide: false },
  { id: 3, tag: 'Note', text: 'Mornings work best for big tasks — protect that window at all costs', isWide: false },
  { id: 4, tag: 'Later', text: 'Look into body-doubling apps for accountability during deep work blocks', isWide: true },
  { id: 5, tag: 'Idea', text: 'Set up a "done list" alongside the to-do list to see actual progress', isWide: false },
  { id: 6, tag: 'Action', text: 'Book car service — overdue by 3 months', isWide: false },
];

const SORT_MODES = ['none', 'tag', 'alpha'];
const SORT_LABELS = { none: 'SORT ALL', tag: 'SORTED: TAG', alpha: 'SORTED: Aâ€“Z' };

export function TaskBrainstormingScreen({ navigation }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const TAG_STYLES = useMemo(() => ({
    Unsorted: { bg: colors.SecondaryContainer, text: colors.OnSecondaryContainer },
    Idea:     { bg: colors.PrimaryContainer,   text: colors.OnPrimaryContainer },
    Note:     { bg: colors.TertiaryContainer,  text: colors.OnTertiaryContainer },
    Action:   { bg: `${colors.Primary}22`,     text: colors.Primary },
    Later:    { bg: colors.SurfaceContainerHigh, text: colors.OnSurfaceVariant }
  }), [colors]);
  const [inputText, setInputText] = useState('');
  const [captures, setCaptures] = useState(initialCaptures);
  const [sortMode, setSortMode] = useState('none');
  const [selectedTag, setSelectedTag] = useState('Unsorted');

  const onCapture = () => {
    if (!inputText.trim()) return;
    setCaptures(prev => [
      ...prev,
      { id: Date.now(), tag: selectedTag, text: inputText.trim(), isWide: inputText.trim().length > 80 }
    ]);
    setInputText('');
  };

  const cycleSort = () => {
    setSortMode(prev => SORT_MODES[(SORT_MODES.indexOf(prev) + 1) % SORT_MODES.length]);
  };

  const deleteCapture = (id) => {
    Alert.alert('Delete Capture', 'Remove this thought?', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setCaptures(prev => prev.filter(c => c.id !== id)) }
    ]);
  };

  const changeTag = (id) => {
    setCaptures(prev => prev.map(c => {
      if (c.id !== id) return c;
      const nextTag = TAGS[(TAGS.indexOf(c.tag) + 1) % TAGS.length];
      return { ...c, tag: nextTag };
    }));
  };

  const getSorted = () => {
    if (sortMode === 'tag') return [...captures].sort((a, b) => a.tag.localeCompare(b.tag));
    if (sortMode === 'alpha') return [...captures].sort((a, b) => a.text.localeCompare(b.text));
    return captures;
  };

  const sorted = getSorted();

  return (
    <SafeAreaView style={styles.container}>
      <MindfulTopBar />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>Brainstorm</Text>
          <Text style={styles.pageSubtitle}>Capture your thoughts, clear your mind.</Text>
        </View>

        <View style={styles.inputCard}>
          <SpeechTextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="What's on your mind right now?"
            multiline
          />
          <View style={styles.tagChooserRow}>
            {TAGS.map(tag => {
              const ts = TAG_STYLES[tag];
              const active = selectedTag === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagChip, { backgroundColor: active ? ts.bg : colors.SurfaceContainerLow }]}
                  onPress={() => setSelectedTag(tag)}
                >
                  <Text style={[styles.tagChipText, { color: active ? ts.text : colors.Outline }]}>{tag.toUpperCase()}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.inputFooter}>
            <Text style={styles.smallLabel}>TAG THEN CAPTURE</Text>
            <TouchableOpacity style={styles.captureButton} onPress={onCapture}>
              <MaterialIcons name="add" size={16} color={colors.OnPrimary} />
              <Text style={styles.captureButtonText}>Capture</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.capturesHeader}>
          <Text style={styles.sectionTitle}>Recent Captures ({captures.length})</Text>
          <TouchableOpacity onPress={cycleSort}>
            <Text style={styles.sortLabel}>{SORT_LABELS[sortMode]}</Text>
          </TouchableOpacity>
        </View>

        {sorted.map((capture) => {
          const ts = TAG_STYLES[capture.tag] || TAG_STYLES['Unsorted'];
          return (
            <View key={capture.id} style={[styles.captureCard, capture.isWide ? styles.captureCardWide : null]}>
              <View style={styles.captureTagRow}>
                <TouchableOpacity style={[styles.captureTag, { backgroundColor: ts.bg }]} onPress={() => changeTag(capture.id)}>
                  <Text style={[styles.captureTagText, { color: ts.text }]}>{capture.tag.toUpperCase()}</Text>
                  <MaterialIcons name="swap-horiz" size={10} color={ts.text} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteCapture(capture.id)} style={styles.deleteButton}>
                  <MaterialIcons name="close" size={18} color={colors.OnSurfaceVariant} />
                </TouchableOpacity>
              </View>
              <Text style={styles.captureText}>{capture.text}</Text>
            </View>
          );
        })}

        {captures.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="lightbulb-outline" size={40} color={colors.OutlineVariant} />
            <Text style={styles.emptyText}>Your mind is clear. Add a thought above.</Text>
          </View>
        ) : null}
      </ScrollView>
      <AppBottomNav
        tabs={[
          { label: 'Focus', icon: 'track-changes' },
          { label: 'Brainstorm', icon: 'lightbulb', isActive: true },
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
  content: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 130 },
  headerBlock: { marginBottom: 24 },
  pageTitle: { fontSize: 36, fontWeight: '800', color: colors.OnSurface, lineHeight: 40 },
  pageSubtitle: { marginTop: 8, fontSize: 15, fontWeight: '500', color: colors.OnSurfaceVariant },
  inputCard: { width: '100%', borderRadius: 24, backgroundColor: colors.SurfaceContainerLowest, padding: 20, marginBottom: 24 },
  textInput: { width: '100%', minHeight: 100, color: colors.OnSurface, fontSize: 18, fontWeight: '600' },
  tagChooserRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  tagChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  tagChipText: { fontSize: 9, letterSpacing: 1.5, fontWeight: '700' },
  inputFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  smallLabel: { fontSize: 10, letterSpacing: 1.5, fontWeight: '700', color: colors.Outline },
  captureButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.Primary, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  captureButtonText: { marginLeft: 6, color: colors.OnPrimary, fontWeight: '700' },
  capturesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.OnSurface },
  sortLabel: { fontSize: 10, letterSpacing: 1.5, fontWeight: '700', color: colors.Primary },
  captureCard: { width: '100%', borderRadius: 20, backgroundColor: colors.SurfaceContainerLowest, padding: 20, marginBottom: 12 },
  captureCardWide: { minHeight: 140 },
  captureTagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  captureTag: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' },
  captureTagText: { fontSize: 9, letterSpacing: 1.5, fontWeight: '700' },
  deleteButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.SurfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  captureText: { fontSize: 15, fontWeight: '600', color: colors.OnSurface, lineHeight: 22 },
  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyText: { marginTop: 12, fontSize: 14, color: colors.OnSurfaceVariant, textAlign: 'center' }
  });
}
