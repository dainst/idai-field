import { Stack } from 'expo-router';
import { LogBox } from 'react-native';
import 'react-native-get-random-values';

LogBox.ignoreLogs([
  'Require cycle:',
  'PouchdbDatastore.handleNonDeletionChange: Document not found or not valid:',
]);

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
