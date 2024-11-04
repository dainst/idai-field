import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PreferencesContext } from '@/contexts/preferences-context';
import usePreferences from '@/hooks/use-preferences';

export default function TabLayout() {
  const preferences = usePreferences();
  return (
    <SafeAreaProvider>
      <PreferencesContext.Provider value={preferences}>
        <Tabs screenOptions={{ tabBarActiveTintColor: 'blue' }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home Screen',
              tabBarIcon: ({ color }) => (
                <FontAwesome size={28} name="home" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="SettingsScreen"
            options={{
              title: 'Settings',
              tabBarIcon: ({ color }) => (
                <FontAwesome size={28} name="cog" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="ProjectScreen"
            options={{
              title: 'Project',
              tabBarIcon: ({ color }) => (
                <FontAwesome size={28} name="edit" color={color} />
              ),
            }}
          />
        </Tabs>
      </PreferencesContext.Provider>
    </SafeAreaProvider>
  );
}
