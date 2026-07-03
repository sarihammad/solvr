import onboardingReducer, {
  completeOnboarding,
  setHasOnboarded,
} from '../../src/store/onboardingSlice';

describe('onboardingSlice', () => {
  const initial = onboardingReducer(undefined, { type: '@@INIT' });

  it('starts as not onboarded — gates RootNavigator to the trial paywall flow', () => {
    expect(initial.hasOnboarded).toBe(false);
  });

  it('completeOnboarding marks onboarding done', () => {
    const state = onboardingReducer(initial, completeOnboarding());
    expect(state.hasOnboarded).toBe(true);
  });

  it('setHasOnboarded restores a persisted value on app init', () => {
    const state = onboardingReducer(initial, setHasOnboarded(true));
    expect(state.hasOnboarded).toBe(true);
  });
});
