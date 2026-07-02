import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Switch,
  StyleSheet, Animated, Modal, Alert, Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { signInWithGoogle, signOut } from '../lib/auth';
import { useColors } from '../context/ThemeContext';
import { Routes } from '../navigation/Routes';
import { SpeechModule as ExpoSpeechRecognitionModule } from '../lib/speechRecognition';

// â”€â”€â”€ Haptics helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function hapticLight()   { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); }
export function hapticMedium()  { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); }
export function hapticSuccess() { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); }
export function hapticWarning() { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}); }


// â”€â”€â”€ SpeechTextInput â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function SpeechTextInput({
  value, onChangeText, style, onFocus, onBlur,
  placeholder, placeholderTextColor, multiline, ...props
}) {
  const colors = useColors();
  const micStyles = useMemo(() => makeMicStyles(colors), [colors]);
  const [isListening, setIsListening] = useState(false);
  const flashAnim   = useRef(new Animated.Value(1)).current;
  const volumeScale = useRef(new Animated.Value(1)).current;
  const onChangeRef = useRef(onChangeText);
  const isListeningRef = useRef(false);
  useEffect(() => { onChangeRef.current = onChangeText; }, [onChangeText]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

  useEffect(() => {
    if (!ExpoSpeechRecognitionModule) return;
    const subs = [
      ExpoSpeechRecognitionModule.addListener('result', (event) => {
        if (!isListeningRef.current) return;
        const text = event.results?.[0]?.transcript || '';
        if (text) onChangeRef.current(text);
        if (event.isFinal) setIsListening(false);
      }),
      ExpoSpeechRecognitionModule.addListener('end', () => {
        if (isListeningRef.current) setIsListening(false);
      }),
      ExpoSpeechRecognitionModule.addListener('error', () => {
        if (isListeningRef.current) setIsListening(false);
      }),
      ExpoSpeechRecognitionModule.addListener('volumechange', (event) => {
        if (!isListeningRef.current) return;
        const level = Math.max(0, Math.min((event.value ?? 0) / 10, 1));
        Animated.sequence([
          Animated.spring(volumeScale, { toValue: 1 + level * 0.5, useNativeDriver: true, speed: 60, bounciness: 4 }),
          Animated.spring(volumeScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 2 }),
        ]).start();
      }),
    ];
    return () => subs.forEach((s) => s?.remove());
  }, []);

  useEffect(() => {
    if (isListening) {
      const flash = Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, { toValue: 0.2, duration: 350, useNativeDriver: true }),
          Animated.timing(flashAnim, { toValue: 1,   duration: 350, useNativeDriver: true }),
        ])
      );
      flash.start();
      return () => { flash.stop(); flashAnim.setValue(1); };
    }
    flashAnim.setValue(1);
    volumeScale.setValue(1);
  }, [isListening]);

  const start = async () => {
    if (!ExpoSpeechRecognitionModule) return;
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) return;
    hapticLight();
    try {
      await ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: true });
      setIsListening(true);
    } catch (_) {}
  };

  const stop = async () => {
    if (!ExpoSpeechRecognitionModule) return;
    try { await ExpoSpeechRecognitionModule.stop(); } catch (_) {}
    setIsListening(false);
  };

  return (
    <View style={{ position: 'relative' }}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={async (e) => { await start(); onFocus?.(e); }}
        onBlur={async (e) => { await stop(); onBlur?.(e); }}
        placeholder={isListening ? 'Listening...' : placeholder}
        placeholderTextColor={isListening ? colors.Primary : (placeholderTextColor ?? colors.OutlineVariant)}
        multiline={multiline}
        style={[style, { paddingRight: 52 }]}
        {...props}
      />
      <TouchableOpacity
        onPress={isListening ? stop : start}
        style={[micStyles.btn, isListening && micStyles.btnActive, { top: 8 }]}
      >
        <Animated.View style={{ transform: [{ scale: volumeScale }], alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={{ opacity: isListening ? flashAnim : 1 }}>
            <MaterialIcons
              name={isListening ? 'mic' : 'mic-none'}
              size={18}
              color={isListening ? '#F97316' : colors.Outline}
            />
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

function makeMicStyles(colors) {
  return StyleSheet.create({
  btn: {
    position: 'absolute',
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.SurfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: {
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderWidth: 1.5,
    borderColor: '#F97316',
  },
  });
}

// â”€â”€â”€ Clock / date helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function useRealtimeClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const DAYS   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(date) {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${d}-${m}-${date.getFullYear()}`;
}
export function formatTime(date) {
  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m} ${ampm}`;
}
export function getGreeting(date) {
  const h = date.getHours();
  if (h < 12) return 'Good Morning.';
  if (h < 17) return 'Good Afternoon.';
  return 'Good Evening.';
}

// â”€â”€â”€ Profile Menu â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ProfileMenu({ visible, onClose }) {
  const colors = useColors();
  const pmStyles = useMemo(() => makePmStyles(colors), [colors]);
  const { user, firstName, avatarUrl } = useUser();
  const [soundsOn, setSoundsOn] = useState(true);
  const [notifOn, setNotifOn]   = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (visible) {
      AsyncStorage.getItem('profile_sounds').then(v => { if (v !== null) setSoundsOn(v === 'true'); });
      AsyncStorage.getItem('profile_notif').then(v  => { if (v !== null) setNotifOn(v === 'true'); });
    }
  }, [visible]);

  const toggleSounds = async () => {
    hapticLight();
    const next = !soundsOn; setSoundsOn(next);
    await AsyncStorage.setItem('profile_sounds', String(next));
  };

  const toggleNotif = async () => {
    hapticLight();
    const next = !notifOn; setNotifOn(next);
    await AsyncStorage.setItem('profile_notif', String(next));
  };

  const handleSignIn = async () => {
    hapticLight();
    setSigningIn(true);
    try { await signInWithGoogle(); } catch (e) { Alert.alert('Sign-in failed', e.message); }
    setSigningIn(false);
  };

  const handleSignOut = () => {
    hapticWarning();
    Alert.alert('Sign out', 'Sign out of your Google account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: async () => { await signOut(); onClose(); } },
    ]);
  };

  const resetOnboarding = () => {
    hapticWarning();
    Alert.alert('Reset Tutorial', 'Show the onboarding tutorial again next time you open the app?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: async () => { await AsyncStorage.removeItem('onboarding_complete'); onClose(); } },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={pmStyles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={pmStyles.sheet} activeOpacity={1}>
          <View style={pmStyles.handle} />

          {/* Avatar + identity */}
          <View style={pmStyles.avatarRow}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={pmStyles.avatarPhoto} />
            ) : (
              <View style={pmStyles.avatarLarge}>
                <MaterialIcons name="person" size={44} color={colors.Primary} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              {user ? (
                <>
                  <Text style={pmStyles.profileName}>
                    {user.user_metadata?.full_name ?? user.email}
                  </Text>
                  <Text style={pmStyles.profileEmail}>{user.email}</Text>
                </>
              ) : (
                <>
                  <Text style={pmStyles.profileName}>Not signed in</Text>
                  <Text style={pmStyles.profileEmail}>Sign in to sync your data</Text>
                </>
              )}
            </View>
          </View>

          {/* Google sign-in / sign-out */}
          {user ? (
            <TouchableOpacity style={pmStyles.signOutBtn} onPress={handleSignOut}>
              <MaterialIcons name="logout" size={20} color={colors.Error} />
              <Text style={pmStyles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[pmStyles.googleBtn, signingIn && { opacity: 0.6 }]}
              onPress={handleSignIn}
              disabled={signingIn}
            >
              <MaterialIcons name="login" size={20} color={colors.OnPrimary} />
              <Text style={pmStyles.googleBtnText}>
                {signingIn ? 'Opening Googleâ€¦' : 'Sign in with Google'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Preferences */}
          <Text style={pmStyles.groupLabel}>PREFERENCES</Text>
          <View style={pmStyles.prefCard}>
            <View style={pmStyles.prefRow}>
              <MaterialIcons name="volume-up" size={22} color={colors.Primary} />
              <Text style={pmStyles.prefLabel}>App Sounds</Text>
              <Switch value={soundsOn} onValueChange={toggleSounds}
                thumbColor={soundsOn ? colors.OnPrimary : colors.SurfaceContainerLowest}
                trackColor={{ true: colors.Primary, false: colors.SurfaceContainerHighest }} />
            </View>
            <View style={[pmStyles.prefRow, { borderTopWidth: 1, borderTopColor: colors.SurfaceContainerHigh }]}>
              <MaterialIcons name="notifications" size={22} color={colors.Primary} />
              <Text style={pmStyles.prefLabel}>Notifications</Text>
              <Switch value={notifOn} onValueChange={toggleNotif}
                thumbColor={notifOn ? colors.OnPrimary : colors.SurfaceContainerLowest}
                trackColor={{ true: colors.Primary, false: colors.SurfaceContainerHighest }} />
            </View>
          </View>

          <Text style={pmStyles.groupLabel}>APP</Text>
          <TouchableOpacity style={pmStyles.actionRow} onPress={resetOnboarding}>
            <MaterialIcons name="replay" size={22} color={colors.OnSurfaceVariant} />
            <Text style={pmStyles.actionLabel}>Replay Tutorial</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.OutlineVariant} />
          </TouchableOpacity>

          <Text style={pmStyles.version}>ADHD Buddy  Â·  v1.0.0</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function makePmStyles(colors) {
  return StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.Surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 44,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.OutlineVariant,
    alignSelf: 'center', marginBottom: 24,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28, gap: 16 },
  avatarLarge: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.PrimaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarPhoto: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2, borderColor: colors.PrimaryContainer,
  },
  profileName: { fontSize: 18, fontWeight: '700', color: colors.OnSurface },
  profileEmail: { marginTop: 2, fontSize: 13, color: colors.OnSurfaceVariant },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: colors.Primary, borderRadius: 999,
    paddingVertical: 14, marginBottom: 24,
  },
  googleBtnText: { fontSize: 15, fontWeight: '700', color: colors.OnPrimary },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 999, paddingVertical: 12, marginBottom: 20,
    backgroundColor: `${colors.Error}15`,
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: colors.Error },
  groupLabel: {
    fontSize: 10, letterSpacing: 1.5, fontWeight: '700',
    color: colors.OnSurfaceVariant, marginBottom: 8, marginTop: 4,
  },
  prefCard: {
    borderRadius: 20, backgroundColor: colors.SurfaceContainerLowest,
    overflow: 'hidden', marginBottom: 20,
  },
  prefRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 14, gap: 14,
  },
  prefLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.OnSurface },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.SurfaceContainerLowest,
    borderRadius: 20, paddingHorizontal: 18, paddingVertical: 16, marginBottom: 24,
  },
  actionLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.OnSurface },
  version: { textAlign: 'center', fontSize: 12, color: colors.OutlineVariant, fontWeight: '600', letterSpacing: 0.5 },
  });
}

// â”€â”€â”€ MindfulTopBar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function MindfulTopBar() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [profileOpen, setProfileOpen] = useState(false);
  const { avatarUrl } = useUser();
  const navigation = useNavigation();

  return (
    <View style={styles.topBar}>
      <View style={styles.topBarTitle}>
        <MaterialIcons name="spa" size={24} color={colors.Primary} />
        <Text style={styles.topBarText}>ADHD Buddy</Text>
      </View>
      <View style={styles.topBarRight}>
        <TouchableOpacity onPress={() => { hapticLight(); navigation.navigate(Routes.ALERTS); }} style={styles.topBarIcon}>
          <MaterialIcons name="notifications-none" size={22} color={colors.OnSurfaceVariant} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { hapticLight(); navigation.navigate(Routes.FOCUS_SETTINGS); }} style={styles.topBarIcon}>
          <MaterialIcons name="settings" size={22} color={colors.OnSurfaceVariant} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { hapticLight(); setProfileOpen(true); }}
          style={styles.avatarCircle}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarPhoto} />
          ) : (
            <MaterialIcons name="person" size={22} color={colors.Primary} />
          )}
        </TouchableOpacity>
      </View>
      <ProfileMenu
        visible={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </View>
  );
}

export function BackTopBar({ title, onBack }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.topBar}>
      <TouchableOpacity onPress={() => { hapticLight(); onBack(); }} style={styles.iconButton}>
        <MaterialIcons name="arrow-back" size={24} color={colors.Primary} />
      </TouchableOpacity>
      <Text style={styles.backTitle}>{title}</Text>
      <TouchableOpacity onPress={() => {}} style={styles.iconButton}>
        <MaterialIcons name="more-vert" size={24} color={colors.OnSurfaceVariant} />
      </TouchableOpacity>
    </View>
  );
}

export function StyledToggle({ checked, onCheckedChange }) {
  const colors = useColors();
  return (
    <Switch
      value={checked}
      onValueChange={(v) => { hapticLight(); onCheckedChange(v); }}
      thumbColor={checked ? colors.OnPrimary : colors.SurfaceContainerLowest}
      trackColor={{ true: colors.Primary, false: colors.SurfaceContainerHighest }}
    />
  );
}

export function AppBottomNav({ tabs, onTabSelected = () => {} }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const initialIndex = tabs.findIndex(t => t.isActive) >= 0 ? tabs.findIndex(t => t.isActive) : 0;
  const [selected, setSelected] = useState(initialIndex);
  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab, index) => {
        const active = selected === index;
        return (
          <TouchableOpacity
            key={tab.label + index}
            style={styles.navItem}
            onPress={() => {
              hapticLight();
              setSelected(index);
              onTabSelected(index);
            }}
          >
            <MaterialIcons name={tab.icon} size={22} color={active ? colors.Primary : colors.OnSurfaceVariant} />
            <Text style={[styles.navLabel, { color: active ? colors.Primary : colors.OnSurfaceVariant }]}>
              {tab.label.toUpperCase()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function GreenFab({ onPress }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => { hapticMedium(); onPress(); }}
    >
      <MaterialIcons name="add" size={28} color={colors.OnPrimary} />
    </TouchableOpacity>
  );
}

export function SectionHeader({ title, trailing }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderTitle}>{title}</Text>
      {trailing ? <Text style={styles.sectionHeaderTrailing}>{trailing.toUpperCase()}</Text> : null}
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
  topBar: {
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.Surface,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  topBarTitle: { flexDirection: 'row', alignItems: 'center' },
  topBarText: { fontSize: 20, fontWeight: '700', color: colors.Primary, marginLeft: 10 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topBarIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topBarClock: { fontSize: 14, fontWeight: '700', color: colors.OnSurfaceVariant, letterSpacing: 0.5 },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.PrimaryContainer,
    borderWidth: 2, borderColor: colors.Primary + '33',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarPhoto: { width: 40, height: 40, borderRadius: 20 },
  iconButton: { padding: 4 },
  backTitle: { fontSize: 22, fontWeight: '700', color: colors.Primary },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: `${colors.Surface}EB`,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 8, paddingVertical: 8,
    justifyContent: 'space-between',
  },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  navLabel: { marginTop: 4, fontSize: 9, letterSpacing: 1, fontWeight: '600' },
  fab: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.Primary,
    alignItems: 'center', justifyContent: 'center',
    position: 'absolute', right: 16, bottom: 24, elevation: 6,
  },
  sectionHeader: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionHeaderTitle: { fontSize: 18, fontWeight: '700', color: colors.OnSurface },
  sectionHeaderTrailing: { fontSize: 10, letterSpacing: 1.5, fontWeight: '600', color: colors.Outline },
  });
}
