import { useEffect, useState } from 'react';
import { useAppDispatch } from '../store';
import { login } from '../store/authSlice';
import { setTier, resetDailySolves, incrementDailySolves } from '../store/subscriptionSlice';
import { setHasOnboarded } from '../store/onboardingSlice';
import { storage } from '../lib/storage';
import { setupRevenueCat, checkSubscription } from '../lib/revenuecat';

export function useAppInit() {
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      // 1. Restore auth (inert while auth is disabled — nothing currently
      // populates a stored user — kept so re-enabling auth later just works)
      const user = await storage.getUser();
      if (user) dispatch(login(user));

      // 2. Restore onboarding/forced-trial completion — this is what actually
      // gates navigation now (see RootNavigator.tsx).
      const hasOnboarded = await storage.getHasOnboarded();
      dispatch(setHasOnboarded(hasOnboarded));

      // 3. Restore subscription tier from cache
      const tier = await storage.getTier();
      if (tier) dispatch(setTier(tier));

      // 4. Restore daily solve counter (reset if it's a new day)
      const daily = await storage.getDailyState();
      const today = new Date().toISOString().split('T')[0];
      if (daily && daily.date === today) {
        for (let i = 0; i < daily.used; i++) dispatch(incrementDailySolves());
      }

      // 5. Try refreshing subscription from RevenueCat (non-blocking).
      // RevenueCat tracks entitlements against its own anonymous device ID,
      // not our (currently disabled) auth user — must not be gated on `user`,
      // or a returning trial/subscriber would never get their tier restored.
      try {
        await setupRevenueCat();
        await checkSubscription(dispatch);
      } catch {
        // RevenueCat not configured — fine in dev
      }

      setReady(true);
    }

    init();
  }, [dispatch]);

  return ready;
}
