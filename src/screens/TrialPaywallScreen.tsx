import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../constants/theme';
import { TIERS } from '../constants/tiers';
import { purchasePackage, restorePurchases } from '../lib/revenuecat';
import { completeOnboarding } from '../store/onboardingSlice';
import { useAppDispatch } from '../store';

const PRO = TIERS.pro;

// Forced trial paywall (product decision: no free tier shown at first
// launch — see conversation with the user). This screen has no back/close
// button and blocks the Android hardware back button. It is the ONLY way
// into the app pre-MVP; a lapsed/declined trial still lands users on the
// regular Free tier afterward (see PLAN.md §7) — this screen just controls
// what happens before that point.
export default function TrialPaywallScreen() {
  const dispatch = useAppDispatch();
  const [billingIdx, setBillingIdx] = useState(0); // annual listed first
  const [loading, setLoading] = useState<'trial' | 'restore' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const selected = PRO.billing[billingIdx];

  const handleStartTrial = async () => {
    setError(null);
    setLoading('trial');
    try {
      await purchasePackage(selected.revenuecat_id, dispatch);
      dispatch(completeOnboarding());
    } catch (e: any) {
      if (e?.code !== 'PURCHASE_CANCELLED') {
        setError(e?.message ?? 'Something went wrong starting your trial. Please try again.');
      }
    } finally {
      setLoading(null);
    }
  };

  const handleRestore = async () => {
    setError(null);
    setLoading('restore');
    try {
      const tier = await restorePurchases(dispatch);
      // Only let a restore bypass the trial screen if it actually found an
      // active entitlement — otherwise a no-op restore would trivially
      // defeat the forced-trial flow for anyone who taps it.
      if (tier === 'free') {
        setError("We couldn't find an active subscription to restore.");
      } else {
        dispatch(completeOnboarding());
      }
    } catch {
      setError('Could not restore purchases. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleDevSkip = () => {
    dispatch(completeOnboarding());
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroIconText}>✦</Text>
          </View>
          <Text style={styles.heroTitle}>Start your {PRO.trialDays}-day free trial</Text>
          <Text style={styles.heroBody}>{PRO.tagline}</Text>
        </View>

        <View style={styles.featureList}>
          {PRO.features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <View style={styles.billingToggle}>
          {PRO.billing.map((opt, i) => {
            const active = i === billingIdx;
            return (
              <TouchableOpacity
                key={opt.revenuecat_id}
                style={[styles.billingOption, active && styles.billingOptionActive]}
                onPress={() => setBillingIdx(i)}
                activeOpacity={0.8}
              >
                <Text style={[styles.billingPrice, active && styles.billingTextActive]}>
                  {opt.price}
                  {opt.interval}
                </Text>
                {opt.note ? <Text style={styles.billingNote}>{opt.note}</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleStartTrial}
          disabled={loading !== null}
          activeOpacity={0.85}
        >
          {loading === 'trial' ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.ctaText}>Start Free Trial</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRestore}
          style={styles.restoreBtn}
          disabled={loading !== null}
          activeOpacity={0.7}
        >
          {loading === 'restore' ? (
            <ActivityIndicator size="small" color={COLORS.textMuted} />
          ) : (
            <Text style={styles.restoreText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.legalNote}>
          {PRO.trialDays}-day free trial, then {selected.price}
          {selected.interval}. Auto-renews unless cancelled at least 24 hours before the trial
          ends. Manage or cancel anytime in your App Store or Google Play account settings.
        </Text>

        {__DEV__ && (
          <TouchableOpacity onPress={handleDevSkip} style={styles.devSkip}>
            <Text style={styles.devSkipText}>Skip (dev only — not shown in production)</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: {
    padding: SPACING.xl,
    paddingTop: SPACING['3xl'],
    paddingBottom: SPACING['3xl'],
    gap: SPACING.lg,
  },
  hero: { alignItems: 'center', gap: SPACING.sm },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconText: { fontSize: TYPOGRAPHY.xl, color: COLORS.accent },
  heroTitle: {
    fontSize: TYPOGRAPHY.xl,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  heroBody: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
  featureList: {
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
  },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  featureCheck: { color: COLORS.success, fontSize: TYPOGRAPHY.sm, marginTop: 1 },
  featureText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  billingToggle: { flexDirection: 'row', gap: SPACING.sm },
  billingOption: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  billingOptionActive: {
    borderColor: COLORS.accentBorder,
    borderWidth: 1.5,
    backgroundColor: COLORS.accentDim,
  },
  billingPrice: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
  },
  billingTextActive: { color: COLORS.accentLight },
  billingNote: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.success,
    fontFamily: 'Inter_400Regular',
  },
  errorBox: {
    backgroundColor: COLORS.errorDim,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error,
    padding: SPACING.md,
  },
  errorText: { fontSize: TYPOGRAPHY.sm, color: COLORS.error, fontFamily: 'Inter_400Regular' },
  ctaButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.base,
    alignItems: 'center',
    ...SHADOWS.accent,
  },
  ctaText: { fontSize: TYPOGRAPHY.md, color: COLORS.white, fontFamily: 'Inter_400Regular' },
  restoreBtn: { alignItems: 'center', paddingVertical: SPACING.sm },
  restoreText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
    fontFamily: 'Inter_400Regular',
    textDecorationLine: 'underline',
  },
  legalNote: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
  devSkip: { alignItems: 'center', paddingTop: SPACING.sm },
  devSkipText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.warning,
    fontFamily: 'Inter_400Regular',
  },
});
