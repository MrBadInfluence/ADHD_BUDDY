import React, { useMemo } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import { Routes } from '../navigation/Routes';

export function DailyFlowTutorialScreen({ navigation }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="close" size={28} color={colors.Primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MINDFUL SANCTUARY</Text>
          <TouchableOpacity onPress={() => {}}>
            <MaterialIcons name="help-outline" size={28} color={colors.Primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroText}>
          <Text style={styles.stepLabel}>STEP 3 OF 4</Text>
          <Text style={styles.heroTitle}>Daily Flow</Text>
          <Text style={styles.heroSubtitle}>
            Quiet the mental noise by automating your essentials. Track routines without the anxiety of a ticking clock.
          </Text>
        </View>

        <View style={styles.previewCardWrapper}>
          <View style={styles.glowCircle} />
          <View style={styles.previewCard}>
            <View style={styles.previewCardHeader}>
              <View>
                <Text style={styles.previewSectionLabel}>MORNING ROUTINE</Text>
                <Text style={styles.previewCardTitle}>Start with Calm</Text>
              </View>
              <View style={styles.previewBadge}>
                <Text style={styles.previewBadgeText}>75%</Text>
              </View>
            </View>
            <View style={styles.previewRowCardCompleted}>
              <View style={styles.checkCircleCompleted}>
                <MaterialIcons name="check-circle" size={16} color={colors.OnPrimary} />
              </View>
              <Text style={styles.previewCompletedText}>Morning Hydration</Text>
            </View>
            <View style={styles.previewRowCardPending}>
              <View style={styles.checkCirclePending} />
              <Text style={styles.previewPendingText}>Mindful Meds</Text>
            </View>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={[styles.featureCard, styles.featureCardRightMargin]}>
            <MaterialIcons name="auto-awesome" size={28} color={colors.Primary} />
            <Text style={styles.featureTitle}>Effortless Tracking</Text>
            <Text style={styles.featureBody}>Check off essentials like hydration or medication without cognitive load.</Text>
          </View>
          <View style={styles.featureCard}>
            <MaterialIcons name="waves" size={28} color={colors.Primary} />
            <Text style={styles.featureTitle}>Build Flow</Text>
            <Text style={styles.featureBody}>Visualize your daily recurring habits as a continuous, gentle flow.</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.stepDots}>
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={[styles.dot, index === 2 ? styles.dotActive : null, index < 3 ? styles.dotSpacing : null]}
            />
          ))}
        </View>
        <View style={styles.footerButtons}>
          <TouchableOpacity style={styles.outlineButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={20} color={colors.OnSurface} />
            <Text style={styles.outlineButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate(Routes.DAILY_FOCUS)}>
            <Text style={styles.primaryButtonText}>Continue Journey</Text>
            <MaterialIcons name="arrow-forward" size={20} color={colors.OnPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.Background },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 170 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 14,
    letterSpacing: 2,
    fontWeight: '700',
    color: colors.Primary
  },
  heroText: { marginTop: 32, alignItems: 'center' },
  stepLabel: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '600',
    color: `${colors.OnSurfaceVariant}B2`
  },
  heroTitle: {
    marginTop: 12,
    fontSize: 38,
    fontWeight: '800',
    color: '#8DA399',
    textAlign: 'center'
  },
  heroSubtitle: {
    marginTop: 12,
    fontSize: 17,
    color: colors.OnSurfaceVariant,
    textAlign: 'center',
    lineHeight: 26,
    width: '85%'
  },
  previewCardWrapper: { alignItems: 'center', marginTop: 32, marginBottom: 24, width: '100%' },
  glowCircle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.PrimaryContainer + '40'
  },
  previewCard: {
    width: '88%',
    borderRadius: 24,
    backgroundColor: colors.SurfaceContainerLowest,
    padding: 24,
    elevation: 4
  },
  previewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  previewSectionLabel: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    color: colors.Primary
  },
  previewCardTitle: { fontSize: 18, fontWeight: '600', color: colors.OnSurface, marginTop: 4 },
  previewBadge: {
    borderRadius: 50,
    backgroundColor: colors.PrimaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  previewBadgeText: { fontSize: 12, fontWeight: '700', color: colors.OnPrimaryContainer },
  previewRowCardCompleted: {
    marginTop: 16,
    borderRadius: 50,
    backgroundColor: `${colors.PrimaryContainer}33`,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  checkCircleCompleted: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.Primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  previewCompletedText: {
    marginLeft: 10,
    fontSize: 13,
    fontWeight: '600',
    color: `${colors.PrimaryDim}99`,
    textDecorationLine: 'line-through'
  },
  previewRowCardPending: {
    marginTop: 12,
    borderRadius: 50,
    backgroundColor: colors.PrimaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  checkCirclePending: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.SurfaceContainerLowest,
    borderWidth: 2,
    borderColor: `${colors.Primary}33`
  },
  previewPendingText: {
    marginLeft: 10,
    fontSize: 13,
    fontWeight: '700',
    color: colors.OnPrimaryContainer
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  featureCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: colors.SurfaceContainerLow,
    padding: 20
  },
  featureCardRightMargin: {
    marginRight: 12
  },
  dotSpacing: {
    marginRight: 6
  },
  featureTitle: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    color: colors.OnSurface
  },
  featureBody: {
    marginTop: 6,
    fontSize: 12,
    color: colors.OnSurfaceVariant,
    lineHeight: 18
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: 'transparent'
  },
  stepDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  dot: {
    width: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: `${colors.OutlineVariant}4D`
  },
  dotActive: {
    width: 28,
    backgroundColor: colors.Primary
  },
  footerButtons: {
    flexDirection: 'row'
  },
  outlineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.Outline,
    borderRadius: 999,
    paddingVertical: 16,
    marginRight: 12
  },
  outlineButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: colors.OnSurface
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.Primary,
    borderRadius: 999,
    paddingVertical: 16
  },
  primaryButtonText: {
    color: colors.OnPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8
  }
  });
}
