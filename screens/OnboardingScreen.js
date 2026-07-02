import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  ScrollView, Animated, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useColors } from '../context/ThemeContext';
import { Routes } from '../navigation/Routes';

const { width } = Dimensions.get('window');

export function OnboardingScreen({ navigation }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const SLIDES = useMemo(() => [
    {
      key: 'welcome',
      icon: 'spa',
      iconColor: colors.Primary,
      bgColor: colors.PrimaryContainer,
      title: 'Welcome to\nADHD Buddy',
      subtitle: 'Your calm, focused companion â€” built around how your brain actually works.',
      features: null,
    },
    {
      key: 'focus',
      icon: 'track-changes',
      iconColor: colors.Secondary,
      bgColor: colors.SecondaryContainer,
      title: 'Daily Focus\nMade Simple',
      subtitle: 'Pick your Big Three tasks each day. Everything else waits â€” and that\'s okay.',
      features: [
        { icon: 'check-circle', label: 'Big Three daily priorities' },
        { icon: 'history', label: 'Unfinished tasks roll over automatically' },
        { icon: 'today', label: '3-day task planner included' },
      ],
    },
    {
      key: 'voice',
      icon: 'mic',
      iconColor: '#60604C',
      bgColor: '#FFFFE2',
      title: 'Just Speak\nYour Thoughts',
      subtitle: 'Tap any text field and the mic activates automatically. No typing required.',
      features: [
        { icon: 'mic-none', label: 'Auto-activates when you tap an input' },
        { icon: 'lightbulb', label: 'Capture ideas in Brainstorm instantly' },
        { icon: 'notifications', label: 'Set reminders by speaking them' },
      ],
    },
    {
      key: 'routines',
      icon: 'sync',
      iconColor: colors.Primary,
      bgColor: colors.PrimaryContainer,
      title: 'Routines &\nProgress',
      subtitle: 'Build steady habits, celebrate wins, and see how far you\'ve come.',
      features: [
        { icon: 'wb-sunny', label: 'Morning, midday, and evening routines' },
        { icon: 'star', label: 'Win wall to celebrate achievements' },
        { icon: 'show-chart', label: 'Streak and focus-time tracking' },
      ],
    },
    {
      key: 'ready',
      icon: 'launch',
      iconColor: colors.Primary,
      bgColor: colors.PrimaryContainer,
      title: 'You\'re All\nSet!',
      subtitle: 'Let\'s begin. Your sanctuary is ready whenever you need it.',
      features: null,
      isFinal: true,
    },
  ], [colors]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const goTo = (index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setCurrentIndex(index);
    Animated.timing(progressAnim, {
      toValue: index / (SLIDES.length - 1),
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const finish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem('onboarding_complete', 'true');
    navigation.replace(Routes.DAILY_FOCUS);
  };

  const skip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem('onboarding_complete', 'true');
    navigation.replace(Routes.DAILY_FOCUS);
  };

  const slide = SLIDES[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip button */}
      {!slide.isFinal && (
        <TouchableOpacity style={styles.skipBtn} onPress={skip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slide content */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s, i) => (
          <View key={s.key} style={[styles.slide, { width }]}>
            {/* Hero icon */}
            <View style={[styles.iconBubble, { backgroundColor: s.bgColor }]}>
              <MaterialIcons name={s.icon} size={64} color={s.iconColor} />
            </View>

            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.subtitle}>{s.subtitle}</Text>

            {s.features && (
              <View style={styles.featureList}>
                {s.features.map((f) => (
                  <View key={f.label} style={styles.featureRow}>
                    <View style={[styles.featureIconWrap, { backgroundColor: s.bgColor }]}>
                      <MaterialIcons name={f.icon} size={20} color={s.iconColor} />
                    </View>
                    <Text style={styles.featureLabel}>{f.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {s.isFinal && (
              <View style={styles.finalIllustration}>
                <View style={[styles.finalCircle, { backgroundColor: colors.PrimaryContainer }]}>
                  <MaterialIcons name="spa" size={80} color={colors.Primary} />
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Dot indicators */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)}>
              <Animated.View
                style={[
                  styles.dot,
                  i === currentIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Navigation buttons */}
        <View style={styles.navRow}>
          {slide.isFinal ? (
            <TouchableOpacity style={styles.getStartedBtn} onPress={finish}>
              <Text style={styles.getStartedText}>Let's Go</Text>
              <MaterialIcons name="arrow-forward" size={20} color={colors.OnPrimary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextBtn} onPress={() => goTo(currentIndex + 1)}>
              <Text style={styles.nextText}>Next</Text>
              <MaterialIcons name="arrow-forward" size={20} color={colors.OnPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.Surface },
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.SurfaceContainerLow,
  },
  skipText: { fontSize: 14, fontWeight: '600', color: colors.OnSurfaceVariant },
  slide: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  iconBubble: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.OnSurface,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 17,
    color: colors.OnSurfaceVariant,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 36,
  },
  featureList: { width: '100%', gap: 12 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.SurfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureLabel: { fontSize: 15, fontWeight: '600', color: colors.OnSurface, flex: 1 },
  finalIllustration: { alignItems: 'center', marginTop: 16 },
  finalCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 28, backgroundColor: colors.Primary },
  dotInactive: { width: 8, backgroundColor: colors.OutlineVariant },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.SurfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.Primary,
    borderRadius: 999,
    paddingVertical: 16,
    gap: 8,
  },
  nextText: { fontSize: 16, fontWeight: '700', color: colors.OnPrimary },
  getStartedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.Primary,
    borderRadius: 999,
    paddingVertical: 18,
    gap: 8,
  },
  getStartedText: { fontSize: 18, fontWeight: '800', color: colors.OnPrimary },
  });
}
