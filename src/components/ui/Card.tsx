import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  accentBorder?: boolean;
}

export default function Card({ children, style, elevated = false, accentBorder = false }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        elevated && SHADOWS.md,
        accentBorder && styles.accentBorder,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
  },
  accentBorder: {
    borderColor: COLORS.accentBorder,
    borderWidth: 1.5,
  },
});
