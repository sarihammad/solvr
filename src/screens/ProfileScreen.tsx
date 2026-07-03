import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../store';
import { logout } from '../store/authSlice';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants/theme';
import { TIERS } from '../constants/tiers';

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { tier, dailySolvesUsed, dailySolvesLimit } = useAppSelector((s) => s.subscription);
  const archiveCount = useAppSelector((s) => s.archive.items.length);
  const currentTier = TIERS[tier];

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  const MENU_ITEMS = [
    {
      label: 'Manage Subscription',
      icon: '◎',
      onPress: () => navigation.navigate('Paywall', { trigger: 'pro_feature' }),
    },
    {
      label: 'Restore Purchases',
      icon: '↺',
      onPress: () => Alert.alert('Restore', 'Checking your purchases...'),
    },
    {
      label: 'Privacy Policy',
      icon: '⊡',
      onPress: () => {},
    },
    {
      label: 'Terms of Service',
      icon: '⊡',
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Profile</Text>

        {/* User card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarChar}>
              {user?.name?.charAt(0)?.toUpperCase() ?? 'S'}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{user?.name ?? 'Student'}</Text>
            <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
          </View>
        </View>

        {/* Subscription card */}
        <View style={styles.subscriptionCard}>
          <View style={styles.subscriptionHeader}>
            <Text style={styles.subscriptionTier}>{currentTier?.label ?? 'Free'}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Paywall', { trigger: 'pro_feature' })}
              style={styles.upgradeBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.upgradeBtnText}>
                {tier === 'free' ? 'Upgrade' : 'Manage'}
              </Text>
            </TouchableOpacity>
          </View>
          {tier === 'free' && (
            <View style={styles.usageBar}>
              <View style={styles.usageBarTrack}>
                <View
                  style={[
                    styles.usageBarFill,
                    { width: `${Math.min((dailySolvesUsed / dailySolvesLimit) * 100, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.usageText}>
                {dailySolvesUsed} / {dailySolvesLimit} free solves today
              </Text>
            </View>
          )}
          {tier !== 'free' && (
            <Text style={styles.subscriptionDetail}>Unlimited verified solves</Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{archiveCount}</Text>
              <Text style={styles.statLabel}>Problems Saved</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dailySolvesUsed}</Text>
              <Text style={styles.statLabel}>Today's Solves</Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
              onPress={item.onPress}
              activeOpacity={0.8}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out hidden — auth is disabled for MVP (handleLogout/authSlice
            are kept intact for when auth is wired back in post-MVP). */}

        <Text style={styles.version}>Solvr v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: {
    padding: SPACING.base,
    gap: SPACING.base,
    paddingBottom: SPACING['3xl'],
  },
  heading: {
    fontSize: TYPOGRAPHY.xl,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
    marginBottom: SPACING.xs,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarChar: {
    fontSize: TYPOGRAPHY.xl,
    color: COLORS.accent,
    fontFamily: 'Inter_400Regular',
  },
  userName: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
  },
  userEmail: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  subscriptionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionTier: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
  },
  upgradeBtn: {
    backgroundColor: COLORS.accentDim,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  upgradeBtnText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.accentLight,
    fontFamily: 'Inter_400Regular',
  },
  usageBar: { gap: SPACING.xs },
  usageBarTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
  },
  usageText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  subscriptionDetail: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.success,
    fontFamily: 'Inter_400Regular',
  },
  statsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
    gap: SPACING.md,
  },
  statsTitle: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsRow: { flexDirection: 'row', gap: SPACING.base },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: TYPOGRAPHY['2xl'],
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
  },
  statLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  menu: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
    gap: SPACING.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuIcon: { fontSize: TYPOGRAPHY.md, color: COLORS.textSecondary },
  menuLabel: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
  },
  menuChevron: {
    fontSize: TYPOGRAPHY.lg,
    color: COLORS.textMuted,
  },
  logoutBtn: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.errorDim,
  },
  logoutText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.error,
    fontFamily: 'Inter_400Regular',
  },
  version: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
});
