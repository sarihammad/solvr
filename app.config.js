import 'dotenv/config';

export default {
  expo: {
    name: 'Solvr',
    slug: 'solvr',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#FFFFFF',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.solvr.app',
      infoPlist: {
        NSCameraUsageDescription: 'Solvr needs camera access to capture your academic problems.',
        NSMicrophoneUsageDescription: 'Solvr may use the microphone in future voice features.',
        NSPhotoLibraryUsageDescription: 'Solvr needs photo library access so you can upload problems from your camera roll.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      package: 'com.solvr.app',
    },
    plugins: [
      [
        'expo-camera',
        {
          cameraPermission: 'Solvr needs camera access to capture your academic problems.',
          microphonePermission: 'Solvr may use the microphone in future voice features.',
          recordAudioAndroid: false,
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Solvr needs photo library access so you can upload problems from your camera roll.',
        },
      ],
    ],
    extra: {
      REVENUECAT_IOS_KEY: process.env.REVENUECAT_IOS_KEY,
      REVENUECAT_ANDROID_KEY: process.env.REVENUECAT_ANDROID_KEY,
      eas: {
        projectId: process.env.EAS_PROJECT_ID,
      },
    },
  },
};
