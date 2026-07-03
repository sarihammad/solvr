import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TierConfig } from '../../types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';

interface PricingCardProps {
  tier: TierConfig;
  isCurrentTier: boolean;
  recommended?: boolean;
  /** Called with the selected billing option's RevenueCat id. */
  onSelect: (revenuecatId: string) => void;
  loading?: boolean;
}

export default function PricingCard({
  tier,
  isCurrentTier,
  recommended = false,
  onSelect,
  loading = false,
}: PricingCardProps) {
  // Multiple billing options (Pro: annual + monthly) render a toggle. Annual is
  // listed first in the config, so it's selected by default.
  const [selectedIdx, setSelectedIdx] = useState(0);
  const hasToggle = tier.billing.length > 1;
  const option = tier.billing[selectedIdx] ?? tier.billing[0];
  const emphasise = recommended || tier.highlight;

  return (
    <TouchableOpacity
      onPress={() => onSelect(option.revenuecat_id)}
      disabled={isCurrentTier || loading}
      activeOpacity={0.8}
      style={[
        styles.card,
        emphasise && styles.cardRecommended,
        isCurrentTier && styles.cardCurrent,
      ]}
    >
      {recommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>RECOMMENDED</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.tierLabel}>{tier.label}</Text>
          <Text style={styles.tagline}>{tier.tagline}</Text>
        </View>
        <View style={styles.priceBlock}>
          <Text style={styles.price}>{option.price}</Text>
          {option.interval ? <Text style={styles.interval}>{option.interval}</Text> : null}
        </View>
      </View>

      {hasToggle && (
        <View style={styles.periodToggle}>
          {tier.billing.map((opt, i) => {
            const active = i === selectedIdx;
            return (
              <TouchableOpacity
                key={opt.revenuecat_id}
                style={[styles.periodOption, active && styles.periodOptionActive]}
                onPress={() => setSelectedIdx(i)}
                activeOpacity={0.8}
              >
                <Text style={[styles.periodText, active && styles.periodTextActive]}>
                  {opt.interval.replace('/', '').trim() || opt.price}
                  {opt.note ? ` · ${opt.note}` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.featureList}>
        {tier.features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={styles.featureCheck}>✓</Text>
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      <View
        style={[
          styles.ctaButton,
          isCurrentTier && styles.ctaButtonCurrent,
          emphasise && styles.ctaButtonRecommended,
        ]}
      >
        <Text style={[styles.ctaText, isCurrentTier && styles.ctaTextCurrent]}>
          {isCurrentTier ? 'Current Plan' : loading ? 'Processing...' : `Get ${tier.label}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    position: 'relative',
    overflow: 'hidden',
  },
  cardRecommended: {
    borderColor: COLORS.accentBorder,
    borderWidth: 1.5,
    ...SHADOWS.accent,
  },
  cardCurrent: {
    opacity: 0.6,
  },
  recommendedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderBottomLeftRadius: RADIUS.md,
  },
  recommendedText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.white,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    paddingRight: SPACING.xl,
  },
  headerText: { flex: 1 },
  tierLabel: {
    fontSize: TYPOGRAPHY.lg,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
    marginBottom: 2,
  },
  tagline: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    fontFamily: 'Inter_400Regular',
    maxWidth: 180,
  },
  priceBlock: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: TYPOGRAPHY.xl,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
  },
  interval: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  periodToggle: {
    flexDirection: 'row',
    gap: SPACING.xs,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.full,
    padding: 3,
    marginBottom: SPACING.md,
  },
  periodOption: {
    flex: 1,
    paddingVertical: SPACING.xs + 1,
    alignItems: 'center',
    borderRadius: RADIUS.full,
  },
  periodOptionActive: {
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  periodText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  periodTextActive: {
    color: COLORS.accentLight,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  featureList: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  featureCheck: {
    color: COLORS.success,
    fontSize: TYPOGRAPHY.sm,
    marginTop: 1,
  },
  featureText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  ctaButton: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ctaButtonRecommended: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  ctaButtonCurrent: {
    backgroundColor: COLORS.transparent,
  },
  ctaText: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
  },
  ctaTextCurrent: {
    color: COLORS.textMuted,
  },
});
