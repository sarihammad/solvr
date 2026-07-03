import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, SubscriptionTier } from '../types';

const KEYS = {
  user: 'solvr:user',
  tier: 'solvr:subscription_tier',
  dailySolves: 'solvr:daily_solves',
  dailyResetDate: 'solvr:daily_reset_date',
  hasOnboarded: 'solvr:has_onboarded',
} as const;

export const storage = {
  async getUser(): Promise<User | null> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.user);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async setUser(user: User): Promise<void> {
    await AsyncStorage.setItem(KEYS.user, JSON.stringify(user));
  },

  async clearUser(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.user);
  },

  async getTier(): Promise<SubscriptionTier | null> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.tier);
      return (raw as SubscriptionTier) ?? null;
    } catch {
      return null;
    }
  },

  async setTier(tier: SubscriptionTier): Promise<void> {
    await AsyncStorage.setItem(KEYS.tier, tier);
  },

  async getDailyState(): Promise<{ used: number; date: string } | null> {
    try {
      const used = await AsyncStorage.getItem(KEYS.dailySolves);
      const date = await AsyncStorage.getItem(KEYS.dailyResetDate);
      if (used === null || date === null) return null;
      return { used: parseInt(used, 10), date };
    } catch {
      return null;
    }
  },

  async setDailyState(used: number, date: string): Promise<void> {
    await Promise.all([
      AsyncStorage.setItem(KEYS.dailySolves, String(used)),
      AsyncStorage.setItem(KEYS.dailyResetDate, date),
    ]);
  },

  async getHasOnboarded(): Promise<boolean> {
    try {
      return (await AsyncStorage.getItem(KEYS.hasOnboarded)) === 'true';
    } catch {
      return false;
    }
  },

  async setHasOnboarded(value: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.hasOnboarded, String(value));
  },
};
