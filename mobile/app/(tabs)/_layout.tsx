import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PreferencesContext } from '@/contexts/preferences-context';
import usePreferences from '@/hooks/use-preferences';
import { ToastProvider } from '@/components/common/Toast/ToastProvider';
import { Toast } from '@/components/common/Toast/Toast';

export default function TabLayout() {
  const preferences = usePreferences();
  return (
    <SafeAreaProvider>
      <PreferencesContext.Provider value={preferences}>
        <ToastProvider>
          <Tabs screenOptions={{ tabBarActiveTintColor: 'blue',headerShown:false }}>
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
          <Toast/>
        </ToastProvider>
      </PreferencesContext.Provider>
    </SafeAreaProvider>
  );
}
