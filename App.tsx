import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { useFonts, Inter_400Regular } from '@expo-google-fonts/inter';
import store from './src/store';
import { useAppInit } from './src/hooks/useAppInit';
import RootNavigator from './src/navigation/RootNavigator';
import { COLORS } from './src/constants/theme';

function AppCore() {
  const [fontsLoaded] = useFonts({ Inter_400Regular });
  const appReady = useAppInit();

  if (!fontsLoaded || !appReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} translucent={false} />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppCore />
    </Provider>
  );
}
