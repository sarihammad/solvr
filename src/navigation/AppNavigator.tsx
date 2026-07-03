import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import CaptureScreen from '../screens/CaptureScreen';
import ArchiveScreen from '../screens/ArchiveScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

const Tab = createBottomTabNavigator();

// Icon-only — the label is rendered by the navigator's own tabBarLabel
// mechanism below, which lays out and sizes text correctly. Cramming both
// icon and label into the tabBarIcon slot (the previous approach) squeezed
// the label into the icon's small fixed-size box, wrapping it letter by
// letter — that was the nav bar bug.
function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={[styles.iconRing, focused && styles.iconRingFocused]}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>{icon}</Text>
    </View>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
      }}
    >
      <Tab.Screen
        name="Capture"
        component={CaptureScreen}
        options={{
          tabBarLabel: 'Capture',
          tabBarIcon: ({ focused }) => <TabIcon icon="◉" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Archive"
        component={ArchiveScreen}
        options={{
          tabBarLabel: 'Archive',
          tabBarIcon: ({ focused }) => <TabIcon icon="⊞" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon icon="◎" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 76,
    paddingBottom: SPACING.xs,
    paddingTop: SPACING.sm,
  },
  tabItem: {
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  iconRing: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRingFocused: {
    backgroundColor: COLORS.accentDim,
  },
  icon: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textMuted,
  },
  iconFocused: {
    color: COLORS.accent,
  },
});
