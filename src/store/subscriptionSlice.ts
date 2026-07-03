import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SubscriptionTier } from '../types';

interface SubscriptionState {
  tier: SubscriptionTier;
  isSubscribed: boolean;
  dailySolvesUsed: number;
  dailySolvesLimit: number;
  lastResetDate: string;
}

const todayKey = () => new Date().toISOString().split('T')[0];

const FREE_DAILY_LIMIT = 3;

const initialState: SubscriptionState = {
  tier: 'free',
  isSubscribed: false,
  dailySolvesUsed: 0,
  dailySolvesLimit: FREE_DAILY_LIMIT,
  lastResetDate: todayKey(),
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setSubscribed(state, action: PayloadAction<boolean>) {
      state.isSubscribed = action.payload;
    },
    setTier(state, action: PayloadAction<SubscriptionTier>) {
      state.tier = action.payload;
      state.isSubscribed = action.payload !== 'free';
      state.dailySolvesLimit = action.payload === 'free' ? FREE_DAILY_LIMIT : Infinity;
      AsyncStorage.setItem('solvr:subscription_tier', action.payload);
    },
    incrementDailySolves(state) {
      const today = todayKey();
      if (state.lastResetDate !== today) {
        state.dailySolvesUsed = 0;
        state.lastResetDate = today;
      }
      state.dailySolvesUsed += 1;
      AsyncStorage.setItem('solvr:daily_solves', String(state.dailySolvesUsed));
      AsyncStorage.setItem('solvr:daily_reset_date', state.lastResetDate);
    },
    resetDailySolves(state) {
      state.dailySolvesUsed = 0;
      state.lastResetDate = todayKey();
    },
  },
});

export const { setSubscribed, setTier, incrementDailySolves, resetDailySolves } =
  subscriptionSlice.actions;
export default subscriptionSlice.reducer;
