import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SolutionStep } from '../../types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';

interface StepCardProps {
  step: SolutionStep;
  onAskAbout?: (step: SolutionStep) => void;
}

export default function StepCard({ step, onAskAbout }: StepCardProps) {
  const [expanded, setExpanded] = useState(step.isKeyStep ?? false);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setExpanded((v) => !v)}
      style={[styles.card, step.isKeyStep && styles.cardKey]}
    >
      <View style={styles.header}>
        <View style={[styles.badge, step.isKeyStep && styles.badgeKey]}>
          <Text style={[styles.badgeText, step.isKeyStep && styles.badgeTextKey]}>
            {step.stepNumber}
          </Text>
        </View>
        <Text style={styles.title} numberOfLines={expanded ? undefined : 1}>
          {step.title}
        </Text>
        <Text style={styles.chevron}>{expanded ? '⌃' : '⌄'}</Text>
      </View>

      {expanded && (
        <View style={styles.body}>
          <Text style={styles.explanation}>{step.explanation}</Text>
          {step.equation && (
            <View style={styles.equationBox}>
              <Text style={styles.equationText}>{step.equation}</Text>
            </View>
          )}
          {onAskAbout && (
            <TouchableOpacity
              onPress={() => onAskAbout(step)}
              style={styles.askButton}
              activeOpacity={0.7}
            >
              <Text style={styles.askText}>Ask about this step →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
  },
  cardKey: {
    borderColor: COLORS.accentBorder,
    backgroundColor: COLORS.surfaceAlt,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  badge: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeKey: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accentBorder,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  badgeTextKey: {
    color: COLORS.accentLight,
  },
  title: {
    flex: 1,
    fontSize: TYPOGRAPHY.base,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
  },
  chevron: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
  },
  body: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  explanation: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  equationBox: {
    backgroundColor: COLORS.surfaceHover,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  equationText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.accentLight,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.3,
  },
  askButton: {
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  askText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.accent,
    fontFamily: 'Inter_400Regular',
  },
});
