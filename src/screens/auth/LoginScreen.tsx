import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch } from '../../store';
import { login } from '../../store/authSlice';
import { useGoogleAuth, useAppleAuth } from '../../lib/auth';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../constants/theme';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'At least 6 characters'),
});

type FormData = z.infer<typeof schema>;

type Props = { navigation: NativeStackNavigationProp<any> };

export default function LoginScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const { promptAsync } = useGoogleAuth();
  const { signIn: appleSignIn, isAvailable: appleAvailable } = useAppleAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Replace with real backend auth call
      dispatch(login({ id: '1', name: data.email.split('@')[0], email: data.email }));
    } catch {
      Alert.alert('Login failed', 'Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const result = await promptAsync();
    if (result?.type === 'success') {
      dispatch(login({ id: 'g_1', name: 'Google User', email: '' }));
    }
  };

  const handleApple = async () => {
    const credential = await appleSignIn();
    if (credential) {
      dispatch(login({
        id: credential.user,
        name: `${credential.fullName?.givenName ?? ''} ${credential.fullName?.familyName ?? ''}`.trim() || 'Apple User',
        email: credential.email ?? '',
      }));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.heading}>Sign in to Solvr</Text>
          <Text style={styles.sub}>Understand every step. Learn faster.</Text>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn} onPress={handleGoogle} activeOpacity={0.8}>
              <Text style={styles.socialIcon}>G</Text>
              <Text style={styles.socialLabel}>Google</Text>
            </TouchableOpacity>
            {appleAvailable && (
              <TouchableOpacity style={styles.socialBtn} onPress={handleApple} activeOpacity={0.8}>
                <Text style={styles.socialIcon}></Text>
                <Text style={styles.socialLabel}>Apple</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with email</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.form}>
            <View>
              <Text style={styles.label}>Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    placeholderTextColor={COLORS.textMuted}
                    placeholder="you@university.edu"
                  />
                )}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
            </View>

            <View>
              <Text style={styles.label}>Password</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, errors.password && styles.inputError]}
                    secureTextEntry
                    onChangeText={onChange}
                    value={value}
                    autoComplete="password"
                    placeholderTextColor={COLORS.textMuted}
                    placeholder="••••••••"
                  />
                )}
              />
              {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnLoading]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.submitText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerNote}>
            New to Solvr?{' '}
            <Text
              style={styles.footerLink}
              onPress={() => navigation.navigate('Onboarding')}
            >
              Create an account
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  backBtn: { marginBottom: SPACING.xl },
  backText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  heading: {
    fontSize: TYPOGRAPHY['2xl'],
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
    letterSpacing: -0.5,
    marginBottom: SPACING.xs,
  },
  sub: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontFamily: 'Inter_400Regular',
    marginBottom: SPACING['2xl'],
  },
  socialRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
  },
  socialIcon: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
  },
  socialLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.text,
    fontFamily: 'Inter_400Regular',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  form: { gap: SPACING.base, marginBottom: SPACING.xl },
  label: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontFamily: 'Inter_400Regular',
    marginBottom: SPACING.xs,
  },
  input: {
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
  inputError: { borderColor: COLORS.error },
  errorText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.error,
    fontFamily: 'Inter_400Regular',
    marginTop: SPACING.xs,
  },
  submitBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.base,
    alignItems: 'center',
    marginTop: SPACING.xs,
    ...SHADOWS.accent,
  },
  submitBtnLoading: { opacity: 0.7 },
  submitText: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.white,
    fontFamily: 'Inter_400Regular',
  },
  footerNote: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  footerLink: { color: COLORS.accent },
});
