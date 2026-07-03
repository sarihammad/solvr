import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '../store';
import AppNavigator from './AppNavigator';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import TrialPaywallScreen from '../screens/TrialPaywallScreen';
import ProcessingScreen from '../screens/ProcessingScreen';
import SolutionScreen from '../screens/SolutionScreen';
import PracticeScreen from '../screens/PracticeScreen';
import PaywallScreen from '../screens/PaywallScreen';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  // Auth is disabled for MVP (user decision — wire auth back in post-MVP).
  // authSlice, AuthNavigator, and LoginScreen are left in place, unwired, so
  // re-enabling auth later doesn't require rebuilding this. Navigation is
  // gated on onboarding completion instead: Onboarding -> forced trial
  // paywall -> app. See onboardingSlice.ts and TrialPaywallScreen.tsx.
  const hasOnboarded = useAppSelector((s) => s.onboarding.hasOnboarded);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      {!hasOnboarded ? (
        <>
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen
            name="TrialPaywall"
            component={TrialPaywallScreen}
            options={{ animation: 'slide_from_right', gestureEnabled: false }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={AppNavigator} />
          <Stack.Screen
            name="Processing"
            component={ProcessingScreen}
            options={{ animation: 'fade', gestureEnabled: false }}
          />
          <Stack.Screen
            name="Solution"
            component={SolutionScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Practice"
            component={PracticeScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Paywall"
            component={PaywallScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
