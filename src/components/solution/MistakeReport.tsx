import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MistakeAnalysis } from '../../types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';

interface MistakeReportProps {
  analysis: MistakeAnalysis;
}

export default function MistakeReport({ analysis }: MistakeReportProps) {
  return (
    <View style={styles.container}>
      <View style={styles.divergenceHeader}>
        <Text style={styles.divergenceIcon}>⚠</Text>
        <Text style={styles.divergenceTitle}>
          Divergence at Step {analysis.divergenceStep}
        </Text>
      </View>

      <View style={styles.compareRow}>
        <View style={[styles.compareBlock, styles.compareBlockWrong]}>
          <Text style={styles.compareLabel}>Your Work</Text>
          <Text style={styles.compareCode}>{analysis.studentWork}</Text>
        </View>
        <View style={[styles.compareBlock, styles.compareBlockCorrect]}>
          <Text style={[styles.compareLabel, styles.compareLabelCorrect]}>Correct</Text>
          <Text style={[styles.compareCode, styles.compareCodeCorrect]}>{analysis.correctWork}</Text>
        </View>
      </View>

      <View style={styles.mistakeCard}>
        <View style={styles.mistakeHeader}>
          <Text style={styles.mistakeLabel}>{analysis.mistakeLabel}</Text>
          <View style={styles.errorClassBadge}>
            <Text style={styles.errorClassText}>{analysis.errorClass}</Text>
          </View>
        </View>
        <Text style={styles.mistakeExplanation}>{analysis.explanation}</Text>
      </View>

      <View style={styles.conceptCard}>
        <Text style={styles.conceptTitle}>Conceptual Note</Text>
        <Text style={styles.conceptBody}>{analysis.conceptualNote}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACING.md },
  divergenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  divergenceIcon: {
    fontSize: TYPOGRAPHY.lg,
    color: COLORS.warning,
  },
  divergenceTitle: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.warning,
    fontFamily: 'Inter_400Regular',
  },
  compareRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  compareBlock: {
    flex: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  compareBlockWrong: {
    backgroundColor: COLORS.errorDim,
    borderColor: COLORS.error,
  },
  compareBlockCorrect: {
    backgroundColor: COLORS.successDim,
    borderColor: COLORS.success,
  },
  compareLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.error,
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  compareLabelCorrect: {
    color: COLORS.success,
  },
  compareCode: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  compareCodeCorrect: {
    color: COLORS.text,
  },
  mistakeCard: {
    backgroundColor: COLORS.warningDim,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.warning,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  mistakeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  mistakeLabel: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.warning,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  errorClassBadge: {
    backgroundColor: COLORS.warningDim,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.warning,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 1,
  },
  errorClassText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.warning,
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mistakeExplanation: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  conceptCard: {
    backgroundColor: COLORS.accentDim,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  conceptTitle: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.accentLight,
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  conceptBody: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
});
