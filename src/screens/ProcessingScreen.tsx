import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  Animated,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AgentConsole from '../components/processing/AgentConsole';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants/theme';
import { SolveMode, SolveSession } from '../types';
import { useSolve } from '../hooks/useSolve';
import { LockedSubjectError } from '../lib/api';

type RouteParams = {
  Processing: { mode: SolveMode; problemImageUri: string; workImageUri?: string };
};

export default function ProcessingScreen() {
  const route = useRoute<RouteProp<RouteParams, 'Processing'>>();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { mode, problemImageUri, workImageUri } = route.params;
  const { solve } = useSolve();

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const solveStarted = useRef(false);
  const pendingSession = useRef<SolveSession | null>(null);
  const animationDone = useRef(false);
  const navigated = useRef(false);

  const tryNavigate = useCallback(() => {
    if (navigated.current) return;
    if (animationDone.current && pendingSession.current) {
      navigated.current = true;
      navigation.replace('Solution', { session: pendingSession.current });
    }
  }, [navigation]);

  const handleAnimationComplete = useCallback(() => {
    animationDone.current = true;
    tryNavigate();
  }, [tryNavigate]);

  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (solveStarted.current) return;
    solveStarted.current = true;

    solve(mode, problemImageUri, workImageUri)
      .then((session) => {
        if (!session) {
          navigation.goBack();
          return;
        }
        pendingSession.current = session;
        tryNavigate();
      })
      .catch((e) => {
        if (e instanceof LockedSubjectError) {
          navigation.replace('Paywall', { trigger: 'locked_subject' });
        } else {
          navigation.goBack();
        }
      });
  }, []);

  const label = mode === 'solve_problem' ? 'Solving problem...' : 'Detecting your mistake...';

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: problemImageUri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        blurRadius={20}
      />

      <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, { opacity: overlayOpacity }]} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.pulseRing}>
              <Text style={styles.pulseIcon}>{mode === 'solve_problem' ? '✦' : '⚠'}</Text>
            </View>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.sublabel}>
              {mode === 'solve_problem'
                ? 'Python verification in progress — not an AI guess.'
                : 'Mapping your reasoning against the correct solution.'}
            </Text>
          </View>

          <View style={styles.console}>
            <View style={styles.consoleHeader}>
              <View style={[styles.consoleDot, { backgroundColor: '#FF5F57' }]} />
              <View style={[styles.consoleDot, { backgroundColor: '#FEBC2E' }]} />
              <View style={[styles.consoleDot, { backgroundColor: '#28C840' }]} />
              <Text style={styles.consoleTitle}>solvr reasoning engine</Text>
            </View>
            <View style={styles.consoleBody}>
              <AgentConsole mode={mode} onComplete={handleAnimationComplete} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  safe: { flex: 1 },
  overlay: { backgroundColor: 'rgba(10, 10, 15, 0.82)' },
  content: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
    gap: SPACING['2xl'],
  },
  header: { alignItems: 'center', gap: SPACING.base },
  pulseRing: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accentDim,
    borderWidth: 2,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseIcon: { fontSize: TYPOGRAPHY.xl, color: COLORS.accent },
  // This whole screen is a deliberately-dark "reasoning console" over a
  // blurred photo, independent of the app's light theme — text/borders here
  // hardcode light-on-dark values rather than the (now dark-mode) COLORS
  // text tokens, same reasoning as CaptureScreen/ModeToggle.
  label: {
    fontSize: TYPOGRAPHY.xl,
    color: COLORS.white,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  sublabel: {
    fontSize: TYPOGRAPHY.sm,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.lg,
  },
  console: {
    backgroundColor: 'rgba(17, 17, 24, 0.9)',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  consoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  consoleDot: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.full,
  },
  consoleTitle: {
    fontSize: TYPOGRAPHY.xs,
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'Inter_400Regular',
    marginLeft: SPACING.xs,
    letterSpacing: 0.5,
  },
  consoleBody: { padding: SPACING.base },
});
