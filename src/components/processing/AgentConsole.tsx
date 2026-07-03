import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { SolveMode } from '../../types';

const SOLVE_STEPS = [
  'Reading problem from image...',
  'Classifying subject and difficulty...',
  'Formulating equations...',
  'Executing Python verification...',
  'Confirming numerical accuracy...',
  'Generating step-by-step explanation...',
];

const MISTAKE_STEPS = [
  'Reading your work...',
  'Reading correct solution...',
  'Aligning solution paths step-by-step...',
  'Detecting point of divergence...',
  'Analysing the conceptual mistake...',
  'Building personalised feedback...',
];

const STEP_DELAY = 700;

interface AgentConsoleProps {
  mode: SolveMode;
  onComplete?: () => void;
}

export default function AgentConsole({ mode, onComplete }: AgentConsoleProps) {
  const steps = mode === 'solve_problem' ? SOLVE_STEPS : MISTAKE_STEPS;
  const [active, setActive] = useState(0);
  const [done, setDone] = useState<number[]>([]);
  const opacities = useRef(steps.map(() => new Animated.Value(0))).current;
  const called = useRef(false);

  useEffect(() => {
    let current = 0;

    const advance = () => {
      if (current >= steps.length) {
        if (!called.current) {
          called.current = true;
          onComplete?.();
        }
        return;
      }
      Animated.timing(opacities[current], {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setDone((d) => [...d, current]);
        current += 1;
        setActive(current);
        setTimeout(advance, STEP_DELAY);
      });
    };

    setTimeout(advance, 200);
  }, []);

  return (
    <View style={styles.container}>
      {steps.map((step, i) => {
        const isDone = done.includes(i);
        const isActive = active === i;
        return (
          <Animated.View key={i} style={[styles.row, { opacity: opacities[i] }]}>
            <Text style={[styles.indicator, isDone && styles.indicatorDone, isActive && styles.indicatorActive]}>
              {isDone ? '✓' : isActive ? '⚙' : '·'}
            </Text>
            <Text style={[styles.stepText, isDone && styles.stepDone]}>{step}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  // Rendered inside ProcessingScreen's dark console panel — light-on-dark
  // regardless of app theme, same reasoning as ProcessingScreen's styles.
  indicator: {
    width: 16,
    fontSize: TYPOGRAPHY.sm,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Inter_400Regular',
  },
  indicatorActive: {
    color: COLORS.accent,
  },
  indicatorDone: {
    color: COLORS.success,
  },
  stepText: {
    fontSize: TYPOGRAPHY.sm,
    color: 'rgba(255,255,255,0.65)',
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  stepDone: {
    color: COLORS.white,
  },
});
