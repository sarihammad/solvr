import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const PILLARS = [
  { icon: '✦', text: 'Verified reasoning — not guesses' },
  { icon: '⚠', text: 'Debug your thinking with Mistake Detective' },
  { icon: '◎', text: 'Ask follow-up questions on any step' },
  { icon: '⊞', text: 'Build a second brain for coursework' },
];

export default function OnboardingScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.logoRing}>
            <Text style={styles.logoChar}>S</Text>
          </View>
          <Text style={styles.appName}>Solvr</Text>
          <Text style={styles.tagline}>Turn confusion into clarity.</Text>
          <Text style={styles.subTagline}>
            The fastest way to understand messy academic problems — with verified, submission-grade reasoning.
          </Text>
        </View>

        <View style={styles.pillars}>
          {PILLARS.map((p, i) => (
            <View key={i} style={styles.pillarRow}>
              <Text style={styles.pillarIcon}>{p.icon}</Text>
              <Text style={styles.pillarText}>{p.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.ctaPrimary}
            onPress={() => navigation.navigate('TrialPaywall')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaPrimaryText}>Get Started</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>Start with a 7-day free trial. Cancel anytime.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'space-between',
    paddingTop: SPACING['3xl'],
    paddingBottom: SPACING.xl,
  },
  hero: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  logoRing: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accentDim,
    borderWidth: 2,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.accent,
  },
  logoChar: {
    fontSize: 32,
    color: COLORS.accent,
    fontFamily: 'Inter_400Regular',
  },
  appName: {
    fontSize: TYPOGRAPHY['3xl'],
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: TYPOGRAPHY.xl,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  subTagline: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: SPACING.lg,
  },
  pillars: {
    gap: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  pillarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillarIcon: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.accent,
    width: 24,
    textAlign: 'center',
  },
  pillarText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  actions: {
    gap: SPACING.sm,
  },
  ctaPrimary: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.base,
    alignItems: 'center',
    ...SHADOWS.accent,
  },
  ctaPrimaryText: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.white,
    fontFamily: 'Inter_400Regular',
  },
  disclaimer: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
});
