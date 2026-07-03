import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: 'YOUR_IOS_CLIENT_ID',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    webClientId: 'YOUR_WEB_CLIENT_ID',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      // Pass authentication.accessToken to your backend
      console.log('[Auth] Google token received');
    }
  }, [response]);

  return { request, promptAsync };
}

export function useAppleAuth() {
  const isAvailable = Platform.OS === 'ios';

  const signIn = async () => {
    if (!isAvailable) return null;
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      return credential;
    } catch {
      return null;
    }
  };

  return { signIn, isAvailable };
}
