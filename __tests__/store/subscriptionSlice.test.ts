import subscriptionReducer, {
  setTier,
  incrementDailySolves,
  resetDailySolves,
} from '../../src/store/subscriptionSlice';
import { SubscriptionTier } from '../../src/types';

describe('subscriptionSlice', () => {
  const initial = subscriptionReducer(undefined, { type: '@@INIT' });

  it('starts as free tier with a 3 solves/day limit', () => {
    expect(initial.tier).toBe('free');
    expect(initial.isSubscribed).toBe(false);
    expect(initial.dailySolvesLimit).toBe(3);
    expect(initial.dailySolvesUsed).toBe(0);
  });

  describe('setTier', () => {
    it.each([
      ['pro', true, Infinity],
      ['exam_boost', true, Infinity],
      ['free', false, 3],
    ] as const)('tier=%s → isSubscribed=%s, limit=%s', (tier: SubscriptionTier, subscribed: boolean, limit: number) => {
      const state = subscriptionReducer(initial, setTier(tier));
      expect(state.tier).toBe(tier);
      expect(state.isSubscribed).toBe(subscribed);
      expect(state.dailySolvesLimit).toBe(limit);
    });
  });

  describe('incrementDailySolves', () => {
    it('increments the daily counter', () => {
      const state = subscriptionReducer(initial, incrementDailySolves());
      expect(state.dailySolvesUsed).toBe(1);
    });

    it('resets counter when the date has changed', () => {
      const yesterday = '2024-01-01';
      const staleState = {
        ...initial,
        dailySolvesUsed: 1,
        lastResetDate: yesterday,
      };
      const state = subscriptionReducer(staleState, incrementDailySolves());
      expect(state.dailySolvesUsed).toBe(1); // reset to 0 then +1
      expect(state.lastResetDate).not.toBe(yesterday);
    });
  });

  it('resetDailySolves zeroes the counter', () => {
    let state = subscriptionReducer(initial, incrementDailySolves());
    state = subscriptionReducer(state, resetDailySolves());
    expect(state.dailySolvesUsed).toBe(0);
  });
});
