import SettingsScreen from '@/old/src/components/Settings/SettingsScreen';
import { SafeAreaView } from 'react-native-safe-area-context';
import {  router } from 'expo-router';
export default function Index() {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <SettingsScreen navigation={router} />
    </SafeAreaView>
  );
}
