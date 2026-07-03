import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { storage } from '../lib/storage';

// Gates RootNavigator now that auth is disabled for MVP (see RootNavigator.tsx
// comment). Flow: Onboarding -> forced trial paywall -> completeOnboarding()
// -> app. authSlice/AuthNavigator/LoginScreen are left intact, unwired, so
// auth can be reintroduced post-MVP without rebuilding this.
interface OnboardingState {
  hasOnboarded: boolean;
}

const initialState: OnboardingState = {
  hasOnboarded: false,
};

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    completeOnboarding(state) {
      state.hasOnboarded = true;
      storage.setHasOnboarded(true);
    },
    setHasOnboarded(state, action: PayloadAction<boolean>) {
      state.hasOnboarded = action.payload;
    },
  },
});

export const { completeOnboarding, setHasOnboarded } = onboardingSlice.actions;
export default onboardingSlice.reducer;
