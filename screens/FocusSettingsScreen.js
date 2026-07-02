import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, TextInput, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useColors, useTheme } from '../context/ThemeContext';
import { SCHEMES } from '../theme';
import { Routes } from '../navigation/Routes';
import { MindfulTopBar, AppBottomNav, StyledToggle } from '../components/SharedComponents';

const sounds = ['Tibetan Bowls', 'Rain on Glass', 'Soft Windchimes', 'Deep Forest', 'Crystal Singing Bowls'];

export function FocusSettingsScreen({ navigation }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { schemeName, setScheme, mode, setMode } = useTheme();

  const [suggestionText, setSuggestionText] = useState('');
  const [suggestionSent, setSuggestionSent] = useState(false);

  const saveSuggestion = async () => {
    const text = suggestionText.trim();
    if (!text) return;
    const raw = await AsyncStorage.getItem('user_suggestions');
    const existing = raw ? JSON.parse(raw) : { suggestions: [] };
    existing.suggestions.push({ text, timestamp: new Date().toISOString() });
    await AsyncStorage.setItem('user_suggestions', JSON.stringify(existing));
    const subject = encodeURIComponent('ADHD Buddy — App Suggestion');
    const body = encodeURIComponent(text);
    await Linking.openURL(`mailto:gorgeousguygreg@gmail.com?subject=${subject}&body=${body}`);
    setSuggestionText('');
    setSuggestionSent(true);
    setTimeout(() => setSuggestionSent(false), 2500);
  };

  const [taskReminders, setTaskReminders] = useState(true);
  const [breakAlerts, setBreakAlerts] = useState(true);
  const [deepFocusSilence, setDeepFocusSilence] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [selectedSound, setSelectedSound] = useState(0);
  const [breatherActive, setBreatherActive] = useState(false);

  const outerScale = useRef(new Animated.Value(1)).current;
  const innerScale = useRef(new Animated.Value(1)).current;
  const breatherAnim = useRef(null);

  useEffect(() => {
    if (breatherActive) {
      breatherAnim.current = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(outerScale, { toValue: 1.3, duration: 2400, useNativeDriver: true }),
            Animated.timing(innerScale, { toValue: 1.15, duration: 2400, useNativeDriver: true })
          ]),
          Animated.parallel([
            Animated.timing(outerScale, { toValue: 1, duration: 2400, useNativeDriver: true }),
            Animated.timing(innerScale, { toValue: 1, duration: 2400, useNativeDriver: true })
          ])
        ])
      );
      breatherAnim.current.start();
    } else {
      if (breatherAnim.current) breatherAnim.current.stop();
      Animated.parallel([
        Animated.timing(outerScale, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(innerScale, { toValue: 1, duration: 300, useNativeDriver: true })
      ]).start();
    }
    return () => { if (breatherAnim.current) breatherAnim.current.stop(); };
  }, [breatherActive]);

  return (
    <SafeAreaView style={styles.container}>
      <MindfulTopBar />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>Focus Settings</Text>
          <Text style={styles.pageSubtitle}>Customize your sensory environment to minimize distraction and maintain a gentle flow state.</Text>
        </View>

        {/* Appearance */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Appearance</Text>
            <View style={styles.badge}>
              <MaterialIcons name="palette" size={22} color={colors.Primary} />
            </View>
          </View>

          <Text style={styles.smallLabel}>COLOUR SCHEME</Text>
          <View style={styles.schemesRow}>
            {SCHEMES.map((s) => {
              const isActive = schemeName === s.name;
              return (
                <TouchableOpacity
                  key={s.name}
                  onPress={() => setScheme(s.name)}
                  style={styles.schemeItem}
                  activeOpacity={0.75}
                >
                  <View style={[
                    styles.swatch,
                    { backgroundColor: s.swatch },
                    isActive && styles.swatchActive,
                  ]}>
                    {isActive ? <MaterialIcons name="check" size={16} color="#fff" /> : null}
                  </View>
                  <Text style={[styles.swatchLabel, isActive && { color: colors.Primary, fontWeight: '700' }]}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.smallLabel, { marginTop: 20 }]}>DISPLAY MODE</Text>
          <View style={styles.modeRow}>
            {[
              { key: 'light', icon: 'light-mode', label: 'Light' },
              { key: 'device', icon: 'brightness-auto', label: 'Device' },
              { key: 'dark',  icon: 'dark-mode',  label: 'Dark'  },
            ].map((m) => {
              const isActive = mode === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  onPress={() => setMode(m.key)}
                  style={[styles.modeBtn, isActive && styles.modeBtnActive]}
                  activeOpacity={0.75}
                >
                  <MaterialIcons name={m.icon} size={18} color={isActive ? colors.OnPrimary : colors.OnSurfaceVariant} />
                  <Text style={[styles.modeBtnLabel, isActive && { color: colors.OnPrimary }]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Notification Preferences</Text>
            <View style={styles.badge}>
              <MaterialIcons name="notifications-active" size={22} color={colors.Primary} />
            </View>
          </View>
          <SettingsToggleRow title="Gentle Task Reminders" subtitle="Soft nudges for upcoming focuses" checked={taskReminders} onCheckedChange={setTaskReminders} />
          <SettingsToggleRow title="Break Alerts" subtitle="Periodic breath reminders" checked={breakAlerts} onCheckedChange={setBreakAlerts} />
          <SettingsToggleRow title="Deep Focus Silence" subtitle="Suppress all external pings" checked={deepFocusSilence} onCheckedChange={setDeepFocusSilence} />
        </View>

        <TouchableOpacity style={[styles.card, styles.secondaryCard]} onPress={() => setBreatherActive(v => !v)} activeOpacity={0.85}>
          <View style={styles.visualRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Visual Breather</Text>
              <Text style={styles.cardSubtitle}>
                {breatherActive
                  ? 'Breathing with you – tap to stop.'
                  : 'Tap to activate a soft pulse to synchronize your breathing.'}
              </Text>
            </View>
            <View style={styles.visualCircleOuter}>
              <Animated.View style={[styles.visualCircleRing, { transform: [{ scale: outerScale }] }]} />
              <Animated.View style={[styles.visualCircleInner, { transform: [{ scale: innerScale }] }]} />
            </View>
          </View>
          <View style={styles.breatherFooter}>
            <MaterialIcons name={breatherActive ? 'pause-circle-filled' : 'play-circle-filled'} size={18} color={colors.Primary} />
            <Text style={styles.breatherToggleLabel}>{breatherActive ? 'ACTIVE - TAP TO STOP' : 'TAP TO ACTIVATE'}</Text>
          </View>
        </TouchableOpacity>

        <View style={[styles.card, styles.soundCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Sound Alerts</Text>
            <View style={styles.badge}>
              <MaterialIcons name="graphic-eq" size={22} color={colors.Primary} />
            </View>
          </View>
          <Text style={styles.smallLabel}>SELECTED SOUNDSCAPE</Text>
          {sounds.map((sound, index) => {
            const isSelected = selectedSound === index;
            return (
              <TouchableOpacity key={sound} style={[styles.soundOption, isSelected ? styles.soundOptionSelected : null]} onPress={() => setSelectedSound(index)}>
                <View style={styles.soundRow}>
                  <MaterialIcons name="play-circle-outline" size={24} color={isSelected ? colors.OnPrimaryContainer : colors.Outline} />
                  <Text style={[styles.soundLabel, isSelected ? styles.soundLabelSelected : null]}>{sound}</Text>
                </View>
                {isSelected ? <MaterialIcons name="check-circle" size={20} color={colors.OnPrimaryContainer} /> : null}
              </TouchableOpacity>
            );
          })}
          <View style={styles.sliderCard}>
            <View style={styles.sliderHeader}>
              <Text style={styles.cardTitle}>Volume Intensity</Text>
              <Text style={[styles.cardTitle, { color: colors.Primary }]}>{Math.round(volume * 100)}%</Text>
            </View>
            <Slider
              value={volume}
              onValueChange={setVolume}
              minimumValue={0}
              maximumValue={1}
              minimumTrackTintColor={colors.Primary}
              maximumTrackTintColor={colors.SurfaceVariant}
              thumbTintColor={colors.Primary}
            />
            <Text style={styles.smallCenterLabel}>LOWER VOLUME PROMOTES SUSTAINED FOCUS</Text>
          </View>
        </View>

        <View style={[styles.card, styles.quoteCard]}>
          <Text style={styles.quoteText}>"Focus is the art of knowing what to ignore."</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Suggestions</Text>
            <View style={styles.badge}>
              <MaterialIcons name="chat-bubble-outline" size={22} color={colors.Primary} />
            </View>
          </View>
          <Text style={styles.cardSubtitle}>Got an idea to make this app better? We'd love to hear it.</Text>
          <TextInput
            style={styles.suggestionInput}
            value={suggestionText}
            onChangeText={setSuggestionText}
            placeholder="Type your suggestion here..."
            placeholderTextColor={colors.OutlineVariant}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.suggestionBtn, !suggestionText.trim() && styles.suggestionBtnDisabled]}
            onPress={saveSuggestion}
            disabled={!suggestionText.trim()}
            activeOpacity={0.8}
          >
            {suggestionSent ? (
              <>
                <MaterialIcons name="check-circle" size={18} color={colors.OnPrimary} />
                <Text style={styles.suggestionBtnText}>Thanks!</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="send" size={18} color={colors.OnPrimary} />
                <Text style={styles.suggestionBtnText}>Send Suggestion</Text>
              </>
            )}
          </TouchableOpacity>
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

function SettingsToggleRow({ title, subtitle, checked, onCheckedChange }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.toggleCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleSubtitle}>{subtitle}</Text>
      </View>
      <StyledToggle checked={checked} onCheckedChange={onCheckedChange} />
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.Surface },
    content: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 130 },
    headerBlock: { marginBottom: 32 },
    pageTitle: { fontSize: 40, fontWeight: '800', color: colors.OnSurface, lineHeight: 44 },
    pageSubtitle: { marginTop: 8, fontSize: 16, color: colors.OnSurfaceVariant, lineHeight: 24 },
    card: { width: '100%', borderRadius: 24, backgroundColor: colors.SurfaceContainerLow, padding: 24, marginBottom: 24 },
    secondaryCard: { backgroundColor: `${colors.SecondaryContainer}80` },
    soundCard: { backgroundColor: colors.SurfaceContainer },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    cardTitle: { fontSize: 18, fontWeight: '700', color: colors.OnSurface },
    badge: { borderRadius: 16, backgroundColor: colors.PrimaryContainer, padding: 10 },
    cardSubtitle: { marginTop: 8, fontSize: 13, color: colors.OnSurfaceVariant, lineHeight: 20 },
    toggleCard: { width: '100%', borderRadius: 16, backgroundColor: colors.SurfaceContainerLowest, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
    toggleTitle: { fontSize: 15, fontWeight: '700', color: colors.OnSurface },
    toggleSubtitle: { marginTop: 4, fontSize: 12, color: colors.OnSurfaceVariant },
    visualRow: { flexDirection: 'row', alignItems: 'center' },
    visualCircleOuter: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
    visualCircleRing: { position: 'absolute', width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: `${colors.Primary}33` },
    visualCircleInner: { width: 48, height: 48, borderRadius: 24, backgroundColor: `${colors.Primary}1A` },
    breatherFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
    breatherToggleLabel: { marginLeft: 6, fontSize: 10, letterSpacing: 1.5, fontWeight: '700', color: colors.Primary },
    smallLabel: { fontSize: 10, letterSpacing: 1.5, fontWeight: '700', color: colors.OnSurfaceVariant, marginBottom: 12 },
    soundOption: { width: '100%', borderRadius: 16, backgroundColor: colors.SurfaceContainerLowest, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    soundOptionSelected: { backgroundColor: colors.PrimaryContainer },
    soundRow: { flexDirection: 'row', alignItems: 'center' },
    soundLabel: { marginLeft: 12, fontSize: 15, fontWeight: '600', color: colors.OnSurface },
    soundLabelSelected: { color: colors.OnPrimaryContainer },
    sliderCard: { width: '100%', borderRadius: 16, backgroundColor: colors.SurfaceContainerHighest, padding: 16 },
    sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    smallCenterLabel: { marginTop: 8, fontSize: 9, letterSpacing: 1, color: colors.OnSurfaceVariant, textAlign: 'center' },
    quoteCard: { backgroundColor: colors.SurfaceContainerLow, height: 140, justifyContent: 'center' },
    quoteText: { fontSize: 18, fontWeight: '300', fontStyle: 'italic', color: colors.PrimaryDim, textAlign: 'center', lineHeight: 26 },
    schemesRow: { flexDirection: 'row', justifyContent: 'space-between' },
    schemeItem: { alignItems: 'center', flex: 1 },
    swatch: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    swatchActive: { borderWidth: 3, borderColor: colors.OnSurface },
    swatchLabel: { fontSize: 10, fontWeight: '600', color: colors.OnSurfaceVariant, letterSpacing: 0.3 },
    modeRow: { flexDirection: 'row', gap: 8 },
    modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, backgroundColor: colors.SurfaceContainerLowest, borderWidth: 1.5, borderColor: colors.OutlineVariant },
    modeBtnActive: { backgroundColor: colors.Primary, borderColor: colors.Primary },
    modeBtnLabel: { fontSize: 13, fontWeight: '700', color: colors.OnSurfaceVariant },
    suggestionInput: { width: '100%', borderRadius: 16, backgroundColor: colors.SurfaceContainerLowest, padding: 16, fontSize: 15, color: colors.OnSurface, marginTop: 16, marginBottom: 16, minHeight: 100 },
    suggestionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.Primary, borderRadius: 999, paddingVertical: 14 },
    suggestionBtnDisabled: { opacity: 0.4 },
    suggestionBtnText: { fontSize: 15, fontWeight: '700', color: colors.OnPrimary },
  });
}
