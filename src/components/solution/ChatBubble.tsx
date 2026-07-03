import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage } from '../../types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';

interface ChatBubbleProps {
  message: ChatMessage;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.container, isUser ? styles.containerUser : styles.containerAssistant]}>
      {!isUser && <Text style={styles.senderLabel}>Solvr</Text>}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.text, isUser ? styles.textUser : styles.textAssistant]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
    maxWidth: '85%',
  },
  containerUser: {
    alignSelf: 'flex-end',
  },
  containerAssistant: {
    alignSelf: 'flex-start',
  },
  senderLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.accent,
    marginBottom: 3,
    fontFamily: 'Inter_400Regular',
    paddingLeft: SPACING.xs,
  },
  bubble: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  bubbleUser: {
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    borderBottomRightRadius: RADIUS.sm,
  },
  bubbleAssistant: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: RADIUS.sm,
  },
  text: {
    fontSize: TYPOGRAPHY.sm,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  textUser: {
    color: COLORS.text,
  },
  textAssistant: {
    color: COLORS.textSecondary,
  },
});
