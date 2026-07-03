import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SolveMode } from '../../types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';

interface ModeToggleProps {
  mode: SolveMode;
  onChange: (mode: SolveMode) => void;
}

const OPTIONS: { value: SolveMode; label: string; icon: string }[] = [
  { value: 'solve_problem', label: 'Solve', icon: '✦' },
  { value: 'mistake_detective', label: 'Mistake Detective', icon: '⚠' },
];

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((opt) => {
        const active = mode === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.8}
            style={[styles.option, active && styles.optionActive]}
          >
            <Text style={[styles.icon, active && styles.iconActive]}>{opt.icon}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: RADIUS.full,
    padding: 3,
    gap: 2,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
  },
  optionActive: {
    backgroundColor: COLORS.accent,
  },
  // The pill sits over the live camera feed (dark scrim regardless of app
  // theme) — hardcode a light inactive-state color rather than
  // COLORS.textSecondary, which is dark in the light theme.
  icon: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
  },
  iconActive: {
    color: COLORS.white,
  },
  label: {
    fontSize: TYPOGRAPHY.sm,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Inter_400Regular',
  },
  labelActive: {
    color: COLORS.white,
  },
});
