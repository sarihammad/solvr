import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import StepCard from '../components/solution/StepCard';
import ChatBubble from '../components/solution/ChatBubble';
import MistakeReport from '../components/solution/MistakeReport';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../constants/theme';
import { SolveSession, SolutionStep, SolveEngine } from '../types';
import { useSolve } from '../hooks/useSolve';
import { useGate } from '../hooks/useGate';

type RouteParams = { Solution: { session: SolveSession } };
type Tab = 'steps' | 'chat';

// How the request was routed — shown so the reasoning path is transparent.
const ENGINE_LABEL: Record<SolveEngine, string> = {
  cache: 'Cached',
  rule_based: 'Instant',
  haiku: 'Haiku',
  opus: 'Opus',
};

export default function SolutionScreen() {
  const route = useRoute<RouteProp<RouteParams, 'Solution'>>();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { session } = route.params;
  const { sendChat, saveToArchive, current } = useSolve();
  const { checkExport } = useGate();
  const [activeTab, setActiveTab] = useState<Tab>(
    session.mode === 'mistake_detective' ? 'steps' : 'steps',
  );
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const activeSession = current ?? session;

  const handleAskStep = (step: SolutionStep) => {
    setActiveTab('chat');
    setChatInput(`Why does step ${step.stepNumber} work? "${step.title}"`);
  };

  const handleSend = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput('');
    setChatLoading(true);
    try {
      await sendChat(msg);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSave = () => {
    saveToArchive();
    Alert.alert('Saved', 'Added to your Study Archive.');
  };

  const handleExport = () => {
    const gate = checkExport();
    if (!gate.allowed) {
      navigation.navigate('Paywall', { trigger: gate.trigger });
      return;
    }
    Alert.alert('Export', 'PDF export coming soon.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.navigate('MainTabs')}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.titleBlock}>
            <Text style={styles.subject}>
              {session.subject.charAt(0).toUpperCase() + session.subject.slice(1)}
            </Text>
            {session.verified && (
              <View style={styles.verifiedChip}>
                <Text style={styles.verifiedText}>✓ Python-verified</Text>
              </View>
            )}
            {session.routing && (
              <View style={styles.engineChip}>
                <Text style={styles.engineText}>{ENGINE_LABEL[session.routing.engine]}</Text>
              </View>
            )}
          </View>

          <View style={styles.answerChip}>
            <Text style={styles.answerLabel}>Answer</Text>
            <Text style={styles.answerValue}>{session.finalAnswer}</Text>
          </View>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'steps' && styles.tabActive]}
            onPress={() => setActiveTab('steps')}
          >
            <Text style={[styles.tabText, activeTab === 'steps' && styles.tabTextActive]}>
              {session.mode === 'mistake_detective' ? 'Analysis' : 'Steps'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'chat' && styles.tabActive]}
            onPress={() => setActiveTab('chat')}
          >
            <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>
              Ask Solvr
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'steps' ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {session.mode === 'mistake_detective' && session.mistakeAnalysis && (
              <View style={styles.section}>
                <MistakeReport analysis={session.mistakeAnalysis} />
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Full Solution</Text>
              </View>
            )}
            {session.steps.map((step) => (
              <StepCard key={step.id} step={step} onAskAbout={handleAskStep} />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.chatContainer}>
            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              contentContainerStyle={styles.chatContent}
              showsVerticalScrollIndicator={false}
            >
              {activeSession.chatHistory.length === 0 && (
                <View style={styles.chatEmpty}>
                  <Text style={styles.chatEmptyTitle}>Ask anything about this solution</Text>
                  <Text style={styles.chatEmptyBody}>
                    Tap any step and hit "Ask about this step", or type below. Try: "Why did you square sin(θ)?" or "Show another method."
                  </Text>
                  <View style={styles.chipRow}>
                    {['Why does this step work?', 'Show another method', 'Explain to a beginner'].map(
                      (q) => (
                        <TouchableOpacity
                          key={q}
                          style={styles.chip}
                          onPress={() => { setChatInput(q); }}
                        >
                          <Text style={styles.chipText}>{q}</Text>
                        </TouchableOpacity>
                      ),
                    )}
                  </View>
                </View>
              )}
              {activeSession.chatHistory.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}
              {chatLoading && (
                <View style={styles.thinkingRow}>
                  <ActivityIndicator size="small" color={COLORS.accent} />
                  <Text style={styles.thinkingText}>Solvr is thinking...</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.chatInput}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Ask about any step..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!chatInput.trim() || chatLoading) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!chatInput.trim() || chatLoading}
              >
                <Text style={styles.sendIcon}>↑</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Action bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.actionIcon}>⊞</Text>
            <Text style={styles.actionLabel}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleExport} activeOpacity={0.8}>
            <Text style={styles.actionIcon}>↓</Text>
            <Text style={styles.actionLabel}>Export PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('MainTabs')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>+</Text>
            <Text style={styles.actionLabel}>New Solve</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textSecondary,
  },
  titleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  subject: {
    fontSize: TYPOGRAPHY.lg,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
  },
  verifiedChip: {
    backgroundColor: COLORS.successDim,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  verifiedText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.success,
    fontFamily: 'Inter_400Regular',
  },
  engineChip: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  engineText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  answerChip: {
    backgroundColor: COLORS.accentDim,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  answerLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answerValue: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.accentLight,
    fontFamily: 'Inter_400Regular',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
  },
  tabText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  tabTextActive: {
    color: COLORS.accent,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.base, paddingBottom: SPACING['2xl'] },
  section: { gap: SPACING.md, marginBottom: SPACING.base },
  divider: { height: 1, backgroundColor: COLORS.border },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chatContainer: { flex: 1 },
  chatContent: { padding: SPACING.base, paddingBottom: SPACING.xl },
  chatEmpty: { gap: SPACING.md, paddingTop: SPACING.xl, paddingBottom: SPACING.xl },
  chatEmptyTitle: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  chatEmptyBody: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, justifyContent: 'center' },
  chip: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  chipText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  thinkingText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  chatInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.accent,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { fontSize: TYPOGRAPHY.md, color: COLORS.white },
  actionBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingBottom: Platform.OS === 'ios' ? SPACING.md : SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: 3,
  },
  actionIcon: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.accent,
  },
  actionLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
});
