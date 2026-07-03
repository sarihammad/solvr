import React from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppSelector, useAppDispatch } from '../store';
import { setSearchQuery } from '../store/archiveSlice';
import SolveCard from '../components/archive/SolveCard';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants/theme';
import { SUBJECT_COLORS } from '../constants/subjectColors';
import { ArchiveItem, SubjectSummary, Subject } from '../types';
import { useWeeklyReport } from '../hooks/useWeeklyReport';
import { useGate } from '../hooks/useGate';

export default function ArchiveScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const dispatch = useAppDispatch();
  const { items, sessions, subjectSummaries, searchQuery } = useAppSelector((s) => s.archive);
  const { solveCount, topWeaknesses } = useWeeklyReport();
  const { checkPractice } = useGate();

  const prettyConcept = (slug: string) =>
    slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const filtered = searchQuery.trim()
    ? items.filter(
        (item) =>
          item.subject.includes(searchQuery.toLowerCase()) ||
          item.preview.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : items;

  const handlePractice = (concept: string, subject: Subject) => {
    const gate = checkPractice();
    if (!gate.allowed) {
      navigation.navigate('Paywall', { trigger: gate.trigger });
      return;
    }
    navigation.navigate('Practice', { concept, subject });
  };

  const handleItemPress = (item: ArchiveItem) => {
    const fullSession = sessions[item.id];
    navigation.navigate('Solution', {
      session: fullSession ?? {
        id: item.id,
        mode: item.mode,
        subject: item.subject,
        concepts: item.concepts ?? [],
        problemImageUri: item.problemImageUri,
        finalAnswer: item.finalAnswer,
        verified: item.verified,
        steps: [],
        chatHistory: [],
        createdAt: item.createdAt,
        savedToArchive: true,
      },
    });
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{items.length}</Text>
          <Text style={styles.statLabel}>Total Solves</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {items.filter((i) => i.mode === 'mistake_detective').length}
          </Text>
          <Text style={styles.statLabel}>Mistakes Caught</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{subjectSummaries.length}</Text>
          <Text style={styles.statLabel}>Subjects</Text>
        </View>
      </View>

      {/* Weekly Report — the retention hook (PLAN.md v1.5): here's what you keep
          getting wrong this week, with a direct path to targeted practice. */}
      {topWeaknesses.length > 0 && (
        <View style={styles.weeklyReportCard}>
          <View style={styles.weeklyReportHeader}>
            <Text style={styles.weeklyReportTitle}>This Week's Report</Text>
            <Text style={styles.weeklyReportSubtitle}>
              {solveCount} solve{solveCount !== 1 ? 's' : ''}
            </Text>
          </View>
          {topWeaknesses.map((w) => (
            <View key={w.concept} style={styles.weeklyReportRow}>
              <View style={styles.weeklyReportRowText}>
                <Text style={styles.weeklyReportConcept}>{prettyConcept(w.concept)}</Text>
                <Text style={styles.weeklyReportMeta}>
                  {w.subject.charAt(0).toUpperCase() + w.subject.slice(1)} — {w.mistakeCount} mistake
                  {w.mistakeCount !== 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.practiceBtn}
                onPress={() => handlePractice(w.concept, w.subject)}
                activeOpacity={0.8}
              >
                <Text style={styles.practiceBtnText}>Practice</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Subject chips */}
      {subjectSummaries.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>By Subject</Text>
          <View style={styles.subjectChips}>
            {subjectSummaries.map((s: SubjectSummary) => {
              const color = SUBJECT_COLORS[s.subject] ?? COLORS.textSecondary;
              return (
                <View
                  key={s.subject}
                  style={[styles.subjectChip, { borderColor: `${color}50`, backgroundColor: `${color}15` }]}
                >
                  <Text style={[styles.subjectChipText, { color }]}>
                    {s.subject.charAt(0).toUpperCase() + s.subject.slice(1)} ({s.count})
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {filtered.length > 0 && <Text style={styles.sectionTitle}>Recent</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.heading}>Study Archive</Text>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by subject or topic..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={(t) => dispatch(setSearchQuery(t))}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => dispatch(setSearchQuery(''))} activeOpacity={0.7}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⊞</Text>
          <Text style={styles.emptyTitle}>No solves yet</Text>
          <Text style={styles.emptyBody}>
            Capture your first problem and save it to build your study archive.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SolveCard item={item} onPress={() => handleItemPress(item)} />
          )}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  heading: {
    fontSize: TYPOGRAPHY.xl,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchIcon: { fontSize: TYPOGRAPHY.md, color: COLORS.textMuted },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
  },
  clearText: { fontSize: TYPOGRAPHY.sm, color: COLORS.textMuted },
  headerContent: { gap: SPACING.base, marginBottom: SPACING.sm },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: TYPOGRAPHY.xl,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
  },
  statLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  weeklyReportCard: {
    backgroundColor: COLORS.warningDim,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.warning,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  weeklyReportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weeklyReportTitle: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.warning,
    fontFamily: 'Inter_400Regular',
  },
  weeklyReportSubtitle: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  weeklyReportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  weeklyReportRowText: { flex: 1 },
  weeklyReportConcept: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
    textTransform: 'capitalize',
  },
  weeklyReportMeta: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  practiceBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  practiceBtnText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.white,
    fontFamily: 'Inter_400Regular',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: SPACING.xs,
  },
  subjectChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  subjectChip: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  subjectChipText: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'Inter_400Regular',
  },
  listContent: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING['3xl'],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING['2xl'],
  },
  emptyIcon: { fontSize: 48, color: COLORS.textMuted },
  emptyTitle: {
    fontSize: TYPOGRAPHY.lg,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
});
