import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../src/constants/theme';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: '#2A2A2A' },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Tara',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📷" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="stock"
        options={{
          title: 'Stok',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="suppliers"
        options={{
          title: 'Kişiler',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
