import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PricingCard from '../components/paywall/PricingCard';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants/theme';
import { TIERS, TIER_ORDER } from '../constants/tiers';
import { useAppSelector, useAppDispatch } from '../store';
import { purchasePackage, restorePurchases } from '../lib/revenuecat';
import { PaywallTrigger } from '../types';

type RouteParams = { Paywall: { trigger?: PaywallTrigger } };

const TRIGGER_HEADLINES: Record<PaywallTrigger, { title: string; body: string }> = {
  daily_limit: {
    title: "You've used your free solves today",
    body: 'Go Pro for unlimited verified solves — or grab an Exam Boost pass to power through this week.',
  },
  pro_feature: {
    title: 'Unlock Solvr Pro',
    body: 'All STEM subjects, Mistake Detective, your Weakness Graph, and clean exports.',
  },
  mistake_detective: {
    title: 'See exactly where you went wrong',
    body: 'Mistake Detective maps your work against the verified solution and pinpoints your error. Included in Pro.',
  },
  export: {
    title: 'Save & share your study sheets',
    body: 'Clean PDF and Markdown exports are included in Pro.',
  },
  locked_subject: {
    title: 'Unlock all STEM subjects',
    body: 'The free plan covers math. Go Pro for physics, chemistry, and more.',
  },
  practice: {
    title: 'Turn mistakes into mastery',
    body: 'Pro generates fresh practice problems targeting exactly what you keep getting wrong.',
  },
};

// Which plan to feature first, by why the user hit the wall (PLAN.md §7).
function recommendedTier(trigger: PaywallTrigger): string {
  if (trigger === 'daily_limit') return 'exam_boost'; // near an intent spike → boost
  return 'pro';
}

export default function PaywallScreen() {
  const route = useRoute<RouteProp<RouteParams, 'Paywall'>>();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const dispatch = useAppDispatch();
  const currentTier = useAppSelector((s) => s.subscription.tier);
  const trigger = route.params?.trigger ?? 'pro_feature';
  const headline = TRIGGER_HEADLINES[trigger];
  const recommended = recommendedTier(trigger);
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (tierId: string, revenuecatId: string) => {
    const tier = TIERS[tierId];
    if (!tier || tier.id === 'free') return;

    setLoading(tierId);
    try {
      await purchasePackage(revenuecatId, dispatch);
      navigation.goBack();
    } catch (e: any) {
      if (e?.code !== 'PURCHASE_CANCELLED') {
        Alert.alert('Purchase failed', e?.message ?? 'Please try again.');
      }
    } finally {
      setLoading(null);
    }
  };

  const handleRestore = async () => {
    setLoading('restore');
    try {
      await restorePurchases(dispatch);
      Alert.alert('Restored', 'Your purchases have been restored.');
    } catch {
      Alert.alert('Error', 'Could not restore purchases. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Headline */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroIconText}>◎</Text>
          </View>
          <Text style={styles.heroTitle}>{headline.title}</Text>
          <Text style={styles.heroBody}>{headline.body}</Text>
        </View>

        {/* Pricing cards */}
        {TIER_ORDER.filter((t) => t !== 'free').map((tierId) => {
          const tier = TIERS[tierId];
          const isCurrentTier = currentTier === tierId;

          return (
            <PricingCard
              key={tierId}
              tier={tier}
              isCurrentTier={isCurrentTier}
              recommended={tierId === recommended}
              onSelect={(revenuecatId) => handlePurchase(tierId, revenuecatId)}
              loading={loading === tierId}
            />
          );
        })}

        <TouchableOpacity
          onPress={handleRestore}
          style={styles.restoreBtn}
          disabled={loading === 'restore'}
          activeOpacity={0.7}
        >
          {loading === 'restore' ? (
            <ActivityIndicator size="small" color={COLORS.textMuted} />
          ) : (
            <Text style={styles.restoreText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.legalNote}>
          Subscriptions auto-renew unless cancelled 24 hours before the renewal date. Managed through the App Store or Google Play.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    alignItems: 'flex-end',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
  },
  scroll: {
    padding: SPACING.base,
    paddingBottom: SPACING['3xl'],
  },
  hero: {
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
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
  heroIconText: {
    fontSize: TYPOGRAPHY.xl,
    color: COLORS.accent,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.lg,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  heroBody: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
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
    paddingHorizontal: SPACING.md,
  },
});
