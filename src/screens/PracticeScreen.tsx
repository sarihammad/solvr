import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants/theme';
import { PracticeProblem, Subject } from '../types';
import { api } from '../lib/api';
import { looseAnswerMatch } from '../lib/answerMatch';
import { useGate } from '../hooks/useGate';

type RouteParams = { Practice: { concept: string; subject: Subject } };
type Grade = 'unanswered' | 'correct' | 'incorrect';

export default function PracticeScreen() {
  const route = useRoute<RouteProp<RouteParams, 'Practice'>>();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { concept, subject } = route.params;
  const { checkPractice } = useGate();

  const [problem, setProblem] = useState<PracticeProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [grade, setGrade] = useState<Grade>('unanswered');
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const loadProblem = useCallback(async () => {
    setLoading(true);
    setAnswer('');
    setGrade('unanswered');
    setShowHint(false);
    setShowSolution(false);
    try {
      const next = await api.practice(concept, subject);
      setProblem(next);
    } finally {
      setLoading(false);
    }
  }, [concept, subject]);

  useEffect(() => {
    // Defense in depth — the entry point (ArchiveScreen) already gates this,
    // but bounce to Paywall if reached without entitlement (e.g. deep link).
    const gate = checkPractice();
    if (!gate.allowed) {
      navigation.replace('Paywall', { trigger: gate.trigger });
      return;
    }
    loadProblem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheck = () => {
    if (!problem || !answer.trim()) return;
    const correct = looseAnswerMatch(answer, problem.expectedAnswer);
    setGrade(correct ? 'correct' : 'incorrect');
    if (!correct) setShowSolution(true);
  };

  const prettyConcept = concept.replace(/-/g, ' ');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn} activeOpacity={0.7}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Practice</Text>
        <View style={styles.closeBtn} />
      </View>

      {loading || !problem ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.accent} />
          <Text style={styles.loadingText}>Generating a problem on {prettyConcept}...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.conceptChip}>
            <Text style={styles.conceptChipText}>{prettyConcept}</Text>
          </View>

          <Card style={styles.questionCard}>
            <Text style={styles.questionText}>{problem.question}</Text>
          </Card>

          {showHint && (
            <View style={styles.hintBox}>
              <Text style={styles.hintLabel}>Hint</Text>
              <Text style={styles.hintText}>{problem.hint}</Text>
            </View>
          )}

          <TextInput
            style={styles.answerInput}
            value={answer}
            onChangeText={(t) => {
              setAnswer(t);
              setGrade('unanswered');
            }}
            placeholder="Type your answer..."
            placeholderTextColor={COLORS.textMuted}
            editable={grade !== 'correct'}
          />

          {grade === 'correct' && (
            <View style={[styles.feedback, styles.feedbackCorrect]}>
              <Text style={styles.feedbackText}>✓ Correct — nice work.</Text>
            </View>
          )}
          {grade === 'incorrect' && (
            <View style={[styles.feedback, styles.feedbackIncorrect]}>
              <Text style={styles.feedbackText}>Not quite — see the explanation below.</Text>
            </View>
          )}

          {showSolution && (
            <View style={styles.solutionBox}>
              <Text style={styles.solutionLabel}>Explanation</Text>
              <Text style={styles.solutionText}>{problem.explanation}</Text>
              <Text style={styles.solutionAnswer}>Answer: {problem.expectedAnswer}</Text>
            </View>
          )}

          <View style={styles.actionsRow}>
            {!showHint && grade === 'unanswered' && (
              <Button label="Hint" variant="ghost" size="sm" onPress={() => setShowHint(true)} />
            )}
            {grade === 'unanswered' && (
              <Button
                label="Check Answer"
                variant="primary"
                size="sm"
                onPress={handleCheck}
                disabled={!answer.trim()}
              />
            )}
            {!showSolution && grade === 'unanswered' && (
              <Button
                label="Show Solution"
                variant="ghost"
                size="sm"
                onPress={() => setShowSolution(true)}
              />
            )}
          </View>

          <Button label="Next Problem" variant="secondary" fullWidth onPress={loadProblem} style={styles.nextBtn} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary },
  headerTitle: { fontSize: TYPOGRAPHY.md, color: COLORS.text, fontFamily: 'Inter_400Regular' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  loadingText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  scroll: { padding: SPACING.base, gap: SPACING.md, paddingBottom: SPACING['3xl'] },
  conceptChip: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentDim,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  conceptChipText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.accentLight,
    fontFamily: 'Inter_400Regular',
    textTransform: 'capitalize',
  },
  questionCard: { gap: SPACING.sm },
  questionText: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  hintBox: {
    backgroundColor: COLORS.warningDim,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.warning,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  hintLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.warning,
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hintText: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, fontFamily: 'Inter_400Regular' },
  answerInput: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.base,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
  },
  feedback: { borderRadius: RADIUS.md, borderWidth: 1, padding: SPACING.md },
  feedbackCorrect: { backgroundColor: COLORS.successDim, borderColor: COLORS.success },
  feedbackIncorrect: { backgroundColor: COLORS.errorDim, borderColor: COLORS.error },
  feedbackText: { fontSize: TYPOGRAPHY.sm, color: COLORS.text, fontFamily: 'Inter_400Regular' },
  solutionBox: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  solutionLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  solutionText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  solutionAnswer: { fontSize: TYPOGRAPHY.sm, color: COLORS.accentLight, fontFamily: 'Inter_400Regular' },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  nextBtn: { marginTop: SPACING.sm },
});
