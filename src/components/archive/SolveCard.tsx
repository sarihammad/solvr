import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { ArchiveItem } from '../../types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { SUBJECT_COLORS } from '../../constants/subjectColors';

interface SolveCardProps {
  item: ArchiveItem;
  onPress: () => void;
}

export default function SolveCard({ item, onPress }: SolveCardProps) {
  const subjectColor = SUBJECT_COLORS[item.subject] ?? COLORS.textSecondary;
  const date = new Date(item.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.card}>
      <View style={styles.thumbnail}>
        <Image source={{ uri: item.problemImageUri }} style={styles.image} resizeMode="cover" />
        {item.mode === 'mistake_detective' && (
          <View style={styles.modeBadge}>
            <Text style={styles.modeBadgeText}>⚠</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={[styles.subjectTag, { backgroundColor: `${subjectColor}20`, borderColor: `${subjectColor}50` }]}>
            <Text style={[styles.subjectText, { color: subjectColor }]}>
              {item.subject.charAt(0).toUpperCase() + item.subject.slice(1)}
            </Text>
          </View>
          {item.verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Verified</Text>
            </View>
          )}
        </View>

        <Text style={styles.preview} numberOfLines={2}>
          {item.preview}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.steps}>{item.stepCount} steps</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  thumbnail: {
    width: 80,
    height: 90,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  modeBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: COLORS.warningDim,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  modeBadgeText: {
    fontSize: 10,
    color: COLORS.warning,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
    gap: SPACING.xs,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  subjectTag: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  subjectText: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'Inter_400Regular',
  },
  verifiedBadge: {
    backgroundColor: COLORS.successDim,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  verifiedText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.success,
    fontFamily: 'Inter_400Regular',
  },
  preview: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  steps: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  date: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    fontFamily: 'Inter_400Regular',
  },
});
