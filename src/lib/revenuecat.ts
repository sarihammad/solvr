import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { AppDispatch } from '../store';
import { setTier, setSubscribed } from '../store/subscriptionSlice';
import { SubscriptionTier } from '../types';

export async function setupRevenueCat() {
  const apiKey = Platform.select({
    ios: Constants.expoConfig?.extra?.REVENUECAT_IOS_KEY,
    android: Constants.expoConfig?.extra?.REVENUECAT_ANDROID_KEY,
  });

  if (!apiKey) {
    console.warn('[RevenueCat] Missing API key — skipping setup');
    return;
  }

  Purchases.setLogLevel(LOG_LEVEL.ERROR);
  await Purchases.configure({ apiKey });
}

function entitlementsToTier(active: Record<string, any>): SubscriptionTier {
  // Exam Boost is a 7-day consumable; while active it grants Pro-level access.
  if (active['exam_boost']) return 'exam_boost';
  if (active['pro']) return 'pro';
  return 'free';
}

export async function checkSubscription(dispatch: AppDispatch): Promise<SubscriptionTier> {
  try {
    const info = await Purchases.getCustomerInfo();
    const tier = entitlementsToTier(info.entitlements.active);
    dispatch(setTier(tier));
    await AsyncStorage.setItem('subscription_tier', tier);
    return tier;
  } catch {
    const cached = await AsyncStorage.getItem('subscription_tier');
    if (cached) {
      dispatch(setTier(cached as SubscriptionTier));
      return cached as SubscriptionTier;
    }
    return 'free';
  }
}

export async function purchasePackage(revenuecatId: string, dispatch: AppDispatch): Promise<SubscriptionTier> {
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.availablePackages.find(
    (p) => p.offeringIdentifier === revenuecatId || p.identifier === revenuecatId,
  );
  if (!pkg) throw new Error(`Package ${revenuecatId} not found`);
  await Purchases.purchasePackage(pkg);
  return checkSubscription(dispatch);
}

// Returns the resolved tier so callers (e.g. TrialPaywallScreen) can tell
// whether restoring actually found an active entitlement, rather than
// treating a no-op restore as equivalent to a successful purchase.
export async function restorePurchases(dispatch: AppDispatch): Promise<SubscriptionTier> {
  await Purchases.restorePurchases();
  return checkSubscription(dispatch);
}
