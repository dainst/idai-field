import { Stack } from 'expo-router';
import { PreferencesContext } from '@/old/src/contexts/preferences-context';
import usePreferences from '@/old/src/hooks/use-preferences';
import { Toast } from '@/old/src/components/common/Toast/Toast';
import { ToastProvider } from '@/old/src/components/common/Toast/ToastProvider';
import LabelsContextProvider from '@/old/src/contexts/labels/LabelsContextProvider';

export default function RootLayout() {
  const preferences = usePreferences();
  return (
    <PreferencesContext.Provider value={preferences}>
      {/* <LabelsContextProvider> */}
        {/* <ToastProvider> */}
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          {/* <Toast /> */}
        {/* </ToastProvider> */}
      {/* </LabelsContextProvider> */}
    </PreferencesContext.Provider>
  );
}
