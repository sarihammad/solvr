import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ModeToggle from '../components/capture/ModeToggle';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import { SolveMode } from '../types';
import { pickFromGallery } from '../lib/imageUtils';
import { useGate } from '../hooks/useGate';

type Nav = NativeStackNavigationProp<any>;

export default function CaptureScreen() {
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [mode, setMode] = useState<SolveMode>('solve_problem');
  const [flash, setFlash] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [problemUri, setProblemUri] = useState<string | null>(null);
  const { checkSolve, checkMistakeDetective } = useGate();

  const handleModeChange = (next: SolveMode) => {
    if (next === 'mistake_detective') {
      const gate = checkMistakeDetective();
      if (!gate.allowed) {
        navigation.navigate('Paywall', { trigger: gate.trigger });
        return;
      }
    }
    setMode(next);
    setStep(1);
    setProblemUri(null);
  };

  const navigateToProcessing = useCallback(
    (problemImageUri: string, workImageUri?: string) => {
      navigation.navigate('Processing', { mode, problemImageUri, workImageUri });
    },
    [mode, navigation],
  );

  const handleCapture = async () => {
    const gate = checkSolve();
    if (!gate.allowed) {
      navigation.navigate('Paywall', { trigger: gate.trigger });
      return;
    }
    if (!cameraRef.current || capturing) return;

    setCapturing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (!photo) return;

      if (mode === 'solve_problem') {
        navigateToProcessing(photo.uri);
      } else {
        if (step === 1) {
          setProblemUri(photo.uri);
          setStep(2);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          navigateToProcessing(problemUri!, photo.uri);
          setStep(1);
          setProblemUri(null);
        }
      }
    } finally {
      setCapturing(false);
    }
  };

  const handleGallery = async () => {
    const gate = checkSolve();
    if (!gate.allowed) {
      navigation.navigate('Paywall', { trigger: gate.trigger });
      return;
    }

    const image = await pickFromGallery();
    if (!image) return;

    if (mode === 'solve_problem') {
      navigateToProcessing(image.uri);
    } else {
      if (step === 1) {
        setProblemUri(image.uri);
        setStep(2);
      } else {
        navigateToProcessing(problemUri!, image.uri);
        setStep(1);
        setProblemUri(null);
      }
    }
  };

  if (!permission) return <View style={styles.bg} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.bg}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Access</Text>
          <Text style={styles.permissionBody}>
            Solvr needs camera access to capture your problems. Your photos are never stored on our servers without your permission.
          </Text>
          <TouchableOpacity
            style={styles.permissionBtn}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.permissionBtnText}>Grant Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.bg}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        flash={flash ? 'on' : 'off'}
        animateShutter
      />

      {/* Top controls */}
      <SafeAreaView style={styles.topBar}>
        <ModeToggle mode={mode} onChange={handleModeChange} />
        <TouchableOpacity
          onPress={() => setFlash((v) => !v)}
          style={[styles.iconBtn, flash && styles.iconBtnActive]}
          activeOpacity={0.8}
        >
          <Text style={styles.iconBtnText}>{flash ? '⚡' : '⚡'}</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Mistake Detective step indicator */}
      {mode === 'mistake_detective' && (
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>
            {step === 1 ? 'Photo 1 of 2 — Your Work' : 'Photo 2 of 2 — Correct Answer'}
          </Text>
        </View>
      )}

      {/* Bottom controls */}
      <SafeAreaView style={styles.bottomBar}>
        <TouchableOpacity style={styles.galleryBtn} onPress={handleGallery} activeOpacity={0.8}>
          <Text style={styles.galleryIcon}>⊞</Text>
          <Text style={styles.galleryLabel}>Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureBtn, capturing && styles.captureBtnActive]}
          onPress={handleCapture}
          disabled={capturing}
          activeOpacity={0.85}
        >
          {capturing ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <View style={styles.captureInner} />
          )}
        </TouchableOpacity>

        <View style={styles.galleryBtn} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    zIndex: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: 'rgba(2,132,199,0.5)',
  },
  iconBtnText: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.white,
  },
  stepIndicator: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    backgroundColor: 'rgba(2,132,199,0.85)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
    zIndex: 10,
  },
  stepText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.white,
    fontFamily: 'Inter_400Regular',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: SPACING['2xl'],
    paddingTop: SPACING.base,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 10,
  },
  galleryBtn: {
    width: 48,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  galleryIcon: { fontSize: TYPOGRAPHY.lg, color: COLORS.white },
  // Sits over the dark bottom-bar scrim on the camera feed — light text
  // regardless of app theme, same reasoning as the permission screen above.
  galleryLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Inter_400Regular',
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
    ...SHADOWS.md,
  },
  captureBtnActive: {
    backgroundColor: COLORS.accent,
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['2xl'],
    gap: SPACING.base,
  },
  // This screen (and CaptureScreen generally) always sits on a black camera
  // backdrop, independent of the app's light theme — hardcode light text
  // rather than COLORS.text/textSecondary, which are dark in the light theme.
  permissionTitle: {
    fontSize: TYPOGRAPHY.xl,
    color: COLORS.white,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  permissionBody: {
    fontSize: TYPOGRAPHY.sm,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.md,
  },
  permissionBtnText: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.white,
    fontFamily: 'Inter_400Regular',
  },
});
